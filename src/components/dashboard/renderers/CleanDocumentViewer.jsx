import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import debounce from 'lodash.debounce';
import { supabase } from '../../../supabaseClient';
import PdfPageWrapper from './PdfPageWrapper';
import TextSelectionToolbar from './TextSelectionToolbar';
import HighlightPopup from './HighlightPopup';
import CommentEditorPopup from './CommentEditorPopup';
import {
  CursorClick, Highlighter, Pen, Eraser, 
  MagnifyingGlassPlus, MagnifyingGlassMinus,
  CaretUp, CaretDown
} from '@phosphor-icons/react';

// Setup local worker using Vite's ?url suffix to correctly resolve node_modules paths
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const HIGHLIGHT_COLORS = ['#FEF08A', '#A7F3D0', '#BFDBFE', '#FBCFE8'];
const PEN_COLORS = ['#111827', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'];

const mergeRects = (rawRects) => {
  if (!rawRects.length) return [];
  
  // Filter out empty rects
  let rects = Array.from(rawRects).filter(r => r.width > 0 && r.height > 0);
  if (!rects.length) return [];

  // Filter out large container rects by using median height
  const heights = rects.map(r => r.height).sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)];
  
  // Only keep rects that are close to the median height (ignores large wrapper blocks)
  rects = rects.filter(r => r.height <= medianHeight * 1.5);

  if (!rects.length) return [];

  const sorted = rects.map(r => ({ top: r.top, left: r.left, right: r.right, bottom: r.bottom })).sort((a, b) => {
    if (Math.abs(a.top - b.top) > 5) return a.top - b.top;
    return a.left - b.left;
  });

  const merged = [];
  let current = { top: sorted[0].top, left: sorted[0].left, right: sorted[0].right, bottom: sorted[0].bottom };

  for (let i = 1; i < sorted.length; i++) {
    const rect = sorted[i];
    // Merge if they are on the same line (within 10 pixels vertically)
    if (Math.abs(current.top - rect.top) <= 10) {
      current.right = Math.max(current.right, rect.right);
      current.bottom = Math.max(current.bottom, rect.bottom);
      current.top = Math.min(current.top, rect.top);
      current.left = Math.min(current.left, rect.left);
    } else {
      merged.push({ x: current.left, y: current.top, width: current.right - current.left, height: current.bottom - current.top });
      current = { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom };
    }
  }
  merged.push({ x: current.left, y: current.top, width: current.right - current.left, height: current.bottom - current.top });

  return merged;
};

