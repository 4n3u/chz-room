import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import chzzkAuthRouter from './auth/chzzkAuth';
import mockAuthRouter from './auth/mockAuth';

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
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Auth routers
  app.use('/api/auth/chzzk', chzzkAuthRouter);
  app.use('/api/auth', mockAuthRouter);

  return app;
}
