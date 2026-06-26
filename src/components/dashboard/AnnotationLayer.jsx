import { useEffect, useRef, useCallback } from "react";
import { supabase } from "../../supabaseClient";

/**
 * AnnotationLayer — Lightweight HTML5 canvas drawing overlay per PDF page.
 * No Excalidraw dependency. Supports pen, eraser, clear.
 * pointerEvents: none when !isActive so document scrolls/selects normally.
 */
export default function AnnotationLayer({
  pageNum,
  isActive,
  sessionId,
  fileId,
  userId,
  readOnly = false,
  color = "#7C3AED",
  strokeWidth = 4,
  isEraser = false,
  onAPIReady,
}) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const saveTimeout = useRef(null);

  // --- Load saved annotations ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !userId || !fileId) return;

    const load = async () => {
      try {
        const { data } = await supabase
          .from("annotations")
          .select("data")
          .eq("user_id", userId)
          .eq("file_id", fileId)
          .eq("page_num", pageNum)
          .eq("type", "canvas")
          .maybeSingle();

        if (data?.data?.dataUrl) {
          const ctx = canvas.getContext("2d");
          const img = new Image();
          img.onload = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            ctx.clearRect(0, 0, rect.width, rect.height);
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
          img.src = data.data.dataUrl;
        }
      } catch (err) {
        console.warn("Failed loading annotation:", err);
      }
    };
    load();
  }, [userId, fileId, pageNum]);

  // --- Save to Supabase (debounced) ---
  const save = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !userId || !fileId) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        await supabase.from("annotations").upsert({
          user_id: userId,
          file_id: fileId,
          session_id: sessionId || null,
          page_num: pageNum,
          type: "canvas",
          data: { dataUrl },
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,file_id,page_num,type" });
      } catch (err) {
        console.warn("Failed saving annotation:", err);
      }
    }, 1500);
  }, [userId, fileId, sessionId, pageNum]);

  // --- Expose a clear() API to parent via onAPIReady ---
  useEffect(() => {
    if (!onAPIReady) return;
    onAPIReady({
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        save();
      },
    });
  }, [onAPIReady, save]);

  // --- Drawing event handlers ---
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left),
      y: (clientY - rect.top),
    };
  };

  const startDraw = useCallback((e) => {
    if (!isActive || readOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    lastPos.current = getPos(e, canvas);
  }, [isActive, readOnly]);

  const draw = useCallback((e) => {
    if (!drawing.current || !isActive || readOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);

    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = (strokeWidth || 4) * 4;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color || "#7C3AED";
      ctx.lineWidth = strokeWidth || 4;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  }, [isActive, readOnly, isEraser, color, strokeWidth]);

  const endDraw = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;
    save();
  }, [save]);

  // --- Resize canvas to match its CSS display size ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      // Save current drawing
      const dataUrl = canvas.width > 0 && canvas.height > 0
        ? canvas.toDataURL()
        : null;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);

      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = dataUrl;
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      onTouchStart={startDraw}
      onTouchMove={draw}
      onTouchEnd={endDraw}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: isActive && !readOnly ? 100 : 10,
        pointerEvents: isActive && !readOnly ? "auto" : "none",
        cursor: isActive ? "inherit" : "default",
        touchAction: "none",
        background: "transparent",
      }}
    />
  );
}
