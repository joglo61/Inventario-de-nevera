-- Recordatorio semanal por notificación en el celular.
-- Parte 1: tablas, permisos y funciones. Parte 2 (al final): el reloj (pg_cron), que se corre
-- cuando /api/recordatorio ya está en producción.

-- ---------- Horario de cada casa (lo elige un dueño) ----------
alter table casas
  add column if not exists recordatorio_dia smallint check (recordatorio_dia between 0 and 6), -- 0 = domingo
  add column if not exists recordatorio_hora smallint check (recordatorio_hora between 0 and 23);
grant select (recordatorio_dia, recordatorio_hora) on casas to authenticated;
grant update (recordatorio_dia, recordatorio_hora) on casas to authenticated; -- la política casas_renombrar lo limita a dueños

-- ---------- Cada integrante decide si lo recibe ----------
alter table miembros add column if not exists recibe_recordatorio boolean not null default true;

-- Por función y no por permiso de columna: con un permiso, la misma regla dejaría tocar el propio rol.
create or replace function mi_recordatorio(c uuid, activo boolean) returns void
language sql security definer set search_path = public as $$
  update miembros set recibe_recordatorio = activo where casa_id = c and user_id = auth.uid();
$$;

-- ---------- Celulares con avisos activos ----------
create table if not exists suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  creado_en timestamptz not null default now()
);
create index if not exists suscripciones_usuario on suscripciones (user_id);
alter table suscripciones enable row level security;

drop policy if exists suscripciones_ver on suscripciones;
create policy suscripciones_ver on suscripciones for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists suscripciones_borrar on suscripciones;
create policy suscripciones_borrar on suscripciones for delete to authenticated
  using (user_id = (select auth.uid()));

-- Guardar pasa por función: si el celular ya estaba registrado a nombre de otra persona
-- (cerró sesión y entró otra), queda a nombre de quien activó los avisos ahora.
create or replace function guardar_suscripcion(e text, p text, a text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  insert into suscripciones (user_id, endpoint, p256dh, auth)
  values (auth.uid(), e, p, a)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
end $$;

-- ---------- Lo que pide el reloj cada hora ----------
-- El secreto vive en Vault (nombre 'recordatorio_cron'); /api/recordatorio tiene el mismo en CRON_SECRET.
create or replace function secreto_cron_valido(s text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vault.decrypted_secrets where name = 'recordatorio_cron' and decrypted_secret = s
  );
$$;

-- Avisos que tocan en esta hora (hora de Colombia), solo para casas con algo agotado.
-- ponytail: zona horaria fija de Bogotá; agregar una por casa si se vende fuera de Colombia.
create or replace function recordatorios_pendientes(secreto text)
returns table (endpoint text, clave_p256dh text, clave_auth text, casa text, lista text[])
language plpgsql stable security definer set search_path = public as $$
declare
  ahora timestamp := now() at time zone 'America/Bogota';
begin
  if not secreto_cron_valido(secreto) then
    raise exception 'No autorizado' using errcode = '28000';
  end if;
  return query
    with casas_ahora as (
      select c.id, c.nombre from casas c
      where c.recordatorio_dia = extract(dow from ahora)::int
        and c.recordatorio_hora = extract(hour from ahora)::int
    ), listas as (
      select p.casa_id,
             array_agg(p.emoji || ' ' || p.nombre || coalesce(' · ' || p.nota, '') order by p.orden) as items
      from productos p join casas_ahora ca on ca.id = p.casa_id
      where p.agotado
      group by p.casa_id
    )
    select s.endpoint, s.p256dh, s.auth, ca.nombre, l.items
    from casas_ahora ca
    join listas l on l.casa_id = ca.id
    join miembros m on m.casa_id = ca.id and m.estado = 'activo' and m.recibe_recordatorio
    join suscripciones s on s.user_id = m.user_id;
end $$;

-- El celular quitó el permiso o desinstaló la app: se borra para no seguir intentando.
create or replace function borrar_suscripcion_vencida(secreto text, e text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not secreto_cron_valido(secreto) then
    raise exception 'No autorizado' using errcode = '28000';
  end if;
  delete from suscripciones where endpoint = e;
end $$;

revoke execute on function secreto_cron_valido(text) from public, anon, authenticated;
revoke execute on function mi_recordatorio(uuid, boolean), guardar_suscripcion(text, text, text) from public, anon;
grant execute on function mi_recordatorio(uuid, boolean), guardar_suscripcion(text, text, text) to authenticated;
revoke execute on function recordatorios_pendientes(text), borrar_suscripcion_vencida(text, text) from public;
grant execute on function recordatorios_pendientes(text), borrar_suscripcion_vencida(text, text) to anon, authenticated;

-- ---------- Parte 2: el reloj (correr cuando /api/recordatorio ya esté en producción) ----------
-- 1. Guardar el secreto (el mismo valor que CRON_SECRET en Netlify):
--    select vault.create_secret('<CRON_SECRET>', 'recordatorio_cron', 'Clave de pg_cron para /api/recordatorio');
-- 2. Programar la llamada al inicio de cada hora:
--    create extension if not exists pg_net;
--    create extension if not exists pg_cron;
--    select cron.schedule('recordatorio-semanal', '0 * * * *', $cron$
--      select net.http_post(
--        url := 'https://inventario-de-nevera.netlify.app/api/recordatorio',
--        headers := jsonb_build_object(
--          'Content-Type', 'application/json',
--          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'recordatorio_cron')
--        ),
--        body := '{}'::jsonb,
--        timeout_milliseconds := 25000
--      );
--    $cron$);
