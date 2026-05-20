import React from 'react';
import { RoomProvider } from '../../liveblocks.config';
import { LiveObject, LiveList } from '@liveblocks/client';

const userColors = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2'];

function colorFromId(id = 'peer') {
  return userColors[String(id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % userColors.length];
}

/**
 * CollaborationProvider wraps the Workstation in a Liveblocks Room.
 * Room ID is derived from the materialId or a custom sessionId.
 * 
 * Storage layout (shared between all users in the room):
 *  - whiteboardData      LiveList   — Excalidraw elements
 *  - whiteboardAppState  LiveObject — Excalidraw app state
 *  - syncMode            boolean    — Whether slide sync is on
 *  - presenterId         string|null — Who is presenting
 *  - presenterSlide      number     — Current slide of presenter
 *  - messages            LiveList   — Group chat messages
 *  - annotations         LiveList   — Shared PDF highlights
 *  - quizState           string     — 'idle'|'generating'|'active'|'results'
 *  - quizQuestions       LiveList   — Quiz questions array
 *  - quizCurrentIdx      number     — Current question index
 *  - quizScores          LiveObject — Map of connectionId → score
 *
 * Presence layout (per-user, ephemeral):
 *  - currentPage  number     — Which page/slide the user is on
 *  - cursor       {x,y}|null — Whiteboard cursor position
 *  - isTyping     boolean    — Whether user is typing in group chat
 *  - status       string     — 'active'|'idle'
 *  - role         string     — 'presenter'|'participant' (set by app logic)
 */
export const CollaborationProvider = ({ roomId, children, userInfo = {}, initialPresence = {} }) => {
  if (!roomId) return children;

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
        // Whiteboard
        whiteboardData: new LiveList([]),
        whiteboardAppState: new LiveObject({}),
        whiteboardFiles: new LiveObject({}),

        // Slide sync
        syncMode: false,
        presenterId: null,
        presenterSlide: 1,
        syncState: new LiveObject({
          isSynced: false,
          leaderId: null,
          currentSlide: 0,
        }),

        // Group chat
        messages: new LiveList([]),

        // Annotations / highlights
        annotations: new LiveList([]),

        // Group quiz
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
};
