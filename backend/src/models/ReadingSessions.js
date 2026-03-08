const mongoose = require('mongoose')

const readingSessionSchema = new mongoose.Schema({
    student:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    },
    book:{
        type:mongoose.Schema.ObjectId,
        ref:'Book',
        required:true
    },
    duration:{
        type:Number,
        required:[true ,'Duration is required'],
        min:1
    },
    pagesRead:{
        type:Number,
        required:[true , 'Pages read is required'],
        min:0
    },
    currentPage:{
    type:Number,
    required:[true , 'Current page is required'],
    min:0
    },
    date:{
        type:Date,
        default: () => new Date()
    },


},{timestamps:true})


module.exports = mongoose.model('ReadingSession', readingSessionSchema);