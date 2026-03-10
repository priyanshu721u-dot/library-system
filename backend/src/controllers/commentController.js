const Comment = require('../models/Comment')
const Blog = require('../models/Blog')


const addComment = async (req , res ) => {
    try {
        const blog = await Blog.findById(req.params.blogId)
        if(!blog){
            return res.status(404).json({message : 'Blog not Found'})
        }

        const comment = await Comment.create({
            blog:req.params.blogId,
            user:req.user._id,
            content : req.body.content
        })

        await comment.populate('user', 'username');

        res.status(201).json(comment);


    } catch (error) {
        return res.status(500).json({message : error.message})
    }
}

const getBlogComments = async (req, res) => {
    try {
        const comments = await Comment.find({ blog: req.params.blogId })
            .populate('user', 'username')
            .sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Only comment owner or admin can delete
        if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Comment.findByIdAndDelete(req.params.commentId);
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addComment, getBlogComments, deleteComment };