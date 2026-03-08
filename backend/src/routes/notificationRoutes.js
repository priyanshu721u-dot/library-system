const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead, getUnreadCount } = require('../controllers/notificationController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/:notificationId/read', protect, markAsRead);
router.put('/mark-all-read', protect, markAllAsRead);

module.exports = router;