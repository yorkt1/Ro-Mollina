-- Tipo de destaque enviado ao Canal Pro (elemento PublicationType do VRSync).
--
-- Além das 10 vagas do plano, o contrato tem uma cota à parte de 2 imóveis em
-- destaque (Destaque Padrão, Super Destaque ou um dos Premieres) — o restante
-- dos anúncios vai como STANDARD (Padrão). Esta coluna só guarda a escolha
-- feita no painel (/admin/olx); o corte de verdade, se a cota for excedida
-- por algum motivo, acontece em api/vrsync.js (OLX_HIGHLIGHT_LIMIT).
--
-- Spec: https://developers.grupozap.com/feeds/vrsync/elements/details.html

alter table public.properties
  add column if not exists olx_publication_type text not null default 'STANDARD';

alter table public.properties
  drop constraint if exists properties_olx_publication_type_check;

alter table public.properties
  add constraint properties_olx_publication_type_check
  check (olx_publication_type in (
    'STANDARD', 'PREMIUM', 'SUPER_PREMIUM', 'PREMIERE_1', 'PREMIERE_2', 'TRIPLE'
  ));

notify pgrst, 'reload schema';
