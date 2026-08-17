import React from 'react';
import { RoomSettings, QueueLimitMode, DuplicatePolicy, RequestPermission } from '../types';
import {
  X,
  Settings,
  Clock,
  CopyCheck,
  Shield,
  Layers,
  Smartphone,
  Check,
  Users,
} from 'lucide-react';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RoomSettings;
  onUpdateSettings: (newSettings: Partial<RoomSettings>) => void;
}

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
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
          maxWidth: 540,
          maxHeight: '90vh',
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
              방 설정 (운영 정책)
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

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {/* 1. 신청 권한 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Users size={15} color="var(--brand-green)" />
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                영상 신청 권한
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { value: 'all' as RequestPermission, label: '모든 참가자', desc: '시청자 누구나 영상 신청 가능' },
                { value: 'admin_only' as RequestPermission, label: '어드민/매니저만', desc: '진행자 전용 감상 모드' },
              ].map((opt) => {
                const active = settings.requestPermission === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onUpdateSettings({ requestPermission: opt.value })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: active ? 'var(--brand-green-glow)' : 'var(--surface-dark-alt)',
                      border: `1px solid ${active ? 'var(--brand-green)' : 'var(--border-subtle)'}`,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--brand-green)' : 'var(--text-primary)', marginBottom: 2 }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 1인당 신청 제한 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Shield size={15} color="var(--brand-green)" />
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                1인당 신청 수량 제한
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { value: 'unlimited' as QueueLimitMode, label: '무제한 신청', desc: '제한 없이 원하는 만큼 신청 가능' },
                { value: 'once_in_queue' as QueueLimitMode, label: '재생목록 내 1곡 제한', desc: '대기열에 본인 곡이 1개만 머무를 수 있음 (완료 시 재신청 가능)' },
                { value: 'once_in_room' as QueueLimitMode, label: '방당 1인 1곡 제한', desc: '이 방에서 1인당 평생 1곡만 신청 가능 (히스토리 포함)' },
              ].map((opt) => {
                const active = settings.queueLimitMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onUpdateSettings({ queueLimitMode: opt.value })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: active ? 'var(--brand-green-glow)' : 'var(--surface-dark-alt)',
                      border: `1px solid ${active ? 'var(--brand-green)' : 'var(--border-subtle)'}`,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--brand-green)' : 'var(--text-primary)' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{opt.desc}</div>
                    </div>
                    {active && <Check size={16} color="var(--brand-green)" style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 영상 최대 길이 제한 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Clock size={15} color="var(--brand-green)" />
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                영상 최대 길이 제한
              </label>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { sec: 0, label: '제한 없음' },
                { sec: 300, label: '5분 이하' },
                { sec: 600, label: '10분 이하' },
                { sec: 1200, label: '20분 이하' },
                { sec: 3600, label: '1시간 이하' },
              ].map((item) => {
                const active = settings.maxDurationLimit === item.sec;
                return (
                  <button
                    key={item.sec}
                    onClick={() => onUpdateSettings({ maxDurationLimit: item.sec })}
                    style={{
                      flex: '1 1 calc(33.33% - 6px)',
                      minWidth: 80,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: active ? 'var(--brand-green)' : 'var(--surface-dark-alt)',
                      color: active ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                      border: `1px solid ${active ? 'var(--brand-green)' : 'var(--border-subtle)'}`,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 중복 영상 신청 방지 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <CopyCheck size={15} color="var(--brand-green)" />
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                중복 영상 방지
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { value: 'allow' as DuplicatePolicy, label: '중복 허용' },
                { value: 'prevent_in_queue' as DuplicatePolicy, label: '대기열 중복 금지' },
                { value: 'prevent_in_history' as DuplicatePolicy, label: '히스토리 포함 금지' },
              ].map((opt) => {
                const active = settings.duplicatePolicy === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onUpdateSettings({ duplicatePolicy: opt.value })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: active ? 'var(--brand-green-glow)' : 'var(--surface-dark-alt)',
                      border: `1px solid ${active ? 'var(--brand-green)' : 'var(--border-subtle)'}`,
                      color: active ? 'var(--brand-green)' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. 대기열 최대 수용 개수 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Layers size={15} color="var(--brand-green)" />
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                대기열 최대 보관 개수
              </label>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { cap: 0, label: '무제한' },
                { cap: 10, label: '최대 10곡' },
                { cap: 30, label: '최대 30곡' },
                { cap: 50, label: '최대 50곡' },
              ].map((item) => {
                const active = settings.maxQueueCapacity === item.cap;
                return (
                  <button
                    key={item.cap}
                    onClick={() => onUpdateSettings({ maxQueueCapacity: item.cap })}
                    style={{
                      flex: '1 1 calc(25% - 6px)',
                      minWidth: 70,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: active ? 'var(--brand-green)' : 'var(--surface-dark-alt)',
                      color: active ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                      border: `1px solid ${active ? 'var(--brand-green)' : 'var(--border-subtle)'}`,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. YouTube Shorts(쇼츠) 허용 여부 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Smartphone size={15} color="var(--brand-green)" />
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                YouTube Shorts(쇼츠) 영상
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { allow: true, label: '쇼츠 허용', desc: '세로형 쇼츠 영상 등록 가능' },
                { allow: false, label: '쇼츠 금지', desc: '일반 가로 영상만 허용' },
              ].map((opt) => {
                const active = settings.allowShorts === opt.allow;
                return (
                  <button
                    key={String(opt.allow)}
                    onClick={() => onUpdateSettings({ allowShorts: opt.allow })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: active ? 'var(--brand-green-glow)' : 'var(--surface-dark-alt)',
                      border: `1px solid ${active ? 'var(--brand-green)' : 'var(--border-subtle)'}`,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--brand-green)' : 'var(--text-primary)', marginBottom: 2 }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notice footer */}
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
            <span>어드민과 매니저는 모든 제한 설정과 무관하게 언제든 자유롭게 영상을 등록할 수 있습니다.</span>
          </div>
        </div>

        {/* Modal Footer */}
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
