export const env = {
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/plants-web',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access-secret-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',

  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/api/auth/facebook/callback',

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
} as const;
