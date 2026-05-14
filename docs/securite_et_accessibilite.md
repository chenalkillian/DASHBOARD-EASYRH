# Sécurité & Accessibilité (C2.2.3)

Ce document synthétise les mesures de **sécurité** (référence OWASP) et les mesures d’**accessibilité** (RGAA / OPQUAST) appliquées au projet, ainsi que les axes de renforcement recommandés.

## Objectifs

- **Sécuriser l’API** (authentification, autorisations, limitation des attaques, protection des données).
- **Réduire les risques applicatifs** (mauvaise configuration, exposition de données, injections, etc.).
- **Rendre l’interface plus accessible** (navigation clavier, labels, focus, feedback).

## Références

- **OWASP Top 10** : risques applicatifs web majeurs (auth, injection, config, etc.).
- **RGAA** (France) / **OPQUAST** : bonnes pratiques d’accessibilité et de qualité UX.

## Référentiel d’accessibilité (RGAA / OPQUAST)

Le projet s’appuie sur **RGAA** (référence France, structure / formulaires / navigation) et **OPQUAST** (qualité d’usage, clarté des messages, cohérence UI). Toute évolution de ce fichier ou du front doit rester cohérente avec ce duo — si tu changes de cadre, mets le doc à jour en même temps.

## Sécurité (OWASP) — Mesures en place

### Authentification & session (OWASP A07 / A01)

- **JWT Supabase** : authentification via Supabase Auth.
- **Stockage token côté client** : token stocké en **cookie** (et non `localStorage`) côté frontend.
- **Header `Authorization: Bearer <token>`** : utilisé pour appeler l’API.
- **Middleware API** : `authenticate` + `authorize` appliquent RBAC (RH / Manager / Collaborateur).

### Contrôle d’accès (OWASP A01)

- **RBAC** côté backend : accès restreint selon le rôle.
- **RLS Supabase** : la base est protégée au niveau Postgres par les politiques RLS.

### En-têtes de sécurité (OWASP A05)

- **`helmet`** activé sur l’API pour renforcer les en-têtes HTTP (durcissement de base).

### Anti-bruteforce / anti-flood (OWASP A07)

- **`express-rate-limit`** sur `/api/auth` pour limiter les tentatives.

### CORS (OWASP A05)

- Configuration CORS centralisée dans `backend/src/app.js`.
- Recommandation prod : restreindre `CORS_ORIGIN` au domaine du frontend.

### Gestion des erreurs

- Contrôleurs backend avec `try/catch` et retours HTTP explicites.
- Correction Supabase `.single()` → `.maybeSingle()` sur décision de congés pour éviter une erreur d’agrégation en cas de 0 ligne.

## Sécurité (OWASP) — Renforcements recommandés

- **Cookies plus stricts** (si possible) :
  - `HttpOnly` (empêche l’accès JS) + `Secure` (HTTPS) + `SameSite=Lax/Strict`.
  - Aujourd’hui le cookie est lisible en JS (nécessaire à la logique actuelle) : en production, privilégier un **cookie HttpOnly** émis côté backend + une stratégie de refresh.
- **Validation des entrées** :
  - Ajouter une validation serveur systématique (schémas `zod`/`joi`) sur les payloads (`register`, `conges`, etc.).
- **Logs & audit** :
  - Journaliser les actions sensibles (validation congés, exports) avec `user_id`, rôle, timestamp.
- **Headers CORS** :
  - Désactiver `origin: '*'` en prod.
- **Secrets** :
  - Vérifier `.gitignore`, éviter tout secret en dépôt, rotation si besoin.
- **CSRF** :
  - Si cookie HttpOnly utilisé pour session, ajouter protection CSRF (token ou SameSite strict + double submit).

## Accessibilité (RGAA / OPQUAST) — Mesures en place / à appliquer

### Formulaires (RGAA — champs, libellés, erreurs)

Bonnes pratiques appliquées / à vérifier :

- Chaque champ a un **`label`** relié via `htmlFor` + `id`.
- Les champs obligatoires sont annoncés (texte explicite ou `aria-required`).
- Les messages d’erreur utilisent un conteneur **`role="alert"`** et des liens `aria-describedby` si nécessaire.

### Navigation clavier (RGAA — focus)

- Tous les éléments interactifs sont accessibles au clavier (`button`, `a`, `input`).
- Les styles de focus sont visibles (focus ring Tailwind, contraste).
- Les liens “icône seule” ont un `aria-label` (lecture lecteur d’écran).

### Tableaux (RGAA — structure)

- Utiliser `th scope="col"` / `th scope="row"` quand pertinent.
- Avoir des en-têtes clairs et un ordre de lecture cohérent.

## Checklist rapide (à parcourir avant un rendu)

- [x] Login/Register/Forgot/Reset : `label` + `htmlFor` + `id`, erreurs lisibles (`role="alert"`).
- [x] Navbar : liens icônes avec `aria-label` / `title` ; **menu mobile** avec `aria-expanded`, `aria-controls`, `role="dialog"`, fermeture **Échap** et clic sur fond semi-transparent.
- [x] Focus visible sur les boutons/liens (anneaux `focus-visible` sur le menu burger et la déconnexion).
- [x] Tables principales : `scope="col"` sur les `th` des pages **Collaborateurs**, **Congés**, **Recrutement** ; défilement horizontal contrôlé (`overflow-x-auto`, `min-w` sur tableaux larges).

## Corrections récentes (mobile + accessibilité)

Mises en œuvre dans le code pour rapprocher l’interface des critères **RGAA** et des bonnes pratiques **OPQUAST** évoqués plus haut (référentiel unique du projet) :

- **Petits écrans** : menu de navigation accessible via un bouton **burger** (visible uniquement en dessous de `md`), intitulés de liens explicites (texte + icône), fermeture clavier (**Échap**) et clic sur le fond semi-transparent.
- **Layout** : conteneur principal avec `overflow-x-hidden` pour limiter le défilement horizontal accidentel.
- **Tableaux (pages liste)** : en-têtes `scope="col"` (Collaborateurs, Congés, Recrutement) ; zone scrollable pour éviter de casser la mise en page sur mobile.
- **Barre supérieure** : libellé « Déconnexion » lisible sur mobile, tailles de titre adaptées (`text-base` → `text-xl`).

Les éléments restants (cookies HttpOnly, validation systématique des payloads, audit RGAA complet, `scope` sur d’éventuels autres tableaux) figurent dans les sections « Renforcements recommandés » et checklist ci-dessus.

