drop policy if exists "Authenticated users manage leads" on public.leads;

create policy "Authenticated users manage leads"
  on public.leads
  for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);
