import { useEffect, useRef } from 'react';
import ColourPicker from '../ui/ColourPicker';
import { 
  Highlighter, ChatCircle, Copy, Trash, Sparkle, 
  ArrowSquareOut 
} from '@phosphor-icons/react';

export default function HighlightToolbox({
  toolbox,
  COLORS,
  selectedColor,
  setSelectedColor,
  onApply,
  onDelete,
  onSendToAI,
  onClose,
  containerRef,
}) {
  const ref = useRef(null);

  // Calculate position
  const style = {
    position: 'absolute',
    zIndex: 100,
    left: toolbox.x,
    top: toolbox.y - 8,
    transform: 'translate(-50%, -100%)',
  };

  // Clamp to container bounds
  useEffect(() => {
    if (!ref.current || !containerRef.current) return;
    const box = ref.current.getBoundingClientRect();
    const container = containerRef.current.getBoundingClientRect();
    
    // Prevent going off left edge
    if (box.left < container.left + 8) {
      ref.current.style.transform = 
        `translate(${container.left + 8 - box.left}px, -100%)`;
    }
    // Prevent going off right edge
    if (box.right > container.right - 8) {
      ref.current.style.transform = 
        `translate(calc(-50% - ${box.right - container.right + 8}px), -100%)`;
    }
  });

  return (
    <div
      ref={ref}
      className="highlight-toolbox"
      style={{
        ...style,
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        width: '260px',
        animation: 'toolboxAppear 150ms ease',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Arrow */}
      <div style={{
        position: 'absolute',
        bottom: -6,
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: 12, height: 12,
        background: 'white',
        borderRight: '1px solid #E5E7EB',
        borderBottom: '1px solid #E5E7EB',
      }}/>

      {/* Quoted text */}
      <div style={{
        background: '#F9FAFB',
        borderLeft: '3px solid #A78BFA',
        borderRadius: '0 6px 6px 0',
        padding: '5px 10px',
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 10,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        fontStyle: 'italic',
      }}>
        "{toolbox.text?.slice(0, 50)}
        {toolbox.text?.length > 50 ? '...' : ''}"
      </div>

      {/* Color picker row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: '#9CA3AF', letterSpacing: '0.07em',
          flexShrink: 0,
        }}>
          COLOR
        </span>
        <div style={{display:'flex', gap:5}}>
          <ColourPicker
            selectedColor={selectedColor}
            onChange={setSelectedColor}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: 6,
        borderTop: '1px solid #F3F4F6',
        paddingTop: 10,
      }}>
        {/* Apply/Change highlight */}
        {!toolbox.existingId ? (
          <button
            onClick={() => {
              const color = COLORS.find(c => c.bg === selectedColor) 
                            || COLORS[0];
              onApply(color);
            }}
            style={{
              flex: 1,
              background: selectedColor,
              border: 'none',
              borderRadius: '9999px',
              padding: '7px 0',
              fontSize: 12,
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              transition: 'opacity 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Highlighter size={13}/>
            Highlight
          </button>
        ) : (
          <button
            onClick={() => onDelete(toolbox.existingId)}
            style={{
              flex: 1,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '9999px',
              padding: '7px 0',
              fontSize: 12,
              fontWeight: 600,
              color: '#EF4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Trash size={13}/>
            Remove
          </button>
        )}

        {/* Ask AI */}
        <button
          onClick={() => {
            onSendToAI(toolbox.text);
            onClose();
          }}
          style={{
            padding: '7px 10px',
            background: '#F5F3FF',
            border: '1px solid #DDD6FE',
            borderRadius: '9999px',
            fontSize: 12,
            color: '#6D28D9',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 150ms',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#EDE9FE'}
          onMouseLeave={e => e.currentTarget.style.background = '#F5F3FF'}
        >
          <Sparkle size={13} color="#7C3AED"/>
          Ask AI
        </button>

        {/* Copy */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(toolbox.text);
            onClose();
          }}
          style={{
            width: 34, height: 34,
            background: 'transparent',
            border: '1px solid #E5E7EB',
            borderRadius: '9999px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms',
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Copy size={13} color="#6B7280"/>
        </button>
      </div>
    </div>
  );
}
