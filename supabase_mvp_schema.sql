-- =========================================================================
-- Phase 1 & 2 MVP - Schéma de base de données multi-restaurant pour Supabase
-- =========================================================================

-- Activation de l'extension pour la génération d'UUID
create extension if not exists "uuid-ossp";

-- Suppression des tables existantes pour réinitialisation propre
drop table if exists service_requests cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists tables cascade;
drop table if exists restaurant_users cascade;
drop table if exists platform_admins cascade;
drop table if exists menu_items cascade;
drop table if exists restaurants cascade;

-- 1. Table des Restaurants
create table restaurants (
    id uuid primary key default uuid_generate_v4(),
    name varchar(255) not null,
    slug varchar(255) not null unique,
    subscription_status varchar(50) not null default 'trialing' check (subscription_status in ('trialing', 'active', 'past_due', 'suspended')),
    trial_ends_at timestamp with time zone not null default (now() + interval '7 days'),
    subscription_ends_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now())
);
create index idx_restaurants_slug on restaurants(slug);

-- 2. Table des Utilisateurs (Gérants et Employés de restaurant)
create table restaurant_users (
    id uuid primary key default uuid_generate_v4(),
    restaurant_id uuid not null references restaurants(id) on delete cascade,
    name varchar(255) not null,
    email varchar(255) not null,
    password varchar(255) not null, -- Stocké en clair pour le prototype/MVP
    role varchar(50) not null check (role in ('admin', 'cook', 'waiter')),
    created_at timestamp with time zone default timezone('utc'::text, now()),
    constraint unique_restaurant_email unique (restaurant_id, email)
);
create index idx_restaurant_users_email on restaurant_users(email);

-- 2.5 Table des Administrateurs de la Plateforme (Super Admins)
create table platform_admins (
    id uuid primary key default uuid_generate_v4(),
    name varchar(255) not null,
    email varchar(255) not null unique,
    password varchar(255) not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);
create index idx_platform_admins_email on platform_admins(email);

-- 3. Table des Tables de restaurant
create table tables (
    id uuid primary key default uuid_generate_v4(),
    restaurant_id uuid not null references restaurants(id) on delete cascade,
    table_number varchar(50) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    constraint unique_restaurant_table unique (restaurant_id, table_number)
);

