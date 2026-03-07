const ReadingSession = require('../models/ReadingSessions')
const Borrow = require('../models/Borrow')
const User = require('../models/User')

const logReadingSession = async (req , res) => {
    try{
        const {bookId, duration, pagesRead, currentPage}  = req.body
        const activeBorrow = await Borrow.findOne({
            student:req.user._id,
            book:bookId,
            status:'approved'
        })

         if (!activeBorrow) {
            return res.status(400).json({ message: 'You can only log reading sessions for books you have borrowed' });
        }

         const session = await ReadingSession.create({
            student: req.user._id,
            book: bookId,
            duration,
            pagesRead,
            currentPage
        });

         const hoursRead = duration / 60;
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { totalReadingHours: hoursRead }
        });

         res.status(201).json(session);

    }catch(error){
        return res.status(500).json({message : error.message})
    }
}


const getMyReadingSessions = async (req , res) => {
    try{
        const sessions = await ReadingSession.find({student:req.user._id})
            .populate('book','title author coverImage totalpages')
            .sort({createdAt: -1});
            res.json(sessions)
    }catch(error){
        return res.status(500).json({message : error.message})
    }
}
// Get reading progress for a specific book
const getBookProgress = async (req , res) => {
    try{
        const session = await ReadingSession.find({
            student:req.user._id,
            book : req.params.bookId
        }).sort({createdAt:-1})

        if(session.length === 0){
             return res.json({ currentPage: 0, totalSessions: 0, totalMinutes: 0 });
        }

        const totalMinutes = session.reduce((acc, s) => acc + s.duration, 0);
        const currentPage = session[0].currentPage;

        res.json({
            currentPage,
            totalSessions: session.length,
            totalMinutes
        });
    }catch(error){
        return res.status(500).json({message : error.message})
    }
}

module.exports = { logReadingSession, getMyReadingSessions, getBookProgress };