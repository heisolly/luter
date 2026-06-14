import React, { useState, useEffect, useRef } from 'react';
import { 
  PaperPlaneRight, X, CaretLeft, CaretRight, DotsThree, Check, 
  ArrowArcLeft, Smiley, At
} from '@phosphor-icons/react';

export default function CommentEditorPopup({
  position,
  initialComment = '',
  onSave,
  onCancel,
  onDelete,
  isDark,
  color = '#EAB308' // default yellow for the dot
}) {
  const [mode, setMode] = useState(initialComment ? 'view' : 'edit');
  const [text, setText] = useState(initialComment);
  const [showMenu, setShowMenu] = useState(false);
  
  const menuRef = useRef(null);

  useEffect(() => {
    setText(initialComment);
    setMode(initialComment ? 'view' : 'edit');
  }, [initialComment]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!position) return null;

  const bg = isDark ? '#1F2937' : '#FFFFFF';
  const border = isDark ? '#374151' : '#E5E7EB';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const mutedText = isDark ? '#9CA3AF' : '#6B7280';
  const hoverBg = isDark ? '#374151' : '#F3F4F6';
  const primary = '#3B82F6';

  const IconButton = ({ icon: Icon, onClick, color, title, disabled, highlighted }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: highlighted ? hoverBg : 'transparent',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? (isDark ? '#4B5563' : '#D1D5DB') : (color || mutedText),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '4px',
        borderRadius: '4px',
        transition: 'background 0.2s'
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = highlighted ? hoverBg : 'transparent'; }}
    >
      <Icon size={16} weight="bold" />
    </button>
  );

  const renderViewMode = () => (
    <div style={{ padding: '12px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <IconButton icon={CaretLeft} disabled />
          <IconButton icon={CaretRight} disabled />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
          <div ref={menuRef}>
            <IconButton 
              icon={DotsThree} 
              onClick={() => setShowMenu(!showMenu)} 
              highlighted={showMenu}
            />
            {showMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: '40px',
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: '8px',
                boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.8)' : '0 4px 20px rgba(0,0,0,0.1)',
                padding: '4px 0',
                minWidth: '160px',
                zIndex: 10
              }}>
                {[
                  { label: 'Link to comment', action: () => {} },
                  { label: 'Copy text', action: () => navigator.clipboard.writeText(text) },
                  { label: 'Mark as unread', action: () => {} },
                  { label: 'Edit comment', action: () => { setMode('edit'); setShowMenu(false); } },
                  { label: 'Delete comment', action: onDelete }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      item.action();
                      setShowMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      color: textColor,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <IconButton icon={Check} onClick={onCancel} title="Resolve" />
          
          <div style={{ width: 1, height: 16, background: border, margin: '0 4px' }} />
          
          <div style={{ 
            width: 14, height: 14, borderRadius: '50%', 
            backgroundColor: color, 
            border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`
          }} />
          
          <IconButton icon={X} onClick={onCancel} />
        </div>
      </div>

      {/* Comment Body */}
      <div style={{ marginBottom: '16px', padding: '0 4px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '2px' }}>
          You
        </div>
        <div style={{ fontSize: '11px', color: mutedText, marginBottom: '8px' }}>
          just now
        </div>
        <div style={{ fontSize: '14px', color: textColor, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {text}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
        <button
          onClick={() => setMode('edit')}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: mutedText, fontSize: '13px', fontWeight: 500, padding: '4px 8px', borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = textColor; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = mutedText; }}
        >
          <ArrowArcLeft size={16} weight="bold" />
          Reply
        </button>
        
        <button
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: mutedText, padding: '4px', borderRadius: '4px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Smiley size={20} weight="regular" />
        </button>
      </div>
    </div>
  );

  const renderEditMode = () => (
    <>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 16px',
        borderBottom: `1px solid ${border}` 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: textColor }}>
            {initialComment ? 'Edit Comment' : 'New Comment'}
          </span>
        </div>
        <IconButton icon={X} onClick={() => initialComment ? setMode('view') : onCancel} />
      </div>

      <div style={{ padding: '16px' }}>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Comment or use @ to mention"
          style={{
            width: '100%',
            minHeight: '80px',
            border: 'none',
            background: 'transparent',
            resize: 'none',
            outline: 'none',
            color: textColor,
            fontSize: '14px',
            lineHeight: '1.5',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div style={{ 
        padding: '12px 16px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isDark ? '#111827' : '#F9FAFB',
        borderTop: `1px solid ${border}`,
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px'
      }}>
        {/* Left Side: Tools */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedText, display: 'flex', padding: '4px', borderRadius: '4px' }}
            onMouseEnter={e => e.currentTarget.style.background = hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Smiley size={18} />
          </button>
          <button 
            onClick={() => setText(prev => prev + '@')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedText, display: 'flex', padding: '4px', borderRadius: '4px' }}
            onMouseEnter={e => e.currentTarget.style.background = hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <At size={18} />
          </button>
        </div>

        {/* Right Side: Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => initialComment ? setMode('view') : onCancel}
            style={{
              background: 'transparent',
              border: `1px solid ${border}`,
              padding: '6px 14px',
              borderRadius: '20px',
              cursor: 'pointer',
              color: textColor,
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(text)}
            disabled={!text.trim() || text === initialComment}
            style={{
              background: (text.trim() && text !== initialComment) ? primary : (isDark ? '#374151' : '#E5E7EB'),
              border: 'none',
              padding: '6px 16px',
              borderRadius: '20px',
              cursor: (text.trim() && text !== initialComment) ? 'pointer' : 'default',
              color: (text.trim() && text !== initialComment) ? '#FFFFFF' : mutedText,
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { if (text.trim() && text !== initialComment) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { if (text.trim() && text !== initialComment) e.currentTarget.style.opacity = '1'; }}
          >
            {initialComment ? 'Update' : 'Post'}
            <PaperPlaneRight weight="fill" size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div 
      className="comment-popup"
      style={{
      position: 'fixed',
      left: position.x + 10,
      top: position.y + 10,
      zIndex: 1000000,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: '12px',
      boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.15)',
      width: '280px',
      display: 'flex',
      flexDirection: 'column',
      animation: 'toolboxAppear 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
    }}
    onPointerDown={(e) => {
      e.stopPropagation();
    }}>
      {mode === 'view' ? renderViewMode() : renderEditMode()}
    </div>
  );
}
