# EasyDashboard RH — Documentation (état actuel)

Ce document résume **ce qui est implémenté**, **ce que le site fait**, et renvoie vers la **doc technique** du dépôt (livrables type bilan RNCP / module).

## Documentation technique (fichiers du repo)

| Livrable | Fichier |
|----------|---------|
| Protocole CI / environnements | [`docs/protocole_deploiement_ci_cd.md`](./protocole_deploiement_ci_cd.md) |
| Cahier de recettes (C2.3.1) | [`docs/cahier_recettes.md`](./cahier_recettes.md) |
| Plan de correction des bogues (C2.3.2) | [`docs/plan_correction_bugs.md`](./plan_correction_bugs.md) |
| Sécurité & accessibilité (C2.2.3) | [`docs/securite_et_accessibilite.md`](./securite_et_accessibilite.md) |
| Manuel de déploiement (C2.4.1) | [`docs/manuels/manuel_deploiement.md`](./manuels/manuel_deploiement.md) |
| Manuel d’utilisation | [`docs/manuels/manuel_utilisation.md`](./manuels/manuel_utilisation.md) |
| Manuel de mise à jour | [`docs/manuels/manuel_mise_a_jour.md`](./manuels/manuel_mise_a_jour.md) |
| Historique des versions (C2.2.4 / C4.3.2) | [`../CHANGELOG.md`](../CHANGELOG.md) (racine du dépôt) |

### Les trois manuels (déploiement, utilisation, mise à jour)

Les trois types de manuel demandés dans le sujet correspondent aux fichiers suivants (`docs/manuels/`) :

| Type | Fichier |
|------|---------|
| Manuel de **déploiement** | [`manuel_deploiement.md`](./manuels/manuel_deploiement.md) |
| Manuel d’**utilisation** | [`manuel_utilisation.md`](./manuels/manuel_utilisation.md) |
| Manuel de **mise à jour** | [`manuel_mise_a_jour.md`](./manuels/manuel_mise_a_jour.md) |

Les noms de fichiers suffisent : pas besoin de renommer pour retrouver déploiement / utilisation / MAJ.

## Vue d’ensemble

Application **Dashboard RH fullstack** pour PME, avec :
- **Authentification** et **rôles** (RH / Manager / Collaborateur)
- **Centralisation RH** : collaborateurs, recrutement, onboarding, congés
- **Dashboard KPI** (répartition services/contrats, ancienneté, statuts)
- **Exports PDF/Excel**

## Stack & architecture

- **Frontend** : React + Vite + React Router + Tailwind + Chart.js
- **Backend** : Node.js + Express
- **Base / Auth / Realtime** : Supabase (PostgreSQL + Supabase Auth)

### Schéma d’appel

