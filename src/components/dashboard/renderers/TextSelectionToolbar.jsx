import React from 'react';
import { 
  ChatCircle, MagicWand, Copy, TextStrikethrough, TextUnderline, Highlighter
} from '@phosphor-icons/react';

export default function TextSelectionToolbar({ 
  position, 
  onAction, 
  isDark 
}) {
  if (!position) return null;

  const bg = isDark ? '#1F2937' : '#FFFFFF';
  const border = isDark ? '#374151' : '#E5E7EB';
  const text = isDark ? '#F9FAFB' : '#111827';
  const hoverBg = isDark ? '#78350F' : '#FDE68A'; // Warm orange/yellow hover fill

  const btnStyle = {
    background: 'transparent',
    border: 'none',
    color: text,
    padding: '6px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    position: 'relative'
  };

  const ActionButton = ({ icon: Icon, title, action, color }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    return (
      <button 
        style={{...btnStyle, color: color || text}} 
        onMouseEnter={e => {
          e.currentTarget.style.background = hoverBg;
          setIsHovered(true);
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          setIsHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onAction(action);
        }}
      >
        <Icon size={22} weight="regular" />
        
        {/* Custom Tooltip */}
        {isHovered && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '12px',
            background: isDark ? '#374151' : '#FFFFFF',
            border: `1px solid ${isDark ? '#4B5563' : '#E5E7EB'}`,
            borderRadius: '12px',
            padding: '4px 10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 1000001,
            animation: 'toolboxAppear 0.15s ease-out'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: text }}>
              {title}
            </span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div 
      className="text-selection-toolbar"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y - 65,
        transform: 'translateX(-50%)',
        zIndex: 999999,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '16px',
        boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 10px 30px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        gap: '8px',
        animation: 'toolboxAppear 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onPointerDown={(e) => {
        // Removed e.preventDefault() so clicks inside will work natively
        e.stopPropagation();
      }}
    >
      <ActionButton icon={MagicWand} title="Ask AI" action="explain" color="#8B5CF6" />
      
      <div style={{ width: 1, height: 24, background: border, margin: '0 4px' }} />

      <ActionButton icon={Highlighter} title="Highlight" action="highlight" color="#EAB308" />
      <ActionButton icon={TextUnderline} title="Underline" action="underline" />
      <ActionButton icon={TextStrikethrough} title="Strike Through" action="strike" />

      <div style={{ width: 1, height: 24, background: border, margin: '0 4px' }} />

      <ActionButton icon={ChatCircle} title="Comment" action="comment" />
      
      <div style={{ width: 1, height: 24, background: border, margin: '0 4px' }} />

      <ActionButton icon={Copy} title="Copy" action="copy" />
    </div>
  );
}
