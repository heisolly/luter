import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Page } from 'react-pdf';
import { ChatCircle } from '@phosphor-icons/react';

export default function PdfPageWrapper({
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
  onRemoveStroke,
  onAnnotationClick,
  activeAnnotationId,
  isDark
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(null);

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
      ref={containerRef}
      className="pdf-page-wrapper"
      style={{ 
        position: 'relative', 
        marginBottom: '32px', 
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        backgroundColor: isDark ? '#1a1a1a' : 'white'
      }}
      data-page-number={pageNumber}
    >
      <div style={{ 
        filter: isDark ? 'invert(0.92) hue-rotate(180deg)' : 'none',
        transition: 'filter 0.3s ease'
      }}>
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
            setTimeout(drawEverything, 50);
          }}
        />
      </div>
      
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
}
