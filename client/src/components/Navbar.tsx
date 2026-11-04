import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MockLoginModal } from './MockLoginModal';
import { LogOut, ChevronDown, CheckCircle2, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onGoHome }) => {
  const { user, loginWithChzzk, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showMockModal, setShowMockModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header
        style={{
          height: 56,
          backgroundColor: 'var(--surface-dark)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Logo with icon.svg */}
        <div
          onClick={onGoHome}
          style={{
            cursor: 'pointer',
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            userSelect: 'none',
          }}
        >
          <img
            src="/icon.svg"
            alt="치즈룸 로고"
            style={{
              width: 18,
              height: 18,
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <span>치즈룸</span>
        </div>

        {/* Right Section: Auth & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Always visible Theme Toggle Button */}
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            aria-label="Toggle theme"
            style={{ width: 34, height: 34 }}
          >
            {theme === 'dark' ? (
              <Sun size={16} color="var(--brand-green)" />
            ) : (
              <Moon size={16} color="var(--text-secondary)" />
            )}
          </button>
          {user ? (
            /* Logged in: Profile Pill with Dropdown */
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: dropdownOpen ? 'var(--surface-dark-hover)' : 'var(--surface-dark-alt)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user.channelName}
                </span>

                {user.verifiedMark && (
                  <CheckCircle2 size={13} color="var(--brand-green)" fill="var(--brand-green)" />
                )}

                <ChevronDown
                  size={14}
                  color="var(--text-muted)"
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: 230,
                    maxWidth: 280,
                    backgroundColor: 'var(--surface-dark)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '6px',
                    zIndex: 1000,
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  {/* User Profile Info Header with Full UID */}
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 4,
                      }}
                    >
                      {user.channelName}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--text-dim)',
                        wordBreak: 'break-all',
                        lineHeight: 1.4,
                      }}
                    >
                      {user.channelId}
                    </p>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                      color: 'var(--accent-red)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 75, 75, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={14} />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in: Simple Login Buttons */
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true') && (
                <button
                  onClick={() => setShowMockModal(true)}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px 6px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                >
                  테스트 로그인
                </button>
              )}
              <button
                className="btn-primary"
                onClick={loginWithChzzk}
                style={{ fontSize: 13, padding: '6px 14px' }}
              >
                <span>치지직 로그인</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true') && (
        <MockLoginModal isOpen={showMockModal} onClose={() => setShowMockModal(false)} />
      )}
    </>
  );
};
