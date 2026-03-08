const User = require('../models/User')
const Book = require('../models/Book')
const Borrow = require('../models/Borrow')
const ReadingSession = require('../models/ReadingSessions');

const getStudentStats = async (req , res) => {
    try {
        const totalBorrows = await Borrow.countDocuments({
            student:req.user._id
        });
        const activeBorrows = await Borrow.countDocuments({
            student: req.user._id,
            status:'approved'
        });

        const pendingBorrows = await Borrow.countDocuments({
            student : req.user._id,
            status: 'pending'
        });

        const returnRequest = await Borrow.countDocuments({
            student: req.user._id,
            status: 'return_requested'
        })

        const totalPenalties = req.user.penalties;
        const totalReadingHours = req.user.totalReadingHours;

        const currentlyReading = await Borrow.find({
            student:req.user._id,
            status:'approved'
        }).populate('book', 'title author coverImage totalPages');

        res.json({
            totalBorrows,
            activeBorrows,
            pendingBorrows,
            returnRequest,
            totalPenalties,
            totalReadingHours,
            currentlyReading
        })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getAdminStats = async (req , res) =>{
    try {
        const totalBooks = await Book.countDocuments();
        const totalStudents = await User.countDocuments({role:'student'});
        const totalBorrows = await Borrow.countDocuments();

        const pendingBorrows = await Borrow.countDocuments({status:'pending'})
        const activeBorrows = await Borrow.countDocuments({status:'approved'})
        const returnRequests = await Borrow.countDocuments({ststus:'return_requested'})

        const totalPenalties = await User.aggregate([
            {$group:{_id : null , total:{$sum : '$penalties'}}}
        ]);

        const recentBorrows = await Borrow.find()
            .populate('book', 'title author')
            .populate('student', 'username email')
            .sort({ createdAt: -1 })
            .limit(5);
            
         res.json({
            totalBooks,
            totalStudents,
            totalBorrows,
            pendingBorrows,
            activeBorrows,
            returnRequests,
            totalPenalties: totalPenalties[0]?.total || 0,
            recentBorrows
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { getStudentStats, getAdminStats };