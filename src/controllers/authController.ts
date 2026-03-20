import { Request, Response } from 'express';
import User from '../models/User';
import {
  generateTokens,
  verifyRefreshToken,
  saveRefreshToken,
  removeRefreshToken,
  removeAllRefreshTokens,
  isRefreshTokenValid,
} from '../services/tokenService';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const user = new User({
      email: email.toLowerCase(),
      password,
      displayName,
    });

    await user.save();

    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
    });

    await saveRefreshToken(user._id.toString(), tokens.refreshToken);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
    });

    await saveRefreshToken(user._id.toString(), tokens.refreshToken);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (refreshToken) {
      await removeRefreshToken(req.user._id.toString(), refreshToken);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

export const logoutAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await removeAllRefreshTokens(req.user._id.toString());

    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const isValid = await isRefreshTokenValid(payload.userId, refreshToken);
    if (!isValid) {
      res.status(401).json({ error: 'Refresh token has been revoked' });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    await removeRefreshToken(user._id.toString(), refreshToken);

    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
    });

    await saveRefreshToken(user._id.toString(), tokens.refreshToken);

    res.json({
      message: 'Tokens refreshed',
      ...tokens,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName,
        photoUrl: req.user.photoUrl,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const googleCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }

    const tokens = generateTokens({
      userId: req.user._id.toString(),
      email: req.user.email,
    });

    await saveRefreshToken(req.user._id.toString(), tokens.refreshToken);

    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    );
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const facebookCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }

    const tokens = generateTokens({
      userId: req.user._id.toString(),
      email: req.user.email,
    });

    await saveRefreshToken(req.user._id.toString(), tokens.refreshToken);

    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    );
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
