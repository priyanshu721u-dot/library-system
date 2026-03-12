const User = require('../models/User');
const jwt = require('jsonwebtoken');


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' })
        }
       

        const user = await User.create({ username, email, password, role });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });


    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' })
            
        }
        if (user.isBlocked) {
           return res.status(403).json({ message: 'Your account has been blocked. Please contact the library.' });
       }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' })

        }

        res.json({
            _id: user._id,
            username: user.username,
            role: user.role,
            email: user.email,
            token: generateToken(user._id)
        });




    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}


module.exports = { register, login, getMe };
