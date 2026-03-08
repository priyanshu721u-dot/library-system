const Notification = require('../models/Notification')

const getMyNotifications = async (req , res) => {
    try{
        const notification = await Notification.find({user:req.user._id})
            .sort({createdAt:-1});

        res.json(notification)
    }catch(error){
        res.status(500).json({message:error.message})
    }
}

const markAsRead = async (req , res) =>{
    try{
        const notification = await Notification.findById(req.params.notificationId)
        if(!notification){
            return res.status(404).json({message: 'Notification not found'})
        }

        if(notification.user.toString() !== req.user._id.toString()){
            return res.status(403).json({message: 'Not Authorized'})
        }
        notification.read = true;
        await notification.save();
        res.json({ message: 'Notification marked as read', notification });


    }catch(error){
        res.status(500).json({message:error.message})
    }
}

const markAllAsRead = async (req, res) =>{
    try {
        await Notification.updateMany(       //updateMany updates all matching documents in one single database call. Much efficient.
            {user : req.user._id , read : false},
            {read : true}
        )
        res.json({ message : 'All notification marked as read'})
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
}

const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            read: false
        });
        res.json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, getUnreadCount };