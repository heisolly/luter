import React from 'react';
import { useOthers } from './dashboard/CollaborationProvider';

export default function LiveCursors() {
  const others = useOthers();

  return (
    <>
      {others.map((other) => {
        const presence = other.presence || {};
        if (!presence.cursor) return null;
        const user = presence.user || {};

        const color = user.color || '#7C3AED';

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
              transition: 'left 60ms linear, top 60ms linear',
            }}
          >
            {/* Cursor arrow */}
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 15L3 17V3l14 8-6 1-6 3z" fill={color} stroke="white" strokeWidth="1" />
            </svg>
            {/* Name label */}
            <div style={{
              position: 'absolute',
              top: '18px',
              left: '10px',
              background: color,
              color: 'white',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
            }}>
              {user.name || 'Peer'}
            </div>
          </div>
        );
      })}
    </>
  );
}
