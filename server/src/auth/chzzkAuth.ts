import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ChzzkUser } from './types';

const router = Router();

const CHZZK_CLIENT_ID = process.env.CHZZK_CLIENT_ID || '4f56b73e-83b4-4338-8d82-6663cab47b47';
const CHZZK_CLIENT_SECRET = process.env.CHZZK_CLIENT_SECRET || 'pKlJEIhnRQC551nv4IsQoHslnsSq3Q-NcV4HL06OHKI';
const CHZZK_REDIRECT_URI = process.env.CHZZK_REDIRECT_URI || 'http://localhost:4000/api/auth/chzzk/callback';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'chzzk_sync_tube_super_secret_jwt_key_2026_safe';

// Generate OAuth Login URL
router.get('/login', (req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString('hex');
  
  // Detect requesting client origin (e.g. http://localhost:4000 for npm start or http://localhost:5173 for dev)
  let origin = req.headers.origin || req.query.returnTo as string;
  if (!origin && req.headers.referer) {
    try {
      const parsed = new URL(req.headers.referer);
      origin = parsed.origin;
    } catch {
      // ignore
    }
  }

  const clientOrigin = origin || process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'http://localhost:4000' : 'http://localhost:5173');

  // Store state and return origin in cookie
  res.cookie('chzzk_oauth_state', state, {
    httpOnly: true,
    maxAge: 10 * 60 * 1000, // 10 minutes
    sameSite: 'lax',
  });

  res.cookie('chzzk_client_origin', clientOrigin, {
    httpOnly: true,
    maxAge: 10 * 60 * 1000,
    sameSite: 'lax',
  });

  const authUrl = `https://chzzk.naver.com/account-interlock?clientId=${encodeURIComponent(
    CHZZK_CLIENT_ID
  )}&redirectUri=${encodeURIComponent(CHZZK_REDIRECT_URI)}&state=${encodeURIComponent(state)}`;

  console.log(`[Chzzk OAuth] Login initiated from origin "${clientOrigin}". Redirecting to Chzzk: ${authUrl}`);

  // Return JSON if requested by API, or redirect if directly accessed
  if (req.headers.accept?.includes('application/json')) {
    return res.json({ url: authUrl });
  }
  return res.redirect(authUrl);
});

// OAuth Callback Handler
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;

  console.log('[Chzzk OAuth] Callback received:', { code: code ? '***' : null, state, error, error_description });

  if (error) {
    console.error('[Chzzk OAuth] Error from Chzzk:', error, error_description);
    return res.redirect(`${CLIENT_URL}/?error=${encodeURIComponent(String(error_description || error))}`);
  }

  if (!code || !state) {
    console.error('[Chzzk OAuth] Missing code or state');
    return res.redirect(`${CLIENT_URL}/?error=missing_code_or_state`);
  }

  try {
    // 1. Request Access Token
    console.log('[Chzzk OAuth] Exchanging code for access token...');
    const tokenRes = await axios.post(
      'https://openapi.chzzk.naver.com/auth/v1/token',
      {
        grantType: 'authorization_code',
        clientId: CHZZK_CLIENT_ID,
        clientSecret: CHZZK_CLIENT_SECRET,
        code: String(code),
        state: String(state),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': CHZZK_CLIENT_ID,
          'Client-Secret': CHZZK_CLIENT_SECRET,
        },
      }
    );

    const tokenData = tokenRes.data?.content || tokenRes.data;
    console.log('[Chzzk OAuth] Token response received:', {
      tokenType: tokenData?.tokenType,
      expiresIn: tokenData?.expiresIn,
      hasAccessToken: !!tokenData?.accessToken,
    });

    const accessToken = tokenData?.accessToken;

    if (!accessToken) {
      throw new Error(`Failed to obtain accessToken from Chzzk: ${JSON.stringify(tokenRes.data)}`);
    }

    // 2. Fetch User Me Info
    console.log('[Chzzk OAuth] Fetching user profile (/open/v1/users/me)...');
    const userMeRes = await axios.get('https://openapi.chzzk.naver.com/open/v1/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userMe = userMeRes.data?.content || userMeRes.data;
    const channelId = userMe?.channelId;
    let channelName = userMe?.channelName || '치지직 유저';
    let channelImageUrl: string | undefined = undefined;
    let verifiedMark = false;

    console.log('[Chzzk OAuth] User Me info:', { channelId, channelName });

    // 3. Fetch Channel Detail Info (Avatar, Verified status)
    if (channelId) {
      try {
        const channelRes = await axios.get(
          `https://openapi.chzzk.naver.com/open/v1/channels?channelIds=${encodeURIComponent(channelId)}`,
          {
            headers: {
              'Client-Id': CHZZK_CLIENT_ID,
              'Client-Secret': CHZZK_CLIENT_SECRET,
            },
          }
        );

        const channelDataList = channelRes.data?.content?.data || channelRes.data?.data || [];
        const channelData = channelDataList.find((c: any) => c.channelId === channelId) || channelDataList[0];

        if (channelData) {
          channelName = channelData.channelName || channelName;
          channelImageUrl = channelData.channelImageUrl;
          verifiedMark = !!channelData.verifiedMark;
        }
      } catch (channelErr) {
        console.warn('[Chzzk OAuth] Could not fetch channel details, continuing with basic profile:', channelErr);
      }
    }

    const user: ChzzkUser = {
      channelId: channelId || `chzzk-${Date.now()}`,
      channelName,
      channelImageUrl,
      verifiedMark,
    };

    // 4. Issue JWT Session
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    // Set cookie
    res.cookie('chzzk_session', token, {
      httpOnly: true,
      secure: false, // allow http in localhost dev
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Clear oauth state & client origin cookies
    res.clearCookie('chzzk_oauth_state');
    res.clearCookie('chzzk_client_origin');

    const targetClientUrl = req.cookies?.chzzk_client_origin || process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'http://localhost:4000' : 'http://localhost:5173');

    console.log(`[Chzzk OAuth] Login successful for user ${user.channelName} (${user.channelId}). Redirecting to client (${targetClientUrl})...`);

    // Redirect to frontend with token in query param for robust cross-port sync
    return res.redirect(`${targetClientUrl}/?token=${encodeURIComponent(token)}&login=success`);
  } catch (err: any) {
    const errorDetails = err?.response?.data || err?.message || err;
    console.error('[Chzzk OAuth] Callback failed:', errorDetails);
    const fallbackClientUrl = req.cookies?.chzzk_client_origin || process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'http://localhost:4000' : 'http://localhost:5173');
    return res.redirect(`${fallbackClientUrl}/?error=${encodeURIComponent(JSON.stringify(errorDetails))}`);
  }
});

export default router;
