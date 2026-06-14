import React, { useMemo, useState } from 'react';
import { RiPulseLine } from 'react-icons/ri';
import { useOthers, useStorage } from './dashboard/CollaborationProvider';

function timeAgo(ts) {
  const minutes = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function ActivityFeed({ messages = [] }) {
  const [open, setOpen] = useState(false);
  const others = useOthers();
  const quiz = useStorage((root) => root.quiz);
  const raisedHands = useStorage((root) => root.raisedHands) || {};
  const syncState = useStorage((root) => root.syncState);

  const items = useMemo(() => {
    const now = Date.now();
    return [
      ...others.map((other) => ({
        id: `presence-${other.connectionId}`,
        actor: other.presence?.user?.name || 'Peer',
        action: `joined the session · Slide ${other.presence?.currentPage || other.presence?.currentSlide || 1}`,
        color: other.presence?.user?.color || '#7C3AED',
        time: now,
      })),
      ...Object.values(raisedHands).map((hand) => ({
        id: `hand-${hand.userId}`,
        actor: hand.userName,
        action: 'raised their hand',
        color: '#D97706',
        time: hand.raisedAt,
      })),
      ...messages.slice(-4).map((message) => ({
        id: `message-${message.id}`,
        actor: message.userName,
        action: message.text?.startsWith('@luter') ? 'asked Luter AI in group chat' : 'sent a group message',
        color: message.userColor || '#7C3AED',
        time: message.timestamp,
      })),
      quiz?.status === 'active' ? { id: 'quiz-active', actor: 'Teacher', action: 'started a quiz', color: '#059669', time: now } : null,
      syncState?.isSynced ? { id: 'sync-active', actor: 'Teacher', action: 'enabled slide sync', color: '#7C3AED', time: now } : null,
    ].filter(Boolean).sort((a, b) => b.time - a.time);
  }, [others, raisedHands, messages, quiz?.status, syncState?.isSynced]);

  return (
    <div className="ws-activity-feed">
      <button type="button" className="ws-activity-button" onClick={() => setOpen((value) => !value)} aria-label="Session activity">
        <RiPulseLine size={17} />
      </button>
      {open && (
        <div className="ws-activity-panel">
          <div className="ws-activity-header">Session Activity</div>
          <div className="ws-activity-list">
            {items.length === 0 ? (
              <div className="ws-activity-empty">No activity yet.</div>
            ) : items.map((item) => (
              <div key={item.id} className="ws-activity-item">
                <span style={{ background: item.color }}>{item.actor?.[0]?.toUpperCase() || 'L'}</span>
                <p><strong>{item.actor}</strong> {item.action}</p>
                <time>{timeAgo(item.time)}</time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
