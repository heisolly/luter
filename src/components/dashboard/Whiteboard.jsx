import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Excalidraw, WelcomeScreen, Footer } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { LiveList, LiveObject } from '@liveblocks/client';
import { useStorage, useMutation, useSelf, useStatus, useOthers, useUpdateMyPresence } from '../../liveblocks.config';

// ─── tiny debounce helper ────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timer = useRef(null);
  const debounced = useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
  debounced.cancel = () => clearTimeout(timer.current);
  return debounced;
}

// ─── CSS injected once to rebrand Excalidraw → Luter ─────────────────
const LUTER_BRAND_STYLE = `
  /* ── Hide Excalidraw branding & external links ── */
  .excalidraw .encrypted-icon,
  .excalidraw [href*="excalidraw.com"],
  .excalidraw [href*="github.com"],
  .excalidraw [href*="twitter.com"],
  .excalidraw [href*="discord"],
  .excalidraw .social-icons,
  .excalidraw .excalidraw-link,
  .excalidraw .HelpButton,
  .excalidraw .help-icon,
  .excalidraw footer a,
  a[href*="excalidraw"],
  a[href*="github.com/excalidraw"],
  .excalidraw__canvas-actions a,
  .welcome-screen-center__menu-item--help {
    display: none !important;
  }

  /* ── Ensure canvas fills the container ── */
  .luter-whiteboard-root {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .luter-whiteboard-root .excalidraw-wrapper {
    flex: 1;
    height: 100%;
  }
  .luter-whiteboard-root .excalidraw {
    height: 100%;
  }

  .luter-whiteboard-root .excalidraw,
  .luter-whiteboard-root .excalidraw__canvas {
    border-radius: inherit;
  }

  .luter-whiteboard-root .excalidraw .Island,
  .luter-whiteboard-root .excalidraw .Stack.Stack_horizontal,
  .luter-whiteboard-root .excalidraw .App-menu_top {
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08) !important;
  }

  .luter-whiteboard-root .excalidraw .Island {
    border: 1px solid rgba(226, 232, 240, 0.92) !important;
  }

  /* ── Subtle Luter purple accent on active tool ── */
  .excalidraw .ToolIcon.is-selected .ToolIcon__icon {
    background: rgba(124, 58, 237, 0.12) !important;
    border-radius: 8px;
  }
  .excalidraw .ToolIcon.is-selected svg {
    color: #7C3AED !important;
  }

  /* ── Responsive spacing from bottom navigation on mobile/tablet ── */
  @media (max-width: 1024px) {
    .luter-whiteboard-root {
      padding-bottom: 74px !important;
    }
  }
`;

let brandStyleInjected = false;
function injectBrandStyle() {
  if (brandStyleInjected) return;
  const el = document.createElement('style');
  el.id = 'luter-board-brand';
  el.textContent = LUTER_BRAND_STYLE;
  document.head.appendChild(el);
  brandStyleInjected = true;
}

