import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ChzzkUser } from './types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chzzk_sync_tube_super_secret_jwt_key_2026_safe';

// Mock Login for local testing & instant demo (Disabled in production for security)
router.post('/mock-login', (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowMockInProd = process.env.ENABLE_MOCK_AUTH === 'true';

  if (isProduction && !allowMockInProd) {
    return res.status(403).json({
      error: '프로덕션 환경에서는 테스트 로그인이 비활성화되어 있습니다. 치지직 공식 로그인을 사용해주세요.',
    });
  }

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
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ success: true, user, token });
});

// Current Logged-in User Profile (supports cookie and Authorization header)
router.get('/me', (req: Request, res: Response) => {
  let token = req.cookies?.chzzk_session;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
  }

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
