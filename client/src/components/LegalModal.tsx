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
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          maxHeight: '85vh',
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
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface-dark-alt)',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setActiveTab('privacy')}
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'privacy' ? 'var(--brand-green-glow)' : 'transparent',
                color: activeTab === 'privacy' ? 'var(--brand-green)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <ShieldCheck size={15} />
              <span>개인정보 처리방침</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'terms' ? 'var(--brand-green-glow)' : 'transparent',
                color: activeTab === 'terms' ? 'var(--brand-green)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={15} />
              <span>서비스 이용약관</span>
            </button>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            style={{ width: 30, height: 30 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
          }}
        >
          {activeTab === 'privacy' ? (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                개인정보 처리방침
              </h3>
              <p style={{ marginBottom: 14 }}>
                치즈룸(이하 "서비스")은 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 14, marginBottom: 6 }}>
                1. 수집하는 개인정보 항목 및 수집 방법
              </h4>
              <ul style={{ paddingLeft: 18, marginBottom: 14 }}>
                <li><strong>수집 항목:</strong> 네이버 치지직(CHZZK) 채널 ID (UID), 채널 닉네임, 인증 마크 유무</li>
                <li><strong>수집 방법:</strong> 네이버 치지직 공식 OAuth 2.0 계정 연동을 통한 자동 수집</li>
              </ul>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 14, marginBottom: 6 }}>
                2. 개인정보의 수집 및 이용 목적
              </h4>
              <ul style={{ paddingLeft: 18, marginBottom: 14 }}>
                <li>동시 시청 방(Room) 생성 및 어드민 / 매니저 / 시청자 권한 식별</li>
                <li>대기열 영상 등록자 표기 및 방 내 참가자 목록 식별</li>
              </ul>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 14, marginBottom: 6 }}>
                3. 개인정보의 보유 및 이용 기간
              </h4>
              <p style={{ marginBottom: 14 }}>
                이용자의 로그인 세션 정보는 브라우저 이용 및 방 퇴장 시까지 유지되며, 로그아웃 시 브라우저 내에서 즉시 파기됩니다.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 14, marginBottom: 6 }}>
                4. 제3자 제공 및 위탁
              </h4>
              <p style={{ marginBottom: 14 }}>
                서비스는 이용자의 개인정보를 외부에 제공하거나 위탁하지 않습니다.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 14, marginBottom: 6 }}>
                5. 개인정보 보호책임자 및 문의
              </h4>
              <p style={{ marginBottom: 8 }}>
                개인정보 보호 및 서비스 관련 문의는 아래 연락처로 접수해 주시기 바랍니다.
              </p>
              <div
                style={{
                  backgroundColor: 'var(--surface-dark-alt)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                관리자: 치즈룸 운영팀 (chz-room)
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                서비스 이용약관
              </h3>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 14, marginBottom: 6 }}>
                제1조 (목적)
              </h4>
              <p style={{ marginBottom: 14 }}>
                본 약관은 치즈룸(이하 "서비스")이 제공하는 유튜브 동시 시청 및 소통 기능의 이용에 관한 권리와 의무를 규정함을 목적으로 합니다.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 14, marginBottom: 6 }}>
                제2조 (비공식 서드파티 서비스 고지)
              </h4>
              <p style={{ marginBottom: 14 }}>
                본 서비스는 네이버(NAVER Corp.), 치지직(CHZZK), 및 구글(Google LLC / YouTube)과 공식적인 제휴 관계가 없는 비공식 팬/서드파티 프로젝트입니다.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 14, marginBottom: 6 }}>
                제3조 (콘텐츠 및 저작권)
              </h4>
              <ul style={{ paddingLeft: 18, marginBottom: 14 }}>
                <li>서비스 내에서 재생되는 모든 동영상 콘텐츠의 저작권 및 권리는 YouTube 및 해당 영상의 원저작자에게 귀속됩니다.</li>
                <li>본 서비스는 YouTube IFrame API를 통한 임베드 스트리밍 기술만을 활용하며, 영상을 서버에 직접 저장하거나 다운로드하지 않습니다.</li>
              </ul>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 14, marginBottom: 6 }}>
                제4조 (이용자의 의무 및 금지행위)
              </h4>
              <p style={{ marginBottom: 14 }}>
                이용자는 타인의 권리를 침해하거나, 불법/유해한 영상 링크를 대기열에 고의로 등록하여 다른 참가자에게 피해를 주는 행위를 하여서는 안 됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 20px',
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
