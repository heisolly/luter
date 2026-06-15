import React, { useState } from 'react';
import { AiChatPanel } from './AiChatPanel';
import { Sparkle, Notebook, ChatCircleDots, List } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { CollabChatPanel } from './CollabChatPanel';
import { OutlinePanel } from './OutlinePanel';

export function WorkspaceRightPanel(props) {
  const { isOpen, mode, panelWidth, isDark } = props;
  const [activeTab, setActiveTab] = useState('ai');

  if (!isOpen) return null;

  const tabs = [
    { id: 'ai', label: 'AI', icon: <Sparkle /> },
    { id: 'chat', label: 'Chat', icon: <ChatCircleDots /> },
    { id: 'outline', label: 'Outline', icon: <List /> }
  ];

  return (
    <div className={`ns-ai-panel mode-${mode}`} style={{ 
      width: mode === 'fullscreen' ? '100%' : panelWidth,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: isDark ? '#111827' : '#FAFAFA', // matching typical workspace panel background
      borderLeft: mode === 'sidebar' ? `1px solid ${isDark ? '#374151' : '#E5E7EB'}` : 'none',
      height: '100%',
      position: 'relative'
    }}>
      {/* Tab Navigation Header */}
      <div style={{
        display: 'flex',
        padding: '12px 16px',
        borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        gap: '4px',
        alignItems: 'center',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: '4px', position: 'relative' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const color = isActive ? (isDark ? '#F9FAFB' : '#111827') : (isDark ? '#9CA3AF' : '#6B7280');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  position: 'relative', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px',
                  border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '999px',
                  fontSize: '13px', fontWeight: isActive ? 600 : 500, color, transition: 'color 0.2s'
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="luter-tabs-indicator"
                    style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: isDark ? '#374151' : '#F3F4F6', borderRadius: '999px', zIndex: 0
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                  {React.cloneElement(tab.icon, { weight: isActive ? 'fill' : 'bold', size: 16 })}
                </span>
                <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {props.onClose && (
            <button 
              onClick={props.onClose}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: isDark ? '#9CA3AF' : '#6B7280', padding: '6px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#F3F4F6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {activeTab === 'ai' && (
          <AiChatPanel 
            {...props}
            hideWrapper={true}
          />
        )}
        
        {activeTab === 'chat' && (
          <CollabChatPanel isDark={isDark} room_id={props.currentNoteId || 'global'} user={props.user} profile={props.profile} />
        )}
        
        {activeTab === 'outline' && (
          <OutlinePanel isDark={isDark} />
        )}
      </div>
    </div>
  );
}
