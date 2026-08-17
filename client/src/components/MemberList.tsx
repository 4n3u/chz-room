import React from 'react';
import { RoomMember, UserRole } from '../types';
import { Crown, Shield, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface MemberListProps {
  members: RoomMember[];
  myRole: UserRole;
  myUserId?: string;
  onUpdateRole: (targetUserId: string, newRole: UserRole) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  myRole,
  myUserId,
  onUpdateRole,
}) => {
  const isHost = myRole === 'host';

  // Sort members: Host first, then Mods, then Viewers
  const sortedMembers = [...members].sort((a, b) => {
    const roleWeight = { host: 3, mod: 2, viewer: 1 };
    return roleWeight[b.role] - roleWeight[a.role];
  });

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
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          룸 참가자 목록
        </span>
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
          {members.length}명
        </span>
      </div>

      {/* Role explanation notice */}
      <div
        style={{
          padding: '10px 16px',
          backgroundColor: 'var(--surface-dark-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <ShieldCheck size={14} color="var(--brand-green)" />
        <span>어드민과 매니저는 다음 영상 넘기기 및 대기열을 제어할 수 있습니다.</span>
      </div>

      {/* Member List Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortedMembers.map((member) => {
            const isMe = member.user.channelId === myUserId;

            return (
              <div
                key={member.socketId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--surface-dark-alt)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                }}
              >
                {/* User Info & Inline Role Badges */}
                <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {member.user.channelName}
                  </span>
                  {member.user.verifiedMark && (
                    <CheckCircle2 size={13} color="var(--brand-green)" fill="var(--brand-green)" />
                  )}
                  {isMe && (
                    <span style={{ fontSize: 10, color: 'var(--brand-green)', fontWeight: 800 }}>
                      (나)
                    </span>
                  )}

                  {/* Inline Role Badges (Admin / Manager only) */}
                  {member.role === 'host' && (
                    <span className="badge badge-host" style={{ marginLeft: 2 }}>
                      <Crown size={10} /> 어드민
                    </span>
                  )}
                  {member.role === 'mod' && (
                    <span className="badge badge-mod" style={{ marginLeft: 2 }}>
                      <Shield size={10} /> 매니저
                    </span>
                  )}
                </div>

                {/* Host Management Controls */}
                {isHost && !isMe && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {member.role === 'viewer' && (
                      <button
                        className="btn-secondary"
                        onClick={() => onUpdateRole(member.user.channelId, 'mod')}
                        title="매니저로 임명"
                        style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          color: 'var(--brand-green)',
                          borderColor: 'rgba(0, 255, 163, 0.3)',
                        }}
                      >
                        매니저 임명
                      </button>
                    )}
                    {member.role === 'mod' && (
                      <button
                        className="btn-secondary"
                        onClick={() => onUpdateRole(member.user.channelId, 'viewer')}
                        title="매니저 권한 해제"
                        style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          color: 'var(--accent-red)',
                          borderColor: 'rgba(255, 75, 75, 0.3)',
                        }}
                      >
                        매니저 해제
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
