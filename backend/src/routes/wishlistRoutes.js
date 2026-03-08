const express = require('express');
const router = express.Router();
const { addToWishlist, getMyWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const protect = require('../middleware/authMiddleware');

router.post('/:bookId', protect, addToWishlist);
router.get('/my', protect, getMyWishlist);
router.delete('/:bookId', protect, removeFromWishlist);

module.exports = router;