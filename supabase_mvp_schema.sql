-- =========================================================================
-- Phase 1 MVP - Schéma de base de données pour Supabase
-- Ce schéma est simplifié pour la prise de commande client et l'interface cuisine.
-- =========================================================================

-- Activation de l'extension pour la génération d'UUID
create extension if not exists "uuid-ossp";

-- Suppression des tables existantes pour réinitialisation propre
drop table if exists service_requests cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists menu_items cascade;

-- 1. Table MenuItems
create table menu_items (
    id uuid primary key default uuid_generate_v4(),
    name varchar(255) not null,
    description text,
    price decimal(10, 2) not null check (price >= 0),
    category varchar(100) not null,
    image_url text,
    is_active boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Table Orders
create table orders (
    id uuid primary key default uuid_generate_v4(),
    table_number varchar(50) not null,
    status varchar(50) not null default 'pending' check (status in ('pending', 'cooking', 'ready')),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Table OrderItems (Liaison Orders <-> MenuItems avec quantité)
create table order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid not null references orders(id) on delete cascade,
    menu_item_id uuid not null references menu_items(id) on delete cascade,
    quantity integer not null check (quantity > 0)
);

-- 4. Table ServiceRequests (Appels serveur et demandes d'addition)
create table service_requests (
    id uuid primary key default uuid_generate_v4(),
    table_number varchar(50) not null,
    type varchar(50) not null check (type in ('waiter', 'bill')),
    status varchar(50) not null default 'pending' check (status in ('pending', 'resolved')),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index pour optimiser les performances des requêtes fréquentes
create index idx_orders_status on orders(status);
create index idx_order_items_order_id on order_items(order_id);
create index idx_service_requests_status on service_requests(status);

-- Activation de Supabase Realtime pour les tables suivies en temps réel
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table service_requests;

-- =========================================================================
-- JEU DE DONNÉES DE DÉMONSTRATION (SEEDING MOCK DATA)
-- =========================================================================

insert into menu_items (id, name, description, price, category, image_url) values
('44444444-4444-4444-4444-444444444401', 'Foie Gras de Canard Maison', 'Foie gras de canard maison, chutney de figues et brioche toastée.', 12000, 'Entrées', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-444444444402', 'Velouté de Potimarron', 'Un velouté onctueux de saison, éclats de châtaignes et émulsion truffée.', 5000, 'Entrées', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-444444444403', 'Filet de Bœuf Rossini', 'Filet de bœuf tendre, foie gras poêlé, sauce Périgueux, écrasé de pommes de terre.', 22000, 'Plats', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-444444444404', 'Risotto aux Cèpes', 'Risotto crémeux aux cèpes poêlés et parmesan Reggiano 24 mois.', 15000, 'Plats', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-444444444405', 'Mi-Cuit Chocolat Noir', 'Cœur coulant, glace vanille de Madagascar.', 6000, 'Desserts', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop&q=80'),
('44444444-4444-4444-4444-444444444406', 'Cocktail Bistro Tonic', 'Gin infusé au romarin, tonic artisanal, concombre frais.', 7000, 'Boissons', 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop&q=80');
