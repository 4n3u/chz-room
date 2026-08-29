import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import chzzkAuthRouter from './auth/chzzkAuth';
import mockAuthRouter from './auth/mockAuth';
import { globalRoomManager } from './rooms/RoomManager';
import { logger, accessLogStream } from './utils/logger';
// Load environment variables from multiple standard paths
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });
dotenv.config();

export function createApp(): Express {
  const app = express();

  const isProduction = process.env.NODE_ENV === 'production';
  const CLIENT_URL = process.env.CLIENT_URL || (isProduction ? true : 'http://localhost:5173');

  // 1. HTTP Access Logging (Morgan - Console & File)
  app.use(
    morgan(isProduction ? 'combined' : 'dev', {
      skip: (req) => req.path === '/api/health' || req.path === '/health',
    })
  );
  app.use(
    morgan('combined', {
      stream: accessLogStream,
      skip: (req) => req.path === '/api/health' || req.path === '/health',
    })
  );

  // 2. Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled to allow YouTube iframe player embeds & external CDNs
      crossOriginEmbedderPolicy: false,
    })
  );

  // 3. Gzip / Deflate Compression
  app.use(compression());

  // 4. CORS
  app.use(
    cors({
      origin: CLIENT_URL === 'true' || CLIENT_URL === true ? true : (CLIENT_URL as any),
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  // 4. Rate Limiting (DDoS & Abuse Prevention)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 400, // 400 requests per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health' || req.path === '/api/health',
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
  });

  const createRoomLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // Max 30 rooms per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: '치즈룸 생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
  });

  app.use('/api', apiLimiter);

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Auth routers
  app.use('/api/auth/chzzk', chzzkAuthRouter);
  app.use('/api/auth', mockAuthRouter);

  // Room REST APIs
  app.get('/api/rooms', (req: Request, res: Response) => {
    const rooms = globalRoomManager.getPublicRooms();
    res.json({ rooms });
  });

  app.post('/api/rooms', createRoomLimiter, (req: Request, res: Response) => {
    const { title, hostUser, isPrivate } = req.body;

    if (!title || !hostUser?.channelId) {
      return res.status(400).json({ error: '룸 제목과 호스트 사용자 정보가 필요합니다.' });
    }

    const room = globalRoomManager.createRoom({
      title,
      hostUser,
      isPrivate: !!isPrivate,
    });

    res.json({ success: true, room });
  });

  app.get('/api/rooms/:id', (req: Request, res: Response) => {
    const room = globalRoomManager.getRoom(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '룸을 찾을 수 없습니다.' });
    }

    res.json({ room });
  });

  // Serve frontend static build in production with optimal caching headers
  const possibleDistPaths = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
  ];
  const clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

  if (clientDistPath) {
    app.use(
      express.static(clientDistPath, {
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
          // HTML files should never be cached so users always receive latest releases
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      const indexPath = path.join(clientDistPath, 'index.html');

      // Dynamic OpenGraph injection for shared room links (e.g. /room/abc123)
      if (req.path.startsWith('/room/')) {
        const roomId = req.path.replace('/room/', '').split('/')[0].split('?')[0];
        const room = globalRoomManager.getRoom(roomId);
        if (room) {
          try {
            let html = fs.readFileSync(indexPath, 'utf-8');
            const roomTitle = `${room.title} - 치즈룸`;
            const currentTitle = room.currentVideo?.title ? `현재 재생: ${room.currentVideo.title}` : '실시간 영상 같이보기';
            const roomDesc = `${currentTitle} | 참가자 ${room.members.length}명과 함께 시청 중`;
            const roomThumb = room.currentVideo?.thumbnailUrl || '/og-image.png';

            html = html
              .replace(/<title>.*?<\/title>/, `<title>${roomTitle}</title>`)
              .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${roomTitle}" />`)
              .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${roomDesc}" />`)
              .replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${roomThumb}" />`)
              .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${roomTitle}" />`)
              .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${roomDesc}" />`)
              .replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${roomThumb}" />`);

            return res.send(html);
          } catch (err) {
            // Fallback to static sendFile on any error
          }
        }
      }

      res.sendFile(indexPath);
    });
  }

  // 5. Global Express Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`[Express] Unhandled error on ${req.method} ${req.originalUrl}:`, err?.stack || err?.message || err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
