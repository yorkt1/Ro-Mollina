alter table public.leads
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists message text,
  add column if not exists marketing_data jsonb not null default '{}'::jsonb;

alter table public.leads enable row level security;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'leads'
  loop
    execute format(
      'drop policy if exists %I on public.leads',
      existing_policy.policyname
    );
  end loop;
end
$$;

create policy "Authenticated users manage leads"
  on public.leads
  for all
  to authenticated
  using (true)
  with check (true);

revoke all on table public.leads from anon;
grant select, insert, update, delete on table public.leads to authenticated;

create or replace function public.submit_website_lead(
  p_name text,
  p_phone text,
  p_email text,
  p_message text,
  p_marketing_data jsonb default '{}'::jsonb,
  p_website text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_lead_id uuid;
begin
  -- Honeypot: bots usually fill this invisible field.
  if length(trim(coalesce(p_website, ''))) > 0 then
    return gen_random_uuid();
  end if;

  if length(trim(coalesce(p_name, ''))) not between 2 and 120 then
    raise exception 'Nome inválido';
  end if;

  if length(trim(coalesce(p_phone, ''))) not between 8 and 30 then
    raise exception 'Telefone inválido';
  end if;

  if length(trim(coalesce(p_email, ''))) not between 5 and 254
    or trim(p_email) !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  then
    raise exception 'E-mail inválido';
  end if;

  if length(trim(coalesce(p_message, ''))) not between 5 and 2000 then
    raise exception 'Mensagem inválida';
  end if;

  insert into public.leads (
    name,
    stage,
    source,
    budget,
    interest,
    neighborhood,
    last_contact,
    owner,
    phone,
    email,
    message,
    marketing_data
  )
  values (
    trim(p_name),
    'novo',
    'Site',
    'Não informado',
    'venda',
    'Captação de imóvel',
    to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
    'Ro Molina',
    trim(p_phone),
    lower(trim(p_email)),
    trim(p_message),
    coalesce(p_marketing_data, '{}'::jsonb)
  )
  returning id into new_lead_id;

  return new_lead_id;
end;
$$;

revoke all on function public.submit_website_lead(text, text, text, text, jsonb, text) from public;
grant execute on function public.submit_website_lead(text, text, text, text, jsonb, text) to anon, authenticated;
