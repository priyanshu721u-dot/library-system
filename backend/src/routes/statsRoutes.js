const express = require('express');
const router = express.Router();
const { getStudentStats, getAdminStats } = require('../controllers/statsController');
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

router.get('/student', protect, getStudentStats);
router.get('/admin', protect, adminOnly, getAdminStats);

module.exports = router;