const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/authMiddleware');
const { getTasksByCollaborateur, createTask, updateTask, deleteTask } = require('../controllers/onboardingController');

// Onboarding visible RH + Manager
router.use(authenticate, authorize('RH', 'Manager'));

router.get('/:collaborateurId', getTasksByCollaborateur);
router.post('/:collaborateurId', createTask);
router.put('/task/:id', updateTask);
router.delete('/task/:id', deleteTask);

module.exports = router;

