import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ChzzkUser } from './types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chzzk_sync_tube_super_secret_jwt_key_2026_safe';

// Mock Login for local testing & instant demo
router.post('/mock-login', (req: Request, res: Response) => {
  const { channelId, channelName, channelImageUrl, verifiedMark } = req.body;

  if (!channelName) {
    return res.status(400).json({ error: 'channelName is required' });
  }

  const user: ChzzkUser = {
    channelId: channelId || `mock-${Date.now().toString(36)}`,
    channelName,
    channelImageUrl: channelImageUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(channelName)}`,
    verifiedMark: !!verifiedMark,
  };

  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  res.cookie('chzzk_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ success: true, user });
});

// Current Logged-in User Profile
router.get('/me', (req: Request, res: Response) => {
  const token = req.cookies?.chzzk_session;

  if (!token) {
    return res.json({ user: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ChzzkUser;
    return res.json({ user: decoded });
  } catch (err) {
    res.clearCookie('chzzk_session');
    return res.json({ user: null });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('chzzk_session');
  return res.json({ success: true });
});

export default router;
