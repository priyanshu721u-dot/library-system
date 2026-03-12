const Book = require('../models/Book');

const addBook = async (req , res) =>{
    try{

        const { title, author, ISBN, category, totalPages, totalCopies, coverImage, isNew, isTrending } = req.body;
        const existingBook = await Book.findOne({ ISBN });
        if(existingBook) {
            return res.status(500).json({message : 'Book with ISBN is already exists'})
        }

        const book = await Book.create({
            title,
            author,
            ISBN,
            category,
            totalPages,
            totalCopies,
            availableCopies: totalCopies,
            coverImage,
            isNew,
            isTrending
        });
        res.status(201).json(book);
    }catch(error){
        res.status(500).json({message : error.message});
    }
}


const getAllBooks = async (req , res) => {
    try{
        const books = await Book.find();
        res.json(books);
    }catch(error){
        return res.status(500).json({message : error.message});
    }
}

const getBook = async (req , res ) =>{     //getting an single book
    try{ 
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(book);
    }catch(error){
        return res.status(500).json({message : error.message});
    }
}

const updateBook = async ( req , res ) => {
    try{
        const book = await Book.findById(req.params.id);
        if(!book){
            return res.status(404).json({message: 'Book not found'})
        }
        const updatedBook = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json(updatedBook);

    }catch(error){
        return res.status(500).json({message : error.message});
    }
}

const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addBook, getAllBooks, getBook, updateBook, deleteBook };