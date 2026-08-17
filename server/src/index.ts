import http from 'http';
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
registerSyncHandlers(io, globalRoomManager);

httpServer.listen(PORT, () => {
  logger.info(`Server started successfully on port ${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
});
