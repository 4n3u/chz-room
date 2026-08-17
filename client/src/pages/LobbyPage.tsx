import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MockLoginModal } from '../components/MockLoginModal';
import {
  Plus,
  Link,
  Share2,
  Tv,
  ArrowRight,
  Radio,
} from 'lucide-react';

interface LobbyPageProps {
  onJoinRoom: (roomId: string) => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({ onJoinRoom }) => {
  const { user } = useAuth();
  const [roomTitle, setRoomTitle] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMockLoginModal, setShowMockLoginModal] = useState(false);

  const handleCreateRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user) {
      setShowMockLoginModal(true);
      return;
    }

    setLoading(true);
    setError(null);

    const title = roomTitle.trim() || `${user.channelName}님의 치즈룸`;

    try {
      const res = await axios.post(
        '/api/rooms',
        {
          title,
          hostUser: user,
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data?.room) {
        onJoinRoom(res.data.room.id);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || '방 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;

    let code = roomCodeInput.trim();
    // If full URL was pasted, extract room ID
    if (code.includes('/room/')) {
      const parts = code.split('/room/');
      code = parts[1].split('?')[0].split('#')[0];
    }

    onJoinRoom(code);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>
      {/* Hero Header */}
      <section style={{ textAlign: 'center', marginBottom: 48 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(0, 255, 163, 0.12)',
            border: '1px solid rgba(0, 255, 163, 0.3)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--brand-green)',
            marginBottom: 16,
          }}
        >
          <span>CHZ-ROOM</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 900,
            letterSpacing: '-1.5px',
            marginBottom: 18,
            color: '#ffffff',
            lineHeight: 1.15,
          }}
        >
          치지직 유저들을 위한 <br />
          <span style={{ color: 'var(--brand-green)' }}>실시간 유튜브 동시 시청</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(15px, 2vw, 17px)',
            color: 'var(--text-muted)',
            maxWidth: 580,
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          방을 만들면 고유 링크가 생성됩니다. 링크를 공유받은 유저들과 유튜브 영상을 등록하고 완벽하게 동기화된 화면으로 함께 시청하세요.
        </p>
      </section>

      {/* Main Action Card: Create Room Form */}
      <div
        style={{
          backgroundColor: 'var(--surface-dark)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-card)',
          marginBottom: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #00ffa3, #00b374)',
          }}
        />

        {error && (
          <div
            style={{
              padding: '12px 16px',
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

        <form onSubmit={handleCreateRoom}>
          <label
            style={{
              display: 'block',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 10,
            }}
          >
            새 치즈룸 이름
          </label>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder={user ? `예: ${user.channelName}님의 유튜브 시청방` : '방 이름을 입력하세요 (미입력 시 자동생성)'}
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              style={{
                flex: 1,
                minWidth: 260,
                fontSize: 15,
                padding: '14px 18px',
                backgroundColor: 'var(--surface-dark-alt)',
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ fontSize: 16, padding: '14px 28px' }}
            >
              <Plus size={20} />
              <span>{loading ? '생성 중...' : '치즈룸 만들기'}</span>
            </button>
          </div>
        </form>

        {/* Or Join with Link / Code */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            margin: '28px 0 20px 0',
          }}
        >
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>
            또는 기존 링크로 입장
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Link
              size={16}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="text"
              placeholder="방 코드 또는 전체 초대 URL 붙여넣기..."
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 38,
                fontSize: 14,
                backgroundColor: 'var(--surface-dark-alt)',
              }}
            />
          </div>
          <button
            type="submit"
            className="btn-secondary"
            disabled={!roomCodeInput.trim()}
            style={{ fontSize: 14, padding: '10px 20px' }}
          >
            <span>입장하기</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>

      {/* How it works Section (Sync-tube style) */}
      <section>
        <h3 style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 24, color: 'var(--text-secondary)' }}>
          치즈룸 이용 방법
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-dark)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 20px',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(0, 255, 163, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Tv size={22} color="var(--brand-green)" />
            </div>
            <h4 style={{ fontSize: 16, marginBottom: 8 }}>1. 치즈룸 생성</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              방 이름을 입력하고 버튼을 클릭하면 고유한 방 주소가 즉시 발급됩니다.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-dark)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 20px',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(58, 134, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Share2 size={22} color="var(--accent-blue)" />
            </div>
            <h4 style={{ fontSize: 16, marginBottom: 8 }}>2. 초대 링크 공유</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              발급된 고유 URL을 복사하여 다른 치지직 유저들에게 공유하세요.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-dark)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 20px',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 190, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Radio size={22} color="var(--accent-gold)" />
            </div>
            <h4 style={{ fontSize: 16, marginBottom: 8 }}>3. 실시간 동시 시청</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              누구나 유튜브 URL을 대기열에 등록하고, 관리자가 영상을 넘기며 완벽한 싱크로 시청합니다.
            </p>
          </div>
        </div>
      </section>

      <MockLoginModal
        isOpen={showMockLoginModal}
        onClose={() => {
          setShowMockLoginModal(false);
          handleCreateRoom();
        }}
      />
    </div>
  );
};
