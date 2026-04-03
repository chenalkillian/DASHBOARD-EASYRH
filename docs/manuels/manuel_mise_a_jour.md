# Manuel de mise à jour – EasyDashboard RH

Ce manuel explique comment **mettre à jour** le projet EasyDashboard RH tout en limitant les risques de régression.

---

## 1. Mise à jour du code (local)

### 1.1. Récupérer les dernières modifications

Dans le répertoire du projet :

```bash
git pull origin main
```

Si vous travaillez sur une branche de fonctionnalité :

```bash
git checkout feature/ma-feature
git pull origin main
git merge main
```

### 1.2. Réinstaller les dépendances (si nécessaire)

Si `package.json` ou `package-lock.json` ont changé :

- Backend :

```bash
cd backend
npm install
```

- Frontend :

```bash
cd frontend
npm install
```

---

## 2. Vérifications avant déploiement

Avant tout déploiement sur un environnement partagé (staging/production), exécuter :

### 2.1. Tests backend

```bash
cd backend
npm test
```

Tous les tests Jest doivent être **verts**.

### 2.2. Lint & build frontend

```bash
cd frontend
npm run lint
npm run build
```

- `lint` ne doit pas retourner d’erreurs bloquantes.
- `build` doit réussir sans erreurs.

### 2.3. CI GitHub Actions

Pousser la branche sur GitHub et vérifier que le workflow **CI** :

- exécute les tests backend,
- exécute `lint` + `build` frontend,
- est **vert** (aucun job en échec).

En cas d’échec, corriger le problème avant tout déploiement.

---

## 3. Mise à jour de l’environnement de test / staging

Une fois les vérifications locales et CI réalisées :

1. **Backend** :
   - déployer la nouvelle version du service (Railway/Render…),
   - vérifier `GET /api/health` sur l’URL staging.
2. **Frontend** :
   - déployer la nouvelle version (Vercel/Netlify),
   - vérifier que l’application se charge correctement et pointe vers le bon backend.

---

## 4. Mise à jour de l’environnement de production

La mise à jour de production doit suivre **exactement** les mêmes étapes que la staging, avec :

1. Merge de la branche feature dans `main`.
2. CI verte sur `main`.
3. Déploiement backend prod.
4. Déploiement frontend prod.
5. Contrôle rapide :
   - authentification,
   - accès Dashboard,
   - création d’un collaborateur (puis suppression),
   - création/validation d’une demande de congé (sur un environnement de test, si possible).

---

## 5. Gestion des changements de schéma (Supabase)

Lors d’ajout de nouvelles fonctionnalités nécessitant des tables/colonnes :

1. Créer ou mettre à jour un script SQL dans `docs/supabase_*.sql`.
2. Appliquer d’abord les changements sur l’environnement Supabase **staging**.
3. Tester sur staging (création fiche, onboarding, congés…).
4. Appliquer ensuite les mêmes scripts sur Supabase **production**.

---

## 6. Procédure de rollback

En cas de problème critique détecté après déploiement :

1. **Identifier la version stable précédente** (tag Git ou commit `main` connu pour être stable).
2. **Revenir à cette version** :
   - `git checkout <commit-stable>`
3. **Redéployer** backend + frontend à partir de ce commit.
4. Vérifier à nouveau les fonctionnalités principales :
   - login, Dashboard, Collaborateurs, Recrutement, Onboarding, Congés.

---

## 7. Traçabilité

Pour chaque mise à jour importante, il est recommandé de :

- créer un **tag Git** (ex: `v1.0.0`, `v1.1.0`),
- noter dans un fichier `CHANGELOG.md` (ou dans `README_PROJET.md`) :
  - les fonctionnalités ajoutées,
  - les bugs corrigés,
  - les éventuelles migrations de base exécutées.

