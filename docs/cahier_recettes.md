# Cahier de recettes – EasyDashboard RH (C2.3.1)

Ce cahier de recettes recense les **scénarios de tests fonctionnels** du MVP (F1 → F7).

## Légende

- **Acteur** : RH / Manager / Collaborateur
- **Résultat** : OK / KO

---

## 1. Authentification & rôles (F1)

| ID | Fonctionnalité                    | Pré‑conditions                          | Étapes                                                                                     | Résultat attendu                                                                 | Acteur         | Résultat |
|----|-----------------------------------|-----------------------------------------|--------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|----------------|----------|
| A1 | Connexion RH                      | Compte RH existant                      | 1. Aller sur `/login`  2. Saisir email RH + mot de passe  3. Valider                      | Redirection vers `/` (Dashboard), navbar affichée, rôle RH visible              | RH             | OK       |
| A2 | Connexion Collaborateur          | Compte Collaborateur existant          | idem A1                                                                                    | Redirection vers `/`, accès **Dashboard** et **Congés**, pas accès Collaborateurs/Recrutement/Onboarding | Collaborateur  | OK       |
| A3 | Connexion avec mauvais mot de passe | Compte existant                      | 1. `/login`  2. Email correct + mot de passe erroné  3. Valider                           | Message d’erreur “Login échoué” (ou message backend), pas de redirection        | Tous           | OK       |
| A4 | Inscription                       | Aucune                                  | 1. `/register`  2. Saisir nom, email, mot de passe x2  3. Valider                         | Compte créé. Soit login auto, soit message invitant à valider l’email (selon conf Supabase) | Futur utilisateur | OK    |
| A5 | Mot de passe oublié               | Compte existant                         | 1. `/forgot-password`  2. Saisir email  3. Valider                                         | Message “Si l’email existe, un lien a été envoyé”                               | Tous           | OK       |
| A6 | Réinitialisation du mot de passe  | Lien email de reset valide              | 1. Cliquer le lien Supabase  2. Formulaire `/reset-password`  3. Saisir nouveau mot de passe x2 | Nouveau mot de passe actif, redirection vers `/login`                           | Tous           | OK       |

---

## 2. Collaborateurs (F2)

| ID  | Fonctionnalité                    | Pré‑conditions                    | Étapes                                                                                 | Résultat attendu                                                             | Acteur |
|-----|-----------------------------------|-----------------------------------|----------------------------------------------------------------------------------------|------------------------------------------------------------------------------|--------|
| C1  | Accès à la page Collaborateurs   | Connecté en RH                    | 1. Se connecter en RH  2. Aller sur `/collaborateurs` via sidebar ou navbar          | Liste des collaborateurs visible                                             | RH     |
| C2  | Accès refusé Collaborateurs      | Connecté en Collaborateur         | 1. Se connecter en Collaborateur  2. `/collaborateurs`                               | Message “Accès réservé au rôle RH”                                           | Collab |
| C3  | Création collaborateur           | Connecté en RH                    | 1. `/collaborateurs`  2. Saisir formulaire (nom, prénom, poste, etc.)  3. Submit     | Nouveau collaborateur apparaît dans le tableau                               | RH     |
| C4  | Édition collaborateur            | Au moins 1 collaborateur          | 1. Clic bouton **Edit**  2. Modifier un champ  3. Enregistrer                         | Ligne mise à jour                                                            | RH     |
| C5  | Suppression collaborateur        | Au moins 1 collaborateur          | 1. Clic **Suppr**  2. Confirmer                                                        | Collaborateur supprimé de la liste                                           | RH     |

---

## 3. Dashboard KPI (F3)

| ID  | Fonctionnalité                  | Pré‑conditions                    | Étapes                                                   | Résultat attendu                                                           | Acteur         |
|-----|---------------------------------|-----------------------------------|----------------------------------------------------------|----------------------------------------------------------------------------|----------------|
| D1  | Affichage KPI RH               | Connecté en RH                    | 1. `/`                                                   | Cartes KPI (total, actifs, suspendus, ancienneté) + charts services/contrats/ancienneté | RH             |
| D2  | Accès Manager                  | Connecté en Manager               | 1. `/`                                                   | Même vue Dashboard qu’un RH                                               | Manager        |
| D3  | Accès Collaborateur            | Connecté en Collaborateur         | 1. `/`                                                   | Dashboard visible (selon besoins), données agrégées, aucun accès aux écrans RH-only | Collaborateur  |

---

## 4. Recrutement (F4)

