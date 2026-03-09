const mongoose = require('mongoose')


const readingGoalSchema = new mongoose.Schema({
    student:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    targetHours:{
        type:Number,
        required:[true , 'Target Hours is required'],
        min:1
    },
    targetBooks:{
        type: Number,
        default: 0
    },
    period:{
        type: String,
        enum: ['weekly', 'monthly', 'yearly'],
        required: false
    },
    startDate:{
        type: Date,
        default: () => new Date()
    },
    endDate:{
        type: Date,
       required: false
    },
    isCompleted:{
        type: Boolean,
        default: false
    }
},{timestamps:true})

module.exports = mongoose.model('ReadingGoal', readingGoalSchema);