-- F4 Recrutement: table candidats + RLS (à exécuter dans Supabase SQL Editor)
-- Pré-requis: extensions par défaut Supabase (uuid/pgcrypto généralement dispo)

create table if not exists public.candidats (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  poste text not null,
  statut text not null default 'Nouveau',
  source text,
  email text,
  telephone text,
  date_candidature date,
  notes text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_candidats_updated_at on public.candidats;
create trigger trg_candidats_updated_at
before update on public.candidats
for each row execute function public.set_updated_at();

-- Index utiles
create index if not exists idx_candidats_statut on public.candidats (statut);
create index if not exists idx_candidats_created_at on public.candidats (created_at desc);

-- RLS
alter table public.candidats enable row level security;

-- Lecture/écriture réservées aux utilisateurs authentifiés.
-- (Le filtrage par rôle RH/Manager est appliqué côté API Express via service_role)
drop policy if exists "candidats_read_authenticated" on public.candidats;
create policy "candidats_read_authenticated"
on public.candidats
for select
to authenticated
using (true);

drop policy if exists "candidats_insert_authenticated" on public.candidats;
create policy "candidats_insert_authenticated"
on public.candidats
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "candidats_update_authenticated" on public.candidats;
create policy "candidats_update_authenticated"
on public.candidats
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "candidats_delete_authenticated" on public.candidats;
create policy "candidats_delete_authenticated"
on public.candidats
for delete
to authenticated
using (auth.uid() = created_by);

