-- Lien fiche RH (collaborateurs) ↔ compte applicatif (auth.users / profiles)
-- Permet la liaison bidirectionnelle : création RH avec compte existant, ou inscription auto.

ALTER TABLE public.collaborateurs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.collaborateurs
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_collaborateurs_user_id ON public.collaborateurs (user_id);
CREATE INDEX IF NOT EXISTS idx_collaborateurs_email ON public.collaborateurs (email)
  WHERE user_id IS NULL;
