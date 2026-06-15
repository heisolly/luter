import { 
  Eraser
} from '@phosphor-icons/react';

export default function AnnotationToolbar({
  activeWorkspaceTool, // 'annotate', 'highlight', 'occlude'
  isEraserMode, setIsEraserMode,
  strokeColor, setStrokeColor,
  strokeSize, setStrokeSize,
  ANNOTATION_COLORS, STROKE_SIZES,
  isDark,
  visible,
}) {
  if (!visible) return null;

  const bg = isDark ? '#1F2937' : 'white';
  const border = isDark ? '#374151' : '#E5E7EB';
  const text = isDark ? '#F9FAFB' : '#111827';
  const inactiveText = isDark ? '#9CA3AF' : '#6B7280';
  const hoverBg = isDark ? '#374151' : '#F3F4F6';
  
  // Determine which properties to show based on active tool
  const showColors = activeWorkspaceTool === 'annotate' || activeWorkspaceTool === 'highlight' || activeWorkspaceTool === 'pin';
  const showSizes = activeWorkspaceTool === 'annotate';

  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 10px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: '20px',
      padding: '8px 12px',
      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.10)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      whiteSpace: 'nowrap',
      animation: 'toolboxAppear 150ms ease',
      color: text,
    }}>
      
      {showColors && (
        <div style={{display:'flex', gap:5, alignItems:'center'}}>
          {ANNOTATION_COLORS.map(color => (
            <div
              key={color}
              onClick={() => {
                setStrokeColor(color);
                setIsEraserMode(false);
              }}
              style={{
                width: 18, height: 18,
                borderRadius: '50%',
                background: color,
                cursor: 'pointer',
                transition: 'all 150ms',
                border: strokeColor === color && !isEraserMode
                  ? `2px solid ${color}` : '2px solid transparent',
                boxShadow: strokeColor === color && !isEraserMode
                  ? `0 0 0 2px ${bg}, 0 0 0 3.5px ${color}` : 'none',
                transform: strokeColor === color && !isEraserMode 
                  ? 'scale(1.2)' : 'scale(1)',
                opacity: isEraserMode ? 0.5 : 1
              }}
            />
          ))}
        </div>
      )}

      {showSizes && showColors && (
        <div style={{width:1, height:20, background: border, flexShrink:0, margin: '0 4px'}}/>
      )}

      {showSizes && (
        <div style={{display:'flex', gap:4, alignItems:'center'}}>
          {STROKE_SIZES.map((s, idx) => {
            const isObj = typeof s === 'object';
            const id = isObj ? s.id : idx;
            const size = isObj ? s.size : s;
            const label = isObj ? s.label : `${s}px`;
            return (
            <button
              key={id}
              onClick={() => {
                setStrokeSize(size);
                setIsEraserMode(false);
              }}
              title={label}
              style={{
                width: 28, height: 28,
                borderRadius: '50%',
                border: 'none',
                background: strokeSize === size && !isEraserMode ? hoverBg : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms',
                opacity: isEraserMode ? 0.5 : 1
              }}
            >
              <div style={{
                width: size === 2 ? 4 : size === 4 ? 6 : 9,
                height: size === 2 ? 4 : size === 4 ? 6 : 9,
                borderRadius: '50%',
                background: strokeColor,
                border: strokeSize === size && !isEraserMode ? `2px solid ${text}` : 'none',
                transition: 'border 150ms'
              }}/>
            </button>
          )})}
        </div>
      )}

      {(showColors || showSizes) && activeWorkspaceTool === 'annotate' && (
        <div style={{width:1, height:20, background: border, flexShrink:0, margin: '0 4px'}}/>
      )}

      {/* Eraser */}
      {activeWorkspaceTool === 'annotate' && (
        <button
          onClick={() => setIsEraserMode(!isEraserMode)}
          title="Eraser"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 9999,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            background: isEraserMode ? hoverBg : 'transparent',
            color: isEraserMode ? text : inactiveText,
            transition: 'all 150ms'
          }}
        >
          <Eraser size={16} weight={isEraserMode ? 'fill' : 'regular'} />
          Erase
        </button>
      )}

    </div>
  );
}
