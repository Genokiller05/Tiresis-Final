-- Enable UUID extension
create extension if not exists "uuid-ossp";
-- 1. Admins Table
create table if not exists admins (
    id uuid default uuid_generate_v4() primary key,
    "fullName" text,
    email text unique not null,
    password text not null,
    -- Note: Consider hashing this in production if not already
    "companyName" text,
    location text,
    lat double precision,
    lng double precision,
    zone jsonb,
    -- Stores the polygon coordinates for the zone
    created_at timestamp with time zone default timezone('utc'::text, now())
);
-- 2. Guards Table
create table if not exists guards (
    id uuid default uuid_generate_v4() primary key,
    "idEmpleado" text unique not null,
    nombre text not null,
    estado text,
    email text,
    area text,
    foto text,
    lat double precision,
    lng double precision,
    actividades jsonb default '[]'::jsonb,
    -- Keeping activities embedded for now to match JSON structure
    created_at timestamp with time zone default timezone('utc'::text, now())
);
-- 3. Cameras Table
create table if not exists cameras (
    id text primary key,
    -- Using text ID to match "CAM-001" format
    ip text,
    marca text,
    modelo text,
    activa boolean default true,
    area text,
    alertas int default 0,
    created_at timestamp with time zone default timezone('utc'::text, now())
);
-- 4. Reports (Alerts) Table
create table if not exists reports (
    id text primary key,
    "fechaHora" timestamp with time zone,
    origen text,
    tipo text,
    "sitioArea" text,
    estado text,
    detalles jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now())
);
-- 5. Buildings Table
create table if not exists buildings (
    id text primary key,
    name text,
    geometry jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now())
);
-- 6. Entries/Exits Table
create table if not exists entries_exits (
    id text primary key,
    "fechaHora" timestamp with time zone,
    tipo text,
    -- 'Entrada' or 'Salida'
    descripcion text,
    "idRelacionado" text,
    -- ID of guard or admin if applicable
    created_at timestamp with time zone default timezone('utc'::text, now())
);
-- RLS Policies (Optional but recommended - Enable manually if needed)
-- alter table admins enable row level security;
-- alter table guards enable row level security;
-- ...