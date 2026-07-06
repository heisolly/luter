import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ListChecks, 
  Plus, 
  Database, 
  Folder, 
  CalendarBlank, 
  CaretLeft, 
  CaretRight, 
  Repeat,
  BookOpen,
  CalendarCheck,
  Scissors,
  CheckCircle,
  X
} from '@phosphor-icons/react';

// --- DUMMY DATA ---
const dummyTags = [
  { id: '1', title: 'A.C. Circuit', icon: <Database size={16} color="#E85D04" />, emoji: '📈' },
  { id: '2', title: 'Intro. to C Language', icon: <Database size={16} color="#E85D04" />, emoji: '🗓️' },
  { id: '3', title: 'New Deck', icon: <Database size={16} color="#E85D04" />, emoji: '💡' },
  { id: '4', title: 'ABeginnersGuideToPython3Progra...', icon: <Database size={16} color="#E85D04" />, emoji: '👨‍🎓' },
  { id: '5', title: 'GST112', icon: <Database size={16} color="#E85D04" />, emoji: '' },
  { id: '6', title: '30_Python_Questions_v2', icon: <Database size={16} color="#E85D04" />, emoji: '✂️' },
];

export default function TodoListWidget({ isDark = false }) {
  const [isAdding, setIsAdding] = useState(false);
  const [taskText, setTaskText] = useState('');
  
  // Popover states
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);

  // References for clicking outside
  const widgetRef = useRef(null);
  const inputRef = useRef(null);

  // Colors based on theme (Matching ExploreTasksWidget)
  const bgOuter = isDark ? '#1F2937' : '#F3F4F6';
  const bgInner = isDark ? '#111827' : '#FFFFFF';
  const textTitle = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const hoverBg = isDark ? '#374151' : '#F9FAFB';
  const primaryColor = '#8B5CF6'; // Purple
  const primaryLight = isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE';

  // Handle typing to show tag menu
  const handleInputChange = (e) => {
    const val = e.target.value;
    setTaskText(val);
    if (val.includes('@')) {
      setShowTagMenu(true);
      setShowDateMenu(false);
    } else {
      setShowTagMenu(false);
    }
  };

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setShowTagMenu(false);
        setShowDateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={widgetRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderRadius: '24px',
        backgroundColor: bgOuter,
        padding: '16px 4px 4px 4px',
        width: '100%',
        minHeight: '320px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        height: '30px',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListChecks size={20} weight="regular" color={textTitle} />
          <span style={{ fontSize: '16px', fontWeight: 700, color: textTitle }}>To-Do</span>
        </div>
        
        {!isAdding && (
          <button 
            onClick={() => {
              setIsAdding(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: textTitle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%'
            }}
          >
            <Plus size={20} weight="bold" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        borderRadius: '24px',
        backgroundColor: bgInner,
        padding: '16px',
        position: 'relative',
        overflow: 'visible' // Allow popovers to break out
      }}>
        
        <AnimatePresence mode="wait">
          {!isAdding ? (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px'
              }}
            >
              {/* Illustration */}
              <div style={{ position: 'relative', width: '120px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {/* Shadow */}
                <div style={{ position: 'absolute', bottom: 10, width: '100px', height: '20px', backgroundColor: isDark ? '#1F2937' : '#E5E7EB', borderRadius: '50%' }} />
                
                {/* Lines Card */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: 25, 
                  width: '90px', 
                  height: '60px', 
                  backgroundColor: isDark ? '#374151' : '#F3F4F6', 
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '10px 8px',
                  gap: '8px',
                  border: `1px solid ${isDark ? '#4B5563' : '#E5E7EB'}`
                }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: `1px solid ${isDark ? '#9CA3AF' : '#D1D5DB'}` }} />
                      <div style={{ height: '4px', width: i === 2 ? '30px' : '45px', backgroundColor: isDark ? '#6B7280' : '#D1D5DB', borderRadius: '2px' }} />
                    </div>
                  ))}
                </div>

                {/* Floating Question Mark */}
                <div style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: '28px',
                  height: '28px',
                  backgroundColor: isDark ? '#4B5563' : '#D1D5DB',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#F9FAFB' : '#4B5563',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  ?
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: textTitle }}>No Tasks yet</h3>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: textSecondary }}>Add a Task using the plus button</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="add-task-state"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative' // For popovers
              }}
            >
              {/* Input Area */}
              <div style={{ flex: 1 }}>
                <input
                  ref={inputRef}
                  value={taskText}
                  onChange={handleInputChange}
                  placeholder="Use @ to tag decks & folders"
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '16px',
                    color: textTitle,
                    outline: 'none',
                    fontStyle: taskText.length === 0 ? 'italic' : 'normal',
                    padding: '8px 0',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Tag Popover */}
              <AnimatePresence>
                {showTagMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: '40px',
                      left: '0',
                      width: '100%',
                      maxWidth: '300px',
                      backgroundColor: bgInner,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                      zIndex: 50,
                      maxHeight: '240px',
                      overflowY: 'auto',
                      padding: '8px 0'
                    }}
                  >
                    {dummyTags.map((tag) => (
                      <div 
                        key={tag.id}
                        onClick={() => {
                          setTaskText(taskText.replace(/@\w*$/, `@${tag.title.replace(/\s+/g, '')} `));
                          setShowTagMenu(false);
                          inputRef.current?.focus();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          color: textTitle
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {tag.icon}
                        <span style={{ fontSize: '14px', fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tag.title}
                        </span>
                        {tag.emoji && <span style={{ fontSize: '14px' }}>{tag.emoji}</span>}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', margin: '16px 0', flexWrap: 'wrap' }}>
                <button style={actionBtnStyle(isDark, borderColor, textTitle)}>
                  <Database size={16} weight="regular" /> Decks
                </button>
                <button style={actionBtnStyle(isDark, borderColor, textTitle)}>
                  <Folder size={16} weight="regular" /> Folders
                </button>
                <button 
                  onClick={() => setShowDateMenu(!showDateMenu)}
                  style={{...actionBtnStyle(isDark, borderColor, textTitle), position: 'relative'}}
                >
                  <CalendarBlank size={16} weight="regular" /> Date
                  
                  {/* Date Popover */}
                  <AnimatePresence>
                    {showDateMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          left: '0',
                          width: '260px',
                          backgroundColor: bgInner,
                          border: `1px solid ${borderColor}`,
                          borderRadius: '16px',
                          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                          zIndex: 60,
                          padding: '16px',
                          cursor: 'default'
                        }}
                      >
                        {/* Calendar Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <button style={calNavBtnStyle(isDark, hoverBg)}><CaretLeft size={16} /></button>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: textTitle }}>Jul 2026</span>
                          <button style={calNavBtnStyle(isDark, hoverBg)}><CaretRight size={16} /></button>
                        </div>

                        {/* Days Grid */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(7, 1fr)', 
                          gap: '4px',
                          textAlign: 'center',
                          marginBottom: '16px'
                        }}>
                          {['M','T','W','T','F','S','S'].map((d, i) => (
                            <span key={i} style={{ fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '8px' }}>{d}</span>
                          ))}
                          
                          {/* Empty slots for July 2026 (Starts on Wed) */}
                          <div /><div />
                          
                          {/* Days */}
                          {Array.from({length: 31}, (_, i) => i + 1).map(day => {
                            const isSelected = day === 3;
                            return (
                              <button key={day} style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: isSelected ? primaryColor : textTitle,
                                fontWeight: isSelected ? 700 : 500,
                              }}>
                                {day}
                              </button>
                            );
                          })}
                        </div>
                        
                        <div style={{ height: '1px', backgroundColor: borderColor, margin: '0 -16px 12px' }} />

                        {/* Bottom Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button style={calActionBtnStyle(textSecondary, hoverBg)}>
                            <CalendarBlank size={16} weight="regular" style={{ opacity: 0.7 }} /> 
                            No date
                          </button>
                          
                          <div style={{ position: 'relative' }}>
                            <button 
                              onClick={() => setShowRecurring(!showRecurring)}
                              style={{...calActionBtnStyle(textSecondary, hoverBg), justifyContent: 'space-between', width: '100%', backgroundColor: showRecurring ? hoverBg : 'transparent'}}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Repeat size={16} weight="regular" /> 
                                Recurring task
                              </div>
                              <CaretRight size={14} style={{ transform: showRecurring ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }} />
                            </button>
                            
                            {/* Recurring Dropdown */}
                            <AnimatePresence>
                              {showRecurring && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{ overflow: 'hidden', padding: '4px 0 0' }}
                                >
                                  {['None', 'Daily', 'Weekly', 'Every two weeks', 'Monthly'].map((opt, i) => (
                                    <button 
                                      key={i}
                                      style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '8px 12px 8px 32px',
                                        background: i === 0 ? (isDark ? '#374151' : '#F3F4F6') : 'transparent',
                                        border: 'none',
                                        color: textTitle,
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        borderRadius: '8px'
                                      }}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>

                </button>
              </div>

              {/* Bottom Save/Cancel */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                marginTop: 'auto',
                borderTop: `1px solid ${borderColor}`,
                paddingTop: '16px'
              }}>
                <button 
                  onClick={() => setIsAdding(false)}
                  style={{
                    padding: '10px 0',
                    borderRadius: '12px',
                    border: `1px solid ${borderColor}`,
                    background: 'transparent',
                    color: textTitle,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button 
                  disabled={taskText.trim() === ''}
                  style={{
                    padding: '10px 0',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: taskText.trim() === '' ? (isDark ? '#374151' : '#E5E7EB') : primaryLight,
                    color: taskText.trim() === '' ? (isDark ? '#6B7280' : '#9CA3AF') : primaryColor,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: taskText.trim() === '' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Plus size={16} weight="bold" />
                  Add task
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper styles
const actionBtnStyle = (isDark, border, text) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '8px',
  border: `1px solid ${border}`,
  background: 'transparent',
  color: text,
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer'
});

const calNavBtnStyle = (isDark, hoverBg) => ({
  width: '28px',
  height: '28px',
  borderRadius: '8px',
  border: `1px solid ${isDark ? '#4B5563' : '#E5E7EB'}`,
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: isDark ? '#F9FAFB' : '#111827',
});

const calActionBtnStyle = (color, hoverBg) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  color: color,
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
});
