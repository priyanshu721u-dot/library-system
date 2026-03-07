const Borrow = require('../models/Borrow')
const Book = require('../models/Book')


const borrowBook = async (req , res ) => {
    try{
         console.log('req.user:', req.user);
        console.log('req.params:', req.params);
        const book = await Book.findById(req.params.bookId);
        if(!book) {
            return res.status(404).json({message : 'Book not found '});
        }
        if(book.availableCopies === 0){
            return res.status(400).json({message : 'No copies found'});
        }
          //check if student have already 3 books
        const activeBorrows = await Borrow.countDocuments({
            student : req.user._id,
            status:'borrowed'
        });

        if(activeBorrows >= 3){
            return res.status(400).json({message : 'You Cannot borrow more than 3 books at a time'});
        }

        //check if student already borrowing this book or not
        const alreadyBorrowed = await Borrow.findOne({
            student : req.user._id,
            book : req.params.bookId,
            status : 'borrowed'
        })

        if(alreadyBorrowed){
            return res.status(400).json({message : 'You already have this book borrowed'});
        }

        // Calculate due date (14 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        // Create borrow record
        const borrow = await Borrow.create({
            student: req.user._id,
            book: req.params.bookId,
            dueDate
        });

         // Decrease available copies
        await Book.findByIdAndUpdate(req.params.bookId, {
            $inc: { availableCopies: -1 }
        });

        res.status(201).json(borrow);

    }catch(error){
        return res.status(500).json({message : error.message});
    }
};

const returnBook = async (req, res) => {
    try {
        const borrow = await Borrow.findById(req.params.borrowId);
        if (!borrow) {
            return res.status(404).json({ message: 'Borrow record not found' });
        }

        // Make sure this borrow belongs to the logged in student
        if (borrow.student.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check if already returned
        if (borrow.status === 'returned') {
            return res.status(400).json({ message: 'Book already returned' });
        }

        // Update borrow record
        borrow.status = 'returned';
        borrow.returnDate = new Date();
        await borrow.save();

        // Increase available copies
        await Book.findByIdAndUpdate(borrow.book, {
            $inc: { availableCopies: 1 }
        });

        res.json({ message: 'Book returned successfully', borrow });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const getMyBorrows = async (req , res) => {
    try{
        const borrows = await Borrow.find({student : req.user._id})
        .populate('book','title author coverImage')
        .sort({createdAt : -1 });
        res.json(borrows)
    }catch(error){
          return res.status(500).json({message : error.message});
    }
};

const getAllBorrows = async (req, res) => {
    try{
         const borrows = await Borrow.find()
            .populate('book', 'title author')
            .populate('student', 'username email')
            .sort({ createdAt: -1 });
        res.json(borrows);
    }catch(error){
     return res.status(500).json({message : error.message});
    }
}

module.exports = { borrowBook, returnBook, getMyBorrows, getAllBorrows };