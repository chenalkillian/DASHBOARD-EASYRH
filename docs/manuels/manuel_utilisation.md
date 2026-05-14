# Manuel d’utilisation – EasyDashboard RH

Ce manuel décrit comment utiliser l’application selon les rôles : **RH**, **Manager**, **Collaborateur**.

---

## 1. Connexion & rôles

### 1.1. Connexion

- Aller sur l’URL de l’application (ex: `https://...`).
- Page de connexion :
  - saisir votre **email**,
  - saisir votre **mot de passe**,
  - cliquer sur **“Se connecter”**.

En cas d’oubli :

- cliquer sur **“Mot de passe oublié ?”**,
- saisir l’email,
- suivre le lien envoyé pour définir un nouveau mot de passe.

### 1.2. Rôles

- RH : accès complet à la gestion RH (collaborateurs, recrutement, onboarding, congés, exports).
- Manager : accès **Dashboard**, **Recrutement**, **Onboarding**, **Congés** (validation), mais pas à la création brute de fiches collaborateurs.
- Collaborateur : accès limité à **Dashboard** (vue globale) et **Congés** (demandes personnelles).

Le rôle est affiché dans la barre de navigation (en haut à gauche).

---

## 2. Dashboard (RH / Manager / Collaborateur)

Page : `/`

- Affiche :
  - le **nombre total** de collaborateurs,
  - les collaborateurs **actifs/suspendus**,
  - l’**ancienneté moyenne**,
  - des graphiques par **service**, **type de contrat**, **tranches d’ancienneté**.

Ce Dashboard permet un aperçu global du capital humain de l’entreprise.

---

## 3. Gestion des collaborateurs (RH)

Page : `/collaborateurs`

### 3.1. Ajouter un collaborateur

1. Cliquer sur **Collaborateurs** dans la sidebar (visible uniquement pour RH).
2. Remplir les champs :
   - Nom, Prénom, Poste, Service, Type de contrat, Date d’embauche, Salaire, Statut (Actif/Suspendu).
3. Cliquer sur **Ajouter**.

Le collaborateur apparaît alors dans le tableau.

### 3.2. Modifier / Supprimer

- **Editer** :
  - cliquer sur le bouton **Edit** de la ligne,
  - modifier les champs,
  - cliquer sur **Enregistrer**.
- **Supprimer** :
  - cliquer sur **Suppr**,
  - confirmer la suppression.

### 3.3. Exports (RH)

- Boutons **“Exporter Excel”** / **“Exporter PDF”** en haut à droite :
  - Excel : export de la liste complète au format `.xlsx`.
  - PDF : export lisible pour une synthèse ou une remise au management.

---

## 4. Module Recrutement (RH / Manager)

Page : `/recrutement`

### 4.1. Suivi des candidats

- Liste des **candidats** avec :
  - nom, prénom,
  - poste visé,
  - statut (Nouveau, En cours, Entretien, Offre, Rejeté, Embauché),
  - date de candidature.

### 4.2. Filtres & stats

- Un filtre par **statut** permet de se concentrer sur une étape précise du pipeline.
- Des cartes en haut de page affichent le **nombre de candidats** par statut.

### 4.3. CRUD Candidats

- **Ajouter** :
  - remplir le formulaire (nom, prénom, poste, email, téléphone, source, statut, date),
  - cliquer sur **Ajouter**.
- **Modifier / Supprimer** :
  - via les boutons **Edit** / **Suppr** de chaque ligne.

### 4.4. Exports

- Boutons **Excel** / **PDF** en haut à droite :
  - export du pipeline de recrutement au format `.xlsx` ou `.pdf`.

---

## 5. Onboarding (RH / Manager)

Page : `/onboarding`

### 5.1. Sélectionner un collaborateur

- À gauche, une liste des collaborateurs.
- Cliquer sur un collaborateur pour afficher sa **checklist d’onboarding**.

### 5.2. Générer la checklist

- Si aucune tâche n’existe, cliquer sur **“Générer depuis template”** :
  - crée automatiquement des tâches : préparer le contrat, créer les accès IT, etc.

### 5.3. Gérer les tâches

- **Marquer comme terminée** : cocher/décocher une tâche.
- **Ajouter une tâche personnalisée** :
  - saisir un libellé dans le champ prévu,
  - cliquer sur **Ajouter**.
- **Supprimer** : cliquer sur **Suppr** en face de la tâche.

---

## 6. Gestion des congés (tous les rôles)

Page : `/conges`

### 6.1. Collaborateur – Demander un congé

1. Aller sur **Congés**.
2. Choisir :
   - Type (Congés payés, RTT, Maladie, Sans solde),
   - Dates début/fin,
   - Motif (optionnel).
3. Cliquer sur **Envoyer**.

La demande apparaît en statut **En attente** dans le tableau.

### 6.2. Collaborateur – Suivre le statut

- Dans le tableau :
  - une pastille indique le **statut** (En attente / Approuvé / Refusé),
  - la colonne **“Traité le”** indique la date/heure de décision RH/Manager.
- Si la demande est encore **En attente**, le bouton **Suppr** permet de l’annuler.

### 6.3. RH / Manager – Valider ou refuser

- Connecté en RH ou Manager :
  - accéder à `/conges`,
  - pour chaque demande **En attente** :
    - bouton **Approuver**,
    - bouton **Refuser**.
- Des cartes en haut de page montrent :
  - total, en attente, approuvés, refusés.

### 6.4. Exports congés

- Boutons **Excel** / **PDF** (visibles RH/Manager) :
  - export de toutes les demandes de congés, pour reporting.

---

## 7. Paramètres (placeholder)

Page : `/parametres`

- Pour l’instant, cette page est un **placeholder**.
- Elle est prévue pour accueillir ultérieurement :
  - la gestion des paramètres d’entreprise,
  - la gestion avancée des rôles,
  - d’autres options.

