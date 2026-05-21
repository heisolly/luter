import React from 'react';
import { HexColorPicker } from 'react-colorful';
import './ColourPicker.css'; // optional styling file

/**
 * ColourPicker component renders a small colour picker UI.
 * Props:
 *  - selectedColor: current hex colour string (e.g., "#FEF08A")
 *  - onChange: callback receiving new hex colour string
 */
export default function ColourPicker({ selectedColor, onChange }) {
  // Ensure the hex string is in the format '#RRGGBB'
  const handleChange = (color) => {
    // force uppercase and prepend # if missing
    const formatted = color.startsWith('#') ? color.toUpperCase() : `#${color}`.toUpperCase();
    onChange(formatted);
  };

  return (
    <div className="colour-picker-wrapper" style={{ position: 'relative', width: 200, padding: 8, background: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      {/* Hex colour picker */}
      <HexColorPicker color={selectedColor} onChange={handleChange} />
      {/* Display current colour value */}
      <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: '#374151' }}>
        {selectedColor}
      </div>
    </div>
  );
}
