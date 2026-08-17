import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import chzzkAuthRouter from './auth/chzzkAuth';
import mockAuthRouter from './auth/mockAuth';
import { globalRoomManager } from './rooms/RoomManager';

dotenv.config();

export function createApp(): Express {
  const app = express();

  const isProduction = process.env.NODE_ENV === 'production';
  const CLIENT_URL = process.env.CLIENT_URL || (isProduction ? true : 'http://localhost:5173');

  app.use(
    cors({
      origin: CLIENT_URL === 'true' || CLIENT_URL === true ? true : (CLIENT_URL as any),
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

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

  app.post('/api/rooms', (req: Request, res: Response) => {
    const { title, hostUser, isPrivate, password } = req.body;

    if (!title || !hostUser?.channelId) {
      return res.status(400).json({ error: '룸 제목과 호스트 사용자 정보가 필요합니다.' });
    }

    const room = globalRoomManager.createRoom({
      title,
      hostUser,
      isPrivate: !!isPrivate,
      password: password || undefined,
    });

    res.json({ success: true, room });
  });

  app.get('/api/rooms/:id', (req: Request, res: Response) => {
    const room = globalRoomManager.getRoom(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '룸을 찾을 수 없습니다.' });
    }

    // Don't expose password in response
    const { password, ...safeRoom } = room;
    res.json({ room: safeRoom, hasPassword: !!password });
  });

  // Serve frontend static build in production (Single-process deployment)
  const possibleDistPaths = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
  ];
  const clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

  if (clientDistPath) {
    app.use(express.static(clientDistPath));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  return app;
}
