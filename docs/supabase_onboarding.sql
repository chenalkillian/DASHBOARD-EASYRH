-- F5 Onboarding: table onboarding_tasks + RLS (à exécuter dans Supabase SQL Editor)

create table if not exists public.onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  collaborateur_id uuid not null references public.collaborateurs (id) on delete cascade,
  titre text not null,
  categorie text,
  termine boolean not null default false,
  ordre integer not null default 1,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger updated_at
create or replace function public.set_updated_at_onboarding()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_onboarding_tasks_updated_at on public.onboarding_tasks;
create trigger trg_onboarding_tasks_updated_at
before update on public.onboarding_tasks
for each row execute function public.set_updated_at_onboarding();

-- Index
create index if not exists idx_onboarding_tasks_collaborateur on public.onboarding_tasks (collaborateur_id);

alter table public.onboarding_tasks enable row level security;

-- RLS: lecture/écriture réservées aux utilisateurs authentifiés
drop policy if exists "onboarding_read_authenticated" on public.onboarding_tasks;
create policy "onboarding_read_authenticated"
on public.onboarding_tasks
for select
to authenticated
using (true);

drop policy if exists "onboarding_insert_authenticated" on public.onboarding_tasks;
create policy "onboarding_insert_authenticated"
on public.onboarding_tasks
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "onboarding_update_authenticated" on public.onboarding_tasks;
create policy "onboarding_update_authenticated"
on public.onboarding_tasks
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "onboarding_delete_authenticated" on public.onboarding_tasks;
create policy "onboarding_delete_authenticated"
on public.onboarding_tasks
for delete
to authenticated
using (auth.uid() = created_by);

