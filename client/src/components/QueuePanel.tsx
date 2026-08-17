import React, { useState } from 'react';
import { UserRole, VideoItem } from '../types';
import { Plus, SkipForward, Trash2, ListMusic, Play, User } from 'lucide-react';

interface QueuePanelProps {
  currentVideo: VideoItem | null;
  queue: VideoItem[];
  role: UserRole;
  onAddToQueue: (url: string) => Promise<boolean>;
  onRemoveFromQueue: (queueItemId: string) => void;
  onSkipNext: () => void;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({
  currentVideo,
  queue,
  role,
  onAddToQueue,
  onRemoveFromQueue,
  onSkipNext,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const canManage = role === 'host' || role === 'mod';

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setInputError(null);

    const success = await onAddToQueue(urlInput.trim());
    if (success) {
      setUrlInput('');
    } else {
      setInputError('올바른 유튜브 영상 URL을 입력해주세요.');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--surface-dark)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      {/* Panel Header & URL Input Form */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--surface-dark-alt)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ListMusic size={18} color="var(--brand-green)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>대기열 & 영상 등록</h3>
          <span
            style={{
              fontSize: 11,
              backgroundColor: 'rgba(0, 255, 163, 0.15)',
              color: 'var(--brand-green)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
            }}
          >
            누구나 등록 가능
          </span>
        </div>

        <form onSubmit={handleAddSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="유튜브 URL (일반/Shorts/youtu.be) 붙여넣기..."
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (inputError) setInputError(null);
            }}
            style={{
              flex: 1,
              fontSize: 13,
              padding: '8px 12px',
              backgroundColor: 'var(--surface-dark)',
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !urlInput.trim()}
            style={{ padding: '8px 14px', fontSize: 13, whiteSpace: 'nowrap' }}
          >
            <Plus size={16} />
            <span>{loading ? '추가 중...' : '추가'}</span>
          </button>
        </form>

        {inputError && (
          <p style={{ fontSize: 12, color: 'var(--accent-red)', marginTop: 6 }}>{inputError}</p>
        )}
      </div>

      {/* Content Area: Current Video + Upcoming Queue */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Currently Playing Card */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Play size={13} fill="var(--brand-green)" /> 현재 재생 중
            </span>

            {/* Next Video Button (Host & Mod only) */}
            {canManage && (
              <button
                className="btn-secondary"
                onClick={onSkipNext}
                disabled={!currentVideo && queue.length === 0}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--brand-green)',
                  borderColor: 'rgba(0, 255, 163, 0.3)',
                  backgroundColor: 'rgba(0, 255, 163, 0.08)',
                }}
              >
                <SkipForward size={13} />
                <span>다음 영상</span>
              </button>
            )}
          </div>

          {currentVideo ? (
            <div
              style={{
                display: 'flex',
                gap: 12,
                backgroundColor: 'var(--surface-dark-alt)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '10px',
              }}
            >
              <img
                src={currentVideo.thumbnailUrl}
                alt={currentVideo.title}
                style={{
                  width: 96,
                  height: 54,
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: 4,
                  }}
                  title={currentVideo.title}
                >
                  {currentVideo.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    등록자: {currentVideo.addedBy?.channelName || '치지직 유저'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                backgroundColor: 'var(--surface-dark-alt)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)',
                color: 'var(--text-dim)',
                fontSize: 13,
              }}
            >
              재생 중인 영상이 없습니다.
            </div>
          )}
        </div>

        {/* Upcoming Queue List */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
              다음 재생 목록 ({queue.length}개)
            </span>
          </div>

          {queue.length === 0 ? (
            <div
              style={{
                padding: '30px 16px',
                textAlign: 'center',
                color: 'var(--text-dim)',
                fontSize: 13,
              }}
            >
              대기 중인 다음 영상이 없습니다.
              <br />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                상단에 유튜브 링크를 추가해보세요!
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {queue.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: 'var(--surface-dark-alt)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 10px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--text-dim)',
                      width: 16,
                      textAlign: 'center',
                    }}
                  >
                    {index + 1}
                  </span>
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    style={{
                      width: 64,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-primary)',
                        marginBottom: 2,
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {item.addedBy?.channelName}
                    </span>
                  </div>

                  {/* Remove Button (Host & Mod only) */}
                  {canManage && (
                    <button
                      className="btn-icon"
                      onClick={() => onRemoveFromQueue(item.id)}
                      title="대기열에서 삭제"
                      style={{ width: 28, height: 28, flexShrink: 0 }}
                    >
                      <Trash2 size={13} color="var(--accent-red)" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
