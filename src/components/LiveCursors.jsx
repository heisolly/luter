import React from 'react';
import { useOthers } from '../liveblocks.config';

export default function LiveCursors() {
  const others = useOthers();

  return (
    <>
      {others.map((other) => {
        const presence = other.presence || {};
        if (!presence.cursor || presence.currentTool !== 'annotate') return null;
        const user = presence.user || {};

        return (
          <div
            key={other.connectionId}
            style={{
              position: 'absolute',
              left: presence.cursor.x,
              top: presence.cursor.y,
              pointerEvents: 'none',
              zIndex: 30,
              transform: 'translate(-2px, -2px)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 15L3 17V3l14 8-6 1-6 3z" fill={user.color || '#7C3AED'} stroke="white" strokeWidth="1" />
            </svg>
            <div style={{
              position: 'absolute',
              top: '18px',
              left: '10px',
              background: user.color || '#7C3AED',
              color: 'white',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
            }}>
              {user.name || 'Peer'}
            </div>
          </div>
        );
      })}
    </>
  );
}
