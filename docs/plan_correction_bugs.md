# Plan de correction des bogues – EasyDashboard RH (C2.3.2)

Ce document recense quelques **anomalies majeures** rencontrées, leur analyse, et les **actions de correction**.

---

## Bogue 1 – Erreur RLS Supabase sur `profiles` (infinite recursion)

- **Symptôme côté backend** :
  - Logs : `infinite recursion detected in policy for relation "profiles"` (code Postgres `42P17`).
  - Contexte : middleware `authenticate` qui lit la table `profiles` pour le rôle.
- **Cause racine** :
  - Une policy RLS de la table `profiles` faisait un `SELECT` sur… `profiles`, créant une récursion infinie.
- **Impact fonctionnel** :
  - Échec de toutes les requêtes nécessitant la récupération du rôle utilisateur.
- **Correction** :
  - Réécriture de la policy pour qu’elle se base directement sur `auth.uid()` et le champ `id`, **sans** requête recursive sur `profiles`.
- **Résultat** :
  - Le middleware d’authentification fonctionne, les rôles sont correctement chargés.

---

## Bogue 2 – Erreur Supabase `.single()` sur décision de congés

- **Symptôme côté API** :
  - Réponse JSON : `{"error":"Cannot coerce the result to a single JSON object"}` lors d’un `PUT /api/conges/:id/decision`.
- **Cause racine** :
  - Utilisation de `.single()` après un `update` sur Supabase :
    - si aucune ligne n’est mise à jour (ID inexistant / filtres supplémentaires), Supabase renvoie 0 ligne, ce qui fait échouer `.single()`.
- **Impact fonctionnel** :
  - L’interface RH ne pouvait pas approuver/refuser une demande, même avec un payload correct.
- **Correction** :
  - Passage de `.single()` à `.maybeSingle()` :
    ```js
    .select()
    .maybeSingle();
    ```
  - Ajout d’un contrôle explicite côté backend :
    - `if (!data) return res.status(404).json({ error: 'Demande introuvable' });`
- **Résultat** :
  - L’appel renvoie désormais soit l’objet mis à jour, soit un message 404 clair.

---

## Bogue 3 – Redirection après login non prise en compte

- **Symptôme côté front** :
  - Après un login réussi, le composant `Login` appelait `navigate('/')`, mais l’utilisateur restait sur `/login` ou était renvoyé vers `/login` immédiatement.
- **Cause racine** :
  - Le hook `useAuth` gérait son état **en local** par composant.  
    `App` utilisait une instance de `useAuth` différente de celle du `Login`, donc `user` restait `null` dans `App`, qui redirigeait vers `/login`.
- **Impact fonctionnel** :
  - Expérience utilisateur cassée : impossible de réellement accéder au Dashboard après authentification.
- **Correction** :
  - Création d’un **AuthContext** global (`AuthProvider`) dans `frontend/src/context/AuthContext.jsx`.
  - `main.jsx` enveloppe désormais `App` avec `<AuthProvider>`.
  - `useAuth` devient un simple wrapper autour du contexte (dans `hooks/useAuth.js`).
- **Résultat** :
  - L’état `user` est partagé globalement, la redirection vers `/` fonctionne immédiatement après connexion.

---

## Bogue 4 – Erreurs ESLint / CI GitHub Actions

- **Symptômes** :
  - Règles `react-refresh/only-export-components`, `no-undef` (`process` dans `vite.config.js`), et `react-hooks` faisaient échouer `npm run lint` dans la CI.
- **Cause racine** :
  - Mélange de hooks/fonctions utilitaires et composants dans certains fichiers (`AuthContext`).
  - Utilisation de `process` côté Vite sans import explicite.
  - Appel de `setState` directement dans un `useEffect` (toléré dans ce cas, mais signalé).
- **Corrections** :
  - Extraction des fonctions de gestion de cookie dans `utils/authToken.js`.
  - Import explicite de `process` : `import process from 'node:process'`.
  - Désactivation ciblée d’une règle ESLint sur la ligne concernée lorsque le comportement est volontaire.
- **Résultat** :
  - La commande `npm run lint` passe localement et dans GitHub Actions.

---

## Bogue 5 – Problèmes de cache npm dans GitHub Actions (frontend)

- **Symptôme** :
  - Erreur “Dependencies lock file is not found” sur le job frontend.
- **Cause racine** :
  - Utilisation de `cache: npm` avec un `cache-dependency-path` inexistant (`frontend/package-lock.json` absent).
- **Correction** :
  - Suppression de l’option de cache dans le job frontend (`setup-node`) et passage à `npm install` au lieu de `npm ci`.
- **Résultat** :
  - Le job frontend de la CI s’exécute correctement (install, lint, build).

---

## Synthèse

Pour chaque bogue :

- une **cause racine** a été identifiée (configuration RLS, logique d’update, gestion d’état ou CI),
- une **correction ciblée** a été apportée,
- l’impact utilisateur a été vérifié (recette) pour s’assurer que le comportement est désormais conforme.

Ces exemples illustrent une approche systématique de :

1. Détection (logs, erreurs CI, tests),
2. Analyse de cause,
3. Correction,
4. Vérification (tests + recettes).

