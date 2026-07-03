alter table public.properties
  add column if not exists opportunity boolean not null default false;

create index if not exists properties_featured_created_at_idx
  on public.properties (created_at desc)
  where featured = true;

create index if not exists properties_opportunity_created_at_idx
  on public.properties (created_at desc)
  where opportunity = true;

notify pgrst, 'reload schema';
