import React, { useState } from 'react';
import { UserRole, VideoItem } from '../types';
import {
  Plus,
  SkipForward,
  Trash2,
  ListMusic,
  Play,
  Shuffle,
  Repeat,
  GripVertical,
} from 'lucide-react';

interface QueuePanelProps {
  currentVideo: VideoItem | null;
  queue: VideoItem[];
  role: UserRole;
  isShuffle: boolean;
  onAddToQueue: (url: string) => Promise<boolean>;
  onRemoveFromQueue: (queueItemId: string) => void;
  onReorderQueue: (fromIndex: number, toIndex: number) => void;
  onToggleShuffle: (isShuffle: boolean) => void;
  onPlayNow: (queueItemId: string) => void;
  onSkipNext: () => void;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({
  currentVideo,
  queue,
  role,
  isShuffle,
  onAddToQueue,
  onRemoveFromQueue,
  onReorderQueue,
  onToggleShuffle,
  onPlayNow,
  onSkipNext,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!canManage) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!canManage || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!canManage || draggedIndex === null) return;
    e.preventDefault();
    if (draggedIndex !== targetIndex) {
      onReorderQueue(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
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
        </div>

        <form onSubmit={handleAddSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="유튜브 URL 붙여넣기"
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
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--brand-green)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Play size={13} fill="var(--brand-green)" /> 현재 재생 중
            </span>

            {/* Next Video Button (Admin & Manager only) */}
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
                    등록: {currentVideo.addedBy?.channelName || '치지직 유저'}
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

        {/* Upcoming Queue Header & Mode Toggle */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
              다음 재생 목록 ({queue.length}개)
            </span>

            {/* Play Mode Switch (Sequential / Random Shuffle) */}
            {canManage ? (
              <button
                onClick={() => onToggleShuffle(!isShuffle)}
                title={isShuffle ? '순서대로 재생으로 전환' : '랜덤 재생으로 전환'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: isShuffle ? 'rgba(0, 255, 163, 0.15)' : 'var(--surface-dark-alt)',
                  color: isShuffle ? 'var(--brand-green)' : 'var(--text-muted)',
                  border: isShuffle ? '1px solid rgba(0, 255, 163, 0.4)' : '1px solid var(--border-color)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isShuffle ? <Shuffle size={12} /> : <Repeat size={12} />}
                <span>{isShuffle ? '랜덤 재생' : '순차 재생'}</span>
              </button>
            ) : (
              <span
                style={{
                  fontSize: 11,
                  color: isShuffle ? 'var(--brand-green)' : 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 600,
                }}
              >
                {isShuffle ? <Shuffle size={11} /> : <Repeat size={11} />}
                <span>{isShuffle ? '랜덤 재생 중' : '순차 재생 중'}</span>
              </span>
            )}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {queue.map((item, index) => {
                const isDragging = draggedIndex === index;
                const isOver = dragOverIndex === index;

                return (
                  <div
                    key={item.id}
                    draggable={canManage}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: isOver
                        ? 'var(--surface-dark-hover)'
                        : 'var(--surface-dark-alt)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 10px',
                      border: isOver
                        ? '1px solid var(--brand-green)'
                        : '1px solid var(--border-color)',
                      opacity: isDragging ? 0.4 : 1,
                      cursor: canManage ? 'grab' : 'default',
                      transform: isOver ? 'scale(1.01)' : 'none',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Drag Handle (Admin / Manager only) */}
                    {canManage && (
                      <div
                        style={{
                          color: 'var(--text-dim)',
                          cursor: 'grab',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                        }}
                        title="드래그하여 순서 변경"
                      >
                        <GripVertical size={14} />
                      </div>
                    )}

                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      style={{
                        width: 60,
                        height: 34,
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        flexShrink: 0,
                        pointerEvents: 'none',
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

                    {/* Action Buttons (Admin & Manager only) */}
                    {canManage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        {/* Play Now Button (즉시 재생) */}
                        <button
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayNow(item.id);
                          }}
                          title="지금 바로 재생"
                          style={{
                            width: 28,
                            height: 28,
                            color: 'var(--brand-green)',
                            backgroundColor: 'rgba(0, 255, 163, 0.08)',
                            borderColor: 'rgba(0, 255, 163, 0.25)',
                          }}
                        >
                          <Play size={12} fill="var(--brand-green)" />
                        </button>

                        {/* Remove Button (대기열 삭제) */}
                        <button
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFromQueue(item.id);
                          }}
                          title="대기열에서 삭제"
                          style={{ width: 28, height: 28 }}
                        >
                          <Trash2 size={13} color="var(--accent-red)" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
