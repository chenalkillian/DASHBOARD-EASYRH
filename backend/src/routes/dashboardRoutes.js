const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { getStats } = require('../controllers/dashboardController');

// Visible Manager et RH
router.use(authenticate, authorize('RH', 'Manager'));

router.get('/stats', getStats);

module.exports = router;
