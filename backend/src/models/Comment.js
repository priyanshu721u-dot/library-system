const mongoose = require('mongoose')

const commentsSchema = new mongoose.Schema({
    blog:{
        type :mongoose.Schema.Types.ObjectId,
        ref:'Blog',
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    content:{
        type:String,
        required:[true ,'Comment content is required'],
        trim : true
    }
},{timestamps:true})

module.exports = mongoose.model('Comment' , commentsSchema);

