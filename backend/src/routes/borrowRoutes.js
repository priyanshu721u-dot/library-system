const express = require('express');
const router = express.Router();
const { borrowBook, returnBook, getMyBorrows, getAllBorrows } = require('../controllers/borrowController');
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

router.post('/borrow/:bookId', protect, borrowBook);
router.put('/return/:borrowId', protect, returnBook);
router.get('/my', protect, getMyBorrows);
router.get('/all', protect, adminOnly, getAllBorrows);

module.exports = router;