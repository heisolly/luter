import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Page } from 'react-pdf';
import { ChatCircle } from '@phosphor-icons/react';
import { useOthers, useUpdateMyPresence } from '../CollaborationProvider';
import { useInView } from 'react-intersection-observer';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PdfPageWrapper ErrorBoundary caught an error rendering <Page>:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          width: this.props.width || '100%', 
          minHeight: 800, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8717111',
          border: '1px dashed #f87171',
          borderRadius: '8px',
          color: '#ef4444',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontWeight: 600 }}>Failed to render page</div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>This page contains unsupported fonts or corrupted elements.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
const RemoteStrokesOverlay = React.memo(({ pageNumber, scale }) => {
  const others = useOthers();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Use devicePixelRatio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    } else {
      // Just clear if size didn't change, but we need to reset transform to clear fully
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
    }

    others.forEach(({ presence }) => {
      const activeStroke = presence?.activeStroke;
      if (activeStroke && activeStroke.pageNumber === pageNumber && activeStroke.points && activeStroke.points.length > 1) {
        if (activeStroke.tool === 'occlusion') return;
        
        ctx.beginPath();
        ctx.strokeStyle = activeStroke.color;
        ctx.lineWidth = activeStroke.width * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        activeStroke.points.forEach((point, i) => {
          const x = point.x * scale;
          const y = point.y * scale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    });
  });

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  );
});

