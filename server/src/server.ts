import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import chzzkAuthRouter from './auth/chzzkAuth';
import mockAuthRouter from './auth/mockAuth';
import { globalRoomManager } from './rooms/RoomManager';

dotenv.config();

export function createApp(): Express {
  const app = express();

  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

  app.use(
    cors({
      origin: CLIENT_URL,
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
      return res.status(400).json({ error: '방 제목과 호스트 사용자 정보가 필요합니다.' });
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
      return res.status(404).json({ error: '방을 찾을 수 없습니다.' });
    }

    // Don't expose password in response
    const { password, ...safeRoom } = room;
    res.json({ room: safeRoom, hasPassword: !!password });
  });

  return app;
}