export default function CleanDocumentViewer({ 
  material,
  isDark,
  annotateMode = false,
  highlightMode = false,
  occludeMode = false,
  isEraserMode = false,
  annotationColor,
  annotationStrokeSize,
  annotationToolType
}) {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(null);
  
  // New States for Advanced Interactions
  const [textSelectionData, setTextSelectionData] = useState(null);
  const [popupAnnotation, setPopupAnnotation] = useState(null);
  const [commentPopupData, setCommentPopupData] = useState(null); // { position, item, type }
  
  // Resolve tool state from parent WorkstationPage props
  const activeTool = highlightMode ? (isEraserMode ? 'eraser' : 'highlight') 
                   : (annotateMode ? (isEraserMode ? 'eraser' : 'pen') 
                   : (occludeMode ? (isEraserMode ? 'eraser' : 'occlusion')
                   : 'select'));
                   
  const activeColor = annotationColor || '#7C3AED';
  const activeStrokeWidth = annotationStrokeSize || 3;

  // Data state
  const [highlights, setHighlights] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const handleSaveComment = async (text) => {
    if (!commentPopupData) return;
    const { item, type } = commentPopupData;
    
    // update locally
    if (type === 'highlight') {
      setHighlights(prev => prev.map(h => h.id === item.id ? { ...h, comment: text } : h));
      if (userId) await supabase.from('highlights').update({ comment: text }).eq('id', item.id);
    } else {
      setStrokes(prev => prev.map(s => s.id === item.id ? { ...s, comment: text } : s));
      if (userId) await supabase.from('strokes').update({ comment: text }).eq('id', item.id);
    }
    setCommentPopupData(null);
  };

  // View state
  const scrollContainerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Supabase User
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Fetch initial data
  useEffect(() => {
    if (!material?.id) return;
    
    const fetchAnnotations = async () => {
      setIsLoadingData(true);
      try {
        const [highlightsRes, strokesRes] = await Promise.all([
          supabase.from('highlights').select('*').eq('material_id', material.id),
          supabase.from('strokes').select('*').eq('material_id', material.id)
        ]);

        if (highlightsRes.data) setHighlights(highlightsRes.data);
        if (strokesRes.data) setStrokes(strokesRes.data);
      } catch (e) {
        console.error("Failed to load annotations:", e);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAnnotations();
  }, [material?.id]);

  // Intersection Observer for Page Number
  useEffect(() => {
    if (!numPages || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.dataset.pageNumber);
            if (pageNum) setCurrentPage(pageNum);
          }
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '-50% 0px -50% 0px', // Trigger when page crosses the middle
      }
    );

    const pages = scrollContainerRef.current.querySelectorAll('.pdf-page-wrapper');
    pages.forEach((p) => observer.observe(p));

    // Also observe container width
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(scrollContainerRef.current);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [numPages]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Listen to document selection changes for TextSelectionToolbar
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        if (activeTool !== 'highlight') {
          // Only hide if we aren't about to highlight it automatically
          setTextSelectionData(null);
        }
        return;
      }
      
      // If we are in highlight mode, we don't show the toolbar, we just highlight automatically
      if (activeTool === 'highlight') return;

      const range = selection.getRangeAt(0);
      const rects = Array.from(range.getClientRects());
      if (rects.length === 0) return;

      const pageWrapper = selection.anchorNode?.parentElement?.closest('.pdf-page-wrapper');
      if (!pageWrapper) return;

      const firstRect = rects[0];
      
      setTextSelectionData({
        position: {
          x: firstRect.left + (firstRect.width / 2),
          y: firstRect.top
        },
        text: selection.toString(),
        range: range
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [activeTool]);

  // --- HIGHLIGHT LOGIC ---
  const createAnnotationFromSelection = (range, style = 'highlight', overrideColor = null) => {
    const rawRects = Array.from(range.getClientRects());
    if (rawRects.length === 0) return null;

    const rects = mergeRects(rawRects);
    let pageWrapper = range.startContainer.parentElement?.closest('.pdf-page-wrapper');
    if (!pageWrapper && range.startContainer.closest) {
       pageWrapper = range.startContainer.closest('.pdf-page-wrapper');
    }
    if (!pageWrapper) return null;

    const pageNum = Number(pageWrapper.dataset.pageNumber);
    const wrapperRect = pageWrapper.getBoundingClientRect();

    const unscaledRects = rects.map((r) => ({
      x: (r.x - wrapperRect.left) / scale,
      y: (r.y - wrapperRect.top) / scale,
      width: r.width / scale,
      height: r.height / scale,
    }));

    const newHighlight = {
      id: crypto.randomUUID(),
      material_id: material.id,
      user_id: userId,
      page_number: pageNum,
      rects: unscaledRects,
      color: overrideColor || activeColor,
      style: style,
      created_at: new Date().toISOString()
    };

    setHighlights((prev) => [...prev, newHighlight]);
    saveHighlightToDb(newHighlight);
    return newHighlight;
  };

  const handleMouseUp = useCallback(() => {
    if (activeTool !== 'highlight') return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    createAnnotationFromSelection(selection.getRangeAt(0), 'highlight');
    selection.removeAllRanges();
    setTextSelectionData(null);
  }, [activeTool, scale, activeColor, material?.id, userId]);

  const saveHighlightToDb = useCallback(
    debounce(async (highlight) => {
      if (!highlight.user_id) return;
      await supabase.from('highlights').insert([highlight]);
    }, 1000),
    []
  );

  // --- STROKE LOGIC ---
  const handleAddStroke = (pageNumber, strokeData) => {
    const newStroke = {
      id: crypto.randomUUID(),
      material_id: material.id,
      user_id: userId,
      page_number: pageNumber,
      points: strokeData.points,
      color: strokeData.color,
      width: strokeData.width,
      created_at: new Date().toISOString()
    };

    setStrokes((prev) => [...prev, newStroke]);
    saveStrokeToDb(newStroke);
  };

  const saveStrokeToDb = useCallback(
    debounce(async (stroke) => {
      if (!stroke.user_id) return;
      await supabase.from('strokes').insert([stroke]);
    }, 1000),
    []
  );

  const handleDeleteStroke = async (strokeId) => {
    setStrokes((prev) => prev.filter((s) => s.id !== strokeId));
    if (popupAnnotation?.item?.id === strokeId) setPopupAnnotation(null);
    if (!userId) return;
    await supabase.from('strokes').delete().eq('id', strokeId);
  };

  // --- POPUP ANNOTATION ACTION HANDLERS ---
  const handleUpdateAnnotationColor = async (newColor) => {
    if (!popupAnnotation || !userId) return;
    const { type, item } = popupAnnotation;
    
    if (type === 'highlight') {
      setHighlights(prev => prev.map(h => h.id === item.id ? { ...h, color: newColor } : h));
      setPopupAnnotation(prev => ({ ...prev, item: { ...prev.item, color: newColor } }));
      await supabase.from('highlights').update({ color: newColor }).eq('id', item.id);
    } else if (type === 'stroke') {
      setStrokes(prev => prev.map(s => s.id === item.id ? { ...s, color: newColor } : s));
      setPopupAnnotation(prev => ({ ...prev, item: { ...prev.item, color: newColor } }));
      await supabase.from('strokes').update({ color: newColor }).eq('id', item.id);
    }
  };

  const handleDeleteAnnotationDirect = async (id, type) => {
    if (!userId) return;
    if (type === 'highlight') {
      setHighlights((prev) => prev.filter((h) => h.id !== id));
      await supabase.from('highlights').delete().eq('id', id);
    } else if (type === 'stroke') {
      setStrokes((prev) => prev.filter((s) => s.id !== id));
      await supabase.from('strokes').delete().eq('id', id);
    }
  };

  const handleDeleteAnnotation = async () => {
    if (!popupAnnotation) return;
    await handleDeleteAnnotationDirect(popupAnnotation.item.id, popupAnnotation.type);
    setPopupAnnotation(null);
  };

  const handleTextAction = (actionType) => {
    if (!textSelectionData) return;
    
    const { range, text, position } = textSelectionData;

    if (actionType === 'copy') {
      navigator.clipboard.writeText(text);
      // Optional: show some temporary feedback if we had a toast system
    } else if (actionType === 'underline' || actionType === 'strike') {
      // Use standard colors for these or default
      const defaultColor = actionType === 'underline' ? '#EF4444' : '#6B7280';
      createAnnotationFromSelection(range, actionType, defaultColor);
    } else if (actionType === 'highlight') {
      createAnnotationFromSelection(range, 'highlight');
    } else if (actionType === 'comment') {
      const newAnn = createAnnotationFromSelection(range, 'highlight', '#FEF08A');
      if (newAnn) {
        const firstRect = newAnn.rects[0];
        setCommentPopupData({
          position: {
            x: position.x,
            y: position.y
          },
          item: newAnn,
          type: 'highlight',
          isNew: true
        });
      }
    } else if (actionType === 'explain') {
      console.log(`AI Explain on: "${text}"`);
    }

    setTextSelectionData(null);
    window.getSelection().removeAllRanges();
  };

  // --- RENDERING ---
  const fileSource = material?.converted_url || material?.source_url;
  const pageWidth = containerWidth ? Math.min(containerWidth - 80, 1200) : undefined;
  
  // Memoize file to avoid unnecessary re-renders when react-pdf parses it
  const fileToLoad = React.useMemo(() => fileSource, [fileSource]);

  return (
    <div className="clean-doc-viewer" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: 'transparent', position: 'relative' }}>


      {/* Scroll Container */}
      <div 
        className="document-scroll-container"
        ref={scrollContainerRef}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        onClick={(e) => {
          // Close popups if clicking outside
          if (!e.target.closest('.highlight-popup') && !e.target.closest('.text-selection-toolbar')) {
             setPopupAnnotation(null);
          }
          if (!e.target.closest('.comment-popup') && !e.target.closest('.text-selection-toolbar')) {
             setCommentPopupData(null);
          }
        }}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'auto',
          padding: '40px 20px',
          scrollBehavior: 'smooth',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {fileToLoad ? (
          <Document
            file={fileToLoad}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <div style={{ color: '#64748B' }}>Loading document...</div>
              </div>
            }
          >
            {Array.from(new Array(numPages || 0), (el, index) => (
              <PdfPageWrapper
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                scale={scale}
                pageWidth={pageWidth}
                activeTool={activeTool}
                activeColor={activeColor}
                activeStrokeWidth={activeStrokeWidth}
                isDark={isDark}
                activeAnnotationId={popupAnnotation?.item?.id}
                highlights={highlights.filter(h => h.page_number === index + 1)}
                strokes={strokes.filter(s => s.page_number === index + 1)}
                onAddHighlight={() => {}} // Handled at container level via MouseUp
                onAddStroke={handleAddStroke}
                onRemoveStroke={handleDeleteStroke}
                onAnnotationClick={(e, type, item) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const position = {
                    x: rect.left + (rect.width / 2),
                    y: rect.top
                  };
                  if (type === 'comment_dot') {
                    setPopupAnnotation(null); // hide highlight popup
                    setCommentPopupData({
                      position,
                      item,
                      type: 'highlight',
                      isNew: false
                    });
                  } else {
                    setCommentPopupData(null); // hide comment popup
                    setPopupAnnotation({
                      position,
                      type,
                      item
                    });
                  }
                }}
              />
            ))}
          </Document>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px', color: '#EF4444' }}>
            No document source provided.
          </div>
        )}

        {/* Floating Toolbars Overlays */}
        {textSelectionData && (
          <TextSelectionToolbar
            position={textSelectionData.position}
            onAction={handleTextAction}
            isDark={isDark}
          />
        )}

        {popupAnnotation && (
          <HighlightPopup
            position={popupAnnotation.position}
            currentColor={popupAnnotation.item.color}
            isDark={isDark}
            onColorChange={handleUpdateAnnotationColor}
            onDelete={handleDeleteAnnotation}
            onAddComment={() => {
              setCommentPopupData({
                position: popupAnnotation.position,
                item: popupAnnotation.item,
                type: popupAnnotation.type
              });
              setPopupAnnotation(null);
            }}
          />
        )}

        {commentPopupData && (
          <CommentEditorPopup
            position={commentPopupData.position}
            initialComment={commentPopupData.item.comment || ''}
            isDark={isDark}
            color={commentPopupData.item.color}
            onSave={handleSaveComment}
            onCancel={() => {
              if (commentPopupData.isNew && (!commentPopupData.item.comment)) {
                handleDeleteAnnotationDirect(commentPopupData.item.id, commentPopupData.type);
              }
              setCommentPopupData(null);
            }}
            onDelete={() => {
              handleDeleteAnnotationDirect(commentPopupData.item.id, commentPopupData.type);
              setCommentPopupData(null);
            }}
          />
        )}
      </div>

      {/* Vertical Page & Zoom Sidebar */}
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '24px',
        transform: 'translateY(-50%)',
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        backdropFilter: 'blur(12px)',
        zIndex: 100
      }}>
        {/* Page Nav */}
        <button 
          onClick={() => {
            const el = document.querySelector(`.pdf-page-wrapper[data-page-number="${Math.max(1, currentPage - 1)}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#D1D5DB' : '#475569', display: 'flex', padding: '4px' }}
        >
          <CaretUp size={20} weight="bold" />
        </button>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#F3F4F6' : '#1E293B' }}>{currentPage}</span>
          <div style={{ width: '16px', height: '1.5px', backgroundColor: isDark ? '#4B5563' : '#CBD5E1' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#9CA3AF' : '#64748B' }}>{numPages || '-'}</span>
        </div>

        <button 
          onClick={() => {
            const el = document.querySelector(`.pdf-page-wrapper[data-page-number="${Math.min(numPages || 1, currentPage + 1)}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#D1D5DB' : '#475569', display: 'flex', padding: '4px' }}
        >
          <CaretDown size={20} weight="bold" />
        </button>

        <div style={{ width: '24px', height: '1px', backgroundColor: isDark ? '#374151' : '#E2E8F0', margin: '4px 0' }} />

        {/* Zoom Nav */}
        <button 
          onClick={() => setScale(s => Math.min(3.0, s + 0.25))}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#D1D5DB' : '#475569', display: 'flex', padding: '4px' }}
        >
          <MagnifyingGlassPlus size={20} weight="bold" />
        </button>

        <span style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#9CA3AF' : '#64748B', margin: '4px 0' }}>
          {Math.round(scale * 100)}%
        </span>

        <button 
          onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#D1D5DB' : '#475569', display: 'flex', padding: '4px' }}
        >
          <MagnifyingGlassMinus size={20} weight="bold" />
        </button>
      </div>
    </div>
  );
}

// Subcomponents for Toolbar
function ToolButton({ icon, isActive, onClick, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: isActive ? '#F5F3FF' : 'transparent',
        color: '#111827',
        transition: 'background-color 150ms ease'
      }}
    >
      {icon}
    </button>
  );
}

function ColorDot({ color, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: color,
        border: isActive ? '2px solid #7C3AED' : '2px solid transparent',
        cursor: 'pointer',
        padding: 0,
        boxShadow: isActive ? '0 0 0 1px white inset' : 'none',
        transition: 'all 150ms ease'
      }}
    />
  );
}
