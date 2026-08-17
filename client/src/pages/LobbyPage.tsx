import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { MockLoginModal } from '../components/MockLoginModal';
import { PublicRoomSummary } from '../types';
import {
  Plus,
  Users,
  Play,
  Tv,
  Sparkles,
  RefreshCw,
  Search,
  ArrowRight,
} from 'lucide-react';

interface LobbyPageProps {
  onJoinRoom: (roomId: string) => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({ onJoinRoom }) => {
  const { user, loginWithChzzk } = useAuth();
  const [rooms, setRooms] = useState<PublicRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMockLoginModal, setShowMockLoginModal] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/rooms');
      setRooms(res.data?.rooms || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoomClick = () => {
    if (!user) {
      setShowMockLoginModal(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.hostName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(180deg, rgba(0, 255, 163, 0.08) 0%, rgba(20, 21, 23, 0) 100%)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '48px 32px',
          textAlign: 'center',
          marginBottom: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
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
          <Sparkles size={14} />
          <span>CHZZK X YOUTUBE SYNC</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 900,
            letterSpacing: '-1px',
            marginBottom: 16,
            color: '#ffffff',
          }}
        >
          치지직 유저들과 <span style={{ color: 'var(--brand-green)' }}>실시간 유튜브</span> 함께보기
        </h1>

        <p
          style={{
            fontSize: 'clamp(14px, 1.8vw, 16px)',
            color: 'var(--text-muted)',
            maxWidth: 620,
            margin: '0 auto 32px auto',
            lineHeight: 1.6,
          }}
        >
          치지직 계정으로 방을 만들고, 친구 및 시청자들과 유튜브 링크를 등록해 완벽하게 동기화된 화면으로 함께 감상하세요.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={handleCreateRoomClick}
            style={{ fontSize: 16, padding: '14px 28px' }}
          >
            <Plus size={20} />
            <span>새 시청 방 만들기</span>
          </button>
          {!user && (
            <button
              className="btn-secondary"
              onClick={loginWithChzzk}
              style={{ fontSize: 16, padding: '14px 24px' }}
            >
              <span>치지직 계정 연동</span>
            </button>
          )}
        </div>
      </section>

      {/* Rooms Explorer Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tv size={22} color="var(--brand-green)" />
          <h2 style={{ fontSize: 22 }}>실시간 공개 방</h2>
          <span
            style={{
              backgroundColor: 'var(--surface-dark-alt)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
            }}
          >
            {rooms.length}개
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: 240 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="text"
              placeholder="방 제목 또는 방장 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 36, width: '100%', fontSize: 13 }}
            />
          </div>

          <button
            className="btn-icon"
            onClick={fetchRooms}
            title="새로고침"
            style={{ width: 40, height: 40 }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--surface-dark)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'var(--surface-dark-alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <Play size={24} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 8 }}>
            현재 진행 중인 방이 없습니다
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 20 }}>
            새로운 방을 생성하고 유튜브 영상을 등록해 가장 먼저 시청을 시작해보세요!
          </p>
          <button className="btn-primary" onClick={handleCreateRoomClick}>
            <Plus size={16} />
            <span>첫 번째 방 만들기</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onJoinRoom(room.id)}
              style={{
                backgroundColor: 'var(--surface-dark)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-green)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 255, 163, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Thumbnail preview */}
              <div
                style={{
                  height: 180,
                  backgroundColor: 'var(--surface-dark-alt)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {room.currentVideoThumbnail ? (
                  <img
                    src={room.currentVideoThumbnail}
                    alt={room.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                    <Play size={36} style={{ marginBottom: 6, opacity: 0.4 }} />
                    <p style={{ fontSize: 12 }}>재생 준비 중</p>
                  </div>
                )}

                {/* Viewers badge overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: 'var(--brand-green)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    border: '1px solid rgba(0, 255, 163, 0.2)',
                  }}
                >
                  <Users size={13} />
                  <span>{room.memberCount}명 시청 중</span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: 18 }}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-primary)',
                  }}
                >
                  {room.title}
                </h3>

                {room.currentVideoTitle && (
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      marginBottom: 14,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Play size={12} color="var(--brand-green)" />
                    <span>{room.currentVideoTitle}</span>
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--surface-dark-subtle)',
                    paddingTop: 12,
                    marginTop: 4,
                  }}
                >
                  {/* Host info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {room.hostAvatar ? (
                      <img
                        src={room.hostAvatar}
                        alt={room.hostName}
                        style={{ width: 22, height: 22, borderRadius: '50%' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: 'var(--surface-dark-alt)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        👑
                      </div>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {room.hostName}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--brand-green)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    입장하기 <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={(roomId) => onJoinRoom(roomId)}
      />
      <MockLoginModal
        isOpen={showMockLoginModal}
        onClose={() => {
          setShowMockLoginModal(false);
          setShowCreateModal(true);
        }}
      />
    </div>
  );
};
