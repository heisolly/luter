import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  RiAddLine as Plus, RiUploadCloudFill as Upload, RiMagicFill as Sparkles, RiBookOpenFill as BookOpen, 
  RiDeleteBin6Fill as Trash2, RiPlayFill as Play, RiCloseLine as X, RiArrowUpSLine as ChevronUp, RiStackFill as Layers,
  RiFileTextFill as FileText, RiMusicFill as Music, RiVideoFill as Video, RiImageFill as ImageIcon,
  RiFolderOpenFill as Folder, RiTimeFill as Clock
} from 'react-icons/ri';
import { supabase } from '../../supabaseClient';
import { useSessionStore } from '../../store/useSessionStore';
import { uploadMaterial } from '../../services/materialsService';
import { useTranslation } from 'react-i18next';
import './FloatingDock.css';

const FloatingDock = ({ user, isMobile }) => {
  const { t } = useTranslation(['dock']);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
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

    // Upload files and create a session with them
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

    // Create session with uploaded files
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
    <div className={`floating-dock-container ${isMobile ? 'mobile' : ''}`}>
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
                        {formatSessionDate(session.last_accessed)} • {session.items?.length || 0} items
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

      <div className="dock-main-bar">
        <label className="dock-main-action upload">
          <Upload size={20} />
          <input type="file" multiple onChange={handleFileUpload} hidden />
          <div className="dock-tooltip">Quick Upload</div>
        </label>

        <div className="dock-divider" />

        <div className="dock-active-area" onClick={() => setIsOpen(!isOpen)}>
          {sessions.length > 0 ? (
            <div className="dock-sessions">
              {sessions.slice(0, 3).map((session, i) => (
                <div 
                  key={session.id} 
                  className="dock-session-preview" 
                  style={{ 
                    position: 'absolute',
                    left: 0,
                    transform: `translateX(${i * 8}px) scale(${1 - i * 0.05})`,
                    zIndex: 10 - i,
                    opacity: 1 - i * 0.2
                  }}
                >
                  <Folder size={18} />
                </div>
              ))}
              <div className="dock-session-count" style={{ marginLeft: sessions.length > 1 ? (sessions.slice(0,3).length * 8 + 24) : 40 }}>
                {sessions.length}
              </div>
            </div>
          ) : (
            <div className="dock-empty-hint">
              <Sparkles size={16} color="var(--primary)" />
              <span>Sessions</span>
            </div>
          )}
        </div>

        <div className="dock-divider" />

        <button 
          className="dock-main-action create"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={20} />
          <div className="dock-tooltip">New Session</div>
        </button>
      </div>
    </div>
  );
};

export default FloatingDock;
