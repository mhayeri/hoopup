-- Notifications RLS: strictly owner-scoped.
--
-- Recipients can read their feed, mark rows read (UPDATE), and dismiss rows
-- (DELETE). There is deliberately NO INSERT policy: rows are written only by
-- the SECURITY DEFINER fan-out triggers (20260606120300), which bypass RLS.
-- A client cannot fabricate a notification for anyone (including itself).
alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select
  using (auth.uid() = user_id);

-- Only read_at is ever updated (the TS Update type narrows to it); the
-- with-check keeps user_id pinned so a row can't be reassigned to someone else.
create policy notifications_update_own on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy notifications_delete_own on public.notifications
  for delete
  using (auth.uid() = user_id);
