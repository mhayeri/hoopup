// Supabase Edge Function: login
//
// Rate-limited password sign-in that accepts an email OR a username, without
// ever exposing one account's email to another caller.
//
// Why this exists: the old flow called a public `get_email_by_username` RPC
// from the browser, so anyone (even logged out) could resolve any username to
// that account's email — an enumeration leak. Here the username -> email
// lookup happens server-side with the service-role key, the sign-in is
// performed here, and only the resulting session tokens are returned. Unknown
// username and wrong password produce the SAME generic error, so the response
// reveals nothing about which usernames/emails exist. Attempts are throttled
// per IP.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
};

// Per-IP limit: at most MAX_ATTEMPTS sign-in attempts per WINDOW_SECONDS.
const MAX_ATTEMPTS = 10;
const WINDOW_SECONDS = 300;

// Identical message for every auth failure so the response never reveals
// whether a username/email exists.
const GENERIC_AUTH_ERROR = 'Invalid email/username or password.';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function clientIp(req: Request): string {
  // Prefer the platform-injected client IP (callers can't forge it);
  // x-forwarded-for is client-settable, so only fall back to it. Otherwise an
  // attacker could rotate a fake XFF per request and sidestep the throttle.
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return 'unknown';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let identifier: unknown;
  let password: unknown;
  try {
    const body = await req.json();
    identifier = body?.identifier;
    password = body?.password;
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier || !password) {
    return json({ error: 'Email/username and password are required.' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Throttle by IP before doing any work.
  const { data: allowed, error: throttleErr } = await admin.rpc('record_login_attempt', {
    p_ip: clientIp(req),
    p_max: MAX_ATTEMPTS,
    p_window_seconds: WINDOW_SECONDS,
  });
  if (throttleErr) {
    console.error('throttle check failed:', throttleErr.message);
    return json({ error: 'Something went wrong. Try again.' }, 500);
  }
  if (!allowed) {
    // Fail closed: anything other than an explicit "under the limit" is treated
    // as over the limit.
    return json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, 429);
  }

  // 2. Resolve the email. A bare username is looked up server-side; the email
  //    is never returned to the client.
  let email: string | null;
  if (identifier.includes('@')) {
    email = identifier;
  } else {
    const { data, error: lookupErr } = await admin.rpc('resolve_login_email', {
      p_username: identifier,
    });
    if (lookupErr) {
      console.error('email lookup failed:', lookupErr.message);
      return json({ error: 'Something went wrong. Try again.' }, 500);
    }
    email = (data as string | null) ?? null;
  }

  // 3. Perform the sign-in server-side and hand back only the session tokens.
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Unknown username: still make one auth round-trip (against a throwaway
  // address) so the response time matches the wrong-password path — otherwise
  // the timing difference would let usernames be enumerated.
  if (!email) {
    await authClient.auth.signInWithPassword({
      email: 'nonexistent@hoopup.invalid',
      password,
    });
    return json({ error: GENERIC_AUTH_ERROR }, 401);
  }

  const { data: signIn, error: signInErr } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr || !signIn.session) {
    return json({ error: GENERIC_AUTH_ERROR }, 401);
  }

  return json(
    {
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    },
    200
  );
});
