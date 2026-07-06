import React, { useState } from 'react';
import { 
  SidebarSimple, ShareNetwork, DotsThree, Hand, PencilSimple, 
  SelectionBackground, GraduationCap, FileText, Chalkboard,
  Cards, CheckSquareOffset, ChatTeardropText, CircleNotch,
  Highlighter, PushPin
} from '@phosphor-icons/react';
import MaterialRenderer from './MaterialRenderer';
import { LiveNoteEditor } from './NotesStudioPage';
import { Whiteboard } from './Whiteboard';
import { CommentsProvider } from './CommentsProvider';
import WorkstationFlashcards from './WorkstationFlashcards';
import WorkstationQuizzes from './WorkstationQuizzes';
import AnnotationToolbar from './AnnotationToolbar';
import { WorkspaceRightPanel } from '../shared/WorkspaceRightPanel';

const BOTTOM_WORKSPACE_TOOLS = [
  {
    id: 'select', label: 'Scroll / Pan', icon: Hand,
    baseBg: '#F3F4F6', baseBorder: '#E5E7EB', baseColor: '#374151',
    activeBg: '#DBEAFE', activeBorder: '#60A5FA', activeColor: '#1D4ED8',
  },
  {
    id: 'highlight', label: 'Highlight', icon: Highlighter,
    baseBg: '#FEF3C7', baseBorder: '#FDE68A', baseColor: '#D97706',
    activeBg: '#FDE68A', activeBorder: '#F59E0B', activeColor: '#92400E',
  },
  {
    id: 'annotate', label: 'Annotate', icon: PencilSimple,
    baseBg: '#F5F3FF', baseBorder: '#DDD6FE', baseColor: '#7C3AED',
    activeBg: '#EDE9FE', activeBorder: '#A78BFA', activeColor: '#6D28D9',
  },
  {
    id: 'pin', label: 'Sticky Note', icon: PushPin,
    baseBg: '#F3F4F6', baseBorder: '#E5E7EB', baseColor: '#374151',
    activeBg: '#111827', activeBorder: '#000000', activeColor: '#FFFFFF',
  },
];
const ANNOTATION_COLORS = ['#111827', '#7C3AED', '#EF4444', '#10B981', '#F59E0B'];
const STROKE_SIZES = [4, 7, 10];

