import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.ACCESS_TOKEN_EXPIRY = '15m';
process.env.REFRESH_TOKEN_EXPIRY = '7d';
process.env.NODE_ENV = 'test';

export async function createAuthenticatedUser(
  overrides: { email?: string; password?: string; displayName?: string } = {}
) {
  const email = overrides.email || 'test@example.com';
  const password = overrides.password || 'password123';
  const displayName = overrides.displayName || 'Test User';

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password, displayName });

  return {
    accessToken: res.body.tokens.accessToken as string,
    refreshToken: res.body.tokens.refreshToken as string,
    userId: res.body.user.id as string,
    user: res.body.user,
  };
}
