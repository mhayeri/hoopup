import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from './database.types';

export type AppSupabase = SupabaseClient<Database>;

export const supabase: AppSupabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