- Le frontend appelle le backend via `/api/...` (en dev, un **proxy Vite** route vers `VITE_BACKEND_URL`).
- Le backend parle à Supabase via la **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`) pour :
  - lire/écrire dans les tables
  - récupérer l’utilisateur via `supabase.auth.getUser(token)`

## Authentification & gestion du token

- **Login** : `POST /api/auth/login` (Supabase `signInWithPassword`)
- Le backend renvoie `{ token, user }`
- Le frontend stocke le token **uniquement en cookie** (clé `token`)
  - cookie accessible JS (pas HttpOnly) : `SameSite=Lax`, `Path=/`
- Au chargement, le frontend vérifie la session via `GET /api/auth/me` avec header `Authorization: Bearer <token>`

### Rôles

- Le middleware `authenticate` lit l’utilisateur Supabase + charge le rôle depuis la table `profiles`.
- Les routes backend appliquent des restrictions :
  - **RH** : gestion collaborateurs + exports collaborateurs
  - **RH/Manager** : dashboard KPI, recrutement, onboarding, exports correspondants
  - **Collaborateur** : accès limité (ex : demandes de congés : uniquement ses propres demandes)

## Modules & pages disponibles (fonctionnel)

### F1 — Auth + rôles

- Page : `Login`
- Protection des routes côté frontend (`Navigate` vers `/login` si pas de `user`)
- Rôles appliqués **côté backend** (`authorize(...)`) + utilisés côté frontend (navigation/accès pages)

### F2 — CRUD Collaborateurs (RH)

- Page : `Collaborateurs`
- Fonctionnalités :
  - Liste
  - Ajout
  - Édition (PUT)
  - Suppression (DELETE)
  - Accès RH uniquement (front + back)

### F3 — Dashboard KPI (RH/Manager)

- Page : `Dashboard`
- KPI/Charts depuis `GET /api/dashboard/stats` :
  - total collaborateurs
  - actifs / suspendus
  - répartition services / contrats
  - distribution d’ancienneté + ancienneté moyenne
- UI améliorée : cartes KPI + graphiques

### F4 — Recrutement (RH/Manager)

- Page : `Recrutement`
- Fonctionnalités :
  - CRUD candidats
  - Filtre par statut
  - Statistiques rapides par statut
  - Exports PDF/Excel (RH/Manager)
- Script Supabase : `docs/supabase_recrutement.sql` (table `candidats` + RLS)

### F5 — Onboarding (RH/Manager)

- Page : `Onboarding`
- Fonctionnalités :
  - Sélection d’un collaborateur
  - Checklist de tâches (toggle terminé, ajout, suppression)
  - Génération d’une checklist depuis un template (si checklist vide)
- Script Supabase : `docs/supabase_onboarding.sql` (table `onboarding_tasks` + RLS)

### F6 — Congés (tous + validation RH/Manager)

- Page : `Congés`
- Fonctionnalités :
  - Création d’une demande (tout utilisateur connecté)
  - Liste + filtre par statut
  - **Collaborateur** : voit seulement ses demandes, peut supprimer uniquement si “En attente”
  - **RH/Manager** : peut approuver/refuser + exporter PDF/Excel
- Script Supabase : `docs/supabase_conges.sql` (table `conges` + RLS)

### F7 — Exports PDF/Excel

Exports implementés via le backend (fichiers téléchargeables) + boutons dans les pages.

- **Collaborateurs** (RH) :
  - `GET /api/exports/collaborateurs.xlsx`
  - `GET /api/exports/collaborateurs.pdf`
- **Recrutement** (RH/Manager) :
  - `GET /api/exports/recrutement.xlsx`
  - `GET /api/exports/recrutement.pdf`
- **Congés** (RH/Manager) :
  - `GET /api/exports/conges.xlsx`
  - `GET /api/exports/conges.pdf`

## Endpoints backend (résumé)

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me` (protégé)

### Collaborateurs (RH)
- `GET /api/collaborateurs`
- `POST /api/collaborateurs`
- `GET /api/collaborateurs/:id`
- `PUT /api/collaborateurs/:id`
- `DELETE /api/collaborateurs/:id`

### Dashboard (RH/Manager)
- `GET /api/dashboard/stats`

### Recrutement (RH/Manager)
- `GET /api/recrutement`
- `POST /api/recrutement`
- `GET /api/recrutement/:id`
- `PUT /api/recrutement/:id`
- `DELETE /api/recrutement/:id`

### Onboarding (RH/Manager)
- `GET /api/onboarding/:collaborateurId`
- `POST /api/onboarding/:collaborateurId`
- `PUT /api/onboarding/task/:id`
- `DELETE /api/onboarding/task/:id`

### Congés (tous + validation RH/Manager)
- `GET /api/conges`
- `POST /api/conges`
- `PUT /api/conges/:id/decision` (RH/Manager)
- `DELETE /api/conges/:id`

### Exports
- `GET /api/exports/*` (selon rôle)

## Navigation / UI

- `Navbar` + `Sidebar` + `Layout`
- Routes principales :
  - `/` Dashboard
  - `/collaborateurs` (RH)
  - `/recrutement` (RH/Manager)
  - `/onboarding` (RH/Manager)
  - `/conges` (tous)

