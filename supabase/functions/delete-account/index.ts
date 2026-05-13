// Supabase Edge Function: delete-account
//
// Allows an authenticated user to permanently delete their own account.
// The client SDK cannot remove auth.users rows; only the admin API can.
// This function runs the admin call server-side with the service-role key,
// then lets the schema's ON DELETE CASCADE chain wipe the rest:
//   auth.users → profiles → sessions → session_rsvps
// Avatar storage objects are cleaned up explicitly since Storage has no cascade.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: files, error: listErr } = await admin.storage.from('avatars').list(user.id);
  if (listErr) {
    console.warn('avatar list failed (continuing):', listErr.message);
  } else if (files && files.length > 0) {
    const paths = files.map((f) => `${user.id}/${f.name}`);
    const { error: removeErr } = await admin.storage.from('avatars').remove(paths);
    if (removeErr) console.warn('avatar remove failed (continuing):', removeErr.message);
  }

  const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
  if (deleteErr) return json({ error: deleteErr.message }, 500);

  return json({ ok: true }, 200);
});
