-- Seleção de imóveis publicados no Grupo OLX (OLX Imóveis / ZAP / VivaReal).
--
-- Antes: /vrsync.xml devolvia TODOS os imóveis do banco. O plano contratado é
-- de 10 anúncios, então o portal importava o feed inteiro e cortava o excedente
-- por conta própria — sem a imobiliária ter controle de QUAIS 10 ficavam no ar.
--
-- Agora a escolha é explícita: só entra no feed o imóvel com olx_enabled = true.
-- `olx_enabled_at` guarda quando a vaga foi ocupada e serve de desempate — se
-- por qualquer motivo houver mais marcados que o limite do plano, o feed publica
-- os que entraram primeiro, e não uma seleção aleatória.

alter table public.properties
  add column if not exists olx_enabled boolean not null default false;

alter table public.properties
  add column if not exists olx_enabled_at timestamptz;

-- Backfill: sem isso o primeiro deploy entregaria um feed vazio e o portal
-- despublicaria os anúncios que já estão no ar. Ocupa as 10 vagas com os
-- imóveis mais recentes que já atendem ao mínimo da spec do VRSync (5 fotos,
-- CEP e preço) — os demais requisitos o painel mostra como pendência.
with elegiveis as (
  select id, created_at
  from public.properties
  where coalesce(array_length(images, 1), 0) >= 5
    and length(regexp_replace(coalesce(cep, ''), '\D', '', 'g')) = 8
    and coalesce(price, 0) > 0
  order by created_at desc
  limit 10
)
update public.properties p
set olx_enabled = true,
    olx_enabled_at = elegiveis.created_at
from elegiveis
where p.id = elegiveis.id
  and not exists (select 1 from public.properties where olx_enabled = true);

create index if not exists properties_olx_enabled_idx
  on public.properties (olx_enabled_at asc)
  where olx_enabled = true;

notify pgrst, 'reload schema';
