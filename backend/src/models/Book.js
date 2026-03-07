const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true , 'Title is required'],
        trim: true
    },
    author:{
        type:String,
        required:[true , 'Author name is required'],
        trim: true
    },
    ISBN:{
        type:String,
        required:[true , 'ISBN is required'],
        trim: true,
        unique:true
    },
    category:{
        type : String ,
        required : [true , 'Category is needed'],
        trim:true
    },
    totalCopies: {
        type : Number,
        required : [true , 'Please enter number of pages'],
        min : 1
    },
    totalPages : {
        type : Number,
        required : [true,'Please enter number of pages']
    },
    availableCopies : {
        type : Number ,
        required : [true , 'Available copies are required '],
        min : 0
    },
     coverImage: {
        type: String,
        default: 'https://placeholder.com/cover.jpg'
    },
    isNew: {
        type: Boolean,
        default: false
    },
    isTrending: {
        type: Boolean,
        default: false
    }
},{ timestamps: true });

module.exports = mongoose.model('Book', bookSchema);