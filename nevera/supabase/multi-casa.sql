-- Multi-casa: cada sticker NFC activa una casa; cada casa ve solo sus productos.
-- Solo agrega cosas: la versión anterior de la app sigue funcionando mientras tanto.

create table if not exists casas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 40),
  -- clave para /api/lista (atajos de Siri, etc.)
  api_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  creado_en timestamptz not null default now()
);

-- Inventario de stickers. El id va grabado en el sticker: https://<dominio>/t/<id>
create table if not exists stickers (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  casa_id uuid references casas on delete set null,
  activado_en timestamptz,
  creado_en timestamptz not null default now()
);

create table if not exists miembros (
  casa_id uuid not null references casas on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  nombre text not null default '',
  email text not null default '',
  rol text not null default 'miembro' check (rol in ('dueno', 'miembro')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'activo')),
  creado_en timestamptz not null default now(),
  primary key (casa_id, user_id)
);

alter table productos add column if not exists casa_id uuid references casas on delete cascade;
create index if not exists productos_casa_orden on productos (casa_id, orden);
create index if not exists miembros_usuario on miembros (user_id);
create index if not exists stickers_casa on stickers (casa_id);

-- ---------- Quién es quién (security definer para que las políticas no se llamen en bucle) ----------

create or replace function es_miembro(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from miembros where casa_id = c and user_id = auth.uid() and estado = 'activo'
  );
$$;

create or replace function es_dueno(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from miembros
    where casa_id = c and user_id = auth.uid() and estado = 'activo' and rol = 'dueno'
  );
$$;

-- ---------- Seguridad por filas ----------

alter table casas enable row level security;
alter table stickers enable row level security; -- sin políticas: solo se tocan por las funciones de abajo
alter table miembros enable row level security;
alter table productos enable row level security;

drop policy if exists casas_ver on casas;
create policy casas_ver on casas for select to authenticated using (es_miembro(id));
drop policy if exists casas_renombrar on casas;
create policy casas_renombrar on casas for update to authenticated
  using (es_dueno(id)) with check (es_dueno(id));

drop policy if exists productos_casa on productos;
create policy productos_casa on productos for all to authenticated
  using (es_miembro(casa_id)) with check (es_miembro(casa_id));

drop policy if exists miembros_ver on miembros;
create policy miembros_ver on miembros for select to authenticated
  using (user_id = (select auth.uid()) or es_miembro(casa_id));
drop policy if exists miembros_gestionar on miembros;
create policy miembros_gestionar on miembros for update to authenticated
  using (es_dueno(casa_id)) with check (es_dueno(casa_id));
drop policy if exists miembros_quitar on miembros;
create policy miembros_quitar on miembros for delete to authenticated
  using (es_dueno(casa_id) or user_id = (select auth.uid()));

-- El dueño solo cambia rol y estado de un integrante; el nombre de la casa, solo el nombre.
revoke update on miembros from anon, authenticated;
grant update (rol, estado) on miembros to authenticated;
revoke update on casas from anon, authenticated;
grant update (nombre) on casas to authenticated;

-- ---------- Sticker ----------

-- Qué es este sticker para quien lo toca: invalido | libre | ajena | pendiente | miembro
create or replace function estado_sticker(s text)
returns table (estado text, casa_id uuid, casa_nombre text)
language plpgsql stable security definer set search_path = public as $$
declare
  c uuid;
  e text;
begin
  select st.casa_id into c from stickers st where st.id = s;
  if not found then
    return query select 'invalido'::text, null::uuid, null::text;
    return;
  end if;
  if c is null then
    return query select 'libre'::text, null::uuid, null::text;
    return;
  end if;
  select m.estado into e from miembros m where m.casa_id = c and m.user_id = auth.uid();
  return query select
    case when e is null then 'ajena' when e = 'pendiente' then 'pendiente' else 'miembro' end,
    c,
    (select ca.nombre from casas ca where ca.id = c);
end $$;

