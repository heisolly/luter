import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  RiAddLine as Plus, RiUploadCloudFill as Upload, RiMagicFill as Sparkles, RiBookOpenFill as BookOpen, 
  RiDeleteBin6Fill as Trash2, RiPlayFill as Play, RiCloseLine as X, RiArrowUpSLine as ChevronUp, RiStackFill as Layers,
  RiFileTextFill as FileText, RiMusicFill as Music, RiVideoFill as Video, RiImageFill as ImageIcon,
  RiFolderOpenFill as Folder, RiTimeFill as Clock, RiDragMoveFill as DragHandle
} from 'react-icons/ri';
import { supabase } from '../../supabaseClient';
import { useSessionStore } from '../../store/useSessionStore';
import { uploadMaterial } from '../../services/materialsService';
import { useTranslation } from 'react-i18next';
import './FloatingDock.css';

const FloatingDock = ({ user, isMobile }) => {
  const { t } = useTranslation(['dock']);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
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
  }, [user?.id, loadSessions]);

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

  return (
    <motion.div 
      ref={containerRef}
      className={`floating-dock-container ${isMobile ? 'mobile' : ''}`}
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
      whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
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
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="dock-expanded-panel"
          >
            <div className="dock-panel-header">
              <div className="dock-panel-title">
                <Folder size={14} />
                <span>Study Sessions ({sessions.length})</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="dock-close-btn">
                <X size={14} />
              </button>
            </div>

            <div className="dock-items-list">
              {sessions.length === 0 ? (
                <div className="dock-empty-state">
                  <Folder size={24} opacity={0.3} />
                  <p>No study sessions yet</p>
                  <p style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>Create a session to start studying</p>
                </div>
              ) : (
                sessions.slice(0, 5).map((session) => (
                  <motion.div 
                    layout
                    key={session.id} 
                    className="dock-session-row"
                    onClick={() => handleOpenSession(session)}
                  >
                    <div className="dock-session-icon">
                      <Folder size={20} />
                    </div>
                    <div className="dock-session-info">
                      <span className="dock-session-name">{session.session_name}</span>
                      <span className="dock-session-meta">
                        <Clock size={10} />
                        {formatSessionDate(session.last_accessed)} &bull; {session.items?.length || 0} items
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }} 
                      className="dock-item-remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            <button 
              onClick={() => {
                setShowCreateModal(true);
                setIsOpen(false);
              }} 
              className="dock-action-btn primary"
            >
              <Plus size={16} />
              <span>New Session</span>
            </button>
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
            className="dock-modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="dock-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dock-modal-header">
                <h3>Create Study Session</h3>
                <button onClick={() => setShowCreateModal(false)} className="dock-close-btn">
                  <X size={16} />
                </button>
              </div>
              <div className="dock-modal-body">
                <div className="dock-form-group">
                  <label>Session Name</label>
                  <input 
                    type="text" 
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="e.g., Biology Exam Prep"
                    autoFocus
                  />
                </div>
                <label className="dock-upload-label">
                  <Upload size={20} />
                  <span>Upload Materials (optional)</span>
                  <input type="file" multiple onChange={handleFileUpload} hidden />
                </label>
              </div>
              <div className="dock-modal-footer">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="dock-btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateSession}
                  disabled={!newSessionName.trim()}
                  className="dock-btn-primary"
                >
                  Create Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable Handle */}
      <motion.div 
        className="dock-drag-handle"
        onPointerDown={(e) => dragControls.start(e)}
        title="Drag to move"
        whileHover={{ scale: 1.1, opacity: 1 }}
        whileTap={{ scale: 0.9 }}
      >
        <DragHandle size={14} />
      </motion.div>

      {/* Main Dock Bar - Study Groups Style */}
      <motion.div 
        className="dock-main-bar"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <motion.label 
          className="dock-nav-btn dock-nav-btn--upload"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 15 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Upload size={18} strokeWidth={2.5} />
          </motion.div>
          <span>Upload</span>
          <input type="file" multiple onChange={handleFileUpload} hidden />
        </motion.label>

        <div className="dock-nav-divider" />

        <motion.button 
          className="dock-nav-btn dock-nav-btn--sessions"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          {sessions.length > 0 ? (
            <>
              <motion.div 
                className="dock-nav-session-dot"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span>Sessions ({sessions.length})</span>
            </>
          ) : (
            <>
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={18} strokeWidth={2.5} />
              </motion.div>
              <span>Sessions</span>
            </>
          )}
        </motion.button>

        <div className="dock-nav-divider" />

        <motion.button 
          className="dock-nav-btn dock-nav-btn--create"
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div 
            className="dock-nav-icon-circle"
            whileHover={{ rotate: 90 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Plus size={18} strokeWidth={3} />
          </motion.div>
          <span>New Session</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default FloatingDock;
