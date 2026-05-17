import React from 'react';
import { useAvatarStack } from '../../hooks/usePresenceFeatures';

function initials(name = 'Peer') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'P';
}

const statusColor = {
  active: '#10B981',
  idle: '#F59E0B',
  away: '#D1D5DB',
};

export default function AvatarStack() {
  const users = useAvatarStack();
  const visible = users.slice(0, 4);
  const extra = Math.max(0, users.length - visible.length);

  return (
    <div className="ws-avatar-stack">
      {visible.map((user, index) => (
        <div
          key={user.connectionId}
          className="ws-avatar-stack-item"
          style={{ marginLeft: index === 0 ? 0 : -8, zIndex: visible.length - index }}
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span style={{ background: user.color }}>{initials(user.name)}</span>
          )}
          <i style={{ background: statusColor[user.status] || statusColor.active }} />
          <b>{user.name} · Slide {(user.currentSlide || 0) + 1}</b>
        </div>
      ))}
      {extra > 0 && <div className="ws-avatar-stack-more">+{extra}</div>}
    </div>
  );
}
