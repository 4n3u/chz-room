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

        {/* Right: Disclaimer */}
        <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
          NAVER 치지직 & YouTube 비공식 서드파티
        </span>
      </footer>

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={initialTab}
      />
    </>
  );
};
