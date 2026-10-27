create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  emoji text not null default '🛒',
  categoria text not null default 'Otros',
  agotado boolean not null default false,
  agotado_en timestamptz,
  nota text,
  ocasional boolean not null default false,
  lugar text,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

alter table productos enable row level security;

-- Después corre multi-casa.sql. Los productos de ejemplo se crean al activar cada sticker.
