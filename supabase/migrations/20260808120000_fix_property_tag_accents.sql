-- Corrige a acentuação das tags livres exibidas nos cards de imóvel.
-- As tags são digitadas à mão no painel admin, então algumas foram salvas sem acento.

update public.properties
set tag = 'ÓTIMA LOCALIZAÇÃO'
where tag is not null
  and upper(btrim(tag)) in ('OTIMA LOCALIZAÇÃO', 'OTIMA LOCALIZACAO', 'ÓTIMA LOCALIZACAO');

update public.properties
set tag = 'FINANCIÁVEL'
where tag is not null
  and upper(btrim(tag)) = 'FINANCIAVEL';
