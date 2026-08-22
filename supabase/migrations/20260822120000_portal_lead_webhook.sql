-- Recebimento automático dos leads do Grupo OLX (ZAP Imóveis / VivaReal / OLX).
--
-- Como a integração funciona: o Canal Pro faz um POST JSON no endereço
-- cadastrado em Configurações → Integrações → Leads → "Receber leads no CRM"
-- toda vez que alguém clica em contato num anúncio nosso. Não existe API para
-- buscar leads — quem chama é o portal. Spec:
-- https://developers.grupozap.com/webhooks/integration_leads.html
--
-- O endpoint é /api/leads/grupozap (atalho /grupozap/lead). Ele traduz o
-- payload do portal para as colunas do CRM e chama ingest_portal_lead().
--
-- Duas regras da spec moldam este arquivo:
--   1. "Sua aplicação deve ser idempotente" — o portal reenvia o mesmo lead
--      até 3 vezes quando não recebe 2xx, por até 14 dias. Daí o external_id
--      único: o segundo POST do mesmo originLeadId devolve o lead que já
--      existe em vez de duplicar o contato no pipeline.
--   2. O lead chega com clientListingId, que é o ListingID publicado por nós
--      em /vrsync.xml (o short_id do imóvel). É o que permite abrir o lead no
--      CRM já sabendo de qual anúncio ele veio.

alter table public.leads
  add column if not exists external_id text,
  add column if not exists origin_listing_id text,
  add column if not exists client_listing_id text,
  add column if not exists property_id uuid references public.properties(id) on delete set null,
  add column if not exists lead_type text,
  add column if not exists temperature text;

comment on column public.leads.external_id is
  'originLeadId do Grupo OLX. Chave de deduplicação dos reenvios do portal.';
comment on column public.leads.origin_listing_id is
  'ID do anúncio dentro do portal (originListingId).';
comment on column public.leads.client_listing_id is
  'ListingID enviado por nós no /vrsync.xml (short_id do imóvel).';
comment on column public.leads.property_id is
  'Imóvel do site que gerou o lead, quando o clientListingId bate com um cadastro.';
comment on column public.leads.lead_type is
  'Canal do contato no anúncio: CONTACT_FORM, CLICK_WHATSAPP, PHONE_VIEW, etc.';
comment on column public.leads.temperature is
  'Interesse estimado pelo portal: Baixa, Média ou Alta.';

-- Índice parcial: leads cadastrados à mão continuam com external_id nulo e não
-- disputam a unicidade entre si.
create unique index if not exists leads_external_id_key
  on public.leads (external_id)
  where external_id is not null;

create index if not exists leads_property_id_idx
  on public.leads (property_id)
  where property_id is not null;

-- O CHECK original de `source` só conhecia os canais manuais; um lead de
-- portal seria recusado pelo banco (e o portal ficaria reenviando até desistir).
do $$
declare
  con record;
begin
  for con in
    select conname
    from pg_constraint
    where conrelid = 'public.leads'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%source%'
  loop
    execute format('alter table public.leads drop constraint %I', con.conname);
  end loop;
end
$$;

-- NOT VALID: a regra vale para tudo que entrar daqui para frente, sem varrer o
-- histórico. Se algum lead antigo tiver origem fora da lista, a migração passa
-- assim mesmo em vez de abortar no meio.
alter table public.leads
  add constraint leads_source_check check (
    source in ('Site', 'WhatsApp', 'Instagram', 'Indicação', 'Grupo OLX', 'MCMV')
  ) not valid;

