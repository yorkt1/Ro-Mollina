update public.destination_links
set
  name = 'Condomínios à venda',
  path = '/comprar?categoria=condominio'
where lower(name) in ('condomínios', 'condominios')
  and path not like '/%';
