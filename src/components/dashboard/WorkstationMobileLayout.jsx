import React, { useState } from 'react';
import { 
  SidebarSimple, ShareNetwork, DotsThree, Hand, PencilSimple, 
  SelectionBackground, GraduationCap, FileText, Chalkboard,
  Cards, CheckSquareOffset, ChatTeardropText, CircleNotch
} from '@phosphor-icons/react';
import MaterialRenderer from './MaterialRenderer';
import { LiveNoteEditor } from './NotesStudioPage';
import { Whiteboard } from './Whiteboard';
import WorkstationFlashcards from './WorkstationFlashcards';
import WorkstationQuizzes from './WorkstationQuizzes';

export default function WorkstationMobileLayout({ state, actions }) {
  const { 
    isDark, user, activeMainTab, activeSubTab, activeWorkspaceTool, 
    isChatOpen, selectedMaterial, urlMaterialId, isCollaborative, 
    displayName, displayAvatar, roomId, isBoardFullScreen, copiedToast
  } = state;

  const { 
    setActiveMainTab, setActiveSubTab, setActiveWorkspaceTool, 
    setIsChatOpen, handleCopyLink, setIsBoardFullScreen 
  } = actions;

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
        padding: '16px 20px', borderBottom: `1px solid ${borderColor}`,
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF'
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SidebarSimple size={28} weight="bold" color={textColor} />
          <div style={{
            position: 'absolute', top: 0, right: '-4px', width: '8px', height: '8px',
            backgroundColor: '#8B5CF6', borderRadius: '50%'
          }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleCopyLink}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '9999px', border: `1px solid ${borderColor}`,
              backgroundColor: 'transparent', color: textColor, fontWeight: 600, fontSize: '14px',
              cursor: 'pointer'
            }}>
            <ShareNetwork size={18} weight="bold" />
            Share
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${borderColor}`,
            backgroundColor: 'transparent', color: textColor, cursor: 'pointer'
          }}>
            <DotsThree size={24} weight="bold" />
          </button>
        </div>
      </div>

      {/* Tools Row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', backgroundColor: bgColor
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

      {/* Sub Navigation Row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px 12px 20px'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderRadius: '9999px', padding: '4px', border: `1px solid ${borderColor}`
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
                  padding: '8px 16px', borderRadius: '9999px', border: 'none',
                  backgroundColor: isActive ? (isDark ? '#374151' : '#F3F4F6') : 'transparent',
                  color: isActive ? textColor : subTextColor,
                  fontWeight: isActive ? 600 : 500, fontSize: '14px', cursor: 'pointer'
                }}>
                <TabIcon size={18} weight={isActive ? "fill" : "regular"} />
                {tab.label}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: subTextColor, fontSize: '13px', fontWeight: 600 }}>
          <CircleNotch size={16} weight="bold" />
          34% generated
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden', 
        borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
      }}>
        {activeMainTab === 'Flashcards' && selectedMaterial && (
          <WorkstationFlashcards material={selectedMaterial} items={selectedMaterial?.analysis?.flashcards || []} isDark={isDark} user={user} />
        )}
        {activeMainTab === 'Quizzes' && selectedMaterial && (
          <WorkstationQuizzes material={selectedMaterial} items={selectedMaterial?.analysis?.quizzes || []} isDark={isDark} user={user} />
        )}
        {activeMainTab === 'Source' && selectedMaterial && (
          <div style={{ display: activeSubTab === 'Document' ? 'block' : 'none', height: '100%', position: 'relative' }}>
            <MaterialRenderer material={selectedMaterial} isDark={isDark} urlMaterialId={urlMaterialId} />
          </div>
        )}
        {activeMainTab === 'Source' && selectedMaterial && (
          <div style={{ display: activeSubTab === 'Notes' ? 'block' : 'none', height: '100%', overflowY: 'auto' }}>
            <LiveNoteEditor isCollaborative={isCollaborative} roomId={roomId} currentUser={{id: user?.id || 'guest', name: displayName, color: '#C4B5FD'}} material={selectedMaterial} />
          </div>
        )}
        {activeMainTab === 'Source' && (
          <div style={{ display: activeSubTab === 'Boards' ? 'block' : 'none', height: '100%' }}>
            <Whiteboard isCollaborative={isCollaborative} roomId={roomId} />
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation */}
      <div style={{
        position: 'absolute', bottom: '24px', left: '20px', right: '20px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        pointerEvents: 'none'
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

    </div>
  );
}
