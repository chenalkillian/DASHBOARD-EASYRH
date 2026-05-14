# Historique des versions — EasyDashboard RH

Synthèse des évolutions du projet (fonctionnalités, correctifs, doc).

Ce n’est **pas** un export automatique de `git log` : Git garde le détail brut ; ici je résume ce qui compte pour suivre le produit (tags / merges comme repères temporels si besoin).

## [1.2.1] — 2026-05

### Ajouts / ajustements

- **Tests API** : recrutement, onboarding, congés (liste, création, erreurs), exports RH, mutations collaborateurs ; couverture lignes ~**60 %** (Jest).
- **UI / accessibilité** : `scope="col"` sur les gros tableaux, scroll horizontal propre sur Collaborateurs, `min-w` sur Congés / Recrutement.
- **Doc** : README + `securite_et_accessibilite` alignés avec l’état du code.

## [1.2.0] — 2026-05

### Ajouts
- Navigation **mobile** (menu accessible sous le breakpoint `md`) pour un usage correct sur petits écrans.
- **Tests** : extension des tests d’API backend (collaborateurs, inscription) ; tests unitaires frontend sur la fonction utilitaire `formatAuthError` (messages d’erreur auth).
- Fichier **`CHANGELOG.md`** et alignement de la documentation projet sur l’état réel du dépôt (CI, recettes, manuels).

### Corrections
- Documentation : `README_PROJET` recalé sur l’état réel du repo (CI, tests, livrables `docs/`).

---

## [1.1.0] — 2026-04

### Ajouts
- Intégration continue **GitHub Actions** (lint + build frontend, tests + audit backend).
- Documentation **sécurité / accessibilité** (OWASP, RGAA / OPQUAST) et **protocole CI/CD**.
- **Cahier de recettes**, **plan de correction des bogues**, **manuels** (déploiement, utilisation, mise à jour).

### Corrections
- Correctifs API (ex. décision congés, politiques RLS) documentés dans `docs/plan_correction_bugs.md`.

---

## [1.0.0] — 2026-03 (MVP)

### Fonctionnalités principales
- Authentification Supabase + rôles (RH / Manager / Collaborateur).
- Modules : collaborateurs, dashboard KPI, recrutement, onboarding, congés, exports PDF/Excel.

---

_Les numéros de version et les dates sont indicatifs ; à ajuster selon ton calendrier réel._
