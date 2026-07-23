# Protocole d’environnement & CI/CD – EasyDashboard RH (BLOC 2 C2.1.1 / C2.1.2 / C2.2.4)

Ce document décrit **l’environnement de développement**, **le déploiement** et la **CI/CD** mise en place pour EasyDashboard RH.

---

## 1. Environnement de développement

### 1.1. Outils principaux

- **OS** : Linux (développement testé sur Ubuntu)
- **Éditeur** : VS Code / Cursor (extensions TypeScript/ESLint/Tailwind conseillées)
- **Node.js** : v20+
- **npm** : v10+
- **Supabase** :
  - projet Supabase (PostgreSQL + Auth + Storage)
  - clés `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 1.2. Frontend

Répertoire : `frontend`

- **Stack** : React 18, Vite, Tailwind CSS, React Router, Chart.js.
- **Commandes** :
  - `npm install` : installation des dépendances
  - `npm run dev` : serveur de dev Vite (`http://localhost:5173` par défaut)
  - `npm run lint` : ESLint sur tout le projet front
  - `npm run build` : build de production

**Configuration API** (dev) :  
Le proxy Vite redirige toutes les requêtes `fetch('/api/...')` vers le backend :

- `frontend/vite.config.js` :
  - lit `VITE_BACKEND_URL` via `loadEnv`
  - configure `server.proxy['/api'].target = VITE_BACKEND_URL || 'http://localhost:3000'`.

### 1.3. Backend

Répertoire : `backend`

- **Stack** : Node.js, Express, Supabase JS (service role).
- **Commandes** :
  - `npm install` : installation des dépendances
  - `npm run dev` : serveur Express avec nodemon (`http://localhost:3000`)
  - `npm start` : serveur Express sans nodemon
  - `npm test` : lance Jest (tests unitaires backend)

**Variables d’environnement** (ex. `.env`) :

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT=3000` (optionnel)

---

## 2. Protocole de déploiement (continu) – concept

### 2.1. Branches

- `main` / `master` : version stable destinée à la démo / production.
- `feature/**` : développement de nouvelles fonctionnalités.
- `fix/**` : correction de bugs.
- `frontend/**` / `backend/**` : branches de travail spécifiques à une couche technique.

### 2.2. Séquence type de déploiement (dev → main)

1. **Développement local** :
   - lancer `backend` (`npm run dev`) + `frontend` (`npm run dev`)
   - travailler sur une branche `feature/...`
2. **Tests locaux** :
   - backend : `npm test`
   - frontend : `npm run lint` + `npm run build`
3. **Push sur GitHub** :
   - ouvrir une PR vers `main`
4. **CI GitHub Actions** (voir section suivante) :
   - si la CI est **verte**, on peut merger la PR dans `main`
5. **Déploiement** (exemple recommandé) :
   - Frontend : déployer le contenu de `frontend/dist` (Vercel, Netlify…)
   - Backend : déploiement Node (Railway/Render)
   - Supabase : déjà hébergé, les scripts SQL (`docs/supabase_*.sql`) documentent le schéma.

---
## 3. Intégration Continue (CI) – GitHub Actions

Fichier : `.github/workflows/ci.yml`

### 3.1. Déclencheurs

La CI se déclenche automatiquement :

- sur `push` vers `main`, `master`, `frontend/**`, `backend/**`, `feature/**`, `fix/**`
- sur `pull_request` vers `main`, `master`

### 3.2. Jobs

La CI contient **deux jobs** parallèles : `backend` et `frontend`.

#### 3.2.1. Job Backend

- **Chemin de travail** : `backend`
- **Étapes** :
  1. `actions/checkout` : récupère le code
  2. `actions/setup-node` :
     - version Node 20
     - cache npm basé sur `backend/package-lock.json`
  3. `npm ci` : installation propre des dépendances backend
  4. `npm audit --audit-level=critical` : audit de sécurité des dépendances (échoue si vulnérabilité critique détectée)
  5. `npm test` : exécute Jest

**Critères de qualité** backend :

- Tous les tests Jest doivent être **verts**.
- Aucune vulnérabilité de niveau **critique** ne doit être détectée par `npm audit`.
- En cas d'échec, la PR ne doit pas être mergée.

#### 3.2.2. Job Frontend

- **Chemin de travail** : `frontend`
- **Étapes** :
  1. `actions/checkout`
  2. `actions/setup-node` :
     - version Node 20
     - cache npm basé sur `frontend/package-lock.json`
  3. `npm ci` : installation propre des dépendances frontend
  4. `npm run lint` : ESLint
  5. `npm test` : tests unitaires **Vitest** (ex. `formatAuthError`)
  6. `npm run build` : build de production Vite

**Critères de qualité** frontend :

- `eslint` ne doit pas remonter d'erreur bloquante.
- Les tests Vitest doivent être **verts**.
- Le build Vite (`npm run build`) doit réussir sans erreur.
---

## 4. Critères de qualité & performance (sujet / module)

- **Qualité code** :
  - usage de frameworks modernes (React, Express, Supabase)
  - respect de patterns simples (routes/controllers/middleware côté backend, pages/components/hooks côté frontend)
  - lint systématique du frontend (ESLint)
- **Sécurité des dépendances** :
  - audit automatique `npm audit --audit-level=critical` sur le backend à chaque exécution de CI
  - la CI bloque le merge si une vulnérabilité critique est détectée
- **Prévention des régressions** :
  - tests unitaires backend avec Jest (10 fichiers, 26 scénarios : auth, collaborateurs, dashboard, congés, recrutement, onboarding, exports, health)
  - tests unitaires frontend avec Vitest (ex. `formatAuthError`)
  - CI bloque le merge si les tests échouent (backend ou frontend)
- **Performance perçue** :
  - SPA côté frontend, chargement conditionnel des données
  - API filtrées par rôle & requêtes raisonnables sur Supabase---

## 5. Évolutions possibles

- Augmenter la couverture des tests backend (actuellement ~60 % lignes / ~28 % branches) pour se rapprocher du mot « majorité » du référentiel.
- Étendre les tests frontend Vitest à d'autres fonctions utilitaires et composants critiques (au-delà de `formatAuthError`).
- Étendre la CI pour déployer automatiquement sur un environnement de **staging** après chaque merge sur `main`.
- Basculer le cookie de session vers un mode **HttpOnly + Secure** posé côté backend.