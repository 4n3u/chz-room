import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, User, CheckCircle2 } from 'lucide-react';

interface MockLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MockLoginModal: React.FC<MockLoginModalProps> = ({ isOpen, onClose }) => {
  const { mockLogin } = useAuth();
  const [channelName, setChannelName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    setLoading(true);
    try {
      await mockLogin({
        channelName: channelName.trim(),
        channelId: channelId.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const presetUsers = [
    { name: '침착맨', id: 'calmdownman_ch' },
    { name: '우왁굳', id: 'woowakgood_ch' },
    { name: '풍월량', id: 'pung_ch' },
    { name: '녹두로', id: 'nokduro_ch' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="var(--brand-green)" />
            <h3 style={{ fontSize: 18 }}>간편 프로필 (테스트 로그인)</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          치지직 OpenAPI 연동 외에도 원하는 닉네임으로 바로 접속하여 동시 시청 및 권한 기능을 테스트할 수 있습니다.
        </p>

        {/* Quick Presets */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 8 }}>
            빠른 프리셋 선택:
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {presetUsers.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className="btn-secondary"
                style={{ fontSize: 12, padding: '6px 12px' }}
                onClick={() => {
                  setChannelName(preset.name);
                  setChannelId(preset.id);
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              치지직 닉네임 *
            </label>
            <input
              type="text"
              placeholder="예: 치지직 스트리머"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              style={{ width: '100%' }}
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              채널 ID (선택)
            </label>
            <input
              type="text"
              placeholder="고유 식별자 (미입력시 자동생성)"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !channelName.trim()}>
              {loading ? '로그인 중...' : '시작하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
