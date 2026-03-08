const express = require('express');
const router = express.Router();
const { createBlog, getAllBlogs, getBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

router.get('/', protect, getAllBlogs);
router.get('/:id', protect, getBlog);
router.post('/', protect, adminOnly, createBlog);
router.put('/:id', protect, adminOnly, updateBlog);
router.delete('/:id', protect, adminOnly, deleteBlog);

module.exports = router;