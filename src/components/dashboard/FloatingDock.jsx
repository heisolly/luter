import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  RiAddLine as Plus, RiUploadCloudFill as Upload, RiMagicFill as Sparkles, RiBookOpenFill as BookOpen, 
  RiDeleteBin6Fill as Trash2, RiPlayFill as Play, RiCloseLine as X, RiArrowUpSLine as ChevronUp, RiStackFill as Layers,
  RiFileTextFill as FileText, RiMusicFill as Music, RiVideoFill as Video, RiImageFill as ImageIcon,
  RiFolderOpenFill as Folder, RiTimeFill as Clock, RiDragMoveFill as DragHandle, RiMenuFill as Menu,
  RiBook2Fill as Book
} from 'react-icons/ri';
import { supabase } from '../../supabaseClient';
import { useSessionStore } from '../../store/useSessionStore';
import { uploadMaterial } from '../../services/materialsService';
import { useTranslation } from 'react-i18next';
import './FloatingDock.css';

const FloatingDock = ({ user, isMobile }) => {
  const { t } = useTranslation(['dock']);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const dragControls = useDragControls();
  const { 
    sessions, 
    activeSession, 
    loadSessions, 
    createSession, 
    setActiveSession,
    deleteSession,
    updateLastAccessed
  } = useSessionStore();
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }
  }, [user?.id]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !user) return;

    setIsUploading(true);
    setIsOpen(true);

    const uploadedItems = [];
    for (const file of files) {
      try {
        const ext = file.name.split('.').pop().toLowerCase();
        let type = 'pdf';
        if (['docx', 'doc'].includes(ext)) type = 'docx';
        else if (['pptx', 'ppt'].includes(ext)) type = 'pptx';
        else if (['mp4', 'webm', 'mov'].includes(ext)) type = 'video';
        else if (['mp3', 'wav', 'm4a'].includes(ext)) type = 'audio';
        else if (['jpg', 'png', 'jpeg', 'webp'].includes(ext)) type = 'image';

        const result = await uploadMaterial({
          file,
          courseId: null,
          userId: user.id,
          title: file.name,
          type,
          week: 1
        });

        if (result?.id) {
          uploadedItems.push({
            id: result.id,
            title: result.title || file.name,
            type,
            url: result.source_url
          });
        }
      } catch (err) {
        console.error('[Dock] Upload failed:', err);
      }
    }

    if (uploadedItems.length > 0) {
      const sessionName = newSessionName || `Study Session ${new Date().toLocaleDateString()}`;
      const { success, session } = await createSession(sessionName, uploadedItems);
      if (success && session) {
        setActiveSession(session);
        navigate(`/dashboard/session/${session.id}`);
      }
    }

    setIsUploading(false);
    setNewSessionName('');
    setShowCreateModal(false);
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return <FileText size={18} />;
    if (type.includes('image')) return <ImageIcon size={18} />;
    if (type.includes('video')) return <Video size={18} />;
    if (type.includes('audio')) return <Music size={18} />;
    return <BookOpen size={18} />;
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    const { success, session } = await createSession(newSessionName, []);
    if (success && session) {
      setActiveSession(session);
      navigate(`/dashboard/session/${session.id}`);
      setShowCreateModal(false);
      setNewSessionName('');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    await deleteSession(sessionId);
  };

  const handleOpenSession = (session) => {
    updateLastAccessed(session.id);
    setActiveSession(session);
    navigate(`/dashboard/session/${session.id}`);
  };

  const formatSessionDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Pages where the Floating Dock should appear
  const allowedPages = ['/dashboard', '/dashboard/session', '/dashboard/flashcards', '/dashboard/playground'];
  
  // Check if current page should show the Floating Dock
  const shouldShowDock = allowedPages.some(page => location.pathname.startsWith(page));
  
  if (!shouldShowDock || !user) {
    return null;
  }

  return (
    <motion.div 
      ref={containerRef}
      className={`floating-orb-container ${isMobile ? 'mobile' : ''}`}
      drag={!isOpen && !showCreateModal}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{
        left: -window.innerWidth + 100,
        right: -50,
        top: -window.innerHeight + 120,
        bottom: -40
      }}
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: isHovered || isOpen ? 1 : 0.3,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.6
        }
      }}
      style={{ 
        position: 'fixed',
        bottom: 32,
        right: 32,
        x: position.x,
        y: position.y,
        zIndex: 1000
      }}
      onDragEnd={(_, info) => {
        setPosition({ x: info.offset.x, y: info.offset.y });
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            className="orb-expanded-panel"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
          >
            <div className="orb-panel-header">
              <div className="orb-panel-title">
                <Folder size={16} />
                <span>Study Sessions ({sessions.length})</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="orb-close-btn">
                <X size={16} />
              </button>
            </div>

            <div className="orb-items-list">
              {sessions.length === 0 ? (
                <div className="orb-empty-state">
                  <Folder size={32} opacity={0.3} />
                  <p>No study sessions yet</p>
                  <p style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>Create a session to start studying</p>
                </div>
              ) : (
                sessions.slice(0, 5).map((session) => (
                  <motion.div 
                    layout
                    key={session.id} 
                    className="orb-session-row"
                    onClick={() => handleOpenSession(session)}
                    whileHover={{ scale: 1.02, x: 4 }}
                  >
                    <div className="orb-session-icon">
                      <Folder size={20} />
                    </div>
                    <div className="orb-session-info">
                      <span className="orb-session-name">{session.session_name}</span>
                      <span className="orb-session-meta">
                        <Clock size={10} />
                        {formatSessionDate(session.last_accessed)} &bull; {session.items?.length || 0} items
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }} 
                      className="orb-item-remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Action Buttons */}
            <div className="orb-action-buttons">
              <motion.label 
                className="orb-action-btn orb-action-btn--upload"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload size={20} />
                <span>Upload Files</span>
                <input type="file" multiple onChange={handleFileUpload} hidden />
              </motion.label>

              <motion.button 
                className="orb-action-btn orb-action-btn--create"
                onClick={() => {
                  setShowCreateModal(true);
                  setIsOpen(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={20} />
                <span>New Session</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="orb-modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="orb-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="orb-modal-header">
                <h3>Create Study Session</h3>
                <button onClick={() => setShowCreateModal(false)} className="orb-close-btn">
                  <X size={16} />
                </button>
              </div>
              <div className="orb-modal-body">
                <div className="orb-form-group">
                  <label>Session Name</label>
                  <input 
                    type="text" 
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="e.g., Biology Exam Prep"
                    autoFocus
                  />
                </div>
                <label className="orb-upload-label">
                  <Upload size={20} />
                  <span>Upload Materials (optional)</span>
                  <input type="file" multiple onChange={handleFileUpload} hidden />
                </label>
              </div>
              <div className="orb-modal-footer">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="orb-btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateSession}
                  disabled={!newSessionName.trim()}
                  className="orb-btn-primary"
                >
                  Create Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Orb Button */}
      <motion.button
        className="floating-orb"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          rotate: isOpen ? 45 : 0,
          scale: isHovered ? 1.1 : 1
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 15
        }}
      >
        <div className="orb-icon">
          {isOpen ? <X size={24} /> : <Book size={24} />}
        </div>
        
        {/* Subtle pulse effect */}
        <motion.div
          className="orb-pulse"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.button>
    </motion.div>
  );
};

export default FloatingDock;
