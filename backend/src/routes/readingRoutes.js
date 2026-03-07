const express = require('express');
const router = express.Router();
const { logReadingSession, getMyReadingSessions, getBookProgress } = require('../controllers/readingController');
const protect = require('../middleware/authMiddleware');

router.post('/log', protect, logReadingSession);
router.get('/my', protect, getMyReadingSessions);
router.get('/progress/:bookId', protect, getBookProgress);

module.exports = router;