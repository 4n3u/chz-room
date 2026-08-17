import React, { useState } from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          backgroundColor: 'var(--surface-dark)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Segmented Tabs */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface-dark-alt)',
          }}
        >
          {/* Segmented Tab */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--surface-dark)',
              padding: 3,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              gap: 3,
            }}
          >
            <button
              onClick={() => setActiveTab('privacy')}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'privacy' ? 'var(--brand-green)' : 'transparent',
                color: activeTab === 'privacy' ? 'var(--text-on-brand)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <ShieldCheck size={14} />
              <span>개인정보 처리방침</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'terms' ? 'var(--brand-green)' : 'transparent',
                color: activeTab === 'terms' ? 'var(--text-on-brand)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={14} />
              <span>서비스 이용약관</span>
            </button>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            style={{ width: 28, height: 28 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Concise Content Body */}
        <div style={{ padding: '18px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
          {activeTab === 'privacy' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  backgroundColor: 'var(--surface-dark-alt)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}
              >
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: 13 }}>
                  📌 수집하는 항목
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  네이버 치지직 공식 계정 연동을 통해 <strong>채널 ID (UID), 닉네임, 인증 마크</strong>만 수집합니다. 비밀번호나 민감 정보는 절대 수집하지 않습니다.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--surface-dark-alt)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}
              >
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: 13 }}>
                  🎯 이용 목적 및 보유 기간
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  방 생성자/매니저 권한 식별과 대기열 등록자 표기에만 사용되며, <strong>로그아웃 또는 방 퇴장 시 세션 정보가 즉시 파기</strong>됩니다.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--surface-dark-alt)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}
              >
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: 13 }}>
                  🔒 제3자 제공
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  이용자의 개인정보를 외부 제3자에게 절대 제공하거나 위탁하지 않습니다.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  backgroundColor: 'var(--surface-dark-alt)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}
              >
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: 13 }}>
                  💡 비공식 팬 프로젝트
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  치즈룸(chz-room)은 NAVER 치지직 및 YouTube(Google LLC)와 공식 제휴 관계가 없는 비공식 동시시청 도구입니다.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--surface-dark-alt)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}
              >
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: 13 }}>
                  🎬 콘텐츠 및 저작권
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  재생되는 모든 영상의 저작권은 <strong>원작작자 및 YouTube</strong>에 있으며, 본 서비스는 YouTube 공식 IFrame API 스트리밍 기능만을 중계합니다.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--surface-dark-alt)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}
              >
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: 13 }}>
                  🚫 이용자 준수사항
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  타인에게 불쾌감을 주거나 불법/유해한 영상을 고의로 등록하는 행위는 엄격히 금지됩니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--surface-dark-alt)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            className="btn-primary"
            onClick={onClose}
            style={{ padding: '5px 14px', fontSize: 12 }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