export default function WorkstationResponsiveLayout({ state, actions }) {
  const { 
    isDark, user, activeMainTab, activeSubTab, activeWorkspaceTool, 
    isChatOpen, selectedMaterial, urlMaterialId, isCollaborative, 
    displayName, displayAvatar, roomId, isBoardFullScreen, copiedToast,
    selectedMaterialWithAnalysis, isAnalysisLoading,
    drawMode, strokeColor, strokeSize
  } = state;

  const { 
    setActiveMainTab, setActiveSubTab, setActiveWorkspaceTool, 
    setIsChatOpen, handleCopyLink, setIsBoardFullScreen, setMobileSidebarOpen,
    setDrawMode, setStrokeColor, setStrokeSize, runAnalysis
  } = actions;

  const [isMobile, setIsMobile] = React.useState(() => typeof window !== 'undefined' && window.innerWidth <= 1024);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const textColor = isDark ? '#F9FAFB' : '#111827';
  const subTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const bgColor = isDark ? '#111827' : '#F9FAFB';

  const SUB_TABS = [
    { id: 'Document', label: 'Document', icon: FileText },
    { id: 'Notes', label: 'Notes', icon: PencilSimple },
    { id: 'Boards', label: 'Boards', icon: Chalkboard },
  ];

  const MAIN_TABS = [
    { id: 'Source', label: 'Source', icon: FileText },
    { id: 'Flashcards', label: 'Flashcards', icon: Cards },
    { id: 'Quizzes', label: 'Quizzes', icon: CheckSquareOffset },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      backgroundColor: bgColor, color: textColor, position: 'relative', overflow: 'hidden'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${borderColor}`,
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        zIndex: 50
      }}>
        {/* Left: Sidebar Toggle */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button 
            onClick={() => setMobileSidebarOpen?.(true)}
            style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <SidebarSimple size={26} weight="bold" color={textColor} />
          </button>
        </div>

        {/* Center: Sub Tabs (Document | Notes | Boards) */}
        <div style={{
          display: 'flex', alignItems: 'center', backgroundColor: isDark ? '#374151' : '#F3F4F6',
          borderRadius: '9999px', padding: '4px', flexShrink: 0
        }}>
          {SUB_TABS.map(tab => {
            const isActive = activeSubTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '9999px', border: 'none',
                  backgroundColor: isActive ? (isDark ? '#4B5563' : '#FFFFFF') : 'transparent',
                  color: isActive ? textColor : subTextColor,
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  fontWeight: isActive ? 600 : 500, fontSize: '13px', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                <TabIcon size={16} weight={isActive ? "fill" : "regular"} />
                <span className="ws-tablet-text">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
          <button 
            onClick={handleCopyLink}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '9999px', border: `1px solid ${borderColor}`,
              backgroundColor: 'transparent', color: textColor, fontWeight: 600, fontSize: '13px',
              cursor: 'pointer'
            }}>
            <ShareNetwork size={16} weight="bold" />
            <span className="ws-tablet-text">Share</span>
          </button>
        </div>
      </div>

      {/* DUMMY WHITEBOARD TOOLBAR */}
      {activeMainTab === 'Source' && activeSubTab === 'Boards' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', backgroundColor: isDark ? '#111827' : '#F9FAFB'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '12px', border: 'none',
              backgroundColor: '#8B5CF6', color: '#FFFFFF', cursor: 'pointer'
            }}>
              <Hand size={22} weight="fill" />
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '12px', border: 'none',
              backgroundColor: 'transparent', color: subTextColor, cursor: 'pointer'
            }}>
              <PencilSimple size={22} weight="bold" />
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '12px', border: 'none',
              backgroundColor: 'transparent', color: subTextColor, cursor: 'pointer'
            }}>
              <SelectionBackground size={22} weight="bold" />
            </button>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '9999px', border: `1px solid ${borderColor}`,
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF', color: textColor, fontWeight: 600, fontSize: '14px',
            cursor: 'pointer'
          }}>
            <GraduationCap size={20} weight="bold" />
            Study Deck
          </button>
        </div>
      )}



      {/* Main Content Area */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden', 
        borderTopLeftRadius: isMobile ? '0px' : '24px', 
        borderTopRightRadius: isMobile ? '0px' : '24px',
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
      }}>
        {activeMainTab === 'Flashcards' && selectedMaterial && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <WorkstationFlashcards material={selectedMaterial} items={selectedMaterial?.analysis?.flashcards || []} isDark={isDark} user={user} />
          </div>
        )}
        {activeMainTab === 'Quizzes' && selectedMaterial && (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <WorkstationQuizzes 
              material={actions.selectedMaterialWithAnalysis || state.selectedMaterialWithAnalysis || selectedMaterial} 
              isDark={isDark} 
              user={user} 
              onRegenerateQuiz={() => actions.runAnalysis && actions.runAnalysis('quiz')}
              isAnalysisLoading={state.isAnalysisLoading}
            />
          </div>
        )}
        {activeMainTab === 'Source' && selectedMaterial && (
          <div style={{ display: activeSubTab === 'Document' ? 'block' : 'none', height: '100%', position: 'relative' }}>
            <MaterialRenderer 
              material={selectedMaterial} 
              isDark={isDark} 
              urlMaterialId={urlMaterialId}
              activeTab="source"
              annotateMode={activeWorkspaceTool === 'annotate'}
              highlightMode={activeWorkspaceTool === 'highlight'}
              pinMode={activeWorkspaceTool === 'pin'}
              annotationColor={strokeColor}
              annotationStrokeSize={strokeSize}
              isEraserMode={drawMode === 'eraser'}
              annotationToolType={drawMode}
              scrollContainerRef={{ current: null }}
            />
          </div>
        )}
        {activeMainTab === 'Source' && (
          <div style={{ display: activeSubTab === 'Notes' ? 'block' : 'none', height: '100%', overflowY: 'auto' }}>
            <CommentsProvider roomId={selectedMaterial ? `luter:notes:${selectedMaterial.id}` : `luter:notes:${roomId}`}>
              <LiveNoteEditor 
                title={selectedMaterial?.title || 'Workspace Note'} 
                roomId={selectedMaterial ? `luter:notes:${selectedMaterial.id}` : `luter:notes:${roomId}`} 
                displayName={displayName} 
                user={user} 
                workstationMode={true} 
              />
            </CommentsProvider>
          </div>
        )}
        {activeMainTab === 'Source' && (
          <div style={{ display: activeSubTab === 'Boards' ? 'block' : 'none', height: '100%', width: '100%' }}>
            <Whiteboard isCollaborative={isCollaborative} roomId={roomId} />
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation */}
      
      {/* Floating Tool Dock for Documents */}
      {activeMainTab === 'Source' && activeSubTab === 'Document' && (
        <div style={{
          position: 'absolute', bottom: isMobile ? '90px' : '104px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 40,
        }}>
          <AnnotationToolbar 
            activeWorkspaceTool={activeWorkspaceTool}
            isEraserMode={drawMode === 'eraser'}
            setIsEraserMode={(val) => setDrawMode(val ? 'eraser' : 'pen')}
            strokeColor={strokeColor} setStrokeColor={setStrokeColor}
            strokeSize={strokeSize} setStrokeSize={setStrokeSize}
            ANNOTATION_COLORS={ANNOTATION_COLORS} STROKE_SIZES={STROKE_SIZES}
            isDark={isDark}
            visible={['annotate', 'highlight', 'pin'].includes(activeWorkspaceTool)}
          />
          
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: isDark ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)', padding: '6px 10px', borderRadius: '9999px',
            border: `1px solid ${borderColor}`, boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
            transform: isMobile ? 'scale(0.95)' : 'none'
          }}>
            {BOTTOM_WORKSPACE_TOOLS.map(tool => {
              const ToolIcon = tool.icon;
              const isActive = (activeWorkspaceTool === tool.id) || (tool.id === 'select' && !activeWorkspaceTool);
              return (
                <button key={tool.id} onClick={() => setActiveWorkspaceTool(tool.id === 'select' ? null : tool.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: isMobile ? '6px 10px' : '8px 12px', borderRadius: '9999px',
                    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    border: `2px solid ${isActive ? tool.activeBorder : tool.baseBorder}`,
                    backgroundColor: isActive ? tool.activeBg : tool.baseBg,
                    color: isActive ? tool.activeColor : tool.baseColor,
                    transition: 'all 0.2s', boxShadow: isActive ? 'inset 0 2px 6px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  <ToolIcon size={isMobile ? 18 : 20} weight={isActive ? "fill" : "bold"} />
                  {!isMobile && isActive && <span>{tool.label}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: '24px', left: '20px', right: '20px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        pointerEvents: 'none', zIndex: 50
      }}>
        {/* Nav segmented control */}
        <div style={{
          display: 'flex', alignItems: 'center', backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderRadius: '16px', padding: '6px', gap: '4px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: `1px solid ${borderColor}`,
          pointerEvents: 'auto'
        }}>
          {MAIN_TABS.map(tab => {
            const isActive = activeMainTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  width: '70px', height: '60px', borderRadius: '12px', border: 'none',
                  backgroundColor: isActive ? (isDark ? '#374151' : '#F3F4F6') : 'transparent',
                  color: isActive ? textColor : subTextColor,
                  fontWeight: isActive ? 600 : 500, fontSize: '12px', cursor: 'pointer'
                }}>
                <TabIcon size={24} weight={isActive ? "fill" : "regular"} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Mascot Chat Icon */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '60px', height: '60px', borderRadius: '16px', border: 'none',
            backgroundColor: '#FDE68A',
            color: '#92400E',
            boxShadow: '0 8px 32px rgba(245,158,11,0.3)', pointerEvents: 'auto',
            cursor: 'pointer'
          }}>
          <ChatTeardropText size={32} weight="fill" />
        </button>
      </div>

      {/* ── AI Chat Overlay (Mobile/Tablet) ── */}
      {/* Backdrop */}
      <div
        onClick={() => setIsChatOpen(false)}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 1100,
          opacity: isChatOpen ? 1 : 0,
          pointerEvents: isChatOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Slide-up Panel */}
      <div
        style={{
          position: 'fixed',
          left: 0, right: 0, bottom: 0,
          height: '82vh',
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden',
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          boxShadow: '0 -16px 60px rgba(0,0,0,0.25)',
          zIndex: 1101,
          transform: isChatOpen ? 'translateY(0)' : 'translateY(105%)',
          transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drag Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{
            width: '40px', height: '4px', borderRadius: '9999px',
            backgroundColor: isDark ? '#4B5563' : '#D1D5DB'
          }} />
        </div>

        {/* Panel Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px 12px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: '#FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ChatTeardropText size={20} weight="fill" color="#92400E" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: isDark ? '#F9FAFB' : '#111827' }}>AI Assistant</div>
              <div style={{ fontSize: '12px', color: isDark ? '#9CA3AF' : '#6B7280' }}>Ask anything about this document</div>
            </div>
          </div>
          <button
            onClick={() => setIsChatOpen(false)}
            style={{
              width: '36px', height: '36px', borderRadius: '10px', border: 'none',
              backgroundColor: isDark ? '#374151' : '#F3F4F6',
              color: isDark ? '#9CA3AF' : '#6B7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '20px', lineHeight: 1
            }}
          >✕</button>
        </div>

        {/* Panel Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <WorkspaceRightPanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            mode="sidebar"
            setMode={() => {}}
            panelWidth="100%"
            setPanelWidth={() => {}}
            isDark={isDark}
            user={user}
            currentNoteId={selectedMaterial?.id}
          />
        </div>
      </div>

    </div>
  );
}
