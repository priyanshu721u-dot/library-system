const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
dotenv.config();

connectDB();

const app = express();

app.use(express.json());

app.use('/api/auth' , authRoutes);
app.use('/api/books' , bookRoutes);
app.get('/' , (req , res ) => {
    res.json({message: 'Library management api is working'})
});

const PORT = process.env.PORT;

app.listen(PORT , () => {
    console.log(`Server running on the ${PORT}`);
});