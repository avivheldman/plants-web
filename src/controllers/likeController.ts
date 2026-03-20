import { Response } from 'express';
import Like from '../models/Like';
import Post from '../models/Post';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';

export const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ error: 'Invalid post ID' });
      return;
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const existing = await Like.findOne({ postId, userId: user._id });
    if (existing) {
      res.status(409).json({ error: 'Already liked' });
      return;
    }

    await Like.create({ postId, userId: user._id });
    post.likesCount += 1;
    await post.save();

    res.status(201).json({ likesCount: post.likesCount });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
};

export const unlikePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ error: 'Invalid post ID' });
      return;
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const like = await Like.findOne({ postId, userId: user._id });
    if (!like) {
      res.status(404).json({ error: 'Not liked' });
      return;
    }

    await like.deleteOne();
    post.likesCount = Math.max(0, post.likesCount - 1);
    await post.save();

    res.json({ likesCount: post.likesCount });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
};

export const checkLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ error: 'Invalid post ID' });
      return;
    }

    const like = await Like.findOne({ postId, userId: user._id });
    res.json({ liked: !!like });
  } catch (error) {
    console.error('Check like error:', error);
    res.status(500).json({ error: 'Failed to check like status' });
  }
};

export const getLikedPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const likes = await Like.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'postId',
        populate: { path: 'author', select: 'displayName photoUrl' },
      })
      .lean();

    const posts = likes
      .map((l) => l.postId)
      .filter(Boolean);

    res.json({ posts });
  } catch (error) {
    console.error('Get liked posts error:', error);
    res.status(500).json({ error: 'Failed to get liked posts' });
  }
};

export const getPostLikers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ error: 'Invalid post ID' });
      return;
    }

    const likes = await Like.find({ postId })
      .populate('userId', 'displayName photoUrl')
      .lean();

    const users = likes.map((l) => l.userId);

    res.json({ users });
  } catch (error) {
    console.error('Get post likers error:', error);
    res.status(500).json({ error: 'Failed to get post likers' });
  }
};
