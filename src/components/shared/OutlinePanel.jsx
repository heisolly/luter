import React, { useState, useEffect } from 'react';

export function OutlinePanel({ isDark, room_id = 'global' }) {
  const storageKey = `luter-jotting-${room_id}`;
  const [content, setContent] = useState('');

  // Load content from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setContent(saved);
    }
  }, [storageKey]);

  // Save content to localStorage on change
  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    localStorage.setItem(storageKey, val);
  };

  return (
    <div style={{ padding: '20px', color: isDark ? '#D1D5DB' : '#374151', height: '100%', overflowY: 'auto' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '15px' }}>Jotting Notes</h3>
      <textarea 
        value={content}
        onChange={handleChange}
        placeholder="Jot down quick thoughts here... (saved automatically to your browser)"
        style={{
          width: '100%', height: 'calc(100% - 40px)', padding: '12px',
          borderRadius: '8px', border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          color: isDark ? '#F3F4F6' : '#111827',
          resize: 'none', outline: 'none', fontSize: '14px',
          fontFamily: 'inherit'
        }}
      />
    </div>
  );
}
