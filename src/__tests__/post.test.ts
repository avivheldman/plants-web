import request from 'supertest';
import app from '../app';
import Post from '../models/Post';
import User from '../models/User';
import mongoose from 'mongoose';

describe('Post API', () => {
  let accessToken: string;
  let userId: string;

  beforeEach(async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  describe('Post Model', () => {
    it('should create a post', async () => {
      const post = await Post.create({
        author: new mongoose.Types.ObjectId(userId),
        title: 'Test Post',
        content: 'Test content for the post',
        plantName: 'Rose',
        tags: ['flower', 'outdoor'],
      });

      expect(post.title).toBe('Test Post');
      expect(post.content).toBe('Test content for the post');
      expect(post.plantName).toBe('Rose');
      expect(post.tags).toEqual(['flower', 'outdoor']);
      expect(post.likesCount).toBe(0);
      expect(post.commentsCount).toBe(0);
    });

    it('should require title and content', async () => {
      await expect(
        Post.create({
          author: new mongoose.Types.ObjectId(userId),
        })
      ).rejects.toThrow();
    });

    it('should enforce maxlength on title', async () => {
      await expect(
        Post.create({
          author: new mongoose.Types.ObjectId(userId),
          title: 'a'.repeat(201),
          content: 'Test content',
        })
      ).rejects.toThrow();
    });
  });

  describe('Post Queries', () => {
    beforeEach(async () => {
      // Create multiple posts
      for (let i = 0; i < 5; i++) {
        await Post.create({
          author: new mongoose.Types.ObjectId(userId),
          title: `Post ${i}`,
          content: `Content ${i}`,
          tags: i % 2 === 0 ? ['even'] : ['odd'],
        });
      }
    });

    it('should find posts by author', async () => {
      const posts = await Post.find({ author: userId });
      expect(posts.length).toBe(5);
    });

    it('should find posts by tags', async () => {
      const evenPosts = await Post.find({ tags: 'even' });
      expect(evenPosts.length).toBe(3);

      const oddPosts = await Post.find({ tags: 'odd' });
      expect(oddPosts.length).toBe(2);
    });

    it('should sort posts by createdAt', async () => {
      const posts = await Post.find().sort({ createdAt: -1 });
      expect(posts.length).toBe(5);
      expect(posts[0].title).toBe('Post 4');
    });

    it('should paginate posts', async () => {
      const page1 = await Post.find().limit(2).skip(0);
      const page2 = await Post.find().limit(2).skip(2);

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);
    });
  });

  describe('Post with Author Population', () => {
    it('should populate author details', async () => {
      const post = await Post.create({
        author: new mongoose.Types.ObjectId(userId),
        title: 'Test Post',
        content: 'Test content',
      });

      const populatedPost = await Post.findById(post._id).populate(
        'author',
        'firstName lastName profilePhoto'
      );

      expect(populatedPost?.author).toBeDefined();
      expect((populatedPost?.author as unknown as { firstName: string }).firstName).toBe('Test');
    });
  });
});
