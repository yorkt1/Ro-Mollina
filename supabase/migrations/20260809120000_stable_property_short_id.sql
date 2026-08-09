-- short_id estável para as URLs públicas de imóvel (/imovel/{short_id}/{slug}).
--
-- Antes: o id curto da URL era calculado no front-end como `index + 1` sobre a
-- lista ordenada por created_at desc. Cada imóvel novo empurrava TODOS os ids,
-- então /imovel/11/... passava a apontar para outro imóvel — o Google via o
-- conteúdo trocar debaixo da URL e desindexava (soft 404 / canônica divergente).
--
-- Agora o número vive no banco e nunca muda. O backfill congela exatamente os
-- valores que o front-end calcularia hoje, para não invalidar o que já está
-- indexado no Google.

alter table public.properties
  add column if not exists short_id integer;

-- Congela a numeração atual (mesma regra do front: row 1 = mais recente).
with ordered as (
  select id, row_number() over (order by created_at desc) as rn
  from public.properties
)
update public.properties p
set short_id = ordered.rn
from ordered
where p.id = ordered.id
  and p.short_id is null;

-- Novos imóveis recebem o próximo número livre, sem tocar nos existentes.
create sequence if not exists public.properties_short_id_seq
  owned by public.properties.short_id;

select setval(
  'public.properties_short_id_seq',
  coalesce((select max(short_id) from public.properties), 0) + 1,
  false
);

alter table public.properties
  alter column short_id set default nextval('public.properties_short_id_seq');

alter table public.properties
  alter column short_id set not null;

create unique index if not exists properties_short_id_key
  on public.properties (short_id);
