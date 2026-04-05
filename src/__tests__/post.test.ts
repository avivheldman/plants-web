import request from 'supertest';
import app from '../app';
import { createAuthenticatedUser } from './setup';

describe('Post Endpoints', () => {
  let accessToken: string;
  let userId: string;

  beforeEach(async () => {
    const auth = await createAuthenticatedUser();
    accessToken = auth.accessToken;
    userId = auth.userId;
  });

  describe('POST /api/posts', () => {
    it('should create a post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'My Plant')
        .field('content', 'A beautiful monstera');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('My Plant');
      expect(res.body.data.content).toBe('A beautiful monstera');
      expect(res.body.data.author).toBeDefined();
    });

    it('should reject post without title', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('content', 'No title here');

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/posts')
        .field('title', 'Test')
        .field('content', 'Test');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('title', `Post ${i}`)
          .field('content', `Content ${i}`);
      }
    });

    it('should list posts with pagination', async () => {
      const res = await request(app).get('/api/posts?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.total).toBe(3);
      expect(res.body.hasMore).toBe(true);
    });

    it('should return second page', async () => {
      const res = await request(app).get('/api/posts?page=2&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.hasMore).toBe(false);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should get a single post', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'Single Post')
        .field('content', 'Details here');

      const postId = createRes.body.data._id;

      const res = await request(app).get(`/api/posts/${postId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Single Post');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app).get('/api/posts/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update own post', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'Original')
        .field('content', 'Original content');

      const postId = createRes.body.data._id;

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'Updated Title');

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('should reject update from another user', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'Mine')
        .field('content', 'My post');

      const postId = createRes.body.data._id;

      const other = await createAuthenticatedUser({ email: 'other@example.com' });

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${other.accessToken}`)
        .field('title', 'Hacked');

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete own post', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'To Delete')
        .field('content', 'Bye');

      const postId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const getRes = await request(app).get(`/api/posts/${postId}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('GET /api/posts/user/:userId', () => {
    it('should get posts by user', async () => {
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'User Post')
        .field('content', 'Content');

      const res = await request(app).get(`/api/posts/user/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });
});
