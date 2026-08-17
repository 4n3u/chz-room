import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockLoginModal } from './MockLoginModal';
import { LogOut, User, Sparkles, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onGoHome }) => {
  const { user, loginWithChzzk, logout } = useAuth();
  const [showMockModal, setShowMockModal] = useState(false);

  return (
    <>
      <header
        style={{
          height: 64,
          backgroundColor: 'var(--surface-dark)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={onGoHome}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #00ffa3, #00b374)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              color: '#000000',
              fontSize: 17,
            }}
          >
            CH
          </div>
          <div className="chzzk-brand">
            <span>CHZZK</span>
            <span className="neon-tag">SYNC-TUBE</span>
          </div>
        </div>

        {/* User Auth Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'var(--surface-dark-alt)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {user.channelImageUrl ? (
                  <img
                    src={user.channelImageUrl}
                    alt={user.channelName}
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: 'var(--surface-dark-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User size={14} color="var(--brand-green)" />
                  </div>
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user.channelName}
                </span>
                {user.verifiedMark && (
                  <CheckCircle2 size={14} color="var(--brand-green)" fill="var(--brand-green)" />
                )}
              </div>

              <button
                className="btn-icon"
                onClick={logout}
                title="로그아웃"
                style={{ width: 36, height: 36 }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn-secondary"
                onClick={() => setShowMockModal(true)}
                style={{ fontSize: 13, padding: '7px 12px' }}
              >
                <Sparkles size={14} color="var(--brand-green)" />
                <span>간편 테스트 로그인</span>
              </button>
              <button
                className="btn-primary"
                onClick={loginWithChzzk}
                style={{ fontSize: 13, padding: '7px 16px' }}
              >
                <span>치지직 로그인</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <MockLoginModal isOpen={showMockModal} onClose={() => setShowMockModal(false)} />
    </>
  );
};
