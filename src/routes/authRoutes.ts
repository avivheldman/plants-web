import { Router } from 'express';
import passport from '../config/passport';
import {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
  googleCallback,
  facebookCallback,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Local authentication
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.post('/refresh', refreshToken);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

// Facebook OAuth
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email'], session: false })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  facebookCallback
);

export default router;