// ─── Main Component ────────────────────────────────────────────────────
export const Whiteboard = ({ isCollaborative = true, roomId }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const isRemoteUpdate = useRef(false);
  const isInitialized = useRef(false);

  // Simplify WelcomeScreen handling to avoid undefined component errors
  const WS = null;
  const SafeFooter = Footer || (Excalidraw ? Excalidraw.Footer : null);


  // Inject brand CSS once
  useEffect(() => { injectBrandStyle(); }, []);

  // Liveblocks storage
  const storedElements  = useStorage((root) => root.whiteboardData);
  const storedAppState  = useStorage((root) => root.whiteboardAppState);
  const storedFiles     = useStorage((root) => root.whiteboardFiles);
  const status          = useStatus();
  const isStorageLoaded = !isCollaborative || (
    status === 'connected' &&
    storedElements !== undefined &&
    storedAppState !== undefined &&
    storedFiles !== undefined
  );
  const isStorageLoadedRef = useRef(false);
  const self            = useSelf();
  const others          = useOthers();
  const updatePresence  = useUpdateMyPresence();
  const userRole        = self?.presence?.role;

  const isWorkstationRoom = roomId?.startsWith('luter-material-') || roomId?.startsWith('luter-course-');
  const canDraw = !isCollaborative || userRole === 'presenter' || (isWorkstationRoom && !userRole) || true; // solo = always can draw

  // ── Liveblocks mutations ──────────────────────────────────────────
  const updateElements = useMutation(({ storage }, newElements) => {
    if (!storage) return;
    const data = storage.get('whiteboardData');
    if (!data || typeof data.clear !== 'function') {
      storage.set('whiteboardData', new LiveList(newElements));
      return;
    }
    data.clear();
    newElements.forEach((el) => data.push(el));
  }, []);

  const updateAppState = useMutation(({ storage }, newState) => {
    if (!storage) return;
    const obj = storage.get('whiteboardAppState');
    if (obj instanceof LiveObject) {
      obj.update({ scrollX: newState.scrollX, scrollY: newState.scrollY, zoom: newState.zoom });
    } else {
      storage.set('whiteboardAppState', new LiveObject({
        scrollX: newState.scrollX,
        scrollY: newState.scrollY,
        zoom: newState.zoom,
      }));
    }
  }, []);

  const updateFiles = useMutation(({ storage }, newFiles) => {
    if (!storage) return;
    const obj = storage.get('whiteboardFiles');
    if (obj instanceof LiveObject) {
      obj.update(newFiles);
    } else {
      storage.set('whiteboardFiles', new LiveObject(newFiles));
    }
  }, []);

  useEffect(() => {
    isStorageLoadedRef.current = isStorageLoaded;
  }, [isStorageLoaded]);

  const safeUpdateElements = useCallback((newElements) => {
    if (!isStorageLoadedRef.current) return;
    try {
      updateElements(newElements);
    } catch (error) {
      if (!String(error?.message || '').includes('storage has been loaded')) {
        console.warn('Whiteboard elements sync skipped:', error);
      }
    }
  }, [updateElements]);

  const safeUpdateAppState = useCallback((newState) => {
    if (!isStorageLoadedRef.current) return;
    try {
      updateAppState(newState);
    } catch (error) {
      if (!String(error?.message || '').includes('storage has been loaded')) {
        console.warn('Whiteboard viewport sync skipped:', error);
      }
    }
  }, [updateAppState]);

  const safeUpdateFiles = useCallback((newFiles) => {
    if (!isStorageLoadedRef.current) return;
    try {
      updateFiles(newFiles);
    } catch (error) {
      if (!String(error?.message || '').includes('storage has been loaded')) {
        console.warn('Whiteboard file sync skipped:', error);
      }
    }
  }, [updateFiles]);

  const debouncedUpdateElements = useDebounce(safeUpdateElements, 80);
  const debouncedUpdateAppState = useDebounce(safeUpdateAppState, 300);
  const debouncedUpdateFiles    = useDebounce(safeUpdateFiles, 150);
  const lastSavedElements  = useRef('[]');
  const lastSavedAppState  = useRef(null);

  const collaborators = React.useMemo(() => {
    const map = new Map();
    others.forEach((other) => {
      const presence = other.presence || {};
      const user = presence.user || other.info || {};
      const cursor = presence.boardCursor || presence.cursor;
      if (!cursor) return;

      const color = user.color || '#7C3AED';
      map.set(String(other.connectionId), {
        id: user.id || String(other.connectionId),
        socketId: String(other.connectionId),
        username: user.name || 'Peer',
        avatarUrl: user.avatar || null,
        pointer: {
          x: cursor.x,
          y: cursor.y,
          tool: cursor.tool || 'pointer',
          renderCursor: true,
        },
        button: presence.boardButton || 'up',
        color: {
          background: color,
          stroke: color,
        },
      });
    });
    return map;
  }, [others]);

  // Helper to load files synchronously for initialData
  const getInitialFiles = () => {
    let files = {};
    try {
      const localKey = `luter-board-files-${roomId}`;
      files = JSON.parse(localStorage.getItem(localKey) || '{}');
    } catch (e) {}
    if (storedFiles) {
      files = { ...files, ...storedFiles };
    }
    return Object.keys(files).length > 0 ? files : undefined;
  };

  // ── Sync remote elements and files into Excalidraw ─────────────────
  useEffect(() => {
    if (!excalidrawAPI) return;
    if (!isStorageLoaded) return;

    let filesToLoad = {};
    try {
      const localKey = `luter-board-files-${roomId}`;
      const localFiles = JSON.parse(localStorage.getItem(localKey) || '{}');
      filesToLoad = { ...localFiles };
    } catch (e) {
      console.warn("Failed to read whiteboard files from localStorage:", e);
    }

    if (storedFiles) {
      filesToLoad = { ...filesToLoad, ...storedFiles };
    }

    isInitialized.current = true;
    isRemoteUpdate.current = true;
    const elementsToLoad = storedElements || [];
    const str = JSON.stringify(elementsToLoad);
    lastSavedElements.current = str;

    excalidrawAPI.updateScene({
      elements: elementsToLoad,
      files: Object.keys(filesToLoad).length > 0 ? filesToLoad : undefined,
    });
    setTimeout(() => { isRemoteUpdate.current = false; }, 150);
  }, [storedElements, storedFiles, excalidrawAPI, roomId, isStorageLoaded]);

  useEffect(() => {
    if (!excalidrawAPI) return;
    excalidrawAPI.updateScene({ collaborators });
  }, [collaborators, excalidrawAPI]);

  // ── onChange: push local changes to Liveblocks ───────────────────
  const onChange = useCallback((newElements, newAppState, files) => {
    if (isRemoteUpdate.current) return;
    if (!isStorageLoaded) return;

    const str = JSON.stringify(newElements);
    if (str !== lastSavedElements.current) {
      lastSavedElements.current = str;
      debouncedUpdateElements(newElements);
    }

    const asStr = JSON.stringify({ scrollX: newAppState.scrollX, scrollY: newAppState.scrollY, zoom: newAppState.zoom });
    if (asStr !== lastSavedAppState.current) {
      lastSavedAppState.current = asStr;
      debouncedUpdateAppState(newAppState);
    }

    // Save newly uploaded image files
    if (files && Object.keys(files).length > 0) {
      try {
        const localKey = `luter-board-files-${roomId}`;
        const existingLocal = JSON.parse(localStorage.getItem(localKey) || '{}');
        const updatedLocal = { ...existingLocal, ...files };
        localStorage.setItem(localKey, JSON.stringify(updatedLocal));
      } catch (e) {
        console.warn("Failed to write whiteboard files to localStorage (quota exceeded?):", e);
      }
      debouncedUpdateFiles(files);
    }
  }, [roomId, isStorageLoaded, debouncedUpdateElements, debouncedUpdateAppState, debouncedUpdateFiles]);

  useEffect(() => {
    return () => {
      debouncedUpdateElements.cancel?.();
      debouncedUpdateAppState.cancel?.();
      debouncedUpdateFiles.cancel?.();
    };
  }, [debouncedUpdateElements, debouncedUpdateAppState, debouncedUpdateFiles]);

  const handlePointerUpdate = useCallback(({ pointer, button }) => {
    if (!isCollaborative) return;
    updatePresence({
      boardCursor: pointer ? { x: pointer.x, y: pointer.y, tool: pointer.tool || 'pointer' } : null,
      boardButton: button || 'up',
      currentTool: 'board',
    });
  }, [isCollaborative, updatePresence]);

  useEffect(() => {
    return () => {
      updatePresence({ boardCursor: null, boardButton: 'up' });
    };
  }, [updatePresence]);

  return (
    <div className="luter-whiteboard-root">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          elements: storedElements || [],
          files: getInitialFiles(),
          appState: {
            scrollX: storedAppState?.scrollX ?? 0,
            scrollY: storedAppState?.scrollY ?? 0,
            zoom:    storedAppState?.zoom    ?? { value: 1 },
            viewBackgroundColor: '#FFFFFF',
            zenModeEnabled: false,
            gridSize: null,
            viewModeEnabled: false,
          },
          scrollToContent: true,
        }}
        onChange={onChange}
        onPointerUpdate={handlePointerUpdate}
        isCollaborating={isCollaborative}
        viewModeEnabled={false}
        theme="light"
        langCode="en"
        UIOptions={{
          dockedSidebarBreakpoint: 0,
          canvasActions: {
            export:          { saveFileToDisk: true },
            loadScene:       true,
            saveToActiveFile: false,
            toggleTheme:     true,
            saveAsImage:     true,
            clearCanvas:     true,
          },
          tools: {
            image: true,
          },
        }}
      >
        {/* Welcome screen with Luter branding (no external links) */}
        {WS && WSCenter && (
          <WS>
            {MenuHint && <MenuHint />}
            {ToolbarHint && <ToolbarHint />}
            <WSCenter>
              {Logo && (
                <Logo>
                  {/* Luter logo in place of Excalidraw logo */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 20px', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
                    borderRadius: '16px', color: 'white',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2Z" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5"/>
                      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.02em' }}>Luter Board</span>
                  </div>
                </Logo>
              )}
              {Heading && (
                <Heading>
                  Your collaborative study canvas
                </Heading>
              )}
              {Menu && (
                <Menu>
                  {/* Only show safe menu items — no external links */}
                  {MenuItemLoadScene && <MenuItemLoadScene />}
                </Menu>
              )}
            </WSCenter>
          </WS>
        )}

        {/* Empty footer override to hide real-time sync status completely */}
        {SafeFooter && (
          <SafeFooter>
            <div style={{ display: 'none' }} />
          </SafeFooter>
        )}
      </Excalidraw>
    </div>
  );
};
