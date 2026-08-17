import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LobbyPage } from './pages/LobbyPage';
import { RoomPage } from './pages/RoomPage';

export function App() {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(() => {
    // Check initial pathname or hash
    const path = window.location.pathname;
    const match = path.match(/\/room\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    const hash = window.location.hash;
    const hashMatch = hash.match(/#room\/([a-zA-Z0-9_-]+)/);
    if (hashMatch && hashMatch[1]) {
      return hashMatch[1];
    }
    return null;
  });

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/\/room\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        setCurrentRoomId(match[1]);
      } else {
        setCurrentRoomId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleJoinRoom = (roomId: string) => {
    window.history.pushState({}, '', `/room/${roomId}`);
    setCurrentRoomId(roomId);
  };

  const handleLeaveRoom = () => {
    window.history.pushState({}, '', '/');
    setCurrentRoomId(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-black)' }}>
      <Navbar onGoHome={handleLeaveRoom} />
      <main style={{ flex: 1, width: '100%' }}>
        {currentRoomId ? (
          <RoomPage roomId={currentRoomId} onLeaveRoom={handleLeaveRoom} />
        ) : (
          <LobbyPage onJoinRoom={handleJoinRoom} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