-- Grava um lead vindo do webhook do Grupo OLX.
--
-- A tradução do payload acontece em api/_portal-lead.js; aqui ficam só as
-- decisões que dependem do banco: achar o imóvel do anúncio, herdar o bairro
-- dele e resolver o reenvio do mesmo lead sem criar duplicata.
--
-- Retorna { id, duplicate, property_id } — o endpoint responde 2xx nos dois
-- casos, porque para o portal um reenvio já entregue também é sucesso.
create or replace function public.ingest_portal_lead(
  p_external_id text,
  p_name text,
  p_phone text,
  p_email text,
  p_message text,
  p_source text default 'Grupo OLX',
  p_interest text default 'venda',
  p_budget text default 'Não informado',
  p_temperature text default null,
  p_lead_type text default null,
  p_origin_listing_id text default null,
  p_client_listing_id text default null,
  p_marketing_data jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_listing text := nullif(trim(coalesce(p_client_listing_id, '')), '');
  v_external text := nullif(trim(coalesce(p_external_id, '')), '');
  v_property public.properties%rowtype;
  v_existing_id uuid;
  v_new_id uuid;
begin
  if length(trim(coalesce(p_name, ''))) = 0 then
    raise exception 'Lead sem nome';
  end if;

  if p_source not in ('Grupo OLX', 'MCMV') then
    raise exception 'Origem inválida: %', p_source;
  end if;

  if p_interest not in ('venda', 'aluguel') then
    raise exception 'Interesse inválido: %', p_interest;
  end if;

  -- Reenvio do mesmo lead: devolve o que já está no pipeline, sem sobrescrever
  -- a etapa em que a corretora já colocou o contato.
  if v_external is not null then
    select id into v_existing_id
    from public.leads
    where external_id = v_external;

    if v_existing_id is not null then
      return jsonb_build_object('id', v_existing_id, 'duplicate', true);
    end if;
  end if;

  -- O ListingID que mandamos no feed é o short_id. Aceita também o uuid e o
  -- código de referência, caso o anúncio tenha sido cadastrado à mão no portal.
  if v_listing is not null then
    if v_listing ~ '^[0-9]+$' then
      select * into v_property
      from public.properties
      where short_id = v_listing::integer;
    end if;

    if v_property.id is null and v_listing ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select * into v_property
      from public.properties
      where id = v_listing::uuid;
    end if;

    if v_property.id is null then
      select * into v_property
      from public.properties
      where upper(coalesce(ref_code, '')) = upper(v_listing);
    end if;
  end if;

  insert into public.leads (
    name, stage, source, budget, interest, neighborhood, last_contact, owner,
    phone, email, message, marketing_data,
    external_id, origin_listing_id, client_listing_id, property_id,
    lead_type, temperature
  )
  values (
    left(trim(p_name), 120),
    'novo',
    p_source,
    coalesce(nullif(trim(coalesce(p_budget, '')), ''), 'Não informado'),
    p_interest,
    coalesce(
      nullif(trim(coalesce(v_property.neighborhood, '')), ''),
      case
        when v_listing is null then 'Contato pelo portal'
        else 'Anúncio ' || v_listing
      end
    ),
    to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
    'Ro Molina',
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(lower(trim(coalesce(p_email, ''))), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    coalesce(p_marketing_data, '{}'::jsonb),
    v_external,
    nullif(trim(coalesce(p_origin_listing_id, '')), ''),
    v_listing,
    v_property.id,
    nullif(trim(coalesce(p_lead_type, '')), ''),
    nullif(trim(coalesce(p_temperature, '')), '')
  )
  returning id into v_new_id;

  return jsonb_build_object(
    'id', v_new_id,
    'duplicate', false,
    'property_id', v_property.id
  );

-- Corrida entre dois reenvios simultâneos do mesmo lead: o índice único
-- resolve, e o segundo POST recebe o id do primeiro em vez de um erro.
exception
  when unique_violation then
    select id into v_existing_id
    from public.leads
    where external_id = v_external;
    return jsonb_build_object('id', v_existing_id, 'duplicate', true);
end;
$fn$;

-- Só o endpoint serverless (service_role) grava lead de portal. O anon key é
-- público — se ele pudesse chamar esta função, qualquer um encheria o pipeline
-- de leads falsos "vindos do ZAP".
revoke all on function public.ingest_portal_lead(
  text, text, text, text, text, text, text, text, text, text, text, text, jsonb
) from public;

revoke all on function public.ingest_portal_lead(
  text, text, text, text, text, text, text, text, text, text, text, text, jsonb
) from anon, authenticated;

grant execute on function public.ingest_portal_lead(
  text, text, text, text, text, text, text, text, text, text, text, text, jsonb
) to service_role;

notify pgrst, 'reload schema';
