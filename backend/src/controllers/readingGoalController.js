const ReadingGoal = require('../models/ReadingGoal');
const User = require('../models/User');

const createGoal = async (req, res) => {
    try {
        const { targetHours, targetBooks, period, endDate } = req.body;

        const goal = await ReadingGoal.create({
            student: req.user._id,
            targetHours,
            targetBooks,
            period,
            endDate
        });

        res.status(201).json(goal);
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const getMyGoals = async (req, res) => {
    try {
        const goals = await ReadingGoal.find({ student: req.user._id })
            .sort({ createdAt: -1 });
        res.json(goals);
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const Borrow = require('../models/Borrow');

const checkGoalProgress = async (req, res) => {
    try {
        const goal = await ReadingGoal.findById(req.params.goalId);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        if (goal.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const student = await User.findById(req.user._id);
        const progressHours = student.totalReadingHours || 0;

        // Count books completed (returned) since goal start
        const completedBorrows = await Borrow.countDocuments({
            student: req.user._id,
            status: 'returned'
        });

        const hoursPercent = Math.min((progressHours / goal.targetHours) * 100, 100);
        const booksPercent = goal.targetBooks
            ? Math.min((completedBorrows / goal.targetBooks) * 100, 100)
            : 0;

        const isCompleted = progressHours >= goal.targetHours &&
            (!goal.targetBooks || completedBorrows >= goal.targetBooks);

        if (isCompleted && !goal.isCompleted) {
            goal.isCompleted = true;
            await goal.save();
        }

        res.json({
            goal,
            progressHours: Math.round(progressHours * 10) / 10,
            progressPercentage: Math.round(hoursPercent),
            currentBooks: completedBorrows,
            booksPercentage: Math.round(booksPercent),
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