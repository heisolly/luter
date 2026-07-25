import React, { useState, useEffect } from 'react';
import { Folder, CaretDown, Star, Sparkle, CircleNotch } from '@phosphor-icons/react';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as Y from "yjs";
import { SupabaseProvider as YSupabaseProvider } from "@supabase-labs/y-supabase";
import { IndexeddbPersistence } from "y-indexeddb";

export default function PersonalLibraryWidget({ isDark = false }) {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [todosMap, setTodosMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMaterialsExpanded, setIsMaterialsExpanded] = useState(true);

  // Colors based on requested design snippet
  const bgCard = isDark ? "#1F2937" : "#F9FAFB";
  const bgCardHover = isDark ? "#374151" : "#F3F4F6";
  const borderCard = isDark ? "#374151" : "#E5E7EB";
  const borderCardHover = isDark ? "#4B5563" : "#D1D5DB";
  const textTitle = isDark ? "#F9FAFB" : "#111827";
  const textBody = isDark ? "#9CA3AF" : "#4B5563";
  const bgPill = isDark ? "#111827" : "#F3F4F6";
  
  // Folder Icon Colors
  const folderFill = isDark ? "#7C2D12" : "#FFEDD5";
  const folderStroke = isDark ? "#FB923C" : "#EA580C";

  // Material Icon Colors
  const docFill = isDark ? "#1E3A8A" : "#DBEAFE";
  const docStroke = isDark ? "#60A5FA" : "#2563EB";

  // Outline Hover color
  const outlineHoverColor = isDark ? "#C4B5FD" : "#818CF8";

  useEffect(() => {
    let cleanupFn = null;
    
    const fetchLibrary = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoading(false);
          return;
        }
        
        const userId = session.user.id;
        
        // Fetch Folders and ALL Materials simultaneously
        const [{ data: folderData }, { data: matData }] = await Promise.all([
          supabase.from('user_courses').select('*, courses(*)').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('materials').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        ]);

        if (folderData) setFolders(folderData);
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
        console.error("Failed to fetch library", e);
        setLoading(false);
      }
    };

    fetchLibrary();
    return () => {
       if (cleanupFn) cleanupFn();
    };
  }, []);

  // Aggregate Data
  const foldersList = folders.map(f => {
    const courseId = f.course_id;
    const folderMaterials = materials.filter(m => m.course_id === courseId);
    
    const decks = folderMaterials.length;
    const cards = folderMaterials.reduce((acc, m) => acc + (m.analysis?.flashcards?.length || 0), 0);
    const todo = todosMap.get(`crs_${courseId}`) || 0;

    return {
      ...f,
      computedStats: { decks, cards, todo }
    };
  });

  const materialsList = materials
    .filter(m => !m.course_id)
    .map(m => {
      const cards = m.analysis?.flashcards?.length || 0;
      const todo = todosMap.get(`mat_${m.id}`) || 0;
      return {
         ...m,
         computedStats: { cards, todo }
      };
    });

  const cardStyle = {
    width: '328px',
    cursor: 'pointer',
    borderRadius: '16px',
    border: `1px solid ${borderCard}`,
    borderBottomWidth: '2px',
    backgroundColor: bgCard,
    padding: '20px',
    transition: 'background-color 0.1s, border-color 0.1s, outline 0.1s, outline-offset 0.1s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '12px',
    flexShrink: 0
  };

  const materialCardStyle = {
    ...cardStyle,
    width: '280px',
    minHeight: '140px',
    backgroundColor: isDark ? "#111827" : "#FFFFFF",
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
    transition: 'colors 0.2s'
  };

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
            <CaretDown size={20} weight="bold" />
          </div>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            fontFamily: 'Quicksand, sans-serif',
            color: textTitle,
            letterSpacing: '-0.01em'
          }}>
            Personal Library
          </span>
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
        <div style={{ display: 'flex', width: '100%', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', padding: '0 24px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ width: '328px', height: '110px', borderRadius: '16px', backgroundColor: borderCard, animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 24px 24px' }}>
          
          {/* Folders Section */}
          {foldersList.length > 0 && (
            <div 
              style={{ 
                display: 'flex', 
                width: '100%', 
                overflowX: 'auto',
                flexWrap: 'nowrap', 
                gap: '24px', 
                justifyContent: 'flex-start',
                WebkitMaskImage: 'linear-gradient(to right, black 40%, transparent 100%)',
                maskImage: 'linear-gradient(to right, black 40%, transparent 100%)',
                paddingBottom: '16px', // For scrollbar clearance
                paddingRight: '60%' // Allows the last item to scroll into full visibility
              }}
              className="hide-scrollbar"
            >
              <AnimatePresence>
                {foldersList.map((item, index) => {
                  const title = item.courses?.title || item.courses?.name || item.courses?.code || 'Untitled Folder';
                  return (
                    <motion.div
                      key={`folder-${item.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={() => item.user_id && navigate(`/backpack?course=${item.course_id}`)}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={folderFill} stroke={folderStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
                          <path d="M2 10h20"></path>
                        </svg>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: textTitle, fontFamily: 'Quicksand, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={pillStyle}><span style={{ fontWeight: '600' }}>{item.computedStats.decks}</span> <span style={{ fontWeight: '500' }}>materials</span></div>
                        <div style={pillStyle}><span style={{ fontWeight: '600' }}>{item.computedStats.cards}</span> <span style={{ fontWeight: '500' }}>cards</span></div>
                        <div style={pillStyle}><span style={{ fontWeight: '600' }}>{item.computedStats.todo}</span> <span style={{ fontWeight: '500' }}>to-do</span></div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Materials Section */}
          {materialsList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: foldersList.length > 0 ? '16px' : '0' }}>
              <div 
                onClick={() => setIsMaterialsExpanded(!isMaterialsExpanded)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', width: 'fit-content' }}
              >
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: isMaterialsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.1s ease-in-out', color: textBody
                }}>
                  <CaretDown size={16} weight="bold" />
                </div>
                <span style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Quicksand, sans-serif', color: textBody }}>
                  Materials
                </span>
              </div>
              <AnimatePresence initial={false}>
                {isMaterialsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.1, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div 
                      style={{ 
                        display: 'flex', 
                        width: '100%', 
                        overflowX: 'auto',
                        flexWrap: 'nowrap', 
                        gap: '24px', 
                        justifyContent: 'flex-start',
                        WebkitMaskImage: 'linear-gradient(to right, black 40%, transparent 100%)',
                        maskImage: 'linear-gradient(to right, black 40%, transparent 100%)',
                        paddingBottom: '16px', // For scrollbar clearance
                        paddingRight: '60%' // Allows the last item to scroll into full visibility
                      }}
                      className="hide-scrollbar"
                    >
                      <AnimatePresence>
                        {materialsList.map((item, index) => {
                          const title = item.title || 'Untitled Material';
                  return (
                    <motion.div
                      key={`material-${item.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={() => item.user_id && navigate(`/workstation/${item.id}`)}
                      style={materialCardStyle}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={docFill} stroke={docStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <line x1="10" y1="9" x2="8" y2="9"></line>
                        </svg>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: textTitle, fontFamily: 'Quicksand, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={pillStyle}><span style={{ fontWeight: '600' }}>{item.computedStats.cards}</span> <span style={{ fontWeight: '500' }}>cards</span></div>
                        <div style={pillStyle}><span style={{ fontWeight: '600' }}>{item.computedStats.todo}</span> <span style={{ fontWeight: '500' }}>to-do</span></div>
                      </div>
                    </motion.div>
                  );
                })}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {foldersList.length === 0 && materialsList.length === 0 && (
            <div style={{ padding: '20px', color: textBody, fontSize: '14px', fontFamily: 'Outfit' }}>
              Your library is empty.
            </div>
          )}
        </div>
      )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
