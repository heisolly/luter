import React, { useEffect, useRef, useState } from 'react';
import { RoomProvider } from '../../liveblocks.config';
import { LiveObject, LiveList } from '@liveblocks/client';
import { LiveblocksFallbackProvider, useLiveblocksFallback } from '../../context/LiveblocksFallbackContext';
import { supabase } from '../../supabaseClient';

const userColors = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2'];

function colorFromId(id = 'peer') {
  return userColors[String(id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % userColors.length];
}

function LiveblocksStatusCheck({ roomId, children, userInfo, initialPresence }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'connected' | 'failed'
  const { setFallback } = useLiveblocksFallback();
  const checkDone = useRef(false);

  useEffect(() => {
    if (checkDone.current) return;
    if (!roomId) {
      setStatus('failed');
      checkDone.current = true;
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    supabase.auth.getSession().then(({ data }) =>
      fetch('/api/liveblocks-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
        },
        body: JSON.stringify({ room: roomId }),
        signal: controller.signal,
      })
    ).then((res) => {
      clearTimeout(timeout);
      if (res.ok) {
        setFallback(false);
        setStatus('connected');
      } else {
        setStatus('failed');
      }
    }).catch(() => {
      clearTimeout(timeout);
      setStatus('failed');
    }).finally(() => {
      clearTimeout(timeout);
      checkDone.current = true;
    });

    return () => clearTimeout(timeout);
  }, [roomId]);

  if (status === 'checking') {
    return <>{children}</>;
  }

  if (status === 'failed') {
    return (
      <>
        <OfflineBanner onReconnect={() => {
          checkDone.current = false;
          setFallback(true);
          setStatus('checking');
        }} />
        {children}
      </>
    );
  }

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        currentPage: 1,
        currentSlide: 0,
        isTyping: false,
        status: 'active',
        selectedText: null,
        currentTool: 'none',
        role: 'participant',
        user: {
          id: userInfo?.id || 'guest',
          name: userInfo?.name || 'Peer',
          avatar: userInfo?.avatar || null,
          color: userInfo?.color || colorFromId(userInfo?.id),
          role: userInfo?.role || 'peer',
        },
        ...initialPresence,
      }}
      initialStorage={{
        whiteboardData: new LiveList([]),
        whiteboardAppState: new LiveObject({}),
        whiteboardFiles: new LiveObject({}),
        syncMode: false,
        presenterId: null,
        presenterSlide: 1,
        syncState: new LiveObject({
          isSynced: false,
          leaderId: null,
          currentSlide: 0,
        }),
        messages: new LiveList([]),
        annotations: new LiveList([]),
        quizState: 'idle',
        quizQuestions: new LiveList([]),
        quizCurrentIdx: 0,
        quizScores: new LiveObject({}),
        quiz: new LiveObject({
          status: 'idle',
          question: null,
          options: [],
          correctAnswer: null,
          answers: {},
          scores: {},
          startedAt: null,
          timeLimit: 60,
        }),
        sessionFiles: new LiveList([]),
        activeFileId: null,
        coverAreas: new LiveObject({}),
        raisedHands: new LiveObject({}),
      }}
    >
      {children}
    </RoomProvider>
  );
}

function OfflineBanner({ onReconnect }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 16px', background: '#FEF3C7', borderBottom: '1px solid #FDE68A',
      fontSize: '12px', fontWeight: 600, color: '#92400E', gap: '12px'
    }}>
      <span>Collaboration unavailable — working offline</span>
      <button
        onClick={onReconnect}
        style={{
          background: '#92400E', color: 'white', border: 'none',
          borderRadius: '6px', padding: '4px 12px', cursor: 'pointer',
          fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap'
        }}
      >
        Reconnect
      </button>
    </div>
  );
}

export const CollaborationProvider = ({ roomId, children, userInfo = {}, initialPresence = {} }) => {
  if (!roomId) return children;

  return (
    <LiveblocksFallbackProvider>
      <LiveblocksStatusCheck
        roomId={roomId}
        userInfo={userInfo}
        initialPresence={initialPresence}
      >
        {children}
      </LiveblocksStatusCheck>
    </LiveblocksFallbackProvider>
  );
};
