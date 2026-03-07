const express = require('express');
const router = express.Router();
const { addBook, getAllBooks, getBook, updateBook, deleteBook } = require('../controllers/bookController');
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

router.get('/', protect, getAllBooks);
router.get('/:id', protect, getBook);
router.post('/', protect, adminOnly, addBook);
router.put('/:id', protect, adminOnly, updateBook);
router.delete('/:id', protect, adminOnly, deleteBook);

module.exports = router;