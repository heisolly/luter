import React, { useState, useEffect } from 'react';
import { ClockCounterClockwise, CaretDown } from '@phosphor-icons/react';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PdfThumbnail from '../shared/PdfThumbnail';
import * as Y from "yjs";
import { SupabaseProvider as YSupabaseProvider } from "@supabase-labs/y-supabase";
import { IndexeddbPersistence } from "y-indexeddb";

export default function RecentlyStudiedWidget({ isDark = false }) {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [todosMap, setTodosMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  // Colors based on requested design
  const bgCard = isDark ? "#1F2937" : "#FFFFFF";
  const bgCardHover = isDark ? "#374151" : "#F9FAFB";
  const borderCard = isDark ? "#374151" : "#E5E7EB";
  const borderCardHover = isDark ? "#4B5563" : "#D1D5DB";
  const textTitle = isDark ? "#F9FAFB" : "#111827";
  const textBody = isDark ? "#9CA3AF" : "#4B5563";
  const bgPill = isDark ? "#111827" : "#F3F4F6";

  useEffect(() => {
    let cleanupFn = null;
    
    const fetchRecent = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoading(false);
          return;
        }
        
        const userId = session.user.id;
        
        // Fetch Materials recently accessed
        const { data: matData } = await supabase
          .from('materials')
          .select('*, courses(*)')
          .eq('user_id', userId)
          .not('last_accessed', 'is', null)
          .order('last_accessed', { ascending: false })
          .limit(2);

        if (matData) setMaterials(matData);

        // Setup Yjs for To-dos
        const roomId = `user_${userId}_todos`;
        const doc = new Y.Doc();
        const yMap = doc.getMap("todos_map");
        
        const provider = new YSupabaseProvider(roomId, doc, supabase, {
          awareness: false,
          persistence: { table: "yjs_documents" },
        });

        let idbProvider;
        try {
          idbProvider = new IndexeddbPersistence(roomId, doc);
        } catch (e) {
          console.warn("IDB fail", e);
        }
        
        const updateTodos = () => {
          const list = Array.from(yMap.values()).filter(t => !t.deleted_at && !t.completed);
          const counts = new Map();
          list.forEach(t => {
            if (t.tags && Array.isArray(t.tags)) {
              t.tags.forEach(tag => {
                const tagId = typeof tag === 'object' ? tag.id : tag;
                counts.set(tagId, (counts.get(tagId) || 0) + 1);
              });
            }
          });
          setTodosMap(counts);
        };
        
        yMap.observe(updateTodos);
        if (idbProvider) {
          idbProvider.on("synced", updateTodos);
        } else {
          updateTodos();
        }
        
        setLoading(false);

        cleanupFn = () => {
          yMap.unobserve(updateTodos);
          provider.destroy();
          if (idbProvider) idbProvider.destroy();
          doc.destroy();
        };

      } catch (e) {
        console.error("Failed to fetch recently studied", e);
        setLoading(false);
      }
    };

    fetchRecent();
    return () => {
       if (cleanupFn) cleanupFn();
    };
  }, []);

  const getMaterialUrl = (sourceUrl) => {
    if (!sourceUrl) return null;
    if (sourceUrl.startsWith('http')) return sourceUrl;
    const { data } = supabase.storage.from('materials').getPublicUrl(sourceUrl);
    return data.publicUrl;
  };

  const cardStyle = {
    width: '280px',
    cursor: 'pointer',
    borderRadius: '24px',
    border: `1px solid ${borderCard}`,
    backgroundColor: bgCard,
    transition: 'background-color 0.1s, border-color 0.1s, outline 0.1s, outline-offset 0.1s',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0
  };

  const pillStyle = {
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    borderRadius: '8px',
    backgroundColor: bgPill,
    padding: '0 8px',
    fontSize: '12px',
    color: textBody,
  };

  if (!loading && materials.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 0', width: '100%', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ paddingLeft: '24px' }}>
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', width: 'fit-content' }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.1s ease-in-out',
            color: textTitle
          }}>
            <CaretDown size={16} weight="bold" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textBody }}>
            <ClockCounterClockwise size={20} weight="regular" />
            <span style={{ 
              fontSize: '16px', 
              fontWeight: '700', 
              fontFamily: 'Quicksand, sans-serif',
              letterSpacing: '-0.01em'
            }}>
              Recently Studied
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.1, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {loading ? (
              <div style={{ display: 'flex', width: '100%', flexWrap: 'nowrap', overflowX: 'hidden', gap: '24px', padding: '0 24px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ width: '280px', height: '300px', borderRadius: '24px', backgroundColor: borderCard, animation: 'pulse 2s infinite', flexShrink: 0 }} />
                ))}
              </div>
            ) : (
              <div 
                style={{ 
                  display: 'flex', 
                  width: '100%', 
                  flexWrap: 'wrap', 
                  gap: '24px', 
                  justifyContent: 'flex-start',
                  padding: '0 24px'
                }}
              >
                <AnimatePresence>
                    {materials.map((item, index) => {
                      const courseTitle = item.courses?.title || item.courses?.name || item.courses?.code || '';
                      const materialTitle = item.title || 'Untitled Material';
                      const cards = item.analysis?.flashcards?.length || 0;
                      const todo = todosMap.get(`mat_${item.id}`) || 0;

                      return (
                        <motion.div
                          key={`recent-${item.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          onClick={() => item.user_id && navigate(`/workstation/${item.id}`)}
                          style={cardStyle}
                          onMouseEnter={(e) => { 
                            e.currentTarget.style.backgroundColor = bgCardHover; 
                            e.currentTarget.style.borderColor = borderCardHover;
                            e.currentTarget.style.outline = '2px solid #FFD2A6';
                            e.currentTarget.style.outlineOffset = '2px';
                          }}
                          onMouseLeave={(e) => { 
                            e.currentTarget.style.backgroundColor = bgCard; 
                            e.currentTarget.style.borderColor = borderCard;
                            e.currentTarget.style.outline = 'none';
                            e.currentTarget.style.outlineOffset = '0px';
                          }}
                        >
                          {/* Course Title (Top) */}
                          {courseTitle && (
                            <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
                              <h3 style={{ 
                                fontSize: '15px', 
                                fontWeight: '700', 
                                color: textBody, 
                                fontFamily: 'Quicksand, sans-serif',
                                textTransform: 'uppercase',
                                lineHeight: '1.2'
                              }}>
                                {courseTitle}
                              </h3>
                            </div>
                          )}

                          {/* PDF Thumbnail (Middle Full Bleed) */}
                          <div style={{ width: '100%', height: '120px', overflow: 'hidden', position: 'relative', backgroundColor: isDark ? '#111827' : '#F3F4F6' }}>
                            <PdfThumbnail url={getMaterialUrl(item.source_url)} width={280} />
                          </div>

                          {/* Material Title and Pills (Bottom) */}
                          <div style={{ padding: '20px' }}>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: textTitle, fontFamily: 'Quicksand, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '16px' }}>
                              {materialTitle}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <div style={pillStyle}><span style={{ fontWeight: '600' }}>{cards}</span> <span style={{ fontWeight: '500' }}>cards</span></div>
                              <div style={{ ...pillStyle, backgroundColor: isDark ? 'rgba(109, 40, 217, 0.2)' : '#F3E8FF' }}>
                                <span style={{ fontWeight: '600', color: isDark ? '#C4B5FD' : '#6D28D9' }}>{todo}</span> 
                                <span style={{ fontWeight: '500', color: isDark ? '#C4B5FD' : '#6D28D9' }}>to-do</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
