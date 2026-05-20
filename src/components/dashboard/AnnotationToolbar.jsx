import { 
  Pen, Minus, ArrowUpRight, TextT, Eraser, Trash 
} from '@phosphor-icons/react';

export default function AnnotationToolbar({
  drawMode, setDrawMode,
  strokeColor, setStrokeColor,
  strokeSize, setStrokeSize,
  ANNOTATION_COLORS, STROKE_SIZES,
  onClear,
  visible,
}) {
  if (!visible) return null;

  const MODES = [
    { id: 'pen',   icon: <Pen size={14}/>,          label: 'Draw' },
    { id: 'line',  icon: <Minus size={14}/>,         label: 'Line' },
    { id: 'arrow', icon: <ArrowUpRight size={14}/>,  label: 'Arrow' },
    { id: 'text',  icon: <TextT size={14}/>,         label: 'Text' },
  ];

  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 10px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      background: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: '20px',
      padding: '8px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      whiteSpace: 'nowrap',
      animation: 'toolboxAppear 150ms ease',
    }}>
      
      {/* Draw mode switcher */}
      <div style={{
        background: '#F3F4F6',
        borderRadius: 9999,
        padding: 3,
        display: 'flex',
        gap: 2,
      }}>
        {MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setDrawMode(mode.id)}
            title={mode.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              transition: 'all 150ms',
              background: drawMode === mode.id ? 'white' : 'transparent',
              color: drawMode === mode.id ? '#111827' : '#9CA3AF',
              boxShadow: drawMode === mode.id 
                ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{
        width: 1, height: 20,
        background: '#E5E7EB',
        flexShrink: 0,
      }}/>

      {/* Colors */}
      <div style={{display:'flex', gap:5, alignItems:'center'}}>
        {ANNOTATION_COLORS.map(color => (
          <div
            key={color}
            onClick={() => setStrokeColor(color)}
            style={{
              width: 18, height: 18,
              borderRadius: '50%',
              background: color,
              cursor: 'pointer',
              transition: 'all 150ms',
              border: strokeColor === color 
                ? `2px solid ${color}` : '2px solid transparent',
              boxShadow: strokeColor === color
                ? `0 0 0 2px white, 0 0 0 3.5px ${color}` : 'none',
              transform: strokeColor === color 
                ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Divider */}
      <div style={{width:1, height:20, background:'#E5E7EB', flexShrink:0}}/>

      {/* Stroke sizes */}
      <div style={{display:'flex', gap:4, alignItems:'center'}}>
        {STROKE_SIZES.map(s => (
          <button
            key={s.id}
            onClick={() => setStrokeSize(s.size)}
            title={s.label}
            style={{
              width: 28, height: 28,
              borderRadius: '50%',
              border: 'none',
              background: strokeSize === s.size ? '#F3F4F6' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms',
            }}
          >
            <div style={{
              width: s.size === 2 ? 4 : s.size === 4 ? 6 : 9,
              height: s.size === 2 ? 4 : s.size === 4 ? 6 : 9,
              borderRadius: '50%',
              background: strokeColor,
            }}/>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{width:1, height:20, background:'#E5E7EB', flexShrink:0}}/>

      {/* Eraser */}
      <button
        onClick={() => setDrawMode('eraser')}
        title="Eraser"
        style={{
          width: 28, height: 28,
          borderRadius: '50%',
          border: 'none',
          background: drawMode === 'eraser' ? '#FEF2F2' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms',
        }}
        onMouseEnter={e => {
          if (drawMode !== 'eraser')
            e.currentTarget.style.background = '#F3F4F6';
        }}
        onMouseLeave={e => {
          if (drawMode !== 'eraser')
            e.currentTarget.style.background = 'transparent';
        }}
      >
        <Eraser size={14} 
          color={drawMode === 'eraser' ? '#EF4444' : '#6B7280'}
        />
      </button>

      {/* Clear page */}
      <button
        onClick={onClear}
        title="Clear all annotations on this page"
        style={{
          width: 28, height: 28,
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Trash size={14} color="#9CA3AF"/>
      </button>
    </div>
  );
}
