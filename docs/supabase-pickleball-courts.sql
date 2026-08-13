create table if not exists public.pickleball_courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text,
  court_count integer not null default 1 check (court_count > 0),
  surface_type text not null check (surface_type in ('indoor', 'outdoor')),
  access_type text not null check (access_type in ('public', 'private')),
  price_type text not null check (price_type in ('free', 'paid')),
  opening_hours text,
  website text,
  description text,
  lat double precision not null,
  lng double precision not null,
  source text not null default 'picklemania',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pickleball_courts_status_lat_lng_idx
  on public.pickleball_courts (status, lat, lng);
