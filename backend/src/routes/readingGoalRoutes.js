const express = require('express');
const router = express.Router();
const { createGoal, getMyGoals, checkGoalProgress, deleteGoal } = require('../controllers/readingGoalController');
const protect = require('../middleware/authMiddleware');

router.post('/', protect, createGoal);
router.get('/my', protect, getMyGoals);
router.get('/:goalId/progress', protect, checkGoalProgress);
router.delete('/:goalId', protect, deleteGoal);

module.exports = router;