| ID  | Fonctionnalité                       | Pré‑conditions        | Étapes                                                                 | Résultat attendu                                                                | Acteur      |
|-----|--------------------------------------|-----------------------|------------------------------------------------------------------------|---------------------------------------------------------------------------------|-------------|
| R1  | Accès Recrutement (RH/Manager)       | Connecté en RH/Manager| 1. `/recrutement`                                                      | Liste des candidats + stats par statut                                         | RH/Manager  |
| R2  | Création candidat                    | Connecté en RH/Manager| 1. `/recrutement`  2. Remplir formulaire  3. Submit                    | Candidat apparaît dans la liste                                                | RH/Manager  |
| R3  | Filtre par statut                    | Au moins 2 statuts    | 1. Choisir un statut dans “Filtre statut”                             | Liste filtrée uniquement sur le statut choisi                                  | RH/Manager  |
| R4  | Export recrutement Excel/PDF         | Candidats existants   | 1. Clic sur bouton **Excel** ou **PDF**                               | Téléchargement du fichier `.xlsx` / `.pdf` avec la liste actuelle des candidats | RH/Manager  |

---

## 5. Onboarding (F5)

| ID  | Fonctionnalité                        | Pré‑conditions                   | Étapes                                                                    | Résultat attendu                                                             | Acteur      |
|-----|---------------------------------------|----------------------------------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|-------------|
| O1  | Sélection collaborateur               | Collaborateurs existants         | 1. `/onboarding`  2. Cliquer sur un collaborateur dans la liste à gauche | Checklist (vide ou existante) affichée à droite                              | RH/Manager  |
| O2  | Génération checklist template         | Aucune tâche pour ce collaborateur | 1. `/onboarding`  2. Sélectionner collaborateur  3. Clic “Générer depuis template” | 3–4 tâches par défaut créées (contrat, accès IT, etc.)                       | RH/Manager  |
| O3  | Toggle terminé                        | Checklist existante              | 1. Cocher/décocher une tâche                                             | L’état de la tâche change, persiste après rechargement                       | RH/Manager  |
| O4  | Ajout/Suppression tâche personnalisée | Checklist existante              | 1. Champ “Ajouter une tâche personnalisée”  2. Bouton “Ajouter” / “Suppr”| Tâche ajoutée/supprimée dans la liste                                        | RH/Manager  |

---

## 6. Congés (F6)

| ID  | Fonctionnalité                         | Pré‑conditions                    | Étapes                                                                                           | Résultat attendu                                                             | Acteur         |
|-----|----------------------------------------|-----------------------------------|--------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------|----------------|
| G1  | Demande de congés Collaborateur        | Connecté en Collaborateur         | 1. `/conges`  2. Choisir type, dates, motif  3. Envoyer                                         | Nouvelle demande en statut **En attente**, visible dans la liste personnelle | Collaborateur  |
| G2  | Validation congés RH                   | Demande “En attente” existante   | 1. Se connecter en RH  2. `/conges`  3. Bouton **Approuver**                                   | Statut passe à **Approuvé**, colonne “Traité le” renseignée                  | RH             |
| G3  | Refus congés RH                        | idem G2                           | 1. **Refuser**                                             | Statut passe à **Refusé**, Collaborateur voit la mise à jour                 | RH             |
| G4  | Vue Collaborateur après décision       | G2 ou G3 effectués                | 1. Se reconnecter en Collaborateur  2. `/conges`                                               | Badge de statut (couleur) + date de traitement visibles                      | Collaborateur  |
| G5  | Suppression possible uniquement en attente | Demande approuvée/refusée     | 1. Se connecter en Collaborateur  2. `/conges`                                                 | Bouton **Suppr** absent si statut ≠ “En attente”                             | Collaborateur  |
| G6  | Export congés Excel/PDF (RH/Manager)   | Demandes existantes               | 1. Connecté en RH/Manager  2. `/conges`  3. Clic **Excel** / **PDF**                           | Fichier téléchargé avec toutes les demandes (ou filtrées)                    | RH/Manager     |

---

## 7. Exports (F7)

| ID  | Fonctionnalité                     | Pré‑conditions              | Étapes                                                      | Résultat attendu                                      | Acteur      |
|-----|------------------------------------|-----------------------------|-------------------------------------------------------------|-------------------------------------------------------|-------------|
| E1  | Export collaborateurs Excel/PDF    | Collaborateurs existants    | 1. `/collaborateurs` (RH)  2. Clic Excel/PDF               | Fichier téléchargé (KPI RH)                          | RH          |
| E2  | Export recrutement Excel/PDF       | Candidats existants         | 1. `/recrutement` (RH/Manager)  2. Clic Excel/PDF          | Fichier téléchargé                                    | RH/Manager  |
| E3  | Export congés Excel/PDF            | Congés existants            | 1. `/conges` (RH/Manager)  2. Clic Excel/PDF               | Fichier téléchargé                                    | RH/Manager  |

---

## 8. Résumé de la campagne de tests

Lors de la campagne de tests :

- Tous les scénarios principaux F1 → F7 ont été exécutés.
- Les anomalies détectées et leurs corrections sont décrites dans `docs/plan_correction_bugs.md`.

