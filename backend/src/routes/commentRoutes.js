const express = require('express');
const router = express.Router();
const { addComment, getBlogComments, deleteComment } = require('../controllers/commentController');
const protect = require('../middleware/authMiddleware');

router.post('/:blogId', protect, addComment);
router.get('/:blogId', protect, getBlogComments);
router.delete('/:commentId', protect, deleteComment);

module.exports = router;