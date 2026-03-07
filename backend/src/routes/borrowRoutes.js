const express = require('express');
const router = express.Router();
const { 
    borrowBook, 
    approveBorrow, 
    rejectBorrow, 
    returnBook, 
    approveReturn, 
    getMyBorrows, 
    getAllBorrows 
} = require('../controllers/borrowController');
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

router.post('/borrow/:bookId', protect, borrowBook);
router.put('/approve/:borrowId', protect, adminOnly, approveBorrow);
router.put('/reject/:borrowId', protect, adminOnly, rejectBorrow);
router.put('/return/:borrowId', protect, returnBook);
router.put('/approve-return/:borrowId', protect, adminOnly, approveReturn);
router.get('/my', protect, getMyBorrows);
router.get('/all', protect, adminOnly, getAllBorrows);

module.exports = router;