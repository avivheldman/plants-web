import { Response } from 'express';
import Comment from '../models/Comment';
import Post from '../models/Post';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';

// Get comments for a post
export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    const [comments, total] = await Promise.all([
      Comment.find({ postId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'displayName photoUrl')
        .lean(),
      Comment.countDocuments({ postId }),
    ]);

    res.json({
      success: true,
      data: comments,
      page,
      limit,
      total,
      hasMore: skip + comments.length < total,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

// Create a comment
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    if (!text || !text.trim()) {
      res.status(400).json({ success: false, message: 'Comment text is required' });
      return;
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    const comment = new Comment({
      postId,
      userId: user._id,
      text: text.trim(),
    });

    await comment.save();

    // Increment post comment count
    post.commentsCount += 1;
    await post.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'displayName photoUrl')
      .lean();

    res.status(201).json({ success: true, data: populatedComment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
};

// Delete a comment
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId, commentId } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    if (comment.userId.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
      return;
    }

    // Decrement post comment count
    const post = await Post.findById(postId);
    if (post) {
      post.commentsCount = Math.max(0, post.commentsCount - 1);
      await post.save();
    }

    await comment.deleteOne();

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};
