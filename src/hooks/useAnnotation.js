import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useBroadcastEvent, useEventListener } from '../liveblocks.config';

export function useAnnotation({
  fileId,
  userId,
  isActive,
  currentPage,
  totalPages,
}) {
  const canvasRefs = useRef({});
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef([]); // Use ref instead of state to avoid stale closure in stopDrawing
  const startPointRef = useRef(null);
  const baseImageRef = useRef(null);
  const [drawMode, setDrawMode] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#111827');
  const [strokeSize, setStrokeSize] = useState(3);
  const [showAnnotationBar, setShowAnnotationBar] = useState(false);
  const ctxRef = useRef({});
  const saveTimer = useRef({});
  const isDrawingRef = useRef(false);
  const drawModeRef = useRef('pen');
  const strokeColorRef = useRef('#111827');
  const strokeSizeRef = useRef(3);

  // Keep refs in sync with state for use inside event handlers
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { strokeColorRef.current = strokeColor; }, [strokeColor]);
  useEffect(() => { strokeSizeRef.current = strokeSize; }, [strokeSize]);

  const broadcast = useBroadcastEvent();

  const ANNOTATION_COLORS = [
    '#111827', '#7C3AED', '#EF4444',
    '#10B981', '#F59E0B', '#3B82F6'
  ];

  const STROKE_SIZES = [
    { id: 'sm', size: 2, label: 'Thin' },
    { id: 'md', size: 4, label: 'Medium' },
    { id: 'lg', size: 8, label: 'Thick' },
  ];

  // Show bar when annotation tool active
  useEffect(() => {
    setShowAnnotationBar(isActive);
  }, [isActive]);

  // ─── Draw a received stroke onto a canvas ───────────────────────────
  const drawArrowHead = (ctx, from, to, size = 4) => {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const length = Math.max(12, size * 4);
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - length * Math.cos(angle - Math.PI / 6),
      to.y - length * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - length * Math.cos(angle + Math.PI / 6),
      to.y - length * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const drawLineShape = (ctx, from, to, color, size, mode) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color || '#111827';
    ctx.lineWidth = size || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    if (mode === 'arrow') drawArrowHead(ctx, from, to, size);
    ctx.closePath();
  };

  const drawStrokeOnCanvas = useCallback((pageNum, points, color, size, mode) => {
    const canvas = canvasRefs.current[pageNum];
    const ctx = ctxRef.current[pageNum];
    if (!canvas || !ctx || !points || points.length === 0) return;

    if ((mode === 'line' || mode === 'arrow') && points.length >= 2) {
      drawLineShape(ctx, points[0], points[points.length - 1], color, size, mode);
      return;
    }

    ctx.beginPath();
    if (mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = size || 20;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color || '#111827';
      ctx.lineWidth = size || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  // ─── Real-time sync from peers ────────────────────────────────────────
  useEventListener(({ event }) => {
    if (event.type === 'ANNOTATION_STROKE') {
      drawStrokeOnCanvas(event.page, event.points, event.color, event.size, event.mode);
      // Schedule save so the peer's strokes persist to Supabase
      scheduleSave(event.page);
    }
    if (event.type === 'ANNOTATION_CLEAR_PAGE') {
      const canvas = canvasRefs.current[event.page];
      const ctx = ctxRef.current[event.page];
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        scheduleSave(event.page);
      }
    }
  });

  const scheduleSave = (pageNum) => {
    if (saveTimer.current[pageNum]) clearTimeout(saveTimer.current[pageNum]);
    saveTimer.current[pageNum] = setTimeout(() => {
      saveCanvasForPage(pageNum);
    }, 2000);
  };

  // Initialize canvas for a page
  const initCanvas = useCallback((pageNum, canvasEl) => {
    if (!canvasEl) return;
    canvasRefs.current[pageNum] = canvasEl;
    
    const ctx = canvasEl.getContext('2d');
    
    // Set canvas size to match display size
    const rect = canvasEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvasEl.width = rect.width * dpr;
    canvasEl.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    
    ctxRef.current[pageNum] = ctx;
    
    // Load saved annotations for this page
    loadAnnotationsForPage(pageNum, canvasEl);
  }, [strokeColor, strokeSize]);

  // Get coordinates relative to canvas
  const getCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Drawing handlers
  const startDrawing = useCallback((e, pageNum) => {
    if (!isActive) return;
    e.preventDefault();
    
    const canvas = canvasRefs.current[pageNum];
    if (!canvas) return;
    
    const ctx = ctxRef.current[pageNum];
    if (!ctx) return;
    
    const { x, y } = getCoords(e, canvas);
    
    isDrawingRef.current = true;
    setIsDrawing(true);
    currentPathRef.current = [{ x, y }];
    startPointRef.current = { x, y };
    baseImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Set drawing style
    if (drawModeRef.current === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColorRef.current;
      ctx.lineWidth = strokeSizeRef.current;
      
    if (drawModeRef.current === 'pen') {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (drawModeRef.current === 'line') {
        ctx.lineCap = 'round';
      } else if (drawModeRef.current === 'arrow') {
        ctx.lineCap = 'round';
      }
    }
    
    // For text mode, handle separately
    if (drawModeRef.current === 'text') {
      isDrawingRef.current = false;
      setIsDrawing(false);
      placeTextInput(x, y, pageNum, canvas);
      return;
    }
  }, [isActive]);

  const draw = useCallback((e, pageNum) => {
    if (!isDrawingRef.current || !isActive) return;
    e.preventDefault();
    
    const canvas = canvasRefs.current[pageNum];
    const ctx = ctxRef.current[pageNum];
    if (!canvas || !ctx) return;
    
    const { x, y } = getCoords(e, canvas);
    
    currentPathRef.current = [...currentPathRef.current, { x, y }];
    
    if (drawModeRef.current === 'pen' || drawModeRef.current === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (drawModeRef.current === 'line' || drawModeRef.current === 'arrow') {
      if (baseImageRef.current) {
        ctx.putImageData(baseImageRef.current, 0, 0);
      }
      drawLineShape(
        ctx,
        startPointRef.current || currentPathRef.current[0],
        { x, y },
        strokeColorRef.current,
        strokeSizeRef.current,
        drawModeRef.current
      );
    }
  }, [isActive]);

  const stopDrawing = useCallback((e, pageNum) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsDrawing(false);
    
    const ctx = ctxRef.current[pageNum];
    if (ctx) {
      if ((drawModeRef.current === 'line' || drawModeRef.current === 'arrow') && baseImageRef.current && currentPathRef.current.length >= 2) {
        ctx.putImageData(baseImageRef.current, 0, 0);
        drawLineShape(
          ctx,
          currentPathRef.current[0],
          currentPathRef.current[currentPathRef.current.length - 1],
          strokeColorRef.current,
          strokeSizeRef.current,
          drawModeRef.current
        );
      }
      ctx.closePath();
      ctx.globalCompositeOperation = 'source-over';
    }
    
    // Broadcast completed stroke to peers
    const path = currentPathRef.current;
    if (path.length > 0) {
      broadcast({
        type: 'ANNOTATION_STROKE',
        page: pageNum,
        color: drawModeRef.current === 'eraser' ? '#ffffff' : strokeColorRef.current,
        size: drawModeRef.current === 'eraser' ? 20 : strokeSizeRef.current,
        points: path,
        mode: drawModeRef.current === 'eraser' ? 'erase' : drawModeRef.current,
      });
    }

    currentPathRef.current = [];
    startPointRef.current = null;
    baseImageRef.current = null;
    
    // Save after drawing stops (debounced 2s)
    scheduleSave(pageNum);
  }, [broadcast]);

  // Place text input on canvas
  const placeTextInput = (x, y, pageNum, canvas) => {
    const pageWrapper = canvas.parentElement;
    
    const input = document.createElement('div');
    input.contentEditable = 'true';
    input.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      min-width: 120px;
      min-height: 24px;
      border: none;
      border-bottom: 2px solid ${strokeColorRef.current};
      background: transparent;
      color: ${strokeColorRef.current};
      font-size: ${strokeSizeRef.current * 4 + 10}px;
      font-family: Inter, sans-serif;
      outline: none;
      z-index: 20;
      padding: 0 2px;
      cursor: text;
    `;
    pageWrapper.style.position = 'relative';
    pageWrapper.appendChild(input);
    input.focus();
    
    const commitText = () => {
      const text = input.innerText.trim();
      if (text) {
        const ctx = ctxRef.current[pageNum];
        if (ctx) {
          ctx.fillStyle = strokeColorRef.current;
          ctx.font = `${strokeSizeRef.current * 4 + 10}px Inter, sans-serif`;
          ctx.fillText(text, x, y + strokeSizeRef.current * 4 + 8);
        }
        saveCanvasForPage(pageNum);
      }
      input.remove();
    };
    
    input.addEventListener('blur', commitText);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.remove();
      }
    });
  };

  // Clear page and broadcast to peers
  const clearPage = useCallback((pageNum) => {
    const canvas = canvasRefs.current[pageNum];
    const ctx = ctxRef.current[pageNum];
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCanvasForPage(pageNum);

    broadcast({ type: 'ANNOTATION_CLEAR_PAGE', page: pageNum });
  }, [broadcast]);

  // Save canvas to Supabase
  // Uses file_id as the shared key so all session members share one annotation layer.
  const saveCanvasForPage = async (pageNum) => {
    const canvas = canvasRefs.current[pageNum];
    if (!canvas || !fileId) return;
    
    try {
      const dataUrl = canvas.toDataURL('image/png');
      
      // Upsert with file_id + page_num as conflict key (session-shared, no user_id scoping)
      await supabase.from('annotations').upsert({
        user_id: userId || '00000000-0000-0000-0000-000000000000',
        file_id: fileId,
        page_num: pageNum,
        type: 'canvas',
        data: { dataUrl },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,file_id,page_num,type',
      });
    } catch (e) {
      console.error('Save annotation error:', e);
    }
  };

  // Load annotations for a page — loads any annotation for this file/page
  const loadAnnotationsForPage = async (pageNum, canvas) => {
    if (!fileId) return;
    
    try {
      const { data } = await supabase
        .from('annotations')
        .select('data')
        .eq('file_id', fileId)
        .eq('page_num', pageNum)
        .eq('type', 'canvas')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!data?.data?.dataUrl) return;
      
      const img = new Image();
      img.onload = () => {
        const ctx = ctxRef.current[pageNum];
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        ctx.drawImage(img, 0, 0, 
          canvas.width / dpr, 
          canvas.height / dpr
        );
      };
      img.src = data.data.dataUrl;
    } catch (e) {
      // No saved annotation, that's fine
    }
  };

  // Save all on unmount
  useEffect(() => {
    return () => {
      Object.keys(canvasRefs.current).forEach(pageNum => {
        saveCanvasForPage(Number(pageNum));
      });
    };
  }, []);

  return {
    canvasRefs,
    initCanvas,
    startDrawing,
    draw,
    stopDrawing,
    clearPage,
    drawMode,
    setDrawMode,
    strokeColor,
    setStrokeColor,
    strokeSize,
    setStrokeSize,
    showAnnotationBar,
    ANNOTATION_COLORS,
    STROKE_SIZES,
  };
}
