const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const Notification = require('../models/Notification');

// Student requests to borrow a book
const borrowBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (book.availableCopies === 0) {
            return res.status(400).json({ message: 'No copies available' });
        }

        // Check if student already has 3 approved/pending books
        const activeBorrows = await Borrow.countDocuments({
            student: req.user._id,
            status: { $in: ['pending', 'approved'] }
        });
        if (activeBorrows >= 3) {
            return res.status(400).json({ message: 'You cannot borrow more than 3 books at a time' });
        }

        // Check if student already has this book pending or approved
        const alreadyBorrowed = await Borrow.findOne({
            student: req.user._id,
            book: req.params.bookId,
            status: { $in: ['pending', 'approved'] }    //$in operator — checks if a value matches any item in an array
        });
        if (alreadyBorrowed) {
            return res.status(400).json({ message: 'You already have this book borrowed or requested' });
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const borrow = await Borrow.create({
            student: req.user._id,
            book: req.params.bookId,
            dueDate
        });

        res.status(201).json(borrow);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin approves borrow request
const approveBorrow = async (req, res) => {
    try {
        const borrow = await Borrow.findById(req.params.borrowId);
        if (!borrow) {
            return res.status(404).json({ message: 'Borrow record not found' });
        }

        if (borrow.status !== 'pending') {
            return res.status(400).json({ message: 'This request is not pending' });
        }

        borrow.status = 'approved';
        borrow.adminNote = req.body.adminNote || '';
        await borrow.save();

        await Book.findByIdAndUpdate(borrow.book, {
            $inc: { availableCopies: -1 }
        });

        await Notification.create({
            user: borrow.student,
            type: 'borrow_approved',
            message: `Your borrow request has been approved. Please collect your book within 2 days.`
        });

        res.json({ message: 'Borrow request approved', borrow });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin rejects borrow request
const rejectBorrow = async (req, res) => {
    try {
        const borrow = await Borrow.findById(req.params.borrowId);
        if (!borrow) {
            return res.status(404).json({ message: 'Borrow record not found' });
        }

        if (borrow.status !== 'pending') {
            return res.status(400).json({ message: 'This request is not pending' });
        }

        borrow.status = 'rejected';
        borrow.adminNote = req.body.adminNote || '';
        await borrow.save();

        await Notification.create({
            user: borrow.student,
            type: 'borrow_rejected',
            message: `Your borrow request has been rejected. ${borrow.adminNote ? 'Reason: ' + borrow.adminNote : ''}`
        });

        res.json({ message: 'Borrow request rejected', borrow });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Student requests to return a book
const returnBook = async (req, res) => {
    try {
        const borrow = await Borrow.findById(req.params.borrowId);
        if (!borrow) {
            return res.status(404).json({ message: 'Borrow record not found' });
        }

        if (borrow.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (borrow.status !== 'approved') {
            return res.status(400).json({ message: 'This book is not currently borrowed' });
        }

        borrow.status = 'return_requested';
        await borrow.save();

        res.json({ message: 'Return request submitted, waiting for admin approval', borrow });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin approves return
const approveReturn = async (req, res) => {
    try {
        const borrow = await Borrow.findById(req.params.borrowId);
        if (!borrow) {
            return res.status(404).json({ message: 'Borrow record not found' });
        }

        if (borrow.status !== 'return_requested') {
            return res.status(400).json({ message: 'No return request found for this borrow' });
        }

        // Calculate penalty if overdue
        const returnDate = new Date();
        let penalty = 0;
        if (returnDate > borrow.dueDate) {
            const daysOverdue = Math.ceil((returnDate - borrow.dueDate) / (1000 * 60 * 60 * 24));
            penalty = daysOverdue * 10;
        }

        borrow.status = 'returned';
        borrow.returnDate = returnDate;
        borrow.penalty = penalty;
        borrow.adminNote = req.body.adminNote || '';
        await borrow.save();

        await Book.findByIdAndUpdate(borrow.book, {
            $inc: { availableCopies: 1 }
        });

        // Update student penalties
        if (penalty > 0) {
            const User = require('../models/User');
            await User.findByIdAndUpdate(borrow.student, {
                $inc: { penalties: penalty }
            });
        }

        await Notification.create({
            user: borrow.student,
            type: 'return_approved',
            message: `Your return has been approved. ${penalty > 0 ? 'Penalty applied: ₹' + penalty : 'No penalty applied.'}`
        });

        res.json({ message: 'Return approved successfully', borrow, penalty });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get my borrows (student)
const getMyBorrows = async (req, res) => {
    try {
        const borrows = await Borrow.find({ student: req.user._id })
            .populate('book', 'title author coverImage ISBN category totalPages')
            .sort({ createdAt: -1 });
        res.json(borrows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all borrows (admin)
const getAllBorrows = async (req, res) => {
    try {
        const borrows = await Borrow.find()
            .populate('book', 'title author')
            .populate('student', 'username email')
            .sort({ createdAt: -1 });
        res.json(borrows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { borrowBook, approveBorrow, rejectBorrow, returnBook, approveReturn, getMyBorrows, getAllBorrows };