-- Primer toque: crea la casa con productos de ejemplo y deja a quien la activa como dueño.
create or replace function activar_sticker(s text, nombre_casa text, mi_nombre text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  c uuid;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  perform 1 from stickers where id = s and casa_id is null for update;
  if not found then raise exception 'Este sticker ya está activado o no existe'; end if;

  insert into casas (nombre) values (left(trim(nombre_casa), 40)) returning id into c;
  update stickers set casa_id = c, activado_en = now() where id = s;
  insert into miembros (casa_id, user_id, nombre, email, rol, estado)
  values (c, auth.uid(), left(trim(mi_nombre), 40), coalesce(auth.jwt() ->> 'email', ''), 'dueno', 'activo');

  insert into productos (casa_id, nombre, emoji, categoria, orden)
  select c, v.nombre, v.emoji, v.categoria, v.orden
  from (values
    ('Leche', '🥛', 'Lácteos y huevos', 1),
    ('Huevos', '🥚', 'Lácteos y huevos', 2),
    ('Queso', '🧀', 'Lácteos y huevos', 3),
    ('Pan', '🍞', 'Despensa', 4),
    ('Arroz', '🍚', 'Despensa', 5),
    ('Café', '☕', 'Despensa', 6),
    ('Aceite', '🫒', 'Despensa', 7),
    ('Sal', '🧂', 'Despensa', 8),
    ('Jabón de loza', '🧼', 'Aseo del hogar', 9),
    ('Detergente', '🧴', 'Aseo del hogar', 10),
    ('Papel higiénico', '🧻', 'Aseo del hogar', 11),
    ('Desodorante', '🧴', 'Aseo personal', 12),
    ('Crema de dientes', '🪥', 'Aseo personal', 13),
    ('Shampoo', '🧴', 'Aseo personal', 14),
    ('Cebolla', '🧅', 'Verduras', 15),
    ('Tomate', '🍅', 'Verduras', 16),
    ('Papa', '🥔', 'Verduras', 17)
  ) as v(nombre, emoji, categoria, orden);

  return c;
end $$;

-- Alguien que no es de la casa toca el sticker: queda pendiente hasta que un dueño lo apruebe.
create or replace function pedir_acceso(s text, mi_nombre text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  c uuid;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  select casa_id into c from stickers where id = s;
  if c is null then raise exception 'Este sticker no tiene casa'; end if;
  insert into miembros (casa_id, user_id, nombre, email)
  values (c, auth.uid(), left(trim(mi_nombre), 40), coalesce(auth.jwt() ->> 'email', ''))
  on conflict (casa_id, user_id) do nothing;
end $$;

-- /api/lista con la clave de la casa, sin sesión. Una clave que no es de ninguna casa da
-- error 28000 (y la app responde "No autorizado") en vez de una lista vacía.
create or replace function lista_por_token(t text)
returns table (nombre text, emoji text, categoria text, nota text, agotado_en timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  c uuid;
begin
  select id into c from casas where api_token = t;
  if c is null then
    raise exception 'Clave no válida' using errcode = '28000';
  end if;
  return query
    select p.nombre, p.emoji, p.categoria, p.nota, p.agotado_en
    from productos p
    where p.casa_id = c and p.agotado
    order by p.orden;
end $$;

revoke execute on function es_miembro(uuid), es_dueno(uuid), estado_sticker(text),
  activar_sticker(text, text, text), pedir_acceso(text, text) from public, anon;
grant execute on function es_miembro(uuid), es_dueno(uuid), estado_sticker(text),
  activar_sticker(text, text, text), pedir_acceso(text, text) to authenticated;
revoke execute on function lista_por_token(text) from public;
grant execute on function lista_por_token(text) to anon, authenticated;

-- ---------- Después de activar tu propio sticker (no correr antes) ----------
-- 1. Pasar los productos de antes a tu casa:
--    update productos set casa_id = (select casa_id from stickers where id = '<id de tu sticker>')
--    where casa_id is null;
-- 2. Ya sin productos sueltos:
--    alter table productos alter column casa_id set not null;

-- ---------- La clave para atajos solo la ven los dueños, y la pueden cambiar ----------
revoke select on casas from anon, authenticated;
grant select (id, nombre, creado_en) on casas to authenticated;

create or replace function clave_de_casa(c uuid) returns text
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_dueno(c) then raise exception 'Solo un dueño puede ver la clave' using errcode = '42501'; end if;
  return (select api_token from casas where id = c);
end $$;

create or replace function cambiar_clave(c uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  t text := replace(gen_random_uuid()::text, '-', '');
begin
  if not es_dueno(c) then raise exception 'Solo un dueño puede cambiar la clave' using errcode = '42501'; end if;
  update casas set api_token = t where id = c;
  return t;
end $$;

revoke execute on function clave_de_casa(uuid), cambiar_clave(uuid) from public, anon;
grant execute on function clave_de_casa(uuid), cambiar_clave(uuid) to authenticated;
