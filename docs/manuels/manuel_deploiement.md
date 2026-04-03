# Manuel de déploiement – EasyDashboard RH

Ce manuel explique comment **lancer** et **déployer** EasyDashboard RH.

---

## 1. Pré‑requis

- Node.js 20+ et npm 10+
- Accès à un projet **Supabase** (PostgreSQL + Auth)
- Un dépôt GitHub contenant ce projet

---

## 2. Lancement en environnement de développement

### 2.1. Backend (API Node/Express)

Dans le dossier `backend` :

```bash
npm install
npm run dev
```

Puis :

- L’API est accessible sur `http://localhost:3000`.
- Endpoint de vérification : `GET http://localhost:3000/api/health` → `{ "status": "OK" }`.

Variables à définir dans `backend/.env` :

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=3000
```

### 2.2. Frontend (React/Vite)

Dans le dossier `frontend` :

```bash
npm install
npm run dev
```

L’application est accessible sur `http://localhost:5173` (par défaut).

Variables à définir dans `frontend/.env` :

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_BACKEND_URL=http://localhost:3000
```

Vite proxy redirige automatiquement les appels `/api/**` vers `VITE_BACKEND_URL`.

---

## 3. Déploiement en environnement de test / staging

### 3.1. Backend (ex: Railway/Render/Heroku)

1. Créer un service Node.js dans la plateforme (Railway/Render…)
2. Relier le dépôt GitHub.
3. Définir les variables d’environnement :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PORT` (souvent imposé par la plateforme)
4. Commande de démarrage :

```bash
npm install && npm start
```

5. Vérifier que `GET /api/health` répond `"OK"` sur l’URL publique du backend.

### 3.2. Frontend (ex: Vercel/Netlify)

1. Importer le projet depuis GitHub.
2. Configurer les variables :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BACKEND_URL` pointant vers l’URL publique du backend (`https://mon-backend/api`…).
3. Lancer un build :

```bash
npm install
npm run build
```

4. Déployer le dossier `dist` généré par Vite.

---

## 4. Déploiement en production

Le déploiement production suit la même logique que la **staging**, avec :

- une instance backend dédiée (base Supabase de prod),
- une instance frontend déployée (Vercel/Netlify) pointant sur le backend de prod.

Bonnes pratiques :

- Utiliser des projets Supabase séparés (staging vs prod).
- Ne jamais committer les fichiers `.env`.
- Lancer la CI (tests + lint + build) **avant** de déployer.

---

## 5. Procédure de rollback simple

1. Si une nouvelle version provoque un bug critique :
   - Revenir au commit Git précédent (tag/commit stable).
   - Redéployer backend + frontend depuis ce commit.
2. S’assurer que la base Supabase n’a pas subi de migration destructive.

