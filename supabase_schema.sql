-- Schéma SQL pour le SaaS de Commande par QR Code
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Activation des extensions requises
create extension if not exists "uuid-ossp";

-- 2. Suppression des tables existantes (pour réinitialisation si besoin)
drop table if exists waiter_calls cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists tables cascade;
drop table if exists menu_items cascade;
drop table if exists categories cascade;
drop table if exists restaurants cascade;
drop table if exists subscriptions cascade;

-- 3. Table des Abonnements
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null, -- Référence à auth.users de Supabase
  status varchar(50) not null default 'trial', -- 'active', 'suspended', 'trial', 'canceled'
  billing_cycle varchar(50) not null default 'monthly',
  stripe_customer_id varchar(255),
  stripe_subscription_id varchar(255),
  local_payment_provider_id varchar(255),
  starts_at timestamp with time zone default timezone('utc'::text, now()),
  ends_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Table des Restaurants
create table restaurants (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid references subscriptions(id) on delete set null,
  name varchar(255) not null,
  slug varchar(255) not null unique,
  logo_url text,
  banner_url text,
  contact_phone varchar(50) not null,
  address text not null,
  opening_hours jsonb,
  ui_config jsonb default '{"primaryColor": "#F59E0B", "theme": "dark"}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index sur le slug pour des recherches rapides
create index idx_restaurants_slug on restaurants(slug);

-- 5. Table des Catégories de Menu
create table categories (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name varchar(255) not null,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index idx_categories_restaurant on categories(restaurant_id);

-- 6. Table des Plats / Articles (Menu Items)
create table menu_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references categories(id) on delete cascade,
  name varchar(255) not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  status varchar(50) not null default 'available', -- 'available', 'out_of_stock', 'hidden'
  allergens text[] default '{}'::text[],
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index idx_menu_items_category on menu_items(category_id);

-- 7. Table des Tables
create table tables (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_number varchar(50) not null,
  short_code varchar(50) not null unique,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index idx_tables_restaurant on tables(restaurant_id);
create index idx_tables_short_code on tables(short_code);

-- 8. Table des Commandes (Orders)
create table orders (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid not null references tables(id) on delete cascade,
  status varchar(50) not null default 'pending', -- 'pending', 'preparing', 'ready', 'completed', 'canceled'
  total_amount numeric(10, 2) not null default 0.00,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  accepted_at timestamp with time zone,
  served_at timestamp with time zone
);

create index idx_orders_restaurant on orders(restaurant_id);
create index idx_orders_status on orders(status);

-- 9. Détail des articles d'une commande
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  notes text
);

-- 10. Appels serveur / Addition
create table waiter_calls (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid not null references tables(id) on delete cascade,
  type varchar(50) not null, -- 'call' (appel), 'bill' (addition)
  status varchar(50) not null default 'pending', -- 'pending', 'resolved'
  created_at timestamp with time zone default timezone('utc'::text, now()),
  resolved_at timestamp with time zone
);

create index idx_waiter_calls_restaurant on waiter_calls(restaurant_id);
create index idx_waiter_calls_status on waiter_calls(status);

-- Activer les tables dans Supabase Realtime pour recevoir les mises à jour en direct
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table waiter_calls;

-- =========================================================================
-- JEU DE DONNÉES DE DÉMONSTRATION (SEEDING)
-- =========================================================================

-- Insertion d'un abonnement fictif
insert into subscriptions (id, owner_id, status, billing_cycle, ends_at)
values (
  '11111111-1111-1111-1111-111111111111', 
  '00000000-0000-0000-0000-000000000000', 
  'active', 
  'monthly', 
  now() + interval '1 year'
);

-- Insertion du restaurant "Le Bistro Premium"
insert into restaurants (id, subscription_id, name, slug, logo_url, banner_url, contact_phone, address, ui_config)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Le Bistro Premium',
  'bistro-premium',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop&q=80',
  '+33 1 23 45 67 89',
  '12 Rue de la Gastronomie, 75001 Paris',
  '{"primaryColor": "#D97706", "theme": "dark"}'
);

-- Insertion des tables avec short_code associés
insert into tables (id, restaurant_id, table_number, short_code) values
('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222222', 'Table 1', 'tb1'),
('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222222', 'Table 2', 'tb2'),
('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222222', 'Table 3', 'tb3'),
('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222222', 'Table 4', 'tb4');

-- Insertion des catégories du Bistro Premium
insert into categories (id, restaurant_id, name, sort_order) values
('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222222', 'Entrées', 1),
('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222222', 'Plats Signature', 2),
('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222222', 'Desserts', 3),
('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222222', 'Boissons & Cocktails', 4);

-- Insertion des plats (Menu Items)
-- Entrées
insert into menu_items (category_id, name, description, price, status, allergens, sort_order, image_url) values
(
  '44444444-4444-4444-4444-444444444401',
  'Foie Gras de Canard Maison',
  'Foie gras de canard maison, chutney de figues et brioche toastée.',
  18.50,
  'available',
  array['Gluten', 'Sulfites'],
  1,
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80'
),
(
  '44444444-4444-4444-4444-444444444401',
  'Velouté de Potimarron aux Châtaignes',
  'Un velouté onctueux de saison, éclats de châtaignes et émulsion truffée.',
  12.00,
  'available',
  array['Lactose'],
  2,
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80'
);

-- Plats Signature
insert into menu_items (category_id, name, description, price, status, allergens, sort_order, image_url) values
(
  '44444444-4444-4444-4444-444444444402',
  'Filet de Bœuf Rossini',
  'Filet de bœuf tendre, escalope de foie gras poêlée, sauce Périgueux aux truffes, écrasé de pommes de terre.',
  36.00,
  'available',
  array['Lactose', 'Sulfites'],
  1,
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80'
),
(
  '44444444-4444-4444-4444-444444444402',
  'Pavé de Cabillaud en Croûte d''Herbes',
  'Cabillaud frais, mousseline de panais, légumes glacés et émulsion de coquillages.',
  26.50,
  'available',
  array['Poisson', 'Lactose'],
  2,
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop&q=80'
),
(
  '44444444-4444-4444-4444-444444444402',
  'Risotto aux Cèpes & Truffe Fraîche',
  'Risotto crémeux aux cèpes poêlés, parmesan Reggiano 24 mois, lamelles de truffe fraîche.',
  24.00,
  'available',
  array['Lactose'],
  3,
  'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop&q=80'
);

-- Desserts
insert into menu_items (category_id, name, description, price, status, allergens, sort_order, image_url) values
(
  '44444444-4444-4444-4444-444444444403',
  'Mi-Cuit Chocolat Noir Intense',
  'Coeur coulant, glace vanille de Madagascar et tuile croustillante.',
  9.50,
  'available',
  array['Gluten', 'Lactose', 'Œufs'],
  1,
  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop&q=80'
),
(
  '44444444-4444-4444-4444-444444444403',
  'Tarte Tatin Traditionnelle',
  'Pommes caramélisées, pâte feuilletée croustillante et crème fraîche d''Isigny.',
  9.00,
  'available',
  array['Gluten', 'Lactose'],
  2,
  'https://images.unsplash.com/photo-1508737804141-4c3b688e25be?w=400&h=300&fit=crop&q=80'
);

-- Boissons
insert into menu_items (category_id, name, description, price, status, allergens, sort_order, image_url) values
(
  '44444444-4444-4444-4444-444444444404',
  'Cocktail Signature "Bistro Tonic"',
  'Gin infusé au romarin, tonic artisanal, concombre frais et zeste de citron vert.',
  12.00,
  'available',
  array{},
  1,
  'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop&q=80'
),
(
  '44444444-4444-4444-4444-444444444404',
  'Château Margaux 2015 (Au verre)',
  'Vin rouge d''exception de la région de Bordeaux.',
  19.00,
  'available',
  array['Sulfites'],
  2,
  'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop&q=80'
),
(
  '44444444-4444-4444-4444-444444444404',
  'Eau Minérale Micro-filtrée Gazeuse (75cl)',
  'Eau filtrée et gazéifiée sur place.',
  4.50,
  'available',
  array{},
  3,
  'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=300&fit=crop&q=80'
);
