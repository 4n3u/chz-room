import React from 'react';
import { RoomMember, UserRole } from '../types';
import { Users, Crown, Shield, User, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
  const rolePriority: Record<UserRole, number> = { host: 1, mod: 2, viewer: 3 };
  const sortedMembers = [...members].sort(
    (a, b) => rolePriority[a.role] - rolePriority[b.role]
  );

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
          padding: '16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--surface-dark-alt)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} color="var(--brand-green)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>참가자 목록</h3>
        </div>
        <span
          style={{
            fontSize: 12,
            backgroundColor: 'var(--surface-dark-hover)',
            color: 'var(--text-secondary)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
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
        <span>방장과 관리자는 다음 영상 넘기기 및 대기열을 제어할 수 있습니다.</span>
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
                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {member.user.channelImageUrl ? (
                    <img
                      src={member.user.channelImageUrl}
                      alt={member.user.channelName}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface-dark-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <User size={16} color="var(--text-secondary)" />
                    </div>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                    </div>

                    {/* Role Badge */}
                    <div style={{ marginTop: 2 }}>
                      {member.role === 'host' && (
                        <span className="badge badge-host">
                          <Crown size={10} /> 방장
                        </span>
                      )}
                      {member.role === 'mod' && (
                        <span className="badge badge-mod">
                          <Shield size={10} /> 관리자
                        </span>
                      )}
                      {member.role === 'viewer' && (
                        <span className="badge badge-viewer">시청자</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Host Management Controls */}
                {isHost && !isMe && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {member.role === 'viewer' && (
                      <button
                        className="btn-secondary"
                        onClick={() => onUpdateRole(member.user.channelId, 'mod')}
                        title="관리자로 임명"
                        style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          color: 'var(--brand-green)',
                          borderColor: 'rgba(0, 255, 163, 0.3)',
                        }}
                      >
                        관리자 임명
                      </button>
                    )}
                    {member.role === 'mod' && (
                      <button
                        className="btn-secondary"
                        onClick={() => onUpdateRole(member.user.channelId, 'viewer')}
                        title="관리자 권한 해제"
                        style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          color: 'var(--accent-red)',
                          borderColor: 'rgba(255, 75, 75, 0.3)',
                        }}
                      >
                        관리자 해제
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
