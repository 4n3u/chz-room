import React from 'react';
import { QueueLimitMode } from '../types';
import { X, Settings, Infinity as InfinityIcon, ListPlus, UserCheck, Shield } from 'lucide-react';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: QueueLimitMode;
  onUpdateMode: (mode: QueueLimitMode) => void;
}

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onUpdateMode,
}) => {
  if (!isOpen) return null;

  const options: {
    mode: QueueLimitMode;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      mode: 'unlimited',
      title: '무제한 신청',
      description: '시청자가 제한 없이 자유롭게 여러 영상을 대기열에 등록할 수 있습니다.',
      icon: <InfinityIcon size={18} />,
    },
    {
      mode: 'once_in_queue',
      title: '재생목록 내 1곡 제한',
      description: '대기열(재생 중 포함)에 본인의 영상이 1곡만 존재할 수 있습니다. 재생 완료 시 다시 신청 가능합니다.',
      icon: <ListPlus size={18} />,
    },
    {
      mode: 'once_in_room',
      title: '방당 1인 1곡 제한',
      description: '이 방에서 1인당 평생 1곡만 신청할 수 있습니다. (히스토리에 기록된 사용자 재신청 불가)',
      icon: <UserCheck size={18} />,
    },
  ];

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
          maxWidth: 480,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} color="var(--brand-green)" />
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
              방 설정
            </span>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            style={{ width: 28, height: 28 }}
            title="닫기"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>
              영상 신청 제한 설정
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {options.map((opt) => {
                const isSelected = currentMode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    onClick={() => {
                      onUpdateMode(opt.mode);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--brand-green-glow)' : 'var(--surface-dark-alt)',
                      border: `1px solid ${isSelected ? 'var(--brand-green)' : 'var(--border-subtle)'}`,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.backgroundColor = 'var(--surface-dark-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.backgroundColor = 'var(--surface-dark-alt)';
                      }
                    }}
                  >
                    {/* Icon & Indicator */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? 'var(--brand-green)' : 'var(--surface-dark-subtle)',
                        color: isSelected ? 'var(--text-on-brand)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {opt.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: isSelected ? 'var(--brand-green)' : 'var(--text-primary)',
                          }}
                        >
                          {opt.title}
                        </span>
                        {isSelected && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--brand-green)',
                              backgroundColor: 'rgba(0, 255, 163, 0.15)',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            적용 중
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin bypass tip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              backgroundColor: 'var(--surface-dark-alt)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <Shield size={14} color="var(--brand-green)" style={{ flexShrink: 0 }} />
            <span>어드민과 매니저는 신청 제한 설정과 관계없이 언제나 자유롭게 영상을 추가할 수 있습니다.</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
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
            완료
          </button>
        </div>
      </div>
    </div>
  );
};
