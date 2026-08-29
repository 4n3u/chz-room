import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MockLoginModal } from '../components/MockLoginModal';
import { Plus, ArrowRight, Link } from 'lucide-react';

interface LobbyPageProps {
  onJoinRoom: (roomId: string) => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({ onJoinRoom }) => {
  const { user, loginWithChzzk } = useAuth();
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMockLoginModal, setShowMockLoginModal] = useState(false);
  const isDev = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';

  // 1-Click Instant Room Creation
  const handleCreateRoom = async () => {
    if (!user) {
      if (isDev) {
        setShowMockLoginModal(true);
      } else {
        loginWithChzzk();
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        '/api/rooms',
        {
          title: `${user.channelName}님의 치즈룸`,
          hostUser: user,
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data?.room) {
        onJoinRoom(res.data.room.id);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || '치즈룸 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Join by Link / Code
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;

    let code = roomCodeInput.trim();
    if (code.includes('/room/')) {
      const parts = code.split('/room/');
      code = parts[1].split('?')[0].split('#')[0];
    }

    onJoinRoom(code);
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 88px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 420, width: '100%' }}>
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(255, 75, 75, 0.15)',
              border: '1px solid rgba(255, 75, 75, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-red)',
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* 1. Create Room Button */}
        <button
          className="btn-primary"
          onClick={handleCreateRoom}
          disabled={loading}
          style={{
            width: '100%',
            height: 52,
            fontSize: 16,
            fontWeight: 800,
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
          }}
        >
          <Plus size={20} />
          <span>{loading ? '생성 중...' : '치즈룸 생성'}</span>
        </button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            margin: '8px 0 20px 0',
          }}
        >
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>또는</span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
        </div>

        {/* 2. Join Room Input & Button */}
        <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Link
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
              }}
            />
            <input
              type="text"
              placeholder="룸 코드 또는 초대 링크..."
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              style={{
                width: '100%',
                height: 46,
                paddingLeft: 38,
                fontSize: 14,
                backgroundColor: 'var(--surface-dark)',
              }}
            />
          </div>
          <button
            type="submit"
            className="btn-secondary"
            disabled={!roomCodeInput.trim()}
            style={{
              height: 46,
              padding: '0 20px',
              fontSize: 14,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <span>참여</span>
            <ArrowRight size={15} />
          </button>
        </form>
      </div>

      {isDev && (
        <MockLoginModal
          isOpen={showMockLoginModal}
          onClose={() => {
            setShowMockLoginModal(false);
            handleCreateRoom();
          }}
        />
      )}
    </div>
  );
};
