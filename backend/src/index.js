const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const readingRoutes = require('./routes/readingRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const blogRoutes = require('./routes/blogRoutes');
const statsRoutes = require('./routes/statsRoutes');
const readingGoalRoutes = require('./routes/readingGoalRoutes');
const profileRoutes = require('./routes/profileRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5501', 'http://127.0.0.1:5501'],
    credentials: true
}));

dotenv.config();

connectDB();


app.use(express.json());

app.use('/api/auth' , authRoutes);
app.use('/api/books' , bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/blogs', blogRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/goals', readingGoalRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/comments', commentRoutes);

app.get('/' , (req , res ) => {
    res.json({message: 'Library management api is working'})
});

const PORT = process.env.PORT;

app.listen(PORT , () => {
    console.log(`Server running on the ${PORT}`);
});