const PdfPageWrapper = React.memo(function PdfPageWrapper({
  pageNumber,
  scale,
  pageWidth,
  activeTool,
  activeColor,
  activeStrokeWidth,
  highlights,
  strokes,
  onAddHighlight,
  onAddStroke,
  onAddPin,
  onRemoveStroke,
  onAnnotationClick,
  activeAnnotationId,
  isDark
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const updateMyPresence = useUpdateMyPresence();

  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
    rootMargin: '600px 0px', // Pre-load 600px before scrolling into view
  });

  const setRefs = useCallback(
    (node) => {
      containerRef.current = node;
      inViewRef(node);
    },
    [inViewRef]
  );

  // Sync local stroke to multiplayer presence
  useEffect(() => {
    if (isDrawing && currentStroke && activeTool === 'pen') {
      updateMyPresence({ activeStroke: { ...currentStroke, pageNumber } });
    }
  }, [currentStroke, isDrawing, activeTool, pageNumber, updateMyPresence]);

  // Freehand drawing logic
  const drawEverything = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved pen strokes
    strokes.forEach(stroke => {
      if (stroke.tool === 'occlusion') return; // Occlusions are rendered as divs now
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      stroke.points.forEach((point, i) => {
        const x = point.x * scale;
        const y = point.y * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // Draw current active pen stroke
    if (currentStroke && currentStroke.tool === 'pen') {
      ctx.beginPath();
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.width * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      currentStroke.points.forEach((point, i) => {
        const x = point.x * scale;
        const y = point.y * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [strokes, currentStroke, scale, activeTool]);

  useEffect(() => {
    drawEverything();
  }, [strokes, currentStroke, scale, activeTool, drawEverything]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Unscaled coords
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const handlePointerDown = (e) => {
    if (activeTool === 'pen') {
      setIsDrawing(true);
      const coords = getCanvasCoords(e);
      if (coords) {
        setCurrentStroke({
          color: activeColor,
          width: activeStrokeWidth,
          points: [coords],
          tool: 'pen'
        });
      }
    } else if (activeTool === 'occlusion') {
      setIsDrawing(true);
      const coords = getCanvasCoords(e);
      if (coords) {
        // Store start and current position
        setCurrentStroke({
          color: activeColor, // Occlusion uses selected color
          width: 24, // Fallback width for occlusion
          points: [coords, coords], 
          tool: 'occlusion'
        });
      }
    } else if (activeTool === 'eraser') {
      handleEraser(e);
      setIsDrawing(true); // Treat eraser drag as "drawing" for continuous erase
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
        if (activeTool === 'pen' && currentStroke) {
        const coords = getCanvasCoords(e);
        if (coords) {
          setCurrentStroke(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              points: [...prev.points, coords]
            };
          });
        }
      } else if (activeTool === 'occlusion' && currentStroke) {
      const coords = getCanvasCoords(e);
      if (coords) {
        setCurrentStroke(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            points: [prev.points[0], coords] // Update end point
          };
        });
      }
    } else if (activeTool === 'eraser') {
      handleEraser(e);
    }
  };

  const handlePointerUp = () => {
    if (activeTool === 'pen' && currentStroke && currentStroke.points.length > 1) {
      onAddStroke(pageNumber, currentStroke);
    } else if (activeTool === 'occlusion' && currentStroke) {
      const p1 = currentStroke.points[0];
      const p2 = currentStroke.points[1];
      // Only add if it has some width/height
      if (Math.abs(p1.x - p2.x) > 2 && Math.abs(p1.y - p2.y) > 2) {
        onAddStroke(pageNumber, currentStroke);
      }
    }
    setIsDrawing(false);
    setCurrentStroke(null);
    updateMyPresence({ activeStroke: null });
  };

  const handleEraser = (e) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    
    const eraserRadius = 15 / scale; // Radius in unscaled coords

    // Find first stroke that intersects with eraser
    const strokeToRemove = strokes.find(stroke => {
      return stroke.points.some(p => {
        const dx = p.x - coords.x;
        const dy = p.y - coords.y;
        return Math.sqrt(dx * dx + dy * dy) <= eraserRadius;
      });
    });

    if (strokeToRemove) {
      onRemoveStroke(strokeToRemove.id);
    }
  };

  return (
    <div 
      ref={setRefs}
      className="pdf-page-wrapper"
      onClick={(e) => {
        if (activeTool === 'pin') {
          const coords = getCanvasCoords(e);
          if (coords) {
            onAddPin?.(pageNumber, coords, { x: e.clientX, y: e.clientY });
          }
        }
      }}
      style={{ 
        position: 'relative', 
        marginBottom: '32px', 
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        backgroundColor: isDark ? '#1a1a1a' : 'white',
        cursor: activeTool === 'pin' ? 'crosshair' : 'default',
        minHeight: isLoaded ? undefined : (pageWidth ? `${pageWidth * 0.75}px` : '800px'),
        width: pageWidth ? `${pageWidth}px` : '100%',
      }}
      data-page-number={pageNumber}
    >
      {inView ? (
        <div style={{ 
          filter: isDark ? 'invert(0.92) hue-rotate(180deg)' : 'none',
          transition: 'filter 0.3s ease'
        }}>
          <PageErrorBoundary width={pageWidth}>
            <Page 
              pageNumber={pageNumber} 
              scale={scale} 
              width={pageWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true} // Needed for native links
              onRenderSuccess={() => {
                // Sync canvas size to page size exactly
                const canvas = canvasRef.current;
                const container = containerRef.current;
                if (canvas && container) {
                   const pageCanvas = container.querySelector('.react-pdf__Page__canvas');
                   if (pageCanvas) {
                     canvas.width = pageCanvas.width;
                     canvas.height = pageCanvas.height;
                     canvas.style.width = pageCanvas.style.width;
                     canvas.style.height = pageCanvas.style.height;
                   }
                }
                setIsLoaded(true);
                setTimeout(drawEverything, 50);
              }}
            />
          </PageErrorBoundary>
        </div>
      ) : null}
      
      {/* Highlights Layer */}
      <div 
        className="highlights-layer" 
        style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          pointerEvents: 'none',
          zIndex: 10 
        }}
      >
        {highlights.map(h => {
          const minX = Math.min(...h.rects.map(r => r.x));
          const minY = Math.min(...h.rects.map(r => r.y));
          const maxX = Math.max(...h.rects.map(r => r.x + r.width));
          const maxY = Math.max(...h.rects.map(r => r.y + r.height));
          const isActive = h.id === activeAnnotationId;

          if (h.style === 'pin') {
            const rect = h.rects[0];
            return (
              <div
                key={h.id}
                style={{
                  position: 'absolute',
                  left: rect.x * scale,
                  top: rect.y * scale,
                  transform: 'translate(-50%, -100%)', // Point of pin is at the coordinate
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  zIndex: 15,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))',
                  animation: 'toolboxAppear 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAnnotationClick?.(e, 'comment_dot', h); // Open comment popup directly
                }}
              >
                {/* Pin Head */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: h.color || '#FCD34D',
                  border: '2px solid rgba(255,255,255,0.8)',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {h.comment && <div style={{
                    width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', transform: 'rotate(45deg)'
                  }} />}
                </div>
              </div>
            );
          }

          return (
            <React.Fragment key={h.id}>
              {h.rects.map((rect, i) => {
                let rectStyle = {
                  position: 'absolute',
                  left: rect.x * scale,
                  top: rect.y * scale,
                  width: rect.width * scale,
                  height: rect.height * scale,
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                };

                if (h.style === 'underline') {
                  rectStyle.borderBottom = `2px solid ${h.color}`;
                  rectStyle.backgroundColor = 'transparent';
                } else if (h.style === 'strike') {
                  rectStyle.backgroundColor = 'transparent';
                  rectStyle.background = `linear-gradient(to bottom, transparent 45%, ${h.color} 45%, ${h.color} 55%, transparent 55%)`;
                } else {
                  rectStyle.backgroundColor = h.color;
                  rectStyle.opacity = 0.4;
                }

                return (
                  <div
                    key={i}
                    style={rectStyle}
                    onClick={(e) => onAnnotationClick?.(e, 'highlight', h)}
                  />
                );
              })}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: minX * scale - 2,
                    top: minY * scale - 2,
                    width: (maxX - minX) * scale + 4,
                    height: (maxY - minY) * scale + 4,
                    border: '2px solid #3B82F6',
                    pointerEvents: 'none',
                    zIndex: 11
                  }}
                />
              )}
              {h.comment && (
                <div
                  style={{
                    position: 'absolute',
                    left: minX * scale - 12,
                    top: minY * scale - 12,
                    width: 24, height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#FEF08A',
                    border: '1px solid #EAB308',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#854D0E',
                    zIndex: 12,
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnnotationClick?.(e, 'comment_dot', h);
                  }}
                >
                  <ChatCircle size={14} weight="fill" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Occlusions Layer */}
      <div 
        className="occlusions-layer" 
        style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          pointerEvents: 'none',
          zIndex: 15 
        }}
      >
        {strokes.filter(s => s.tool === 'occlusion').map(s => {
          const p1 = s.points[0];
          const p2 = s.points[1];
          const x = Math.min(p1.x, p2.x);
          const y = Math.min(p1.y, p2.y);
          const w = Math.abs(p1.x - p2.x);
          const h = Math.abs(p1.y - p2.y);
          
          return (
            <div
              key={s.id}
              style={{
                position: 'absolute',
                left: x * scale,
                top: y * scale,
                width: w * scale,
                height: h * scale,
                backgroundColor: s.color,
                pointerEvents: 'auto',
                cursor: 'pointer'
              }}
              onClick={(e) => onAnnotationClick?.(e, 'stroke', s)}
            />
          );
        })}
        {/* Drawing current occlusion box */}
        {currentStroke && currentStroke.tool === 'occlusion' && currentStroke.points.length === 2 && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(currentStroke.points[0].x, currentStroke.points[1].x) * scale,
              top: Math.min(currentStroke.points[0].y, currentStroke.points[1].y) * scale,
              width: Math.abs(currentStroke.points[0].x - currentStroke.points[1].x) * scale,
              height: Math.abs(currentStroke.points[0].y - currentStroke.points[1].y) * scale,
              backgroundColor: currentStroke.color,
              opacity: 0.8
            }}
          />
        )}
      </div>

      {/* Annotation Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: (activeTool === 'pen' || activeTool === 'eraser' || activeTool === 'occlusion') ? 'auto' : 'none',
          zIndex: 20,
          touchAction: 'none', // Prevent scrolling while drawing
          userSelect: 'none', // Prevent text selection while drawing
          cursor: (activeTool === 'occlusion' || activeTool === 'pen') ? 'crosshair' : 'default'
        }}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  if (prevProps.pageNumber !== nextProps.pageNumber) return false;
  if (prevProps.scale !== nextProps.scale) return false;
  if (prevProps.pageWidth !== nextProps.pageWidth) return false;
  if (prevProps.activeTool !== nextProps.activeTool) return false;
  if (prevProps.activeColor !== nextProps.activeColor) return false;
  if (prevProps.activeStrokeWidth !== nextProps.activeStrokeWidth) return false;
  if (prevProps.isDark !== nextProps.isDark) return false;
  if (prevProps.activeAnnotationId !== nextProps.activeAnnotationId) return false;
  if (prevProps.highlights.length !== nextProps.highlights.length) return false;
  if (prevProps.strokes.length !== nextProps.strokes.length) return false;
  
  for (let i = 0; i < prevProps.highlights.length; i++) {
    if (prevProps.highlights[i].id !== nextProps.highlights[i].id) return false;
    if (prevProps.highlights[i].color !== nextProps.highlights[i].color) return false;
    if (prevProps.highlights[i].comment !== nextProps.highlights[i].comment) return false;
  }
  for (let i = 0; i < prevProps.strokes.length; i++) {
    if (prevProps.strokes[i].id !== nextProps.strokes[i].id) return false;
    if (prevProps.strokes[i].color !== nextProps.strokes[i].color) return false;
    if (prevProps.strokes[i].comment !== nextProps.strokes[i].comment) return false;
  }
  return true;
});

export default PdfPageWrapper;
