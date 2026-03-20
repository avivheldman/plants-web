import request from 'supertest';
import app from '../app';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Like from '../models/Like';
import mongoose from 'mongoose';

describe('Social API', () => {
  let accessToken: string;
  let userId: string;
  let postId: string;

  beforeEach(async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

    accessToken = registerResponse.body.tokens.accessToken;
    userId = registerResponse.body.user.id;

    const post = await Post.create({
      author: new mongoose.Types.ObjectId(userId),
      title: 'Test Post',
      content: 'Test content',
    });
    postId = post._id.toString();
  });

  describe('Comments', () => {
    describe('GET /api/social/posts/:postId/comments', () => {
      beforeEach(async () => {
        for (let i = 0; i < 3; i++) {
          await Comment.create({
            postId: new mongoose.Types.ObjectId(postId),
            userId: new mongoose.Types.ObjectId(userId),
            text: `Comment ${i}`,
          });
        }
      });

      it('should get comments for a post', async () => {
        const response = await request(app)
          .get(`/api/social/posts/${postId}/comments`);

        expect(response.status).toBe(200);
        expect(response.body.comments).toBeDefined();
        expect(response.body.comments.length).toBe(3);
      });

      it('should return 400 for invalid post ID', async () => {
        const response = await request(app)
          .get('/api/social/posts/invalid-id/comments');

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/social/posts/:postId/comments', () => {
      it('should create a comment', async () => {
        const response = await request(app)
          .post(`/api/social/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ text: 'Great post!' });

        expect(response.status).toBe(201);
        expect(response.body.comment.text).toBe('Great post!');

        const post = await Post.findById(postId);
        expect(post?.commentsCount).toBe(1);
      });

      it('should reject empty comment text', async () => {
        const response = await request(app)
          .post(`/api/social/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ text: '' });

        expect(response.status).toBe(400);
      });

      it('should reject comment exceeding max length', async () => {
        const response = await request(app)
          .post(`/api/social/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ text: 'a'.repeat(1001) });

        expect(response.status).toBe(400);
      });

      it('should reject unauthenticated request', async () => {
        const response = await request(app)
          .post(`/api/social/posts/${postId}/comments`)
          .send({ text: 'Great post!' });

        expect(response.status).toBe(401);
      });
    });

    describe('PUT /api/social/comments/:commentId', () => {
      let commentId: string;

      beforeEach(async () => {
        const comment = await Comment.create({
          postId: new mongoose.Types.ObjectId(postId),
          userId: new mongoose.Types.ObjectId(userId),
          text: 'Original comment',
        });
        commentId = comment._id.toString();
      });

      it('should update own comment', async () => {
        const response = await request(app)
          .put(`/api/social/comments/${commentId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ text: 'Updated comment' });

        expect(response.status).toBe(200);
        expect(response.body.comment.text).toBe('Updated comment');
      });
    });

    describe('DELETE /api/social/comments/:commentId', () => {
      let commentId: string;

      beforeEach(async () => {
        await Post.findByIdAndUpdate(postId, { commentsCount: 1 });

        const comment = await Comment.create({
          postId: new mongoose.Types.ObjectId(postId),
          userId: new mongoose.Types.ObjectId(userId),
          text: 'Comment to delete',
        });
        commentId = comment._id.toString();
      });

      it('should delete own comment', async () => {
        const response = await request(app)
          .delete(`/api/social/comments/${commentId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);

        const comment = await Comment.findById(commentId);
        expect(comment).toBeNull();
      });
    });
  });

  describe('Likes', () => {
    describe('POST /api/social/posts/:postId/like', () => {
      it('should like a post', async () => {
        const response = await request(app)
          .post(`/api/social/posts/${postId}/like`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(201);
        expect(response.body.likesCount).toBe(1);

        const like = await Like.findOne({ postId, userId });
        expect(like).toBeDefined();
      });

      it('should reject duplicate like', async () => {
        await request(app)
          .post(`/api/social/posts/${postId}/like`)
          .set('Authorization', `Bearer ${accessToken}`);

        const response = await request(app)
          .post(`/api/social/posts/${postId}/like`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(409);
      });

      it('should reject unauthenticated request', async () => {
        const response = await request(app)
          .post(`/api/social/posts/${postId}/like`);

        expect(response.status).toBe(401);
      });
    });

    describe('DELETE /api/social/posts/:postId/like', () => {
      beforeEach(async () => {
        await Like.create({
          postId: new mongoose.Types.ObjectId(postId),
          userId: new mongoose.Types.ObjectId(userId),
        });
        await Post.findByIdAndUpdate(postId, { likesCount: 1 });
      });

      it('should unlike a post', async () => {
        const response = await request(app)
          .delete(`/api/social/posts/${postId}/like`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.likesCount).toBe(0);

        const like = await Like.findOne({ postId, userId });
        expect(like).toBeNull();
      });

      it('should return 404 if not liked', async () => {
        await Like.deleteOne({ postId, userId });

        const response = await request(app)
          .delete(`/api/social/posts/${postId}/like`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('GET /api/social/posts/:postId/like', () => {
      it('should return liked: true when post is liked', async () => {
        await Like.create({
          postId: new mongoose.Types.ObjectId(postId),
          userId: new mongoose.Types.ObjectId(userId),
        });

        const response = await request(app)
          .get(`/api/social/posts/${postId}/like`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.liked).toBe(true);
      });

      it('should return liked: false when post is not liked', async () => {
        const response = await request(app)
          .get(`/api/social/posts/${postId}/like`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.liked).toBe(false);
      });
    });

    describe('GET /api/social/likes', () => {
      it('should get user liked posts', async () => {
        for (let i = 0; i < 3; i++) {
          const post = await Post.create({
            author: new mongoose.Types.ObjectId(userId),
            title: `Post ${i}`,
            content: `Content ${i}`,
          });
          await Like.create({
            postId: post._id,
            userId: new mongoose.Types.ObjectId(userId),
          });
        }

        const response = await request(app)
          .get('/api/social/likes')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.posts.length).toBe(3);
      });
    });
  });
});
