import React from 'react';
import { UserRole, VideoItem } from '../types';
import { History, Plus, Play, Trash2, ExternalLink } from 'lucide-react';

interface HistoryPanelProps {
  history: VideoItem[];
  role: UserRole;
  onReAdd: (historyItemId: string) => void;
  onPlayNow: (historyItemId: string) => void;
  onClearHistory: () => void;
}

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  role,
  onReAdd,
  onPlayNow,
  onClearHistory,
}) => {
  const canManage = role === 'host' || role === 'mod';

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
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <History size={16} color="var(--brand-green)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            재생 히스토리
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {canManage && history.length > 0 && (
            <button
              onClick={onClearHistory}
              title="히스토리 전체 비우기"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                padding: '3px 7px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'transparent',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent-red)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 75, 75, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Trash2 size={13} />
              <span>비우기</span>
            </button>
          )}

          <span
            style={{
              fontSize: 12,
              backgroundColor: 'var(--surface-dark-subtle)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--brand-green)',
              fontWeight: 700,
            }}
          >
            {history.length}곡
          </span>
        </div>
      </div>

      {/* History List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {history.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'var(--surface-dark-alt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dim)',
              }}
            >
              <History size={24} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                재생 히스토리가 없습니다
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0, lineHeight: 1.4 }}>
                영상이 끝나거나 다음 영상으로 넘어가면<br />이곳에 차례대로 기록됩니다.
              </p>
            </div>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                backgroundColor: 'var(--surface-dark-alt)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.backgroundColor = 'var(--surface-dark-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.backgroundColor = 'var(--surface-dark-alt)';
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  position: 'relative',
                  width: 72,
                  height: 42,
                  borderRadius: 4,
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: '#000',
                }}
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  loading="lazy"
                />
              </div>

              {/* Title & Metadata */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  title={item.title}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.title}
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    color: 'var(--text-dim)',
                    flexWrap: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {item.authorName && (
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      {item.authorName}
                    </span>
                  )}
                  {item.addedBy?.channelName && (
                    <>
                      {item.authorName && <span>•</span>}
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: 'var(--text-muted)',
                        }}
                        title={`신청자: ${item.addedBy.channelName}`}
                      >
                        {item.addedBy.channelName}
                      </span>
                    </>
                  )}
                  {item.playedAt && (
                    <>
                      <span>•</span>
                      <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatRelativeTime(item.playedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {/* External Link (YouTube or SoundCloud) */}
                <a
                  href={
                    item.source === 'soundcloud'
                      ? item.soundcloudUrl || item.authorUrl || item.videoId
                      : `https://www.youtube.com/watch?v=${item.videoId}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.source === 'soundcloud' ? '사운드클라우드에서 새 탭으로 열기' : '유튜브에서 새 탭으로 열기'}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-dim)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--surface-dark-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-dim)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ExternalLink size={13} />
                </a>

                {/* Re-add to Queue Button (For Everyone) */}
                <button
                  onClick={() => onReAdd(item.id)}
                  title="대기열에 다시 추가"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--brand-green)';
                    e.currentTarget.style.backgroundColor = 'var(--brand-green-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Plus size={15} />
                </button>

                {/* Play Now Button (Host & Mod only) */}
                {canManage && (
                  <button
                    onClick={() => onPlayNow(item.id)}
                    title="지금 즉시 재생"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-green)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--brand-green-glow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Play size={12} fill="var(--brand-green)" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
