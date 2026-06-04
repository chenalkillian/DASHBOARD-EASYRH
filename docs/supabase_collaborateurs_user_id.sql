-- Lien fiche RH (collaborateurs) ↔ compte applicatif (auth.users / profiles)
-- À exécuter dans le SQL Editor Supabase avant de tester la création de comptes.

ALTER TABLE public.collaborateurs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.collaborateurs
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_collaborateurs_user_id ON public.collaborateurs (user_id);
