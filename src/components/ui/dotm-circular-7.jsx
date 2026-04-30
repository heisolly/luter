import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export function DotmCircular7({
  size = 64, // Increased default size
  dotSize = 6,
  speed = 1.4,
  opacityBase = 0.1,
  opacityPeak = 0.95,
  color = "var(--primary)", 
}) {
  const dots = useMemo(() => {
    const arr = [];
    const count = 7; // As per component name Circular7
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      const radius = size / 2.5;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      arr.push({ id: i, x, y });
    }
    return arr;
  }, [size]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <style>{`
        @keyframes dmx-circ-ripple {
          0%, 100% { opacity: var(--dmx-base); transform: scale(1); }
          50% { opacity: var(--dmx-peak); transform: scale(1.4); }
        }
        .dmx-circ-dot {
          animation: dmx-circ-ripple calc(1.5s / ${speed}) infinite;
        }
      `}</style>
      {dots.map((dot, index) => (
        <motion.div
          key={dot.id}
          className="dmx-circ-dot absolute"
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: color,
            left: `calc(50% + ${dot.x}px - ${dotSize / 2}px)`,
            top: `calc(50% + ${dot.y}px - ${dotSize / 2}px)`,
            '--dmx-base': opacityBase,
            '--dmx-peak': opacityPeak,
            animationDelay: `${index * 0.15}s`
          }}
        />
      ))}
      {/* Central Dot */}
      <motion.div
        className="dmx-circ-dot absolute"
        style={{
          width: dotSize * 1.2,
          height: dotSize * 1.2,
          borderRadius: '50%',
          backgroundColor: color,
          left: `calc(50% - ${dotSize * 0.6}px)`,
          top: `calc(50% - ${dotSize * 0.6}px)`,
          '--dmx-base': opacityBase,
          '--dmx-peak': opacityPeak,
          animationDelay: '0s'
        }}
      />
    </div>
  );
}
