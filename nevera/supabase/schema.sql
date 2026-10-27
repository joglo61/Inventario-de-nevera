create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  emoji text not null default '🛒',
  categoria text not null default 'Otros',
  agotado boolean not null default false,
  agotado_en timestamptz,
  nota text,
  ocasional boolean not null default false,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

alter table productos enable row level security;

insert into productos (nombre, emoji, categoria, orden) values
  ('Leche', '🥛', 'Lácteos y huevos', 1),
  ('Huevos', '🥚', 'Lácteos y huevos', 2),
  ('Queso', '🧀', 'Lácteos y huevos', 3),
  ('Pan', '🍞', 'Despensa', 4),
  ('Arroz', '🍚', 'Despensa', 5),
  ('Café', '☕', 'Despensa', 6),
  ('Vinagre', '🍶', 'Despensa', 7),
  ('Estevia', '🌿', 'Despensa', 8),
  ('Salchichas', '🌭', 'Despensa', 9),
  ('Jabón de loza', '🧼', 'Aseo del hogar', 10),
  ('Detergente', '🧴', 'Aseo del hogar', 11),
  ('Jabón en polvo', '🧺', 'Aseo del hogar', 12),
  ('Desodorante', '🧴', 'Aseo personal', 13),
  ('Talco', '✨', 'Aseo personal', 14),
  ('Crema de dientes', '🪥', 'Aseo personal', 15),
  ('Cebolla', '🧅', 'Verduras', 16),
  ('Tomate', '🍅', 'Verduras', 17),
  ('Lechuga', '🥬', 'Verduras', 18);
