const User = require('../models/User')

const getProfile = async (req , res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        return res.status(500).json({message : error.message})
    }
}

const updateProfile = async (req , res) => {
    try {
        const {username ,email} =req.body;

          // Check if email already taken by another user
        if(email){
            const existingUser = await User.findOne({
                email,
                _id:{$ne:req.user._id} //$ne operator: This means "find a user with this email where the ID is not equal to the current user's ID."

            })
             if (existingUser) {
                return res.status(400).json({ message: 'Email already taken' });
            }
        }

         const user = await User.findByIdAndUpdate(
            req.user._id,
            { username, email },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);

    } catch (error) {
        return res.status(500).json({message : error.message})
    }
}

const changePassword = async (req , res) => {
    try {
        const { currentPassword , newPassword} =req.body;
        
        const user = await User.findById(req.user._id);

        const isMatch = await user.comparePassword(currentPassword)

        if(!isMatch){
            return res.status(404).json({message : 'Current password is Invaild'})
        }

        user.password = newPassword;
        await user.save();

        res.json({message:'Password changed successfully'})
    } catch (error) {
        return res.status(500).json({message : error.message})
    }
}


module.exports = { getProfile, updateProfile, changePassword };