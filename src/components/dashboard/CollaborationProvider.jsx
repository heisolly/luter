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
    let idbProvider = null;
    try {
      idbProvider = new IndexeddbPersistence(actualRoomId, doc);
    } catch (error) {
      console.warn("IndexeddbPersistence failed to initialize:", error);
    }

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
      if (idbProvider) idbProvider.destroy();
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

// Liveblocks compatibility wrappers backed by Yjs
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

export class YjsLiveList {
  constructor(yArray) {
    this.yArray = yArray;
  }
  push(item) {
    this.yArray.push([item]);
  }
  clear() {
    this.yArray.delete(0, this.yArray.length);
  }
  toArray() {
    return this.yArray.toArray();
  }
  get length() {
    return this.yArray.length;
  }
}

export class YjsLiveObject {
  constructor(yMap) {
    this.yMap = yMap;
  }
  set(key, value) {
    this.yMap.set(key, value);
  }
  delete(key) {
    this.yMap.delete(key);
  }
  get(key) {
    return this.yMap.get(key);
  }
  update(newData) {
    this.yMap.doc.transact(() => {
      Object.entries(newData).forEach(([k, v]) => {
        this.yMap.set(k, v);
      });
    });
  }
  toObject() {
    return this.yMap.toJSON();
  }
}

export function useStorage(selector) {
  const context = useContext(CollaborationContext);
  const yDoc = context?.yDoc;

  // Trigger component re-render when Yjs doc updates
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!yDoc) return;
    const handleUpdate = () => {
      setTick(t => t + 1);
    };
    yDoc.on('update', handleUpdate);
    return () => {
      yDoc.off('update', handleUpdate);
    };
  }, [yDoc]);

  // Whiteboard Yjs live wrappers
  const selStr = selector.toString();
  if (selStr.includes('whiteboardData')) {
    return yDoc ? new YjsLiveList(yDoc.getArray('whiteboardData')) : new LiveList();
  }
  if (selStr.includes('whiteboardAppState')) {
    return yDoc ? new YjsLiveObject(yDoc.getMap('whiteboardAppState')) : new LiveObject();
  }
  if (selStr.includes('whiteboardFiles')) {
    return yDoc ? new YjsLiveObject(yDoc.getMap('whiteboardFiles')) : new LiveObject();
  }

  if (!yDoc) return null;

  // Create a Liveblocks-compatible root proxy
  const rootProxy = new Proxy(yDoc, {
    get(target, prop) {
      if (prop === 'getArray') {
        return (name) => target.getArray(name);
      }
      if (prop === 'getMap') {
        return (name) => target.getMap(name);
      }

      // Check if it is a known Array property in the codebase:
      // 'messages', 'quizQuestions', 'flashcards'
      if (prop === 'messages' || prop === 'quizQuestions' || prop === 'flashcards') {
        const yArray = target.getArray(prop);
        return yArray.toArray(); // useStorage returns a plain array/object for selection
      }

      // Check if it is a known Map property in the codebase:
      // 'quizScores', 'raisedHands', 'syncState'
      if (prop === 'quizScores' || prop === 'raisedHands' || prop === 'syncState') {
        const yMap = target.getMap(prop);
        return yMap.toJSON();
      }

      // Default: check shared_metadata Map
      const sharedMetadata = target.getMap('shared_metadata');
      return sharedMetadata.get(prop);
    }
  });

  try {
    return selector(rootProxy);
  } catch (e) {
    console.error("useStorage selector failed:", e);
    return null;
  }
}

export function useMutation(callback, deps) {
  const context = useContext(CollaborationContext);
  const yDoc = context?.yDoc;

  return useCallback((...args) => {
    if (!yDoc) return;

    // Create a storage proxy that behaves like Liveblocks root object in mutation context
    const storageProxy = {
      get(key) {
        // Return wrapped LiveList / LiveObject so it has the mutation methods (like push, update, set)
        if (key === 'messages' || key === 'quizQuestions' || key === 'flashcards' || key === 'whiteboardData') {
          const yArray = yDoc.getArray(key);
          return new YjsLiveList(yArray);
        }
        if (key === 'quizScores' || key === 'raisedHands' || key === 'syncState' || key === 'whiteboardAppState' || key === 'whiteboardFiles') {
          const yMap = yDoc.getMap(key);
          return new YjsLiveObject(yMap);
        }
        
        // Default: return value from shared_metadata map
        const sharedMetadata = yDoc.getMap('shared_metadata');
        return sharedMetadata.get(key);
      },
      set(key, value) {
        yDoc.transact(() => {
          let cleanValue = value;
          if (value && typeof value.toObject === 'function') {
            cleanValue = value.toObject();
          } else if (value && typeof value.toArray === 'function') {
            cleanValue = value.toArray();
          }

          if (key === 'messages' || key === 'quizQuestions' || key === 'flashcards' || key === 'whiteboardData') {
            const yArray = yDoc.getArray(key);
            yArray.delete(0, yArray.length);
            if (Array.isArray(cleanValue)) {
              yArray.push(cleanValue);
            }
          } else if (key === 'quizScores' || key === 'raisedHands' || key === 'syncState' || key === 'whiteboardAppState' || key === 'whiteboardFiles') {
            const yMap = yDoc.getMap(key);
            yMap.clear();
            if (cleanValue && typeof cleanValue === 'object') {
              Object.entries(cleanValue).forEach(([k, v]) => {
                yMap.set(k, v);
              });
            }
          } else {
            const sharedMetadata = yDoc.getMap('shared_metadata');
            sharedMetadata.set(key, cleanValue);
          }
        });
      },
      delete(key) {
        yDoc.transact(() => {
          const sharedMetadata = yDoc.getMap('shared_metadata');
          sharedMetadata.delete(key);
        });
      }
    };

    const mutationContext = {
      storage: storageProxy
    };

    yDoc.transact(() => {
      callback(mutationContext, ...args);
    });
  }, [yDoc, callback, ...(deps || [])]);
}


