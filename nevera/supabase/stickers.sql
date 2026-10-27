-- Genera stickers nuevos y muestra la dirección que hay que grabar en cada uno con NFC Tools
-- (Escribir > Agregar registro > URL). Cambia 10 por la cantidad y el dominio por el tuyo.
with nuevos as (
  insert into stickers (creado_en) select now() from generate_series(1, 10) returning id
)
select 'https://TU-DOMINIO/t/' || id as url from nuevos;

-- Stickers sin activar:
-- select 'https://TU-DOMINIO/t/' || id as url from stickers where casa_id is null order by creado_en;
