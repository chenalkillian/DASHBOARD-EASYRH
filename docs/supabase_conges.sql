-- F6 Congés: table conges + RLS (à exécuter dans Supabase SQL Editor)

create table if not exists public.conges (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  date_debut date not null,
  date_fin date not null,
  motif text,
  statut text not null default 'En attente', -- En attente | Approuvé | Refusé
  created_by uuid not null references auth.users (id),
  validated_by uuid references auth.users (id),
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger updated_at
create or replace function public.set_updated_at_conges()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_conges_updated_at on public.conges;
create trigger trg_conges_updated_at
before update on public.conges
for each row execute function public.set_updated_at_conges();

-- Index
create index if not exists idx_conges_created_at on public.conges (created_at desc);
create index if not exists idx_conges_statut on public.conges (statut);
create index if not exists idx_conges_created_by on public.conges (created_by);

alter table public.conges enable row level security;

-- RLS: lecture/écriture réservées aux utilisateurs authentifiés
drop policy if exists "conges_read_authenticated" on public.conges;
create policy "conges_read_authenticated"
on public.conges
for select
to authenticated
using (true);

drop policy if exists "conges_insert_authenticated" on public.conges;
create policy "conges_insert_authenticated"
on public.conges
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "conges_update_authenticated" on public.conges;
create policy "conges_update_authenticated"
on public.conges
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "conges_delete_authenticated" on public.conges;
create policy "conges_delete_authenticated"
on public.conges
for delete
to authenticated
using (auth.uid() = created_by);

