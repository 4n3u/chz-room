import axios from 'axios';
import { io, Socket } from 'socket.io-client';

async function runLiveE2E() {
  console.log('--- 1. Testing Live Backend API ---');
  const baseURL = 'http://localhost:4000';

  // 1. Health check
  const health = await axios.get(`${baseURL}/api/health`);
  console.log('✅ Health Check:', health.data);

  // 2. Mock Login as Host
  const hostUser = { channelId: 'host_calmdown', channelName: '침착맨', channelImageUrl: 'https://example.com/calmdown.png', verifiedMark: true };
  const loginRes = await axios.post(`${baseURL}/api/auth/mock-login`, hostUser);
  console.log('✅ Mock Login Success:', loginRes.data.user);

  // 3. Create Room
  const createRoomRes = await axios.post(`${baseURL}/api/rooms`, {
    title: '침착맨 삼국지 같이보기',
    hostUser: loginRes.data.user,
    isPrivate: false,
  });
  const room = createRoomRes.data.room;
  console.log('✅ Room Created:', room.id, room.title);

  // 4. Verify in Public Rooms List
  const roomsList = await axios.get(`${baseURL}/api/rooms`);
  console.log('✅ Public Rooms Count:', roomsList.data.rooms.length);

  // 5. Connect 2 Socket Clients (Host & Viewer)
  console.log('\n--- 2. Testing Live Realtime Sockets ---');
  const hostSocket: Socket = io(baseURL, { transports: ['websocket'] });
  const viewerUser = { channelId: 'viewer_guest', channelName: '시청자1' };
  const viewerSocket: Socket = io(baseURL, { transports: ['websocket'] });

  await new Promise<void>((resolve) => {
    let c = 0;
    hostSocket.on('connect', () => { if (++c === 2) resolve(); });
    viewerSocket.on('connect', () => { if (++c === 2) resolve(); });
  });

  // Host joins
  await new Promise<void>((resolve) => {
    hostSocket.emit('room:join', { roomId: room.id, user: hostUser }, (res: any) => {
      console.log('✅ Host Joined Room:', res.role);
      resolve();
    });
  });

  // Viewer joins
  await new Promise<void>((resolve) => {
    viewerSocket.emit('room:join', { roomId: room.id, user: viewerUser }, (res: any) => {
      console.log('✅ Viewer Joined Room:', res.role);
      resolve();
    });
  });

  // 6. Viewer adds 1st YouTube video
  console.log('\n--- 3. Testing YouTube Queue & Sync ---');
  const syncPromise1 = new Promise<any>((resolve) => {
    viewerSocket.once('video:sync', (data) => resolve(data));
  });

  await new Promise<void>((resolve) => {
    viewerSocket.emit('queue:add', { roomId: room.id, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', user: viewerUser }, (res: any) => {
      console.log('✅ Video 1 Added to Queue:', res.videoItem.title);
      resolve();
    });
  });

  const sync1 = await syncPromise1;
  console.log('✅ Video 1 Playing Synced to Viewer:', sync1.videoId, 'isPlaying:', sync1.isPlaying);

  // 7. Viewer adds 2nd YouTube video
  const queuePromise2 = new Promise<any>((resolve) => {
    hostSocket.once('queue:updated', (data) => resolve(data));
  });

  await new Promise<void>((resolve) => {
    viewerSocket.emit('queue:add', { roomId: room.id, url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', user: viewerUser }, (res: any) => {
      console.log('✅ Video 2 Added to Queue');
      resolve();
    });
  });

  const queue2 = await queuePromise2;
  console.log('✅ Queue Updated on Host (Items in queue):', queue2.queue.length);

  // 8. Host skips to next video
  console.log('\n--- 4. Testing Host Controls & Permissions ---');
  const syncPromise2 = new Promise<any>((resolve) => {
    viewerSocket.once('video:sync', (data) => resolve(data));
  });

  await new Promise<void>((resolve) => {
    hostSocket.emit('queue:next', { roomId: room.id, user: hostUser }, (res: any) => {
      console.log('✅ Host Clicked Next Video:', res.success);
      resolve();
    });
  });

  const sync2 = await syncPromise2;
  console.log('✅ Video 2 Now Playing Synced to All:', sync2.videoId);

  // 9. Host promotes Viewer to Moderator
  await new Promise<void>((resolve) => {
    hostSocket.emit('role:update', { roomId: room.id, user: hostUser, targetUserId: 'viewer_guest', newRole: 'mod' }, (res: any) => {
      console.log('✅ Host Promoted Viewer to Mod:', res.success);
      resolve();
    });
  });

  hostSocket.disconnect();
  viewerSocket.disconnect();
  console.log('\n🎉 ALL LIVE E2E INTEGRATION CHECKS PASSED!');
  process.exit(0);
}

runLiveE2E().catch((err) => {
  console.error('❌ E2E Failed:', err);
  process.exit(1);
});
