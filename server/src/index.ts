import http from 'http';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });
dotenv.config();

import { createApp } from './server';
import { Server as SocketIOServer } from 'socket.io';
import { globalRoomManager } from './rooms/RoomManager';
import { registerSyncHandlers } from './sockets/syncHandler';
import { logger } from './utils/logger';

// Process-level crash prevention and logging
process.on('unhandledRejection', (reason: any) => {
  logger.error('[Process] Unhandled Promise Rejection:', reason?.stack || reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('[Process] Uncaught Exception:', error?.stack || error?.message);
});

const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || (isProduction ? true : 'http://localhost:5173');

const app = createApp();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CLIENT_URL === 'true' || CLIENT_URL === true ? true : (CLIENT_URL as any),
    credentials: true,
  },
});

// Register real-time sync socket handlers
const cleanupSyncHandlers = registerSyncHandlers(io, globalRoomManager);

const server = httpServer.listen(PORT, () => {
  logger.info(`Server started successfully on port ${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
});

// Graceful Shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`[Process] ${signal} signal received. Starting graceful shutdown...`);

  cleanupSyncHandlers();
  globalRoomManager.destroy();

  io.close(() => {
    logger.info('[Socket.io] All socket connections closed.');
  });

  server.close(() => {
    logger.info('[HTTP] HTTP server closed gracefully.');
    process.exit(0);
  });

  // Force close if graceful shutdown takes too long (10s)
  setTimeout(() => {
    logger.error('[Process] Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
