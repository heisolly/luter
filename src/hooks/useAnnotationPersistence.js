import { useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function useAnnotationPersistence({
  sessionId, fileId, userId, canvasRefs, pageCount, onLoadSnapshot
}) {

  // SAVE single stroke
  const saveAnnotationStroke = useCallback(
    async (stroke) => {
      await supabase.from('annotations').insert({
        user_id: userId,
        session_id: sessionId,
        file_id: fileId,
        page_num: stroke.pageNum,
        type: 'drawing',
        data: stroke,
      });
    }, [sessionId, fileId, userId]
  );

  // SAVE highlight
  const saveHighlight = useCallback(
    async (highlight) => {
      await supabase.from('annotations').insert({
        user_id: userId,
        session_id: sessionId,
        file_id: fileId,
        page_num: highlight.page,
        type: 'highlight',
        data: highlight,
      });
    }, [sessionId, fileId, userId]
  );

  // SAVE canvas snapshot (debounced, every 3 seconds)
  const saveCanvasSnapshot = useCallback(
    debounce(async (pageNum) => {
      const canvas = canvasRefs.current[pageNum];
      if (!canvas) return;
      
      const dataUrl = canvas.toDataURL('image/png');
      
      // Upsert canvas snapshot
      await supabase.from('annotations').upsert({
        user_id: userId,
        session_id: sessionId,
        file_id: fileId,
        page_num: pageNum,
        type: 'canvas_snapshot',
        data: { dataUrl },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,session_id,file_id,page_num,type'
      });
    }, 3000),
    [sessionId, fileId, userId, canvasRefs]
  );

  // LOAD all annotations on mount
  const loadAnnotations = useCallback(async () => {
    const { data, error } = await supabase
      .from('annotations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('file_id', fileId)
      .order('created_at', { ascending: true });
    
    if (error || !data) return;
    
    // Restore canvas snapshots
    const snapshots = data.filter(a => a.type === 'canvas_snapshot');
    for (const snap of snapshots) {
      if (onLoadSnapshot) {
        onLoadSnapshot(snap.page_num, snap.data.dataUrl);
      }
      const canvas = canvasRefs.current[snap.page_num];
      if (!canvas) continue;
      
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = snap.data.dataUrl;
    }
    
    // Restore highlights
    const highlights = data.filter(a => a.type === 'highlight');
    for (const h of highlights) {
      restoreHighlight(h.data);
    }
    
    return data;
  }, [sessionId, fileId, canvasRefs, onLoadSnapshot]);

  // RESTORE highlight in DOM
  const restoreHighlight = (highlight) => {
    try {
      // Find element by xpath and re-apply highlight mark
      const element = getElementByXPath(highlight.xpath);
      if (!element) return;
      
      const mark = document.createElement('mark');
      mark.dataset.highlightId = highlight.id;
      mark.dataset.color = highlight.color;
      mark.style.cssText = `
        background: ${highlight.color};
        border-radius: 3px;
        padding: 1px 2px;
        cursor: pointer;
      `;
      element.parentNode.replaceChild(mark, element);
      mark.appendChild(element);
    } catch(e) {
      console.warn('Could not restore highlight:', e);
    }
  };

  // XPATH helpers
  const getXPath = (element) => {
    if (element.id !== '') return `//*[@id="${element.id}"]`;
    if (element === document.body) return '/html/body';
    
    let ix = 0;
    const siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) {
        return (
          getXPath(element.parentNode) + 
          '/' + element.tagName.toLowerCase() + 
          '[' + (ix + 1) + ']'
        );
      }
      if (sibling.nodeType === 1 && 
          sibling.tagName === element.tagName) ix++;
    }
  };
  
  const getElementByXPath = (xpath) => {
    return document.evaluate(
      xpath, document, null,
      XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;
  };

  // AUTO-SAVE canvas every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      for (let i = 1; i <= pageCount; i++) {
        const canvas = canvasRefs.current[i];
        if (canvas) saveCanvasSnapshot(i);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [pageCount, saveCanvasSnapshot, canvasRefs]);

  // SAVE on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      for (let i = 1; i <= pageCount; i++) {
        const canvas = canvasRefs.current[i];
        if (!canvas) continue;
        const dataUrl = canvas.toDataURL('image/png');
        // Use sendBeacon for reliable save on unload
        navigator.sendBeacon('/api/save-annotation', 
          JSON.stringify({
            userId, sessionId, fileId,
            pageNum: i, dataUrl
          })
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => 
      window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pageCount, userId, sessionId, fileId]);

  return {
    saveAnnotationStroke,
    saveHighlight,
    saveCanvasSnapshot,
    loadAnnotations,
    getXPath,
  };
}
