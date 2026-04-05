import request from 'supertest';
import app from '../app';
import Post from '../models/Post';
import mongoose from 'mongoose';
import { createAuthenticatedUser } from './setup';

describe('Comment Endpoints', () => {
  let accessToken: string;
  let userId: string;
  let postId: string;

  beforeEach(async () => {
    const auth = await createAuthenticatedUser();
    accessToken = auth.accessToken;
    userId = auth.userId;

    const post = await Post.create({
      author: new mongoose.Types.ObjectId(userId),
      title: 'Test Post',
      content: 'Test content',
      isPublished: true,
    });
    postId = post._id.toString();
  });

  describe('POST /api/social/posts/:postId/comments', () => {
    it('should create a comment', async () => {
      const res = await request(app)
        .post(`/api/social/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: 'Nice plant!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toBe('Nice plant!');

      const post = await Post.findById(postId);
      expect(post?.commentsCount).toBe(1);
    });

    it('should reject empty text', async () => {
      const res = await request(app)
        .post(`/api/social/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: '' });

      expect(res.status).toBe(400);
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post(`/api/social/posts/${postId}/comments`)
        .send({ text: 'Hello' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/social/posts/:postId/comments', () => {
    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/social/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ text: `Comment ${i}` });
      }
    });

    it('should list comments for a post', async () => {
      const res = await request(app)
        .get(`/api/social/posts/${postId}/comments`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it('should return 400 for invalid post id', async () => {
      const res = await request(app)
        .get('/api/social/posts/bad-id/comments');

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/social/comments/:commentId', () => {
    it('should delete own comment', async () => {
      const createRes = await request(app)
        .post(`/api/social/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: 'Temporary' });

      const commentId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/social/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const post = await Post.findById(postId);
      expect(post?.commentsCount).toBe(0);
    });

    it('should reject deleting another users comment', async () => {
      const createRes = await request(app)
        .post(`/api/social/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: 'Mine' });

      const commentId = createRes.body.data._id;
      const other = await createAuthenticatedUser({ email: 'other@test.com' });

      const res = await request(app)
        .delete(`/api/social/comments/${commentId}`)
        .set('Authorization', `Bearer ${other.accessToken}`);

      expect(res.status).toBe(403);
    });
  });
});
