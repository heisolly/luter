import React, { useState, useEffect, useRef } from 'react';
import { FileText, Folder, MoreVertical } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { motion, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PdfThumbnail from '../shared/PdfThumbnail';

// A simple upload icon for the empty state
const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#FFD2A6', marginBottom: '12px' }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const getFileIcon = (type) => {
  if (type?.toLowerCase()?.includes('pdf')) return <FileText size={18} />;
  if (type?.toLowerCase()?.includes('note')) return <FileText size={18} />;
  if (type?.toLowerCase()?.includes('deck')) return <FileText size={18} />;
  return <FileText size={18} />;
};

export default function StackedStartCard({ isDark = false }) {
  const bgOuter = isDark ? '#1F2937' : '#F3F4F6';
  const tabBg = isDark ? '#374151' : '#E5E7EB';
  const textColor = isDark ? '#F3F4F6' : '#111827';
  const textMuted = isDark ? '#9CA3AF' : '#6B7280';
  const hoverBg = isDark ? '#374151' : '#FFFFFF';
  
  const [activeTab, setActiveTab] = useState('files'); // 'files' or 'folders'
  const navigate = useNavigate();
  
  const [recentFiles, setRecentFiles] = useState(() => {
    try { const cached = localStorage.getItem('luter_cached_recent_files'); return cached ? JSON.parse(cached) : []; } catch(e) { return []; }
  });
  const [recentFolders, setRecentFolders] = useState(() => {
    try { const cached = localStorage.getItem('luter_cached_recent_folders'); return cached ? JSON.parse(cached) : []; } catch(e) { return []; }
  });
  // Only show loading state if we don't have cached data
  const [loading, setLoading] = useState(recentFiles.length === 0 && recentFolders.length === 0);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        if (mounted) setLoading(false);
        return;
      }

      // Fetch Materials (Files)
      const { data: materialsData } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch User Courses (Folders)
      const { data: coursesData } = await supabase
        .from('user_courses')
        .select('*, courses(*)')
        .eq('user_id', userId)
        .order('last_studied_at', { ascending: false })
        .limit(5);

      if (mounted) {
        if (materialsData) {
          setRecentFiles(materialsData);
          try { localStorage.setItem('luter_cached_recent_files', JSON.stringify(materialsData)); } catch(e) {}
        }
        if (coursesData) {
          setRecentFolders(coursesData);
          try { localStorage.setItem('luter_cached_recent_folders', JSON.stringify(coursesData)); } catch(e) {}
        }
        setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);
  
  const currentItems = activeTab === 'files' ? recentFiles : recentFolders;
  const [orderedItems, setOrderedItems] = useState([]);

  useEffect(() => {
    setOrderedItems(currentItems);
  }, [currentItems, activeTab]);

  const handleDragEnd = (event, info, index) => {
    if (index !== 0) return; // Only top card is draggable
    
    // If dragged sufficiently up, down, left, or right, send to back
    if (info.offset.y > 60 || info.offset.y < -60 || info.offset.x > 60 || info.offset.x < -60) {
      setOrderedItems(prev => {
        const newOrder = [...prev];
        const swipedCard = newOrder.shift();
        newOrder.push(swipedCard);
        return newOrder;
      });
    }
  };

  const dragClickRef = useRef(false);

  const handleCardClick = (item, isFile, index) => {
    if (dragClickRef.current) return; // Prevent click if we were dragging
    
    if (index === 0) {
      if (isFile) {
         navigate(`/workstation/${item.id}`);
      } else {
         const courseId = item.course_id || item.courses?.id || item.id;
         navigate(`/backpack/${courseId}`);
      }
    } else {
      // Bring clicked card to the front
      setOrderedItems(prev => {
        const newOrder = [...prev];
        const removed = newOrder.splice(0, index);
        return [...newOrder, ...removed];
      });
    }
  };

  const font = "'Quicksand', system-ui, sans-serif";

  const colors = {
    bgOuter: isDark ? '#1a2234' : '#F3F4F6',
    bgInner: isDark ? '#111827' : '#FFFFFF',
    textTitle: isDark ? '#9CA3AF' : '#6B7280',
    textBody: isDark ? '#F9FAFB' : '#111827',
    borderColor: isDark ? '#2d3a50' : '#EFEFEF',
    tabBg: isDark ? '#374151' : '#E5E7EB',
    
    // Purple accents matching TodoListWidget
    accentBg: isDark ? 'rgba(124,92,252,0.15)' : '#EEE9FF',
    accentText: isDark ? '#C4B5FD' : '#7C5CFC',
    accentBorder: isDark ? 'rgba(124,92,252,0.3)' : '#E0D4FC',
  };

  const getMaterialUrl = (sourceUrl) => {
    if (!sourceUrl) return null;
    const { data } = supabase.storage.from('materials').getPublicUrl(sourceUrl);
    return data.publicUrl;
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '500px',
      minWidth: '320px',
      backgroundColor: colors.bgOuter,
      borderRadius: '24px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: font
    }}>
      <style>{`
        .continue-btn {
          margin-top: 16px;
          width: 100%;
          background-color: transparent;
          color: ${colors.accentText};
          font-weight: 600;
          font-size: 15px;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid ${colors.accentBorder};
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s, border-color 0.2s;
          font-family: Inter, system-ui, sans-serif;
        }
        .continue-btn:hover {
          background-color: ${colors.accentBg};
        }
        .fluid-tab {
          display: flex;
          align-items: center;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 999px;
          transition: all 0.3s ease;
          overflow: hidden;
          white-space: nowrap;
        }
        .fluid-tab-text-wrap {
          transition: all 0.3s ease;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
      `}</style>
      
      {/* Switcher Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '24px'
      }}>
        <button 
          className="fluid-tab"
          onClick={() => setActiveTab('files')}
          style={{
            backgroundColor: activeTab === 'files' ? colors.accentBg : 'transparent',
            color: activeTab === 'files' ? colors.accentText : colors.textTitle,
            padding: activeTab === 'files' ? '8px 16px' : '8px',
            gap: activeTab === 'files' ? '8px' : '0px',
          }}
        >
          <FileText size={20} style={{ flexShrink: 0 }} />
          <div className="fluid-tab-text-wrap" style={{
            maxWidth: activeTab === 'files' ? '120px' : '0px',
            opacity: activeTab === 'files' ? 1 : 0,
          }}>
            <span style={{ fontWeight: 700, fontSize: '15px', fontFamily: font }}>Recent Files</span>
          </div>
        </button>

        <button 
          className="fluid-tab"
          onClick={() => setActiveTab('folders')}
          style={{
            backgroundColor: activeTab === 'folders' ? colors.accentBg : 'transparent',
            color: activeTab === 'folders' ? colors.accentText : colors.textTitle,
            padding: activeTab === 'folders' ? '8px 16px' : '8px',
            gap: activeTab === 'folders' ? '8px' : '0px',
          }}
        >
          <Folder size={20} style={{ flexShrink: 0 }} />
          <div className="fluid-tab-text-wrap" style={{
            maxWidth: activeTab === 'folders' ? '140px' : '0px',
            opacity: activeTab === 'folders' ? 1 : 0,
          }}>
            <span style={{ fontWeight: 700, fontSize: '15px', fontFamily: font }}>Recent Folders</span>
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: '440px' }}>
        {loading ? (
          <div style={{ margin: 'auto', color: colors.textTitle }}>Loading...</div>
        ) : orderedItems.length === 0 ? (
          <div style={{ 
            margin: 'auto', 
            backgroundColor: colors.bgInner, 
            padding: '40px', 
            borderRadius: '24px', 
            width: '100%', 
            textAlign: 'center',
            border: `1px solid ${colors.borderColor}`
          }}>
            <UploadIcon />
            <h3 style={{ margin: '0 0 8px 0', color: colors.textBody, fontSize: '18px', fontWeight: 600 }}>
              No recent {activeTab}
            </h3>
            <p style={{ margin: 0, color: colors.textTitle, fontSize: '14px' }}>
              Upload your study materials to get started.
            </p>
          </div>
        ) : (
          <div style={{ width: '100%', height: '440px', position: 'relative' }}>
             {orderedItems.map((item, index) => {
               const isFile = activeTab === 'files';
               const title = isFile ? (item.title || 'Untitled Document') : (item.custom_name || item.courses?.name || 'Untitled Folder');
               
               const isTop = index === 0;
               
               return (
                 <motion.div 
                   key={item.id}
                   layout
                   initial={{ opacity: 0, scale: 0.8, y: 50 }}
                   animate={{
                     opacity: 1,
                     scale: 1 - index * 0.05,
                     y: 0,
                     x: index * 12,
                     zIndex: orderedItems.length - index
                   }}
                   transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                   drag={isTop ? true : false}
                   dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                   dragElastic={1}
                   onDragStart={() => { dragClickRef.current = true; }}
                   onDragEnd={(e, info) => { 
                     setTimeout(() => { dragClickRef.current = false; }, 100);
                     handleDragEnd(e, info, index); 
                   }}
                   onClick={() => handleCardClick(item, isFile, index)}
                   style={{
                     position: 'absolute',
                     top: 0,
                     left: 0,
                     right: 0,
                     display: 'flex',
                     flexDirection: 'column',
                     justifyContent: 'space-between',
                     height: '440px',
                     padding: '28px',
                     borderRadius: '24px',
                     backgroundColor: colors.bgInner,
                     cursor: isTop ? 'grab' : 'pointer',
                     border: `1px solid ${colors.borderColor}`,
                     boxShadow: 'none'
                   }}
                   whileTap={isTop ? { cursor: 'grabbing' } : {}}
                 >
                   {/* Card Header */}
                   <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                     <div style={{ color: colors.textBody, fontWeight: 700, fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 8px' }}>
                       {title}
                     </div>
                     <div style={{ color: colors.textTitle, fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', marginTop: '6px' }}>
                       {isFile ? 'Recent File' : 'Recent Folder'}
                     </div>
                   </div>
                   
                   {/* Card Icon Area */}
                   <div style={{ 
                     flex: 1, 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                   }}>
                     {isFile && item.type?.toLowerCase()?.includes('pdf') && item.source_url ? (
                       <div style={{ width: '130px', height: '173px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.accentBorder}`, backgroundColor: colors.accentBg }}>
                         <PdfThumbnail url={getMaterialUrl(item.source_url)} width={130} />
                       </div>
                     ) : (
                       <div style={{ 
                         backgroundColor: colors.accentBg, 
                         width: '120px', 
                         height: '120px', 
                         borderRadius: '30px', 
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'center',
                         color: colors.accentText,
                         border: `1px solid ${colors.accentBorder}`
                       }}>
                         {isFile ? (
                            React.cloneElement(getFileIcon(item.type), { size: 60 })
                         ) : (
                            <Folder size={60} />
                         )}
                       </div>
                     )}
                   </div>
                   
                   {/* Card Footer Text/Action */}
                   <div style={{ 
                     color: isTop ? '#C4B5FD' : colors.textTitle, 
                     fontWeight: 600,
                     fontSize: '14px',
                     textAlign: 'center',
                     marginTop: '20px',
                   }}>
                     {isTop ? (isFile ? 'Open Material →' : 'Open Folder →') : 'Click to bring forward'}
                   </div>
                 </motion.div>
               );
             })}
          </div>
        )}
      </div>

      {/* Action Button */}
      <button 
        className="continue-btn" 
        onClick={() => {
          localStorage.setItem('backpackActiveTab', activeTab);
          navigate('/backpack');
        }}
      >
        {orderedItems.length === 0 ? 'Upload Material' : 'View All'}
      </button>
    </div>
  );
}
