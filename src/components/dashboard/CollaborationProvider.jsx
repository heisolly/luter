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
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
        background: 'radial-gradient(120% 120% at 50% 0%, #FAF5FF 0%, #F5F3FF 50%, #F9FAFB 100%)',
        color: '#7C3AED', fontFamily: 'Outfit'
      }}>
        <div style={{
           width: '40px', height: '40px',
           border: '3px solid rgba(124, 58, 237, 0.1)',
           borderTopColor: '#7C3AED', borderRadius: '50%',
           animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280' }}>Preparing collaboration space...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
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
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 999999,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', background: '#FEF3C7', border: '1px solid #FDE68A',
      borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      fontSize: '13px', fontWeight: 600, color: '#92400E', gap: '16px',
      animation: 'toolboxAppear 0.3s ease-out'
    }}>
      <span>Collaboration offline.</span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={onReconnect}
          style={{
            background: '#92400E', color: 'white', border: 'none',
            borderRadius: '6px', padding: '6px 12px', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          Reconnect
        </button>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent', color: '#92400E', border: 'none',
            cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
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
