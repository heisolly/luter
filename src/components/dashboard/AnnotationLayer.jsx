import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../supabaseClient";

export default function AnnotationLayer({
  pageNum,
  isActive,
  sessionId,
  fileId,
  userId,
  readOnly = false,
  onAPIReady,
  // Liveblocks (only in group/teacher sessions)
  liveblocksStorage = null,
  broadcastStroke = null,
  onStrokeReceived = null,
}) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [elements, setElements] = useState([]);
  const saveTimeout = useRef(null);
  const lastSavedElementsRef = useRef("");

  // LOAD saved annotations on mount
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const { data, error } = await supabase
          .from("annotations")
          .select("data")
          .eq("user_id", userId)
          .eq("file_id", fileId)
          .eq("page_num", pageNum)
          .eq("type", "excalidraw")
          .maybeSingle();

        if (error) {
          console.warn("Error loading annotations:", error);
          return;
        }

        if (data?.data?.elements) {
          const loadedElements = data.data.elements;
          setElements(loadedElements);
          lastSavedElementsRef.current = JSON.stringify(loadedElements);
          excalidrawAPI?.updateScene({
            elements: loadedElements,
          });
        }
      } catch (err) {
        console.warn("Failed loading saved annotations:", err);
      }
    };

    if (excalidrawAPI && userId && fileId) {
      loadSaved();
    }
  }, [excalidrawAPI, userId, fileId, pageNum]);

  // Pass excalidrawAPI up to parent once initialized
  useEffect(() => {
    if (excalidrawAPI && onAPIReady) {
      onAPIReady(excalidrawAPI);
    }
  }, [excalidrawAPI, onAPIReady]);

  // SAVE to Supabase (debounced 2 seconds)
  const saveToSupabase = useCallback(
    async (elementsToSave) => {
      if (!userId || !fileId) return;

      try {
        await supabase.from("annotations").upsert({
          user_id: userId,
          file_id: fileId,
          session_id: sessionId || null,
          page_num: pageNum,
          type: "excalidraw",
          data: { elements: elementsToSave },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,file_id,page_num,type"
        });
      } catch (err) {
        console.warn("Failed saving annotations to Supabase:", err);
      }
    },
    [userId, fileId, sessionId, pageNum]
  );

  // ON CHANGE — save + broadcast
  const handleChange = useCallback(
    (newElements, appState) => {
      // Avoid infinite rendering loops by ignoring unchanged elements
      const elementsJson = JSON.stringify(newElements);
      if (elementsJson === lastSavedElementsRef.current) return;
      lastSavedElementsRef.current = elementsJson;

      setElements(newElements);

      // Debounced save to Supabase
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      saveTimeout.current = setTimeout(() => {
        saveToSupabase(newElements);
      }, 2000);

      // Broadcast to Liveblocks (group sessions)
      if (broadcastStroke && newElements.length > 0) {
        broadcastStroke({
          type: "ANNOTATION_UPDATE",
          page: pageNum,
          elements: newElements,
        });
      }
    },
    [saveToSupabase, broadcastStroke, pageNum]
  );

  // RECEIVE strokes from other users (Liveblocks)
  useEffect(() => {
    if (!onStrokeReceived || !excalidrawAPI) return;

    const unsubscribe = onStrokeReceived((event) => {
      if (event.type !== "ANNOTATION_UPDATE") return;
      if (event.page !== pageNum) return;

      const elementsJson = JSON.stringify(event.elements);
      if (elementsJson === lastSavedElementsRef.current) return;
      lastSavedElementsRef.current = elementsJson;

      excalidrawAPI.updateScene({
        elements: event.elements,
      });
    });

    return unsubscribe;
  }, [onStrokeReceived, excalidrawAPI, pageNum]);

  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 10,
      // Only receive pointer events when annotating
      pointerEvents: isActive ? "auto" : "none",
      // Make background transparent
      borderRadius: "10px",
      overflow: "hidden",
      background: "transparent",
    }}>
      <Excalidraw
        ref={(api) => setExcalidrawAPI(api)}
        initialData={{
          elements,
          appState: {
            viewBackgroundColor: "transparent",
            currentItemStrokeColor: "#7C3AED",
            currentItemFillStyle: "solid",
            currentItemStrokeWidth: 2,
            theme: "light",
          }
        }}
        onChange={handleChange}
        // Read only when not annotating
        viewModeEnabled={!isActive || readOnly}
        // Hide Excalidraw UI — use our own toolbar
        UIOptions={{
          canvasActions: {
            export: false,
            loadScene: false,
            saveAsImage: false,
            saveToActiveFile: false,
            changeViewBackgroundColor: false,
            clearCanvas: false,
            theme: false,
          },
          tools: {
            image: false,
          },
        }}
        // Transparent background
        style={{
          background: "transparent",
        }}
      />
    </div>
  );
}
