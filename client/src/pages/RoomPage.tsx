import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { QueuePanel } from '../components/QueuePanel';
import { MemberList } from '../components/MemberList';
import { MockLoginModal } from '../components/MockLoginModal';
import {
  ArrowLeft,
  Copy,
  Check,
  Crown,
  Shield,
  ListMusic,
  Users,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface RoomPageProps {
  roomId: string;
  onLeaveRoom: () => void;
}

export const RoomPage: React.FC<RoomPageProps> = ({ roomId, onLeaveRoom }) => {
  const { user, loginWithChzzk } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'members'>('queue');
  const [copied, setCopied] = useState(false);
  const [showMockLogin, setShowMockLogin] = useState(false);

  const {
    room,
    role,
    members,
    currentVideo,
    queue,
    playback,
    error,
    clearError,
    sendVideoControl,
    addToQueue,
    removeFromQueue,
    skipNext,
    updateRole,
  } = useSocket({ roomId, user });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '16px 24px' }}>
      {/* Top Room Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          padding: '12px 18px',
          backgroundColor: 'var(--surface-dark)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <button
            className="btn-icon"
            onClick={onLeaveRoom}
            title="로비로 돌아가기"
            style={{ width: 36, height: 36 }}
          >
            <ArrowLeft size={18} />
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {room?.title || '치즈룸'}
              </h2>

              {/* My Role Badge */}
              {user && (
                <div>
                  {role === 'host' && (
                    <span className="badge badge-host">
                      <Crown size={11} /> 방장
                    </span>
                  )}
                  {role === 'mod' && (
                    <span className="badge badge-mod">
                      <Shield size={11} /> 관리자
                    </span>
                  )}
                  {role === 'viewer' && (
                    <span className="badge badge-viewer">시청자</span>
                  )}
                </div>
              )}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              방 코드: {roomId}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={handleCopyLink}
            style={{ fontSize: 13, padding: '7px 14px' }}
          >
            {copied ? <Check size={14} color="var(--brand-green)" /> : <Copy size={14} />}
            <span>{copied ? '링크 복사됨!' : '초대 링크 복사'}</span>
          </button>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 75, 75, 0.15)',
            border: '1px solid rgba(255, 75, 75, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-red)',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={clearError} style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            닫기
          </button>
        </div>
      )}

      {/* Non-login Notice Banner */}
      {!user && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            backgroundColor: 'rgba(0, 255, 163, 0.08)',
            border: '1px solid rgba(0, 255, 163, 0.25)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} color="var(--brand-green)" />
            <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              로그인 후 시청자에 참여하고 유튜브 영상을 대기열에 등록해보세요!
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-secondary"
              onClick={() => setShowMockLogin(true)}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              간편 테스트 로그인
            </button>
            <button
              className="btn-primary"
              onClick={loginWithChzzk}
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              치지직 로그인
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: YouTube Player (Left/Center) + Right Sidebar (Queue & Members) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 380px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Left: YouTube Sync Player */}
        <div>
          <YouTubePlayer
            currentVideo={currentVideo}
            playback={playback}
            role={role}
            onVideoControl={sendVideoControl}
            onVideoEnded={skipNext}
          />
        </div>

        {/* Right: Sidebar Tabs */}
        <div style={{ height: 'calc(100vh - 180px)', minHeight: 480, display: 'flex', flexDirection: 'column' }}>
          {/* Tab Selector Buttons */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--surface-dark)',
              borderRadius: 'var(--radius-md)',
              padding: 4,
              border: '1px solid var(--border-color)',
              marginBottom: 12,
            }}
          >
            <button
              onClick={() => setActiveTab('queue')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 0',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 700,
                color: activeTab === 'queue' ? '#000000' : 'var(--text-muted)',
                backgroundColor: activeTab === 'queue' ? 'var(--brand-green)' : 'transparent',
              }}
            >
              <ListMusic size={15} />
              <span>대기열 ({queue.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 0',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 700,
                color: activeTab === 'members' ? '#000000' : 'var(--text-muted)',
                backgroundColor: activeTab === 'members' ? 'var(--brand-green)' : 'transparent',
              }}
            >
              <Users size={15} />
              <span>참가자 ({members.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {activeTab === 'queue' ? (
              <QueuePanel
                currentVideo={currentVideo}
                queue={queue}
                role={role}
                onAddToQueue={addToQueue}
                onRemoveFromQueue={removeFromQueue}
                onSkipNext={skipNext}
              />
            ) : (
              <MemberList
                members={members}
                myRole={role}
                myUserId={user?.channelId}
                onUpdateRole={updateRole}
              />
            )}
          </div>
        </div>
      </div>

      <MockLoginModal isOpen={showMockLogin} onClose={() => setShowMockLogin(false)} />
    </div>
  );
};
