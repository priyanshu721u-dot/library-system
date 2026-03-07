const mongoose = require('mongoose');


const borrowSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    borrowDate: {
        type: Date,
        default: () => new Date()
    },
    dueDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'return_requested', 'returned', 'overdue'],
        default: 'pending'
    },
    penalty: {
        type: Number,
        default: 0
    },
    adminNote: {
    type: String,
    default: ''
},

}, { timestamps: true })

module.exports = mongoose.model('Borrow', borrowSchema);