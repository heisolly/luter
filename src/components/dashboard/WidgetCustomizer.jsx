import React, { useState, useRef, useEffect } from 'react';
import { 
  SquaresFour, 
  DotsSixVertical, 
  Fire, 
  Compass, 
  Lightning, 
  ChartPieSlice, 
  ListChecks, 
  CalendarBlank, 
  Clock, 
  FolderOpen, 
  Users 
} from '@phosphor-icons/react';

export default function WidgetCustomizer({ 
  isDark = false,
  activeWidgets = null,
  setActiveWidgets = null,
  activeContent = null,
  setActiveContent = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Internal state if not provided as props
  const [internalWidgets, setInternalWidgets] = useState({
    heatmap: true,
    explore: true,
    streak: true,
    studyProgress: false,
    todo: false,
    calendar: false,
  });

  const [internalContent, setInternalContent] = useState({
    recent: true,
    library: true,
  });

  // Use provided state or internal state
  const widgets = activeWidgets || internalWidgets;
  const updateWidgets = setActiveWidgets || setInternalWidgets;
  const content = activeContent || internalContent;
  const updateContent = setActiveContent || setInternalContent;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Colors based on theme
  const bgMain = isDark ? '#1F2937' : '#FFFFFF';
  const bgHover = isDark ? '#374151' : '#F9FAFB';
  const textMain = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const borderCol = isDark ? '#374151' : '#E5E7EB';
  const shadowCol = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.05)';
  
  // Custom Purple for active state
  const activeBg = isDark ? 'rgba(139, 92, 246, 0.2)' : '#F5F3FF';
  const activeText = isDark ? '#A78BFA' : '#6D28D9';
  const activeBorder = isDark ? 'rgba(139, 92, 246, 0.5)' : '#DDD6FE';

  const toggleWidget = (key) => {
    // If it's already active, we can always turn it off
    if (widgets[key]) {
      updateWidgets({ ...widgets, [key]: false });
      return;
    }
    // If turning on, check if we're at max 3
    const currentActiveCount = Object.values(widgets).filter(Boolean).length;
    if (currentActiveCount < 3) {
      updateWidgets({ ...widgets, [key]: true });
    }
  };

  const toggleContent = (key) => {
    updateContent({ ...content, [key]: !content[key] });
  };

  const currentActiveCount = Object.values(widgets).filter(Boolean).length;

  const CustomToggle = ({ isActive, onClick }) => {
    return (
      <div 
        onClick={onClick}
        style={{
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          backgroundColor: isActive ? '#7C3AED' : (isDark ? '#4B5563' : '#F3F4F6'),
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          border: isActive ? 'none' : `1px solid ${borderCol}`,
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: '#FFF',
          transform: isActive ? 'translateX(16px)' : 'translateX(0)',
          transition: 'transform 0.2s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }} />
      </div>
    );
  };

  const DraggableRow = ({ title, icon: Icon, isActive, onToggle }) => {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '12px',
        backgroundColor: isActive ? activeBg : 'transparent',
        border: isActive ? `1px solid ${activeBorder}` : '1px solid transparent',
        transition: 'all 0.2s',
        marginBottom: '4px'
      }}>
        <div style={{ cursor: 'grab', display: 'flex', color: textSecondary }}>
          <DotsSixVertical size={20} weight="bold" />
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1,
          color: isActive ? activeText : textSecondary
        }}>
          <Icon size={20} weight={isActive ? "fill" : "regular"} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{title}</span>
        </div>
        <CustomToggle isActive={isActive} onClick={onToggle} />
      </div>
    );
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Customise Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: bgMain,
          border: `1px solid ${borderCol}`,
          borderRadius: '24px',
          color: textMain,
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: `0 2px 4px ${shadowCol}`,
          transition: 'all 0.2s'
        }}
      >
        <SquaresFour size={20} weight="regular" />
        Customise
      </button>

      {/* Popover */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '280px',
          backgroundColor: bgMain,
          border: `1px solid ${borderCol}`,
          borderRadius: '16px',
          boxShadow: `0 10px 25px -5px ${shadowCol}`,
          padding: '16px',
          zIndex: 50,
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          {/* Widgets Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: textMain }}>Widgets</span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: textSecondary, 
              backgroundColor: isDark ? '#374151' : '#F3F4F6',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {currentActiveCount}/3
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
            <DraggableRow title="Calendar Heatmap" icon={Fire} isActive={widgets.heatmap} onToggle={() => toggleWidget('heatmap')} />
            <DraggableRow title="Explore Luter" icon={Compass} isActive={widgets.explore} onToggle={() => toggleWidget('explore')} />
            <DraggableRow title="Todo List" icon={ListChecks} isActive={widgets.todo} onToggle={() => toggleWidget('todo')} />
            <DraggableRow title="Study Progress" icon={ChartPieSlice} isActive={widgets.studyProgress} onToggle={() => toggleWidget('studyProgress')} />
            <DraggableRow title="Mini Streak Card" icon={Lightning} isActive={widgets.streak} onToggle={() => toggleWidget('streak')} />
            <DraggableRow title="Calendar" icon={CalendarBlank} isActive={widgets.calendar} onToggle={() => toggleWidget('calendar')} />
          </div>

          {/* Content Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: textMain }}>Content</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <DraggableRow title="Recently Studied" icon={Clock} isActive={content.recent} onToggle={() => toggleContent('recent')} />
            <DraggableRow title="Personal Library" icon={FolderOpen} isActive={content.library} onToggle={() => toggleContent('library')} />
          </div>
        </div>
      )}
    </div>
  );
}
