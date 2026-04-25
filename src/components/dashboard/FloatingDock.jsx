import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiAddLine as Plus, RiUploadCloudFill as Upload, RiMagicFill as Sparkles, RiBookOpenFill as BookOpen, 
  RiDeleteBin6Fill as Trash2, RiPlayFill as Play, RiCloseLine as X, RiArrowUpSLine as ChevronUp, RiStackFill as Layers,
  RiFileTextFill as FileText, RiMusicFill as Music, RiVideoFill as Video, RiImageFill as ImageIcon
} from 'react-icons/ri';
import { supabase } from '../../supabaseClient';
import { useDeckStore } from '../../store/useDeckStore';
import { useTranslation } from 'react-i18next';
import './FloatingDock.css';

const FloatingDock = ({ user, isMobile }) => {
  const { t } = useTranslation(['dock']);
  const [isOpen, setIsOpen] = useState(false);
  const { activeDeckItems, addToDeck, removeFromDeck } = useDeckStore();
  const [isUploading, setIsUploading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    // Mock upload / addition to deck
    files.forEach(file => {
      addToDeck({
        content_id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        content_type: file.type,
        size: file.size
      });
    });

    setIsUploading(false);
    setIsOpen(true);
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return <FileText size={18} />;
    if (type.includes('image')) return <ImageIcon size={18} />;
    if (type.includes('video')) return <Video size={18} />;
    if (type.includes('audio')) return <Music size={18} />;
    return <BookOpen size={18} />;
  };

  const removeItem = (id) => {
    removeFromDeck(id);
  };

  const startStudying = () => {
    if (activeDeckItems.length === 0) return;
    // Navigate to workstation
    window.location.href = '/dashboard/workstation';
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
                <Layers size={14} />
                <span>{t('activeContext')} ({activeDeckItems.length}/5)</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="dock-close-btn">
                <X size={14} />
              </button>
            </div>

            <div className="dock-items-list">
              {activeDeckItems.length === 0 ? (
                <div className="dock-empty-state">
                  <Upload size={24} opacity={0.3} />
                  <p>{t('dropMaterials')}</p>
                </div>
              ) : (
                activeDeckItems.map((item) => (
                  <motion.div 
                    layout
                    key={item.content_id} 
                    className="dock-item-row"
                  >
                    <div className="dock-item-icon">{getFileIcon(item.content_type || '')}</div>
                    <div className="dock-item-info">
                      <span className="dock-item-name">{item.name}</span>
                    </div>
                    <button onClick={() => removeItem(item.content_id)} className="dock-item-remove">
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {activeDeckItems.length > 0 && (
              <button onClick={startStudying} className="dock-action-btn primary">
                <Play size={16} fill="white" />
                <span>{t('start')}</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dock-main-bar">
        <label className="dock-main-action upload">
          <Upload size={20} />
          <input type="file" multiple onChange={handleFileUpload} hidden />
          <div className="dock-tooltip">{t('quickUpload')}</div>
        </label>

        <div className="dock-divider" />

        <div className="dock-active-area" onClick={() => setIsOpen(!isOpen)}>
          {activeDeckItems.length > 0 ? (
            <div className="dock-stacks">
              {activeDeckItems.slice(0, 3).map((item, i) => (
                <div 
                  key={item.content_id} 
                  className="dock-stack-item" 
                  style={{ 
                    position: 'absolute',
                    left: 0,
                    transform: `translateX(${i * 8}px) scale(${1 - i * 0.05})`,
                    zIndex: 10 - i,
                    opacity: 1 - i * 0.2
                  }}
                >
                  {getFileIcon(item.content_type || '')}
                </div>
              ))}
              <div className="dock-stack-count" style={{ marginLeft: activeDeckItems.length > 1 ? (activeDeckItems.slice(0,3).length * 8 + 24) : 40 }}>
                {activeDeckItems.length}
              </div>
            </div>
          ) : (
            <div className="dock-empty-hint">
              <Sparkles size={16} color="var(--primary)" />
              <span>{t('emptyVault')}</span>
            </div>
          )}
        </div>

        <div className="dock-divider" />

        <button 
          className={`dock-main-action study ${activeDeckItems.length === 0 ? 'disabled' : ''}`}
          onClick={startStudying}
          disabled={activeDeckItems.length === 0}
        >
          <Sparkles size={20} />
          <div className="dock-tooltip">{t('aiTutor')}</div>
        </button>
      </div>
    </div>
  );
};

export default FloatingDock;
