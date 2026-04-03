const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { getAll, create, getById, update, remove } = require('../controllers/collaborateurController');

// Protégées RH uniquement
router.use(authenticate, authorize('RH'));

router.get('/', getAll);
router.post('/', create);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
