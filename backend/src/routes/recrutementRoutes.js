const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/authMiddleware');
const { getAll, create, getById, update, remove } = require('../controllers/recrutementController');

// Visible RH et Manager
router.use(authenticate, authorize('RH', 'Manager'));

router.get('/', getAll);
router.post('/', create);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
