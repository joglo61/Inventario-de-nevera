-- Genera stickers nuevos y muestra la dirección que hay que grabar en cada uno con NFC Tools
-- (Escribir > Agregar registro > URL). Cambia 10 por la cantidad.
with nuevos as (
  insert into stickers (creado_en) select now() from generate_series(1, 10) returning id
)
select 'https://inventario-de-nevera.vercel.app/t/' || id as url from nuevos;

-- Stickers sin activar:
-- select 'https://inventario-de-nevera.vercel.app/t/' || id as url from stickers where casa_id is null order by creado_en;
