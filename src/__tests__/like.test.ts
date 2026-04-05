import request from 'supertest';
import app from '../app';
import Post from '../models/Post';
import mongoose from 'mongoose';
import { createAuthenticatedUser } from './setup';

describe('Like Endpoints', () => {
  let accessToken: string;
  let userId: string;
  let postId: string;

  beforeEach(async () => {
    const auth = await createAuthenticatedUser();
    accessToken = auth.accessToken;
    userId = auth.userId;

    const post = await Post.create({
      author: new mongoose.Types.ObjectId(userId),
      title: 'Likeable Post',
      content: 'Content',
      isPublished: true,
    });
    postId = post._id.toString();
  });

  describe('POST /api/social/posts/:postId/like', () => {
    it('should like a post', async () => {
      const res = await request(app)
        .post(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.likesCount).toBe(1);

      const post = await Post.findById(postId);
      expect(post?.likesCount).toBe(1);
    });

    it('should reject duplicate like', async () => {
      await request(app)
        .post(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      const res = await request(app)
        .post(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(409);
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post(`/api/social/posts/${postId}/like`);

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/social/posts/:postId/like', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should unlike a post', async () => {
      const res = await request(app)
        .delete(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.likesCount).toBe(0);
    });

    it('should return 404 if not liked', async () => {
      await request(app)
        .delete(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      const res = await request(app)
        .delete(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/social/posts/:postId/like', () => {
    it('should return liked true when liked', async () => {
      await request(app)
        .post(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      const res = await request(app)
        .get(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.liked).toBe(true);
    });

    it('should return liked false when not liked', async () => {
      const res = await request(app)
        .get(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.liked).toBe(false);
    });
  });

  describe('GET /api/social/likes', () => {
    it('should return liked posts for user', async () => {
      await request(app)
        .post(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      const res = await request(app)
        .get('/api/social/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.posts.length).toBe(1);
    });
  });
});
