const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/authMiddleware');
const { getAll, create, decide, remove } = require('../controllers/congesController');

router.use(authenticate);

// Visible à tous les utilisateurs connectés (filtré côté API pour Collaborateur)
router.get('/', getAll);

// Création demande: tout utilisateur connecté
router.post('/', create);

// Validation/refus: RH + Manager
router.put('/:id/decision', authorize('RH', 'Manager'), decide);

// Suppression: collab (si en attente) + RH/Manager (toutes)
router.delete('/:id', remove);

module.exports = router;

