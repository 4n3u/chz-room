import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { X, Plus } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomId: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('방 제목을 입력해주세요.');
      return;
    }

    if (!user) {
      setError('방을 생성하려면 먼저 로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        '/api/rooms',
        {
          title: title.trim(),
          hostUser: user,
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data?.room) {
        onRoomCreated(res.data.room.id);
        onClose();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || '방 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={20} color="var(--brand-green)" />
            <h3 style={{ fontSize: 18 }}>새 치즈룸 만들기</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 75, 75, 0.15)',
              border: '1px solid rgba(255, 75, 75, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-red)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              치즈룸 이름 *
            </label>
            <input
              type="text"
              placeholder="예: 치즈들과 함께하는 유튜브 감상회"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%' }}
              required
              autoFocus
            />
            <span style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginTop: 6 }}>
              방을 생성하면 전용 링크가 발급되며, 링크를 공유받은 누구나 참여할 수 있습니다.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !title.trim()}>
              {loading ? '생성 중...' : '치즈룸 생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
