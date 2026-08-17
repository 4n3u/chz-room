import http from 'http';
import { createApp } from './server';
import { Server as SocketIOServer } from 'socket.io';

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = createApp();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// Socket server will be connected to syncHandler in Task 4
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Chzzk Sync-Tube Server running at http://localhost:${PORT}`);
});
