const express = require('express');
const router = express.Router();
const { getStudentStats, getAdminStats,getLeaderboard } = require('../controllers/statsController');
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

router.get('/student', protect, getStudentStats);
router.get('/admin', protect, adminOnly, getAdminStats);
router.get('/leaderboard', protect, getLeaderboard);
module.exports = router;