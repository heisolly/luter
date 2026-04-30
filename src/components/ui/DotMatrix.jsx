import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export function DotMatrix({ 
  size = 12, 
  dotSize = 3, 
  gap = 12, 
  color = "rgba(75, 0, 130, 0.2)",
  className = "" 
}) {
  const dots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        arr.push({ id: `${i}-${j}`, x: i, y: j });
      }
    }
    return arr;
  }, [size]);

  return (
    <div 
      className={`relative inline-grid ${className}`}
      style={{ 
        gridTemplateColumns: `repeat(${size}, ${dotSize}px)`,
        gap: `${gap}px`,
        padding: '20px'
      }}
    >
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: color,
          }}
          initial={{ opacity: 0.1 }}
          whileHover={{ 
            scale: 1.5, 
            opacity: 1, 
            backgroundColor: "rgba(75, 0, 130, 0.8)",
            transition: { duration: 0.2 }
          }}
        />
      ))}
    </div>
  );
}
