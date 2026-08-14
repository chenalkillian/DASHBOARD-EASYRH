# Historique des versions — EasyDashboard RH

Synthèse des évolutions du projet (fonctionnalités, correctifs, doc). Historique aligné sur le **Journal des versions officiel (Annexe 2, Dossier Bloc 4 — C4.3.2)**, source de référence pour toutes les dates et contenus de version.

---

## [1.4.4] — Juillet 2026 — `feature/waiting-RH-authorization`

### Ajouts
- Contrôle d'accès pour les utilisateurs authentifiés sans fiche collaborateur valide.
- Création de la page **Compte en attente** et du middleware `requireAccount` (blocage des modules métier hors rôle RH tant que la fiche n'est pas validée, retour 403 `error: compte_en_attente`).
- Sécurisation renforcée du module Congés, ajustements du module Onboarding.
- Mise à jour des tests backend/frontend.

### Conformité
- Mise en conformité renforcée avec OWASP A04 (Insecure Design) — suppression du risque qu'un compte fraîchement créé accède à des données RH sans validation préalable.

---

## [1.4.3] — Juillet 2026 — `feature/link-user-collaborateur`

### Ajouts
- Ajout de la liaison entre un compte utilisateur (`auth.users`) et une fiche collaborateur existante, permettant d'associer un accès applicatif à un collaborateur déjà enregistré en base.

---

## [1.4.2] — Juin 2026 — `fix/bug-06`

### Corrections
- **BUG-06** — Erreur trompeuse à la modification d'un collaborateur sans compte lié (rôle ignoré si pas de `user_id`) — **corrigé**.
- Responsive Login/Onboarding.

---

## [1.4.1] — Juin 2026 — `feature/role-based-ui-restrictions`

### Ajouts
- Restrictions UI par rôle : Manager en lecture seule, sans accès au module Recrutement, vue Congés globale.

---

## [1.4.0] — Juin 2026 — `feature/role-management`

### Ajouts
- Gestion des rôles RBAC : différenciation RH / Manager / Collaborateur côté backend.

---

## [1.3.1] — Juin 2026 — `feature/ux-fixes-v1.3`

### Corrections
- Fixation de la version Vitest (3.2.4), commit du `package-lock.json`, stabilisation du pipeline CI.

---

## [1.3.0] — Juin 2026 — `feature/ux-fixes-v1.3`

### Ajouts
- UX/UI globale : congés demandeur, bouton "modifier" sur le module Recrutement, loading states, empty states, responsive.

---

## [1.2.1] — Juin 2026 — `fix/bug-02-validation`

### Corrections
- **BUG-02** — Validation des entrées backend : intégration d'`express-validator` sur toutes les routes POST/PUT (collaborateurs, candidats, congés) — middleware `validate`, erreurs HTTP 400 — **corrigé**.

---

## [1.2.0] — Mai 2026 — `fix/bug-01-04-03`

### Corrections
- **BUG-01** — Intercepteur 401 `apiFetch` (rafraîchissement de session, redirection login sur token expiré) — **corrigé**.
- **BUG-03** — Messages d'erreur Supabase traduits en français, complété sur `Register.jsx`.
- **BUG-04** — Création automatique du profil Collaborateur manquant dans `authMiddleware` — **corrigé**.

---

## [1.1.3] — Mai 2026 — `feature/no-setting`

### Corrections
- Suppression de la page Paramètres.

---

## [1.1.2] — Mai 2026 — `feature/responsive-tests-doc`

### Ajouts
- Corrections responsive, documentation et tests.

---

## [1.1.1] — Avril 2026 — `feature/bug-03-auth-errors-fr`

### Corrections
- **BUG-03** — Création de la fonction utilitaire `formatAuthError` (traduction des codes d'erreur Supabase en français) — appliquée sur `Login.jsx` — partiellement corrigé.

---

## [1.1.0] — Avril 2026 — `feature/ci-global`

### Ajouts
- Mise en place du pipeline CI/CD global GitHub Actions (jobs backend + frontend).

---

## [1.0.0] — Mars 2026 — `master`

### Fonctionnalités principales
- Version complète F1–F6 : authentification Supabase + rôles (RH / Manager / Collaborateur), collaborateurs, dashboard KPI, recrutement, onboarding, congés.
- CI/CD opérationnel.

---

## [0.4.0] — Février 2026 — `frontend/1.2`

### Ajouts
- Écrans frontend d'authentification, intégration Supabase Auth.

---

## [0.3.0] — Février 2026 — `backend/1.2`

### Ajouts
- Middleware d'authentification JWT + RBAC.

---

## [0.2.0] — Février 2026 — `frontend/1.1`, `backend/1.1`

### Ajouts
- Setup du client Supabase, configuration des variables d'environnement.

---

## [0.1.0] — Février 2026 — `frontend/1.0`, `backend/1.0`

### Ajouts
- Initialisation du projet, structure `frontend/` / `backend/` / `docs/`.

---

## Anomalie en cours (non corrigée)

**BUG-05** — Absence de tests React Testing Library sur les composants frontend (Login, Register, Dashboard, Collaborateurs) — **planifié pour v1.5.0**, axe de progression identifié.
