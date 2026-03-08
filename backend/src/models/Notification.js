const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    type:{
        type:String,
        emun:['borrow_approved', 'borrow_rejected', 'return_approved', 'overdue', 'wishlist_available'],
        required:true
    },
    message:{
        type:String,
        required:true,
    },
    read:{
        type:Boolean,
        default: false
    }
},{timestamps : true})

module.exports = mongoose.model('Notification' ,notificationSchema)