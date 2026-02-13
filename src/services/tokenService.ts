import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import User from '../models/User';

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  };
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, options);
};

export const generateTokens = (payload: TokenPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload & TokenPayload;
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload & TokenPayload;
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
};

export const saveRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    $push: { refreshTokens: refreshToken },
  });
};

export const removeRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: refreshToken },
  });
};

export const removeAllRefreshTokens = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    $set: { refreshTokens: [] },
  });
};

export const isRefreshTokenValid = async (userId: string, refreshToken: string): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) return false;
  return user.refreshTokens.includes(refreshToken);
};
