import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];

/**
 * Inserts a session row and returns the created row. host_id and RLS-bound
 * checks are enforced server-side; callers should pass the signed-in user's
 * id explicitly so the insert and the RLS WITH CHECK clause match.
 */
export async function createSession(
  insert: SessionInsert
): Promise<{ data: SessionRow | null; error: string | null }> {
  const { data, error } = await supabase.from('sessions').insert(insert).select('*').single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
