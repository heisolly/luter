import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import * as Y from 'yjs';
import { SupabaseProvider as YSupabaseProvider } from '@supabase-labs/y-supabase';
import { supabase } from '../../supabaseClient';

const CollaborationContext = createContext(null);

export function CollaborationProvider({ roomId, id, children, userInfo, initialPresence = {} }) {
  const actualRoomId = roomId || id;
  const [yDoc, setYDoc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [awareness, setAwareness] = useState(null);
  const [awarenessStates, setAwarenessStates] = useState(new Map());

  useEffect(() => {
    if (!actualRoomId) return;

    const doc = new Y.Doc();
    setYDoc(doc);

    const newProvider = new YSupabaseProvider(actualRoomId, doc, supabase, {
      awareness: true,
      persistence: { table: 'yjs_documents' }
    });
    setProvider(newProvider);

    const aw = newProvider.getAwareness();
    setAwareness(aw);

    const handleAwarenessUpdate = () => {
      setAwarenessStates(new Map(aw.getStates()));
    };

    aw.on('change', handleAwarenessUpdate);
    handleAwarenessUpdate();

    return () => {
      aw.off('change', handleAwarenessUpdate);
      newProvider.destroy();
      doc.destroy();
    };
  }, [roomId]);

  // Deep compare dependencies to prevent infinite render loops
  const presenceString = JSON.stringify(initialPresence || {});
  const userInfoString = JSON.stringify(userInfo || null);

  useEffect(() => {
    if (!provider || !awareness) return;

    const parsedPresence = JSON.parse(presenceString);
    const parsedUserInfo = JSON.parse(userInfoString);

    const onStatus = (status) => {
      if (status === 'connected') {
        awareness.setLocalStateField('user', {
          info: parsedUserInfo,
          presence: parsedPresence
        });
      }
    };

    // If already connected, set it immediately
    if (provider.getStatus() === 'connected') {
      awareness.setLocalStateField('user', {
        info: parsedUserInfo,
        presence: parsedPresence
      });
    }

    provider.on('status', onStatus);
    return () => {
      provider.off('status', onStatus);
    };
  }, [provider, awareness, userInfoString, presenceString]);

  const value = useMemo(() => ({
    yDoc,
    provider,
    awareness,
    awarenessStates
  }), [yDoc, provider, awareness, awarenessStates]);

  if (!yDoc || !provider) {
    return <div className="flex h-screen items-center justify-center text-zinc-400">Loading collaborative room...</div>;
  }

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) throw new Error('useCollaboration must be used within CollaborationProvider');
  return context;
}

export function useOthers() {
  const { awareness, awarenessStates } = useCollaboration();
  if (!awareness) return [];
  
  const others = [];
  awarenessStates.forEach((state, clientId) => {
    if (clientId !== awareness.clientID && state.user) {
      others.push({
        connectionId: clientId,
        presence: state.user.presence || {},
        info: state.user.info || {}
      });
    }
  });
  return others;
}

export function useSelf() {
  const { awareness, awarenessStates } = useCollaboration();
  if (!awareness) return null;

  const state = awarenessStates.get(awareness.clientID);
  return {
    connectionId: awareness.clientID,
    presence: state?.user?.presence || {},
    info: state?.user?.info || {}
  };
}

export function useUpdateMyPresence() {
  const { awareness } = useCollaboration();
  
  return useCallback((patch) => {
    if (!awareness) return;
    const currentState = awareness.getLocalState()?.user || {};
    awareness.setLocalStateField('user', {
      ...currentState,
      presence: { ...currentState.presence, ...patch }
    });
  }, [awareness]);
}

export function useStorage(keyOrSelector) {
  const { yDoc } = useCollaboration();
  if (!yDoc) return null;
  if (typeof keyOrSelector === 'string') {
     return yDoc.getMap(keyOrSelector);
  }
  return keyOrSelector(yDoc);
}

export function useMutation(callback, deps = []) {
  const { yDoc, awareness } = useCollaboration();
  return useMemo(() => {
    return (...args) => {
      const context = {
        storage: yDoc,
        self: awareness ? { presence: awareness.getLocalState()?.user?.presence || {} } : {},
      };
      return callback(context, ...args);
    };
  }, [yDoc, awareness, ...deps]);
}

export function useStatus() {
  const { provider } = useCollaboration();
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    if (!provider) return;
    const handleStatus = (newStatus) => setStatus(newStatus);
    provider.on('status', handleStatus);
    setStatus(provider.getStatus() || 'connecting');
    return () => provider.off('status', handleStatus);
  }, [provider]);

  return status;
}

export const RoomProvider = CollaborationProvider;
export const LiveList = Y.Array;
export const LiveObject = Y.Map;
export function useThreads() { return { threads: [] }; }
export function useSyncStatus() { return 'synchronized'; }

export function ClientSideSuspense({ fallback, children }) {
  // Yjs provider doesn't strictly suspend, we just render children
  return children;
}
export function useBroadcastEvent() { return () => {}; }
export function useEventListener() { return () => {}; }
export function useOthersMapped(selector) { return []; }
export function useCreateThread() { return () => {}; }
