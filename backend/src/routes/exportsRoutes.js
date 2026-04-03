const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  exportCollaborateursXlsx,
  exportCollaborateursPdf,
  exportCongesXlsx,
  exportCongesPdf,
  exportRecrutementXlsx,
  exportRecrutementPdf,
} = require('../controllers/exportsController');

router.use(authenticate);

// Collaborateurs: RH
router.get('/collaborateurs.xlsx', authorize('RH'), exportCollaborateursXlsx);
router.get('/collaborateurs.pdf', authorize('RH'), exportCollaborateursPdf);

// Congés: RH + Manager
router.get('/conges.xlsx', authorize('RH', 'Manager'), exportCongesXlsx);
router.get('/conges.pdf', authorize('RH', 'Manager'), exportCongesPdf);

// Recrutement: RH + Manager
router.get('/recrutement.xlsx', authorize('RH', 'Manager'), exportRecrutementXlsx);
router.get('/recrutement.pdf', authorize('RH', 'Manager'), exportRecrutementPdf);

module.exports = router;