-- 4. Table des MenuItems (Plats reliés à un restaurant)
create table menu_items (
    id uuid primary key default uuid_generate_v4(),
    restaurant_id uuid not null references restaurants(id) on delete cascade,
    name varchar(255) not null,
    description text,
    price decimal(10, 2) not null check (price >= 0),
    category varchar(100) not null,
    image_url text,
    is_active boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Table des Commandes (Orders)
create table orders (
    id uuid primary key default uuid_generate_v4(),
    restaurant_id uuid not null references restaurants(id) on delete cascade,
    table_number varchar(50) not null,
    status varchar(50) not null default 'pending' check (status in ('pending', 'cooking', 'ready')),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Table de Liaison OrderItems (Liaison Orders <-> MenuItems avec quantité)
create table order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid not null references orders(id) on delete cascade,
    menu_item_id uuid not null references menu_items(id) on delete cascade,
    quantity integer not null check (quantity > 0)
);

-- 7. Table des Appels ServiceRequests (Appels serveur et demandes d'addition)
create table service_requests (
    id uuid primary key default uuid_generate_v4(),
    restaurant_id uuid not null references restaurants(id) on delete cascade,
    table_number varchar(50) not null,
    type varchar(50) not null check (type in ('waiter', 'bill')),
    status varchar(50) not null default 'pending' check (status in ('pending', 'resolved')),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index pour optimiser les performances des requêtes fréquentes
create index idx_orders_restaurant_id on orders(restaurant_id);
create index idx_orders_status on orders(status);
create index idx_order_items_order_id on order_items(order_id);
create index idx_service_requests_restaurant_id on service_requests(restaurant_id);
create index idx_service_requests_status on service_requests(status);
create index idx_menu_items_restaurant_id on menu_items(restaurant_id);

-- Activation de Supabase Realtime pour les tables suivies en temps réel
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table service_requests;

-- =========================================================================
-- JEU DE DONNÉES DE DÉMONSTRATION (SEEDING MOCK DATA)
-- =========================================================================

-- 1. Restaurants de démonstration
insert into restaurants (id, name, slug, subscription_status, trial_ends_at, subscription_ends_at) values
('22222222-2222-2222-2222-222222222222', 'Bistro Premium', 'bistro-premium', 'active', now() + interval '7 days', now() + interval '15 days'),
('33333333-3333-3333-3333-333333333333', 'Maquis Cacao', 'maquis-cacao', 'trialing', now() + interval '5 days', null);

-- 2. Comptes d'accès pour les gérants et employés
insert into restaurant_users (id, restaurant_id, name, email, password, role) values
-- Bistro Premium
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Gérant Bistro', 'gerant@bistropremium.ci', 'admin123', 'admin'),
('11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 'Chef Amadou', 'chef@bistropremium.ci', 'chef123', 'cook'),
('11111111-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222222', 'Serveur Koffi', 'serveur@bistropremium.ci', 'serveur123', 'waiter'),
-- Maquis Cacao
('11111111-1111-1111-1111-222222222221', '33333333-3333-3333-3333-333333333333', 'Gérant Cacao', 'gerant@maquiscacao.ci', 'admin123', 'admin'),
('11111111-1111-1111-1111-222222222222', '33333333-3333-3333-3333-333333333333', 'Chef Awa', 'chef@maquiscacao.ci', 'chef123', 'cook');

-- 2.5 Comptes d'accès pour les Administrateurs de la Plateforme (Super Admin)
insert into platform_admins (id, name, email, password) values
('00000000-0000-0000-0000-000000000000', 'Super Administrateur', 'superadmin@restomenu.ci', 'super123');

-- 3. Tables actives par défaut
insert into tables (id, restaurant_id, table_number) values
-- Bistro Premium (Tables 1 à 4)
('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222222', '1'),
('55555555-5555-5555-5555-555555555502', '22222222-2222-2222-2222-222222222222', '2'),
('55555555-5555-5555-5555-555555555503', '22222222-2222-2222-2222-222222222222', '3'),
('55555555-5555-5555-5555-555555555504', '22222222-2222-2222-2222-222222222222', '4'),
-- Maquis Cacao (Tables A et B)
('55555555-5555-5555-5555-666666666601', '33333333-3333-3333-3333-333333333333', 'A'),
('55555555-5555-5555-5555-666666666602', '33333333-3333-3333-3333-333333333333', 'B');

-- 4. Menu pour Bistro Premium
insert into menu_items (id, restaurant_id, name, description, price, category, image_url) values
('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222222', 'Foie Gras de Canard Maison', 'Foie gras de canard maison, chutney de figues et brioche toastée.', 12000, 'Entrées', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222222', 'Velouté de Potimarron', 'Un velouté onctueux de saison, éclats de châtaignes et émulsion truffée.', 5000, 'Entrées', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222222', 'Filet de Bœuf Rossini', 'Filet de bœuf tendre, foie gras poêlé, sauce Périgueux, écrasé de pommes de terre.', 22000, 'Plats', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222222', 'Risotto aux Cèpes', 'Risotto crémeux aux cèpes poêlés et parmesan Reggiano 24 mois.', 15000, 'Plats', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222222', 'Mi-Cuit Chocolat Noir', 'Cœur coulant, glace vanille de Madagascar.', 6000, 'Desserts', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-444444444406', '22222222-2222-2222-2222-222222222222', 'Cocktail Bistro Tonic', 'Gin infusé au romarin, tonic artisanal, concombre frais.', 7000, 'Boissons', 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop&q=80');

-- 5. Menu pour Maquis Cacao
insert into menu_items (id, restaurant_id, name, description, price, category, image_url) values
('44444444-4444-4444-4444-888888888801', '33333333-3333-3333-3333-333333333333', 'Alloco & Brochettes', 'Alloco croustillant de Côte d''Ivoire, brochettes de bœuf épicées.', 6500, 'Plats', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-888888888802', '33333333-3333-3333-3333-333333333333', 'Kedjenou de Poulet', 'Poulet mijoté à l''étouffée avec légumes, servi avec de l''attiéké.', 8000, 'Plats', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-888888888803', '33333333-3333-3333-3333-333333333333', 'Bissap Glacé Maison', 'Jus de fleurs d''hibiscus infusées, menthe et arôme vanille.', 2000, 'Boissons', 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop&q=80');
