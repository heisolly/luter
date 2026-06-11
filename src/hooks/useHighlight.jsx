import { useState, useEffect, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { supabase } from '../supabaseClient';
import { useBroadcastEvent, useEventListener } from '../liveblocks.config';

export function useHighlight({ 
  fileId, 
  userId, 
  isActive,  // boolean: is Highlight tool selected
  containerRef // ref to the scroll container div
}) {
  const [highlights, setHighlights] = useState([]);
  const [toolbox, setToolbox] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#FEF08A');
  const pendingRange = useRef(null);
  const pendingPdfViewerSelection = useRef(null);

  const broadcast = useBroadcastEvent();

  const COLORS = [
    { id: 'yellow', bg: '#FEF08A', border: '#FDE047', label: 'Yellow' },
    { id: 'green',  bg: '#BBF7D0', border: '#4ADE80', label: 'Green' },
    { id: 'blue',   bg: '#BFDBFE', border: '#60A5FA', label: 'Blue' },
    { id: 'pink',   bg: '#FBCFE8', border: '#F472B6', label: 'Pink' },
    { id: 'orange', bg: '#FED7AA', border: '#FB923C', label: 'Orange' },
    { id: 'purple', bg: '#DDD6FE', border: '#A78BFA', label: 'Purple' },
  ];

  // ─── Real-time sync from peers ────────────────────────────────────────
  useEventListener(({ event }) => {
    if (event.type === 'HIGHLIGHT_ADDED') {
      const h = event.highlight;
      if (!h) return;
      // Parse serialised xpath if needed
      let pageNum = h.pageNum;
      let rects = h.rects;
      let areas = h.areas;
      if (!pageNum && h.xpath) {
        try {
          const parsed = JSON.parse(h.xpath);
          areas = parsed.areas || areas;
          pageNum = parsed.pageNum || 1;
          rects = parsed.rects || (areas
            ? areas
                .filter((area) => area.pageIndex === (areas[0]?.pageIndex ?? 0))
                .map((area) => ({
                  left: area.left / 100,
                  top: area.top / 100,
                  width: area.width / 100,
                  height: area.height / 100,
                }))
            : []);
        } catch (_) {}
      }
      const formatted = {
        id: h.id,
        text: h.text || '',
        color: h.color,
        colorId: h.colorId,
        areas: areas || null,
        pageNum: pageNum || 1,
        rects: rects || [],
        timestamp: h.timestamp || Date.now(),
      };
      setHighlights((prev) => {
        if (prev.some((x) => x.id === formatted.id)) return prev;
        return [...prev, formatted];
      });
    }
    if (event.type === 'HIGHLIGHT_DELETED') {
      if (event.id) {
        setHighlights((prev) => prev.filter((h) => h.id !== event.id));
      }
    }
  });

  // Listen for text selection or clicks on highlights
  useEffect(() => {
    if (!isActive) {
      setToolbox(null);
      return;
    }

    const handleMouseUp = (e) => {
      // Small delay to let selection settle
      setTimeout(() => {
        const selection = window.getSelection();
        const container = containerRef.current;
        if (!container) return;

        // 1. Check if selection is collapsed (which means it's a simple click)
        if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
          // Find if we clicked inside a PDF page layer
          const pageLayer = e.target.closest('.rpv-core__page-layer');
          if (pageLayer) {
            const pageRect = pageLayer.getBoundingClientRect();
            const pageNum = Number(pageLayer.closest('[data-page-number]')?.dataset.pageNumber || 1);
            
            // Calculate click coordinates relative to page layer (0 to 1)
            const clickX = (e.clientX - pageRect.left) / pageRect.width;
            const clickY = (e.clientY - pageRect.top) / pageRect.height;
            
            // Check if coordinates overlap with any existing highlight
            const clickedHighlight = highlights.find(h => {
              if (h.pageNum !== pageNum) return false;
              return h.rects?.some(r => 
                clickX >= r.left && 
                clickX <= r.left + r.width && 
                clickY >= r.top && 
                clickY <= r.top + r.height
              );
            });
            
            if (clickedHighlight) {
              const containerRect = container.getBoundingClientRect();
              setToolbox({
                x: e.clientX - containerRect.left,
                y: e.clientY - containerRect.top,
                text: clickedHighlight.text,
                existingId: clickedHighlight.id,
              });
              return;
            }
          }

          // If clicked outside toolbox, close it
          if (toolbox && !e.target.closest('.highlight-toolbox')) {
            setToolbox(null);
            pendingRange.current = null;
          }
          return;
        }

        // 2. We have a non-empty text selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Check selection is inside our document viewer container
        if (!container.contains(range.commonAncestorContainer)) {
          return;
        }

        pendingRange.current = range.cloneRange();

        const containerRect = container.getBoundingClientRect();
        setToolbox({
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top - containerRect.top,
          text: selection.toString().trim(),
        });
      }, 10);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isActive, containerRef, highlights, toolbox]);

  // Hide toolbox on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setToolbox(null);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, toolbox]);

  const createPdfViewerHighlight = useCallback((color, selection) => {
    const activeSelection = selection || pendingPdfViewerSelection.current;
    if (!activeSelection?.highlightAreas?.length) return;

    const id = nanoid();
    const areas = activeSelection.highlightAreas.map((area) => ({
      pageIndex: area.pageIndex,
      left: area.left,
      top: area.top,
      width: area.width,
      height: area.height,
    }));
    const firstArea = areas[0];
    const samePageAreas = areas.filter((area) => area.pageIndex === firstArea.pageIndex);
    const rects = samePageAreas.map((area) => ({
      left: area.left / 100,
      top: area.top / 100,
      width: area.width / 100,
      height: area.height / 100,
    }));
    const pageNum = (firstArea?.pageIndex ?? 0) + 1;
    const text = activeSelection.selectedText || activeSelection.selectionData?.selectedText || '';
    const xpath = JSON.stringify({ type: 'react-pdf-viewer', areas, pageNum, rects });
    const timestamp = Date.now();
    const highlightData = {
      id,
      text,
      color: color.bg,
      colorId: color.id,
      xpath,
      areas,
      pageNum,
      rects,
      fileId,
      timestamp,
    };

    setHighlights((prev) => [...prev, {
      id,
      text,
      color: color.bg,
      colorId: color.id,
      areas,
      pageNum,
      rects,
      timestamp,
    }]);

    saveHighlight(highlightData);
    broadcast({ type: 'HIGHLIGHT_ADDED', highlight: highlightData });
    setToolbox(null);
    pendingPdfViewerSelection.current = null;
    window.getSelection()?.removeAllRanges();
  }, [broadcast, fileId]);

  const preparePdfViewerHighlight = useCallback((selection, position) => {
    if (!selection?.highlightAreas?.length) return;
    pendingPdfViewerSelection.current = selection;

    if (position) {
      setToolbox({
        x: position.x,
        y: position.y,
        text: selection.selectedText || selection.selectionData?.selectedText || '',
        pdfViewerSelection: true,
      });
    }
  }, []);

  // Apply highlight to PDF overlay
  const applyHighlight = useCallback((color) => {
    if (pendingPdfViewerSelection.current) {
      createPdfViewerHighlight(color);
      return;
    }

    const range = pendingRange.current;
    if (!range) return;

    const id = nanoid();
    
    try {
      const container = containerRef.current;
      if (!container) return;

      const rangeRect = range.getBoundingClientRect();
      const pageLayer = range.commonAncestorContainer?.parentElement?.closest?.('.rpv-core__page-layer') 
                        || document.elementFromPoint(rangeRect.left, rangeRect.top)?.closest?.('.rpv-core__page-layer');
      if (!pageLayer) return;

      const pageRect = pageLayer.getBoundingClientRect();
      const pageNum = Number(pageLayer.closest('[data-page-number]')?.dataset.pageNumber || 1);

      // Convert selection client rects to page-relative coordinates (ratios)
      const clientRects = Array.from(range.getClientRects());
      const rects = clientRects.map(r => ({
        left: (r.left - pageRect.left) / pageRect.width,
        top: (r.top - pageRect.top) / pageRect.height,
        width: r.width / pageRect.width,
        height: r.height / pageRect.height,
      }));

      // Store page number and rect coordinates in the xpath column
      const xpath = JSON.stringify({ pageNum, rects });
      
      const highlightData = {
        id,
        text: toolbox?.text || '',
        color: color.bg,
        colorId: color.id,
        xpath,
        pageNum,
        rects,
        fileId,
        timestamp: Date.now(),
      };

      // Update local state
      setHighlights(prev => [...prev, {
        id,
        text: toolbox?.text || '',
        color: color.bg,
        colorId: color.id,
        areas: null,
        pageNum,
        rects,
        timestamp: Date.now(),
      }]);
      
      // Save to Supabase
      saveHighlight({ ...highlightData });

      // Broadcast to peers in real-time
      broadcast({ type: 'HIGHLIGHT_ADDED', highlight: highlightData });

    } catch (error) {
      console.error('Highlight error:', error);
    }

    setToolbox(null);
    pendingRange.current = null;
    window.getSelection()?.removeAllRanges();
  }, [toolbox, fileId, containerRef, broadcast, createPdfViewerHighlight]);

  // Delete highlight
  const deleteHighlight = useCallback((id) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    setToolbox(null);
    
    // Delete from Supabase (no user_id filter — any session member can remove)
    supabase.from('highlights')
      .delete()
      .eq('id', id)
      .then();

    // Broadcast deletion to peers
    broadcast({ type: 'HIGHLIGHT_DELETED', id });
  }, [broadcast]);

  // Save to Supabase
  const saveHighlight = async (data) => {
    if (!userId) return;
    await supabase.from('highlights').insert({
      id: data.id,
      user_id: userId,
      file_id: fileId,
      text: data.text,
      color: data.color,
      color_id: data.colorId,
      xpath: data.xpath,
      created_at: new Date().toISOString(),
    });
  };

  // Load and restore highlights from Supabase
  // Loads all highlights for this file, not just the current user's,
  // so session members see each other's highlights.
  const loadHighlights = useCallback(async () => {
    if (!fileId) return;
    
    const { data } = await supabase
      .from('highlights')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: true });

    if (!data) return;
    
    const parsedHighlights = [];
    data.forEach(h => {
      try {
        const parsed = JSON.parse(h.xpath);
        const areas = Array.isArray(parsed.areas) ? parsed.areas : null;
        const fallbackRects = areas
          ? areas
              .filter((area) => area.pageIndex === (areas[0]?.pageIndex ?? 0))
              .map((area) => ({
                left: area.left / 100,
                top: area.top / 100,
                width: area.width / 100,
                height: area.height / 100,
              }))
          : (parsed.rects || []);
        parsedHighlights.push({
          id: h.id,
          text: h.text,
          color: h.color,
          colorId: h.color_id,
          areas,
          pageNum: parsed.pageNum || ((areas?.[0]?.pageIndex ?? 0) + 1),
          rects: fallbackRects,
          timestamp: new Date(h.created_at).getTime()
        });
      } catch (e) {
        // Skip legacy/invalid entries
      }
    });

    setHighlights(parsedHighlights);
  }, [fileId]);

  return {
    toolbox,
    setToolbox,
    highlights,
    selectedColor,
    setSelectedColor,
    COLORS,
    applyHighlight,
    createPdfViewerHighlight,
    preparePdfViewerHighlight,
    deleteHighlight,
    loadHighlights,
  };
}
