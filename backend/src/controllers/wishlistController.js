const Wishlist = require('../models/Wishlist')

const addToWishlist = async (req , res) => {
    try{
        const alreadyInWishlist = await Wishlist.findOne({
            student:req.user._id,
            book:req.params.bookId
        });

        if(alreadyInWishlist){
            return res.status(400).json({message:'Book already in wishlist'})
        }

        const wishlist = await Wishlist.create({
            student:req.user._id,
            book:req.params.bookId
        })
        res.status(201).json(wishlist)
    }catch(error){
        return res.status(500).json({message : error.message})
    }
}

//get all the wishlist of the user
const getMyWishlist = async (req , res) => {
    try{
        const wishlist = await Wishlist.find({student : req.user._id})
            .populate('book' , 'title author coverImage availableCopies')
            .sort({createdAt: -1 })
        res.json({wishlist})
    }catch(error){
         return res.status(500).json({message : error.message})
    }
}

const removeFromWishlist = async (req , res ) => {
    try{
        const wishlist = await Wishlist.find({
            student : req.user._id,
            book:req.params.bookId
        })

        if(!wishlist){
        return res.status(404).json({ message: 'Book not found in wishlist' });
        }

        await Wishlist.findByIdAndDelete(wishlist._id);
        res.json({ message: 'Book removed from wishlist' });
            
    }catch(error){
         return res.status(500).json({message : error.message})
    }
}

module.exports = { addToWishlist, getMyWishlist, removeFromWishlist };
