import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Excalidraw, WelcomeScreen, Footer } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { LiveList, LiveObject } from '@liveblocks/client';
import { useStorage, useMutation, useSelf, useStatus } from '../../liveblocks.config';

// ─── tiny debounce helper ────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
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

  /* ── Replace "Excalidraw" text label with "Luter Board" ── */
  .excalidraw .app-menu__label {
    visibility: hidden;
    position: relative;
  }
  .excalidraw .app-menu__label::after {
    content: 'Luter Board';
    visibility: visible;
    position: absolute;
    left: 0;
    top: 0;
    font-weight: 700;
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

  /* ── Subtle Luter purple accent on active tool ── */
  .excalidraw .ToolIcon.is-selected .ToolIcon__icon {
    background: rgba(124, 58, 237, 0.12) !important;
    border-radius: 8px;
  }
  .excalidraw .ToolIcon.is-selected svg {
    color: #7C3AED !important;
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

  // Inject brand CSS once
  useEffect(() => { injectBrandStyle(); }, []);

  // Liveblocks storage
  const storedElements  = useStorage((root) => root.whiteboardData);
  const storedAppState  = useStorage((root) => root.whiteboardAppState);
  const status          = useStatus();
  const isStorageLoaded = status === 'connected';
  const self            = useSelf();
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

  const debouncedUpdateElements = useDebounce(updateElements, 80);
  const debouncedUpdateAppState = useDebounce(updateAppState, 300);
  const lastSavedElements  = useRef('[]');
  const lastSavedAppState  = useRef(null);

  // ── Sync remote elements into Excalidraw ─────────────────────────
  useEffect(() => {
    if (!excalidrawAPI || !storedElements) return;
    isInitialized.current = true;
    isRemoteUpdate.current = true;
    const str = JSON.stringify(storedElements);
    lastSavedElements.current = str;
    excalidrawAPI.updateScene({ elements: storedElements });
    setTimeout(() => { isRemoteUpdate.current = false; }, 150);
  }, [storedElements, excalidrawAPI]);

  // ── onChange: push local changes to Liveblocks ───────────────────
  const onChange = useCallback((newElements, newAppState) => {
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
  }, [isStorageLoaded, debouncedUpdateElements, debouncedUpdateAppState]);

  return (
    <div className="luter-whiteboard-root">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          elements: storedElements || [],
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
        viewModeEnabled={false}
        theme="light"
        name="Luter Board"
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
        <WelcomeScreen>
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.ZoomHint />
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Logo>
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
            </WelcomeScreen.Center.Logo>
            <WelcomeScreen.Center.Heading>
              Your collaborative study canvas
            </WelcomeScreen.Center.Heading>
            <WelcomeScreen.Center.Menu>
              {/* Only show safe menu items — no external links */}
              <WelcomeScreen.Center.MenuItemLoadScene />
            </WelcomeScreen.Center.Menu>
          </WelcomeScreen.Center>
        </WelcomeScreen>

        {/* Custom footer showing sync status, no external links */}
        <Footer>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '12px',
            background: self ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
            border: `1px solid ${self ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.3)'}`,
            fontSize: '11px', fontWeight: 700,
            color: self ? '#059669' : '#94A3B8',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: self ? '#10B981' : '#94A3B8',
              boxShadow: self ? '0 0 0 2px rgba(16,185,129,0.25)' : 'none',
            }} />
            {self ? 'Real-time sync active' : 'Working locally…'}
          </div>
        </Footer>
      </Excalidraw>
    </div>
  );
};
