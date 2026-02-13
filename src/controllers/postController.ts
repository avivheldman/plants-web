import { Response } from 'express';
import Post from '../models/Post';
import Like from '../models/Like';
import Comment from '../models/Comment';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';

// Get all posts with pagination (feed)
export const getPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'displayName photoUrl')
        .lean(),
      Post.countDocuments({ isPublished: true }),
    ]);

    res.json({
      success: true,
      data: posts,
      page,
      limit,
      total,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

// Get single post by ID
export const getPostById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    const post = await Post.findById(id)
      .populate('author', 'displayName photoUrl')
      .lean();

    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
};

// Get posts by user ID
export const getPostsByUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    const [posts, total] = await Promise.all([
      Post.find({ author: userId, isPublished: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'displayName photoUrl')
        .lean(),
      Post.countDocuments({ author: userId, isPublished: true }),
    ]);

    res.json({
      success: true,
      data: posts,
      page,
      limit,
      total,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user posts' });
  }
};

// Create a new post
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, plantName, tags } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!title || !title.trim()) {
      res.status(400).json({ success: false, message: 'Post title is required' });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Post content is required' });
      return;
    }

    // Handle image upload if file is present
    let image: string | undefined;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const post = new Post({
      author: user._id,
      title: title.trim(),
      content: content.trim(),
      image,
      plantName: plantName?.trim(),
      tags: tags || [],
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'displayName photoUrl')
      .lean();

    res.status(201).json({ success: true, data: populatedPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

// Update a post
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, plantName, tags } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    if (post.author.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to update this post' });
      return;
    }

    if (title) {
      post.title = title.trim();
    }

    if (content) {
      post.content = content.trim();
    }

    if (plantName !== undefined) {
      post.plantName = plantName?.trim();
    }

    if (tags !== undefined) {
      post.tags = tags;
    }

    // Handle image upload if file is present
    if (req.file) {
      post.image = `/uploads/${req.file.filename}`;
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'displayName photoUrl')
      .lean();

    res.json({ success: true, data: updatedPost });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
};

// Delete a post
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    if (post.author.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
      return;
    }

    // Delete associated likes and comments
    await Promise.all([
      Like.deleteMany({ postId: id }),
      Comment.deleteMany({ postId: id }),
      post.deleteOne(),
    ]);

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

// Like a post
export const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    // Check if already liked
    const existingLike = await Like.findOne({ postId: id, userId: user._id });

    if (existingLike) {
      res.status(400).json({ success: false, message: 'Post already liked' });
      return;
    }

    // Create like and increment count
    await Like.create({ postId: id, userId: user._id });
    post.likesCount += 1;
    await post.save();

    res.json({ success: true, likesCount: post.likesCount, liked: true });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ success: false, message: 'Failed to like post' });
  }
};

// Unlike a post
export const unlikePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    // Check if like exists
    const existingLike = await Like.findOne({ postId: id, userId: user._id });

    if (!existingLike) {
      res.status(400).json({ success: false, message: 'Post not liked' });
      return;
    }

    // Remove like and decrement count
    await existingLike.deleteOne();
    post.likesCount = Math.max(0, post.likesCount - 1);
    await post.save();

    res.json({ success: true, likesCount: post.likesCount, liked: false });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ success: false, message: 'Failed to unlike post' });
  }
};

// Check if user liked a post
export const checkLiked = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    const like = await Like.findOne({ postId: id, userId: user._id });

    res.json({ success: true, liked: !!like });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ success: false, message: 'Failed to check like status' });
  }
};
