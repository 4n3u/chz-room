import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from '../src/server';
import { registerSyncHandlers } from '../src/sockets/syncHandler';
import { globalRoomManager } from '../src/rooms/RoomManager';
import { ChzzkUser } from '../src/auth/types';
import { AddressInfo } from 'net';

describe('Socket.io Realtime Sync Integration Tests', () => {
  let httpServer: http.Server;
  let ioServer: SocketIOServer;
  let serverPort: number;

  const hostUser: ChzzkUser = {
    channelId: 'host-ch-1',
    channelName: '방장',
  };

  const viewerUser: ChzzkUser = {
    channelId: 'viewer-ch-2',
    channelName: '시청자',
  };

  beforeAll(async () => {
    const app = createApp();
    httpServer = http.createServer(app);
    ioServer = new SocketIOServer(httpServer, {
      cors: { origin: '*' },
    });

    registerSyncHandlers(ioServer, globalRoomManager);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        serverPort = (httpServer.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    ioServer.close();
    httpServer.close();
  });

  it('should join room and synchronize video control between host and viewer', async () => {
    // 1. Create Room
    const room = globalRoomManager.createRoom({
      title: '싱크 테스트 룸',
      hostUser,
    });

    const hostSocket: ClientSocket = Client(`http://localhost:${serverPort}`);
    const viewerSocket: ClientSocket = Client(`http://localhost:${serverPort}`);

    await new Promise<void>((resolve) => {
      let connected = 0;
      const check = () => {
        connected++;
        if (connected === 2) resolve();
      };
      hostSocket.on('connect', check);
      viewerSocket.on('connect', check);
    });

    // 2. Host joins room
    const hostJoined = await new Promise<any>((resolve) => {
      hostSocket.emit('room:join', { roomId: room.id, user: hostUser }, (res: any) => {
        resolve(res);
      });
    });
    expect(hostJoined.success).toBe(true);
    expect(hostJoined.role).toBe('host');

    // 3. Viewer joins room
    const viewerJoined = await new Promise<any>((resolve) => {
      viewerSocket.emit('room:join', { roomId: room.id, user: viewerUser }, (res: any) => {
        resolve(res);
      });
    });
    expect(viewerJoined.success).toBe(true);
    expect(viewerJoined.role).toBe('viewer');

    // 4. Viewer adds video to queue with callback acknowledgement
    const addResult = await new Promise<any>((resolve) => {
      viewerSocket.emit(
        'queue:add',
        {
          roomId: room.id,
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          user: viewerUser,
        },
        (res: any) => {
          resolve(res);
        }
      );
    });

    expect(addResult.success).toBe(true);

    // Give a tiny tick for any initial queue:add sync to clear
    await new Promise((r) => setTimeout(r, 50));

    // 5. Host controls playback (play / seek) -> Viewer receives video:sync
    const videoSyncPromise = new Promise<any>((resolve) => {
      viewerSocket.once('video:sync', (data) => {
        resolve(data);
      });
    });

    hostSocket.emit('video:control', {
      roomId: room.id,
      user: hostUser,
      isPlaying: true,
      currentTime: 45.5,
      playbackRate: 1,
    });

    const syncData = await videoSyncPromise;
    expect(syncData.isPlaying).toBe(true);
    expect(syncData.currentTime).toBe(45.5);

    // 6. Viewer attempts to control playback -> should receive error
    const viewerControlErrorPromise = new Promise<any>((resolve) => {
      viewerSocket.emit(
        'video:control',
        {
          roomId: room.id,
          user: viewerUser,
          isPlaying: false,
          currentTime: 10,
          playbackRate: 1,
        },
        (res: any) => {
          resolve(res);
        }
      );
    });

    const errorRes = await viewerControlErrorPromise;
    expect(errorRes?.error).toBeDefined();

    hostSocket.disconnect();
    viewerSocket.disconnect();
  });
});
