const Borrow = require('../models/Borrow');
const ReadingGoal = require('../models/ReadingGoal');
const User = require('../models/User');


const createGoal = async (req, res) => {
    try {
        const { targetHours, targetBooks, period, endDate } = req.body;

        const student = await User.findById(req.user._id);
        const completedBorrows = await Borrow.countDocuments({
            student: req.user._id,
            status: 'returned'
        });

        const goal = await ReadingGoal.create({
            student: req.user._id,
            targetHours,
            targetBooks,
            period,
            endDate,
            startHours: student.totalReadingHours || 0,
            startBooks: completedBorrows
        });

        res.status(201).json(goal);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getMyGoals = async (req, res) => {
    try {
        const goals = await ReadingGoal.find({ student: req.user._id })
            .sort({ createdAt: -1 });
        res.json(goals);
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}


const checkGoalProgress = async (req, res) => {
    try {
        const goal = await ReadingGoal.findById(req.params.goalId);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        if (goal.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const student = await User.findById(req.user._id);
        const totalHours = student.totalReadingHours || 0;
        const progressHours = Math.max(0, totalHours - (goal.startHours || 0));

        // Count books completed via reading sessions since goal start
        const ReadingSession = require('../models/ReadingSessions');
        const sessions = await ReadingSession.find({
            student: req.user._id,
            createdAt: { $gte: goal.createdAt }
        }).populate('book', 'totalPages');

        // Group by book, find books where currentPage >= totalPages
        const bookMap = {};
        sessions.forEach(s => {
            if (!s.book) return;
            const bookId = s.book._id.toString();
            if (!bookMap[bookId] || s.currentPage > bookMap[bookId].currentPage) {
                bookMap[bookId] = s;
            }
        });

        const currentBooks = Object.values(bookMap).filter(s =>
            s.book.totalPages && s.currentPage >= s.book.totalPages
        ).length;

        const hoursPercent = goal.targetHours
            ? Math.min(Math.round((progressHours / goal.targetHours) * 100), 100)
            : 0;
        const booksPercent = goal.targetBooks
            ? Math.min(Math.round((currentBooks / goal.targetBooks) * 100), 100)
            : 0;

        const isCompleted = progressHours >= goal.targetHours &&
            (!goal.targetBooks || currentBooks >= goal.targetBooks);

        if (isCompleted && !goal.isCompleted) {
            goal.isCompleted = true;
            await goal.save();
        }

        res.json({
            goal,
            progressHours: Math.round(progressHours * 10) / 10,
            progressPercentage: hoursPercent,
            currentBooks,
            booksPercentage: booksPercent,
            isCompleted: goal.isCompleted
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteGoal = async (req, res) => {
    try {
        const goal = await ReadingGoal.findById(req.params.goalId);
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        if (goal.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await ReadingGoal.findByIdAndDelete(req.params.goalId);
        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createGoal, getMyGoals, checkGoalProgress, deleteGoal };