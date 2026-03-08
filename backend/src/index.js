const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const readingRoutes = require('./routes/readingRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');


dotenv.config();

connectDB();

const app = express();

app.use(express.json());

app.use('/api/auth' , authRoutes);
app.use('/api/books' , bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.get('/' , (req , res ) => {
    res.json({message: 'Library management api is working'})
});

const PORT = process.env.PORT;

app.listen(PORT , () => {
    console.log(`Server running on the ${PORT}`);
});