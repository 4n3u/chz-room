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
          maxWidth: 640,
          maxHeight: '82vh',
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
        {/* Header with Navigation Tabs */}
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
                padding: '6px 14px',
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
              <ShieldCheck size={16} />
              <span>개인정보 처리방침</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: '6px 14px',
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
              <FileText size={16} />
              <span>서비스 이용약관</span>
            </button>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            style={{ width: 30, height: 30 }}
            title="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* Legal Document Content Body */}
        <div
          style={{
            padding: '24px 24px',
            overflowY: 'auto',
            fontSize: 13,
            lineHeight: 1.75,
            color: 'var(--text-secondary)',
          }}
        >
          {activeTab === 'privacy' ? (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                개인정보 처리방침
              </h3>
              <p style={{ marginBottom: 20 }}>
                치즈룸(이하 "서비스")은 이용자의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다. 이에 「개인정보 보호법」 제30조에 따라 정보주체에게 개인정보 처리에 관한 절차 및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제1조 (수집하는 개인정보 항목 및 수집 방법)
              </h4>
              <p style={{ marginBottom: 8 }}>
                서비스는 네이버 치지직(CHZZK) 공식 OAuth 2.0 연동 기능을 통해 최소한의 식별 정보를 수집합니다.
              </p>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li><strong>수집 항목:</strong> 네이버 치지직 채널 ID (UID), 채널 닉네임, 인증 마크(verifiedMark) 여부</li>
                <li><strong>수집 방법:</strong> 이용자가 치지직 계정으로 로그인 시 네이버 치지직 공식 인증 API를 통해 연동 및 자동 수집</li>
                <li><strong>비수집 항목:</strong> 비밀번호, 주민등록번호, 연락처, 결제 정보 등 일체의 민감 정보는 수집하지 않습니다.</li>
              </ul>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제2조 (개인정보의 처리 목적)
              </h4>
              <p style={{ marginBottom: 8 }}>
                서비스는 수집한 개인정보를 다음의 목적을 위해서만 처리하며, 목적 이외의 용도로는 이용하지 않습니다.
              </p>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li>동시 시청 방(Room) 생성 및 방장(어드민), 매니저, 시청자 권한 식별 및 관리</li>
                <li>방 내 대기열 유튜브 영상 등록자 식별 및 참가자 목록 표기</li>
                <li>부정 이용 방지 및 서비스 운영 안정성 확보</li>
              </ul>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제3조 (개인정보의 보유 및 이용 기간)
              </h4>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li>이용자의 개인정보는 서비스 이용 기간(로그인 세션 유지 및 방 참여 기간) 동안에 한하여 보유 및 이용됩니다.</li>
                <li>이용자가 로그아웃하거나 브라우저 세션을 종료하면 브라우저 내의 인증 토큰 및 세션 정보는 즉시 파기됩니다.</li>
              </ul>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제4조 (개인정보의 제3자 제공 및 위탁)
              </h4>
              <p style={{ marginBottom: 16 }}>
                서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하거나 제3자에게 위탁하지 않습니다. 단, 법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우는 예외로 합니다.
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제5조 (정보주체의 권리·의무 및 행사방법)
              </h4>
              <p style={{ marginBottom: 16 }}>
                이용자는 언제든지 네이버 계정 관리 페이지에서 치지직 연동 권한을 철회하거나, 서비스 내 로그아웃을 통해 개인정보 이용 동의를 철회할 수 있습니다.
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제6조 (개인정보의 안전성 확보 조치)
              </h4>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li><strong>전송 구간 암호화:</strong> HTTPS 및 WSS 보안 프로토콜을 통하여 네트워크 상의 개인정보를 안전하게 송수신합니다.</li>
                <li><strong>최소 수집 원칙:</strong> 서비스 운영에 필요한 최소한의 식별자(채널 ID, 닉네임)만을 처리합니다.</li>
              </ul>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제7조 (개인정보 보호책임자 및 권익침해 구제)
              </h4>
              <p style={{ marginBottom: 8 }}>
                서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div
                style={{
                  backgroundColor: 'var(--surface-dark-alt)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  marginBottom: 16,
                  fontSize: 12,
                }}
              >
                <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: 'var(--text-primary)' }}>
                  개인정보 보호 책임자: 치즈룸(chz-room) 운영팀
                </p>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  문의: 서비스 GitHub 저장소 및 관리자 채널
                </p>
              </div>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제8조 (개인정보 처리방침의 변경)
              </h4>
              <p style={{ marginBottom: 10 }}>
                본 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 웹사이트 공지사항을 통하여 고지할 것입니다.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                공고일자: 2026년 8월 17일 / 시행일자: 2026년 8월 17일
              </p>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                서비스 이용약관
              </h3>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제1조 (목적)
              </h4>
              <p style={{ marginBottom: 16 }}>
                본 약관은 치즈룸(이하 "서비스")이 제공하는 실시간 유튜브 영상 동시 시청 및 소통 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제2조 (용어의 정의)
              </h4>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li>"서비스"란 이용자가 치지직 계정으로 로그인하여 유튜브 영상을 등록하고, 다른 이용자들과 실시간으로 재생 상태를 동기화하여 함께 시청할 수 있는 웹 기반 플랫폼을 의미합니다.</li>
                <li>"이용자"란 본 약관에 동의하고 서비스를 이용하는 참가자를 의미합니다.</li>
                <li>"어드민(Host)"이란 동시 시청 방을 최초 개설한 이용자로서, 영상 제어 권한 및 매니저 임명 권한을 갖는 자를 의미합니다.</li>
                <li>"매니저(Mod)"란 어드민으로부터 권한을 부여받아 영상 제어 및 대기열 관리를 보조하는 자를 의미합니다.</li>
              </ul>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제3조 (비공식 서드파티 서비스에 관한 명시)
              </h4>
              <p style={{ marginBottom: 16 }}>
                본 서비스는 네이버(NAVER Corp.), 치지직(CHZZK), 및 구글(Google LLC / YouTube)과 공식적인 제휴, 후원, 또는 보증 관계가 없는 비공식 서드파티 동시 시청 프로젝트입니다.
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제4조 (콘텐츠 및 지식재산권)
              </h4>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li>서비스 내에서 재생되는 모든 유튜브 동영상 콘텐츠의 저작권 및 지식재산권은 YouTube 및 해당 영상의 원저작자에게 귀속됩니다.</li>
                <li>본 서비스는 YouTube IFrame Player API 표준 스트리밍 기능만을 중계하며, 동영상 파일을 서버에 직접 저장, 복제, 또는 다운로드하지 않습니다.</li>
                <li>영상 재생 시 발생하는 모든 조회수 및 수익 창출은 YouTube 플랫폼의 원저작자에게 직접 귀속됩니다.</li>
              </ul>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제5조 (이용자의 의무 및 금지사항)
              </h4>
              <p style={{ marginBottom: 8 }}>
                이용자는 다음 각 호의 행위를 하여서는 안 됩니다.
              </p>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li>음란물, 불법 저작물, 혐오 및 폭력적 콘텐츠 등 관련 법령에 위배되는 유튜브 링크를 대기열에 등록하는 행위</li>
                <li>타인의 명예를 훼손하거나 권리를 침해하는 행위</li>
                <li>자동화된 봇, 스크립트 등을 이용하여 서비스 서버에 비정상적인 부하를 일으키는 행위</li>
                <li>기타 공공질서 및 미풍양속에 반하는 행위</li>
              </ul>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제6조 (서비스의 변경 및 중단)
              </h4>
              <p style={{ marginBottom: 16 }}>
                서비스는 무료 비상업적 프로젝트로서 유지보수, 시스템 점검, 또는 외부 API(네이버 치지직, YouTube)의 정책 변경 등에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제7조 (면책 조항)
              </h4>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li>서비스는 외부 플랫폼(YouTube, 치지직)의 네트워크 장애, 서버 점검, 또는 영상 삭제/비공개 전환 등으로 인해 발생하는 재생 장애에 대하여 책임을 지지 않습니다.</li>
                <li>서비스는 이용자 간 또는 이용자와 제3자 상호 간에 서비스를 매개로 하여 발생한 분쟁에 대해 개입할 의무가 없으며 이로 인한 손해를 배상할 책임이 없습니다.</li>
              </ul>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
                제8조 (준거법 및 재판관할)
              </h4>
              <p style={{ marginBottom: 10 }}>
                본 약관의 해석 및 서비스 이용에 관하여는 대한민국 법률을 준거법으로 적용하며, 발생한 분쟁에 대해서는 민사소송법상의 관할 법원에 소를 제기합니다.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                공고일자: 2026년 8월 17일 / 시행일자: 2026년 8월 17일
              </p>
            </div>
          )}
        </div>

        {/* Footer with Confirm Button */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--surface-dark-alt)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            className="btn-primary"
            onClick={onClose}
            style={{ padding: '6px 18px', fontSize: 13, fontWeight: 700 }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