## Configuration (dev)

### Frontend
- Proxy `/api` configuré dans `frontend/vite.config.js`
- Variables recommandées :
  - `VITE_BACKEND_URL=http://localhost:3000`
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`

### Backend
- Variables attendues :
  - `SUPABASE_URL=...`
  - `SUPABASE_SERVICE_ROLE_KEY=...`
  - `PORT=3000` (optionnel)

## État vs documentation du projet (plan d’action BLOC 2)

### Fonctionnalités (F1 → F7)

- **F1 Auth + rôles** : ✅ fait (login + rôles + protections routes)
- **F2 CRUD Collaborateurs** : ✅ fait (liste/ajout/edit/suppression + RH only)
- **F3 Dashboard KPI** : ✅ fait (KPI + charts + endpoint stats)
- **F4 Recrutement** : ✅ fait (CRUD + filtres + exports)
- **F5 Onboarding** : ✅ fait (checklist + template + CRUD tâches)
- **F6 Gestion Congés** : ✅ fait (demande + validation + exports)
- **F7 Exports PDF/Excel** : ✅ fait (collaborateurs + congés + recrutement)

### Livrables / exigences BLOC 2 (état aligné sur le dépôt)

Éléments demandés dans le cadre du module « Concevoir et développer » et **présents dans ce repo** :

- **Prototype fonctionnel** (parcours F1 → F7) : ✅
- **CI / intégration continue** (GitHub Actions : tests backend, audit npm critique, lint + build frontend) : ✅ voir [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) et [`docs/protocole_deploiement_ci_cd.md`](./protocole_deploiement_ci_cd.md)
- **Tests automatisés** : ✅ backend **Jest** — **10** fichiers, **26** scénarios (auth, collaborateurs CRUD + droits, dashboard, congés, recrutement, onboarding, exports, health). Dernière mesure **indicative** (Jest `--coverage`) : ~**60 %** des lignes, ~**28 %** des branches — à faire monter si on veut coller au mot « majorité » du référentiel. ✅ frontend **Vitest** sur `formatAuthError`.

**Comment j’écris les tests** : je pars des cas réels (API, rôles, erreurs métier, ce qui est dans le cahier de recettes), pas de tests qui ne servent qu’à vérifier qu’un mock a été appelé. Les mocks Supabase isolent Express mais le scénario doit rester compréhensible pour quelqu’un qui lit le fichier.

- **Sécurité OWASP + démarche accessibilité (RGAA / OPQUAST)** : ✅ documentées et partiellement appliquées — voir [`docs/securite_et_accessibilite.md`](./securite_et_accessibilite.md) (**référentiel unique** : RGAA + OPQUAST, cf. ce fichier ; ne pas introduire un autre référentiel sans mettre à jour la doc).
- **Responsive / navigation petit écran** : ✅ menu mobile (burger) sous le breakpoint `md` dans la barre de navigation.
- **Déploiement staging / production** : ⚠️ décrit dans les manuels (variables, build) ; l’automatisation dépend de l’hébergeur (ex. Vercel + hébergement API).
- **Cahier de recettes / plan correction bugs / manuels** : ✅ dans `docs/` (tableau ci-dessus).
- **Journal de versions** : ✅ [`CHANGELOG.md`](../CHANGELOG.md) à la racine. C’est une **synthèse** des versions (fonctionnalités, correctifs), pas un copier-coller de `git log` : Git reste la source brute, le fichier sert à lire vite ce qui a changé.

## Points connus / améliorations recommandées

- Cookie token côté frontend : actuellement **non-HttpOnly** (JS accessible). Pour renforcer :
  - faire poser le cookie côté backend en **HttpOnly + Secure** (et ne plus exposer le token au JS)
  - ou basculer vers un mécanisme de session plus robuste selon contraintes de déploiement.
- Normaliser les variables d’environnement (`VITE_BACKEND_URL` utilisé côté code).
- Ajouter pagination/recherche sur tables (collaborateurs / candidats / congés).

