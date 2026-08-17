import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server';
import { Express } from 'express';

describe('Auth API Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it('GET /api/auth/me should return null when not logged in', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('POST /api/auth/mock-login should issue session cookie and return user profile', async () => {
    const mockUser = {
      channelId: 'test-channel-123',
      channelName: '침착맨',
      channelImageUrl: 'https://example.com/calmdown.png',
    };

    const loginRes = await request(app)
      .post('/api/auth/mock-login')
      .send(mockUser);

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.user.channelId).toBe('test-channel-123');
    expect(loginRes.body.user.channelName).toBe('침착맨');

    // Extract cookie
    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();

    // Verify /api/auth/me with the cookie
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user).toBeDefined();
    expect(meRes.body.user.channelName).toBe('침착맨');
  });

  it('POST /api/auth/logout should clear cookie', async () => {
    const logoutRes = await request(app).post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });

  it('GET /api/auth/chzzk/login with JSON accept should return OAuth redirect URL', async () => {
    const loginUrlRes = await request(app)
      .get('/api/auth/chzzk/login')
      .set('Accept', 'application/json');
    expect(loginUrlRes.status).toBe(200);
    expect(loginUrlRes.body.url).toContain('https://chzzk.naver.com/account-interlock');
    expect(loginUrlRes.body.url).toContain('clientId=');
  });

  it('GET /api/auth/chzzk/login without JSON accept should redirect to Chzzk auth page', async () => {
    const loginRedirectRes = await request(app).get('/api/auth/chzzk/login');
    expect(loginRedirectRes.status).toBe(302);
    expect(loginRedirectRes.headers['location']).toContain('https://chzzk.naver.com/account-interlock');
  });
});
