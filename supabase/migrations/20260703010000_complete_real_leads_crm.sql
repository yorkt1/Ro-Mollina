alter table public.leads
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();

create index if not exists leads_created_at_idx
  on public.leads (created_at desc);

create index if not exists leads_stage_updated_at_idx
  on public.leads (stage, updated_at desc);

-- Remove somente os registros de demonstração originalmente exibidos pelo template.
-- Contatos reais com telefone, e-mail ou mensagem nunca entram nesta limpeza.
delete from public.leads
where name in (
  'Marina Dallagnol',
  'Guilherme e Paula Becker',
  'Ricardo Nunes',
  'Fernanda Moura',
  'Henrique Volpato'
)
and phone is null
and email is null
and message is null;

drop function if exists public.submit_website_lead(
  text,
  text,
  text,
  text,
  jsonb,
  text
);

create or replace function public.submit_website_lead(
  p_name text,
  p_phone text,
  p_email text,
  p_message text,
  p_interest text default 'venda',
  p_marketing_data jsonb default '{}'::jsonb,
  p_website text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  clean_marketing_data jsonb := coalesce(p_marketing_data, '{}'::jsonb);
  new_lead_id uuid;
begin
  -- Honeypot: robôs costumam preencher este campo invisível.
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

  if p_interest not in ('venda', 'aluguel') then
    raise exception 'Interesse inválido';
  end if;

  if jsonb_typeof(clean_marketing_data) <> 'object'
    or octet_length(clean_marketing_data::text) > 20000
  then
    raise exception 'Dados de campanha inválidos';
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
    p_interest,
    case
      when p_interest = 'aluguel' then 'Captação para aluguel'
      else 'Captação para venda'
    end,
    to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
    'Ro Molina',
    trim(p_phone),
    lower(trim(p_email)),
    trim(p_message),
    clean_marketing_data
  )
  returning id into new_lead_id;

  return new_lead_id;
end;
$$;

revoke all on function public.submit_website_lead(
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text
) from public;

grant execute on function public.submit_website_lead(
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text
) to anon, authenticated;

notify pgrst, 'reload schema';
