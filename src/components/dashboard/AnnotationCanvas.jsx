import { useEffect, useRef } from 'react';

export default function AnnotationCanvas({
  pageNum,
  isActive,
  initCanvas,
  startDrawing,
  draw,
  stopDrawing,
  drawMode,
}) {
  const canvasRef = useRef(null);
  const resizeObserver = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Initialize canvas
    initCanvas(pageNum, canvas);
    
    // Re-initialize on resize
    resizeObserver.current = new ResizeObserver(() => {
      initCanvas(pageNum, canvas);
    });
    resizeObserver.current.observe(canvas.parentElement);
    
    return () => {
      resizeObserver.current?.disconnect();
    };
  }, [pageNum, initCanvas]);

  const getCursor = () => {
    if (!isActive) return 'default';
    if (drawMode === 'eraser') return 'grab';
    if (drawMode === 'text') return 'text';
    return 'crosshair';
  };

  return (
    <canvas
      ref={canvasRef}
      className="luter-annotation-canvas"
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        borderRadius: 'inherit',
        pointerEvents: isActive ? 'auto' : 'none',
        cursor: getCursor(),
        zIndex: 80,
        touchAction: 'none',
      }}
      onMouseDown={e => startDrawing(e, pageNum)}
      onMouseMove={e => draw(e, pageNum)}
      onMouseUp={e => stopDrawing(e, pageNum)}
      onMouseLeave={e => stopDrawing(e, pageNum)}
      onTouchStart={e => startDrawing(e, pageNum)}
      onTouchMove={e => draw(e, pageNum)}
      onTouchEnd={e => stopDrawing(e, pageNum)}
    />
  );
}
