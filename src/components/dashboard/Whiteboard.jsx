import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Excalidraw, WelcomeScreen } from '@excalidraw/excalidraw';
import "@excalidraw/excalidraw/index.css";
import { LiveList, LiveObject } from '@liveblocks/client';
import { useStorage, useMutation, useSelf, useStatus } from '../../liveblocks.config';

// ─── tiny debounce hook ────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timer = useRef(null)
  return useCallback(
    (...args) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay]
  )
}

export const Whiteboard = ({ isCollaborative = true, roomId }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const isRemoteUpdate = useRef(false);
  const isInitialized = useRef(false);

  // useStorage returns the serialized LiveList value — a plain array for Excalidraw
  const storedElements = useStorage((root) => root.whiteboardData);
  const storedAppState = useStorage((root) => root.whiteboardAppState);

  // Check room status
  const status = useStatus();
  const isStorageLoaded = status === 'connected';

  // Determine role for view-only mode
  const self        = useSelf();
  const userRole    = self?.presence?.role;
  
  const isWorkstationRoom = roomId?.startsWith('luter-material-');
  const canDraw = !isCollaborative || userRole === 'presenter' || (isWorkstationRoom && !userRole);

  const updateElements = useMutation(({ storage }, newElements) => {
    if (!storage) return;
    const whiteboardData = storage.get('whiteboardData');
    if (!whiteboardData || typeof whiteboardData.clear !== 'function') {
      storage.set('whiteboardData', new LiveList(newElements));
      return;
    }
    
    // Simple reconciliation
    whiteboardData.clear();
    newElements.forEach((el) => whiteboardData.push(el));
  }, []);

  const updateAppState = useMutation(({ storage }, newState) => {
    if (!storage) return;
    const obj = storage.get('whiteboardAppState');
    if (obj instanceof LiveObject) {
      obj.update({
        scrollX: newState.scrollX,
        scrollY: newState.scrollY,
        zoom:    newState.zoom,
      });
    } else {
      storage.set('whiteboardAppState', new LiveObject({
        scrollX: newState.scrollX,
        scrollY: newState.scrollY,
        zoom:    newState.zoom,
      }));
    }
  }, []);

  const debouncedUpdateElements = useDebounce(updateElements, 80);
  const debouncedUpdateAppState = useDebounce(updateAppState, 300);
  const lastSavedElements = useRef('[]');
  const lastProcessedAppState = useRef(null);

  // Sync remote changes into Excalidraw
  useEffect(() => {
    if (!excalidrawAPI || !storedElements) return;

    if (!isInitialized.current) {
      isInitialized.current = true;
    }

    isRemoteUpdate.current = true;
    const str = JSON.stringify(storedElements);
    lastSavedElements.current = str;
    
    excalidrawAPI.updateScene({ elements: storedElements });
    // Use a small delay to ensure onChange from updateScene is ignored
    setTimeout(() => {
      isRemoteUpdate.current = false;
    }, 150);
  }, [storedElements, excalidrawAPI]);

  const onChange = useCallback((newElements, newAppState) => {
    if (isRemoteUpdate.current) return;
    if (!isCollaborative || !canDraw) return;
    if (!isStorageLoaded) return;
    
    const elementsStr = JSON.stringify(newElements);
    if (elementsStr !== lastSavedElements.current) {
      lastSavedElements.current = elementsStr;
      debouncedUpdateElements(newElements);
    }
    
    const appStateStr = JSON.stringify(newAppState);
    if (appStateStr !== lastProcessedAppState.current) {
      lastProcessedAppState.current = appStateStr;
      debouncedUpdateAppState(newAppState);
    }
  }, [isCollaborative, canDraw, debouncedUpdateElements, debouncedUpdateAppState, isStorageLoaded]);

  return (
    <div className="luter-whiteboard-container" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '12px', background: '#F8FAFC' }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          elements: storedElements || [],
          appState: {
            scrollX: storedAppState?.scrollX ?? 0,
            scrollY: storedAppState?.scrollY ?? 0,
            zoom:    storedAppState?.zoom    ?? { value: 1 },
            viewBackgroundColor: '#F8FAFC',
            zenModeEnabled: false,
            viewModeEnabled: !canDraw,
          },
          scrollToContent: true,
        }}
        onChange={onChange}
        viewModeEnabled={!canDraw}
        theme="light"
        name="Luter Whiteboard"
        UIOptions={{
          canvasActions: {
            export: { saveFileToDisk: true },
            loadScene: true,
            saveToActiveFile: true,
            toggleTheme: true,
            saveAsImage: true,
          },
        }}
        aiEnabled={true}
      >
        {canDraw && (
          <WelcomeScreen>
            <WelcomeScreen.Hints.MenuHint />
            <WelcomeScreen.Hints.ToolbarHint />
            <WelcomeScreen.Center>
              <WelcomeScreen.Center.Heading>Collaboration Canvas</WelcomeScreen.Center.Heading>
              <WelcomeScreen.Center.Menu>
                <WelcomeScreen.Center.MenuItemHelp />
              </WelcomeScreen.Center.Menu>
            </WelcomeScreen.Center>
          </WelcomeScreen>
        )}
      </Excalidraw>
      
      {/* Connection Status Indicator */}
      <div style={{
        position: 'absolute', bottom: '12px', right: '12px',
        padding: '6px 12px', background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)', borderRadius: '20px',
        fontSize: '11px', fontWeight: 700, display: 'flex',
        alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        zIndex: 10, border: '1px solid #E2E8F0', pointerEvents: 'none',
        color: !self ? '#94A3B8' : '#10B981'
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: !self ? '#94A3B8' : '#10B981' }} />
        {!self ? 'Working Locally (Syncing…)' : 'Real-time Sync Active'}
      </div>

      {/* View-only overlay badge */}
      {!canDraw && (
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'rgba(0,0,0,0.5)', color: 'white',
          fontSize: '11px', fontWeight: 700, padding: '4px 10px',
          borderRadius: '8px', backdropFilter: 'blur(4px)',
          pointerEvents: 'none'
        }}>
          View Only
        </div>
      )}
    </div>
  );
};
