-- Row Level Security for friendships
--
-- Two SELECT policies that OR together:
--   * accepted rows are public (powers /u/:username friend lists, including
--     anonymous viewers — matches the existing "profiles are public" pattern).
--   * either party also sees their own pending rows.
--
-- Mutations are tightly scoped:
--   INSERT — only as requester, only `status='pending'`, `accepted_at` null.
--   UPDATE — only the addressee, only the pending→accepted transition. The
--            companion trigger freezes requester_id/addressee_id and stamps
--            accepted_at.
--   DELETE — either party (cancel-sent / decline / unfriend).

alter table public.friendships enable row level security;

create policy friendships_select_public_accepted on public.friendships
  for select using (status = 'accepted');

create policy friendships_select_self on public.friendships
  for select using (auth.uid() in (requester_id, addressee_id));

create policy friendships_insert_self on public.friendships
  for insert with check (
    auth.uid() = requester_id
    and status = 'pending'
    and accepted_at is null
  );

create policy friendships_update_addressee on public.friendships
  for update
  using (auth.uid() = addressee_id and status = 'pending')
  with check (auth.uid() = addressee_id and status = 'accepted');

create policy friendships_delete_either on public.friendships
  for delete using (auth.uid() in (requester_id, addressee_id));
