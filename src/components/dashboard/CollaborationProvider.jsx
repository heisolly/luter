import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { SupabaseProvider as YSupabaseProvider } from '@supabase-labs/y-supabase';
import { IndexeddbPersistence } from 'y-indexeddb';
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

    // Initialize y-supabase purely for syncing the document
    const newProvider = new YSupabaseProvider(actualRoomId, doc, supabase, {
      awareness: false, // Explicitly disable since v0.1.0 doesn't support it well
      persistence: { table: 'yjs_documents' }
    });
    setProvider(newProvider);

    // Initialize offline indexeddb provider
    const idbProvider = new IndexeddbPersistence(actualRoomId, doc);

    // Initialize official y-protocols awareness
    const aw = new Awareness(doc);
    setAwareness(aw);

    // Create Supabase Channel for native Presence
    const channel = supabase.channel(`presence_${actualRoomId}`, {
      config: { presence: { key: aw.clientID.toString() } }
    });

    const parsedPresence = initialPresence || {};
    const parsedUserInfo = userInfo || null;

    // Whenever local awareness changes, track it to the channel
    const handleAwarenessUpdate = ({ added, updated, removed }, origin) => {
      if (origin === 'local') {
        const localState = aw.getLocalState();
        if (channel.state === 'joined') {
          channel.track({ clientID: aw.clientID, state: localState || {} }).catch(console.error);
        }
      }
      setAwarenessStates(new Map(aw.getStates()));
    };

    aw.on('change', handleAwarenessUpdate);

    // Initial state setup
    aw.setLocalStateField('user', {
      info: parsedUserInfo,
      presence: parsedPresence
    });
    setAwarenessStates(new Map(aw.getStates()));

    // When remote presence updates arrive, apply them to awareness
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      
      Object.entries(presenceState).forEach(([key, clients]) => {
        clients.forEach(client => {
          if (client.clientID && client.clientID !== aw.clientID) {
            aw.setLocalState(client.clientID, client.state);
          }
        });
      });
      setAwarenessStates(new Map(aw.getStates()));
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const local = aw.getLocalState();
        if (local) {
          channel.track({ clientID: aw.clientID, state: local }).catch(console.error);
        }
      }
    });

    return () => {
      aw.off('change', handleAwarenessUpdate);
      aw.destroy();
      channel.unsubscribe();
      newProvider.destroy();
      idbProvider.destroy();
      doc.destroy();
    };
  }, [actualRoomId]);

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

export function useYMap(name) {
  const { yDoc } = useCollaboration();
  const [state, setState] = useState({});

  useEffect(() => {
    if (!yDoc) return;
    const yMap = yDoc.getMap(name);
    
    setState(yMap.toJSON());

    const observer = () => {
      setState(yMap.toJSON());
    };
    yMap.observeDeep(observer);

    return () => {
      yMap.unobserveDeep(observer);
    };
  }, [yDoc, name]);

  const map = yDoc ? yDoc.getMap(name) : null;
  return { map, state };
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

export function useThreads() { return { threads: [] }; }
export function useSyncStatus() { return 'synchronized'; }

export function ClientSideSuspense({ fallback, children }) {
  return children;
}
export function useBroadcastEvent() { return () => {}; }
export function useEventListener() { return () => {}; }
export function useOthersMapped(selector) { return []; }
export function useCreateThread() { return () => {}; }

// Dummy exports to fix build until Whiteboard is migrated to Yjs
export class LiveList {
  constructor(data = []) { this.data = data; }
  push(item) { this.data.push(item); }
  clear() { this.data = []; }
  toArray() { return this.data; }
}
export class LiveObject {
  constructor(data = {}) { this.data = data; }
  update(newData) { Object.assign(this.data, newData); }
  toObject() { return this.data; }
}
export function useStorage(selector) {
  // Return dummy data so it doesn't block loading
  if (selector.toString().includes('whiteboardData')) return new LiveList();
  if (selector.toString().includes('whiteboardAppState')) return new LiveObject();
  if (selector.toString().includes('whiteboardFiles')) return new LiveObject();
  return null;
}
export function useMutation(callback, deps) {
  return () => {};
}

