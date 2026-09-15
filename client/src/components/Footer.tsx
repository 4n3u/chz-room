import React, { useState } from 'react';
import { LegalModal } from './LegalModal';

export const Footer: React.FC = () => {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<'privacy' | 'terms'>('privacy');

  const openPrivacy = (e: React.MouseEvent) => {
    e.preventDefault();
    setInitialTab('privacy');
    setLegalModalOpen(true);
  };

  const openTerms = (e: React.MouseEvent) => {
    e.preventDefault();
    setInitialTab('terms');
    setLegalModalOpen(true);
  };

  return (
    <>
      <footer
        style={{
          height: 32,
          minHeight: 32,
          maxHeight: 32,
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--surface-dark)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-dim)',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
          flexShrink: 0,
          zIndex: 50,
        }}
      >
        {/* Left: Brand & Legal Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
            치즈룸
          </span>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <button
            onClick={openPrivacy}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 11,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-green)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            개인정보 처리방침
          </button>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <button
            onClick={openTerms}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 11,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-green)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            서비스 이용약관
          </button>
        </div>

        {/* Right: Disclaimer & GitHub */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
            NAVER 치지직 & YouTube 비공식 서드파티
          </span>
          <a
            href="https://github.com/4n3u/chz-room"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            style={{
              color: 'var(--text-dim)',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </footer>

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={initialTab}
      />
    </>
  );
};
