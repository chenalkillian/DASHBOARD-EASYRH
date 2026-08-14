# Historique des versions — EasyDashboard RH

Synthèse des évolutions du projet (fonctionnalités, correctifs, doc).

Ce n’est **pas** un export automatique de `git log` : Git garde le détail brut ; ici je résume ce qui compte pour suivre le produit (tags / merges comme repères temporels si besoin).

## [1.4.4] — 2026-08-09 (Version finale)

### Ajouts / ajustements
- **Couverture fonctionnelle** : les 6 modules (authentification, collaborateurs, dashboard KPI, recrutement, onboarding, congés) sont livrés à 100 %.
- **Clôture Issue #21** : dernière anomalie documentée (erreur trompeuse à la modification d'un collaborateur sans compte lié), fermée avec commit de correction associé.
- **Doc** : nettoyage final du code (suppression logs de debug), revue des messages d'erreur UX.

## [1.4.3] — 2026-07

### Ajouts
- Finalisation de la documentation utilisateur et du cahier de recettes.
- Vérification croisée de la conformité OWASP Top 10 sur l'ensemble des endpoints API.

## [1.4.2] — 2026-07

### Ajouts / ajustements
- **Performance** : temps de réponse API stabilisé sous 500 ms (p95).
- **Tests** : couverture backend consolidée à ~63 % (Jest), cible ≥50 % dépassée.

## [1.4.1] — 2026-07

### Ajouts
- **Accessibilité** : conformité RGAA 4.1 niveau AA validée — Lighthouse 100/100, WAVE 9.9/10.

## [1.4.0] — 2026-07

### Ajouts
- **Sécurité RBAC** : gestion fine des rôles RH / Manager / Collaborateur finalisée sur l'ensemble des modules.
- Module **Congés** centralisé (soumission, validation, historique) livré intégralement.
- Module **Onboarding** : génération automatique de checklist depuis template finalisée.

## [1.3.1] — 2026-06

### Corrections
- **BUG-02** — Validation des entrées API (durcissement des contrôles côté backend).
- **BUG-03** — UX des messages d'erreur (clarification des retours utilisateur).
- Renforcement des politiques RLS suite à audit de sécurité complémentaire.

## [1.3.0] — 2026-06



### Corrections
- **Arbitrage sécurité critique** : détection et correction de l'absence de politiques RLS sur la table `profiles` (non-conformité OWASP A01 — Broken Access Control). Politiques RLS définies et activées en 2h, 0 € de coût, 0 vulnérabilité critique restante.
- **BUG-01** — Gestion des tokens JWT (correction du renouvellement de session).

---

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
