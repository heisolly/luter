import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export function DotmSquare11({
  size = 5,
  dotSize = 6,
  gap = 12,
  speed = 1.4,
  opacityBase = 0.1,
  opacityMid = 0.4,
  opacityPeak = 0.95,
}) {
  const [phase, setPhase] = useState('idle');
  
  const dots = useMemo(() => {
    const arr = [];
    const center = Math.floor(size / 2);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const manhattanDistance = Math.abs(i - center) + Math.abs(j - center);
        arr.push({ id: `${i}-${j}`, x: i, y: j, distance: manhattanDistance });
      }
    }
    return arr;
  }, [size]);

  return (
    <div 
      className="relative inline-grid"
      onMouseEnter={() => setPhase('active')}
      onMouseLeave={() => setPhase('idle')}
      style={{ 
        gridTemplateColumns: `repeat(${size}, ${dotSize}px)`,
        gap: `${gap}px`,
        padding: '20px'
      }}
    >
      <style>{`
        @keyframes dmx-ripple {
          0%, 100% { opacity: var(--dmx-base); transform: scale(1); }
          50% { opacity: var(--dmx-peak); transform: scale(1.2); }
        }
        .dmx-dot {
          transition: all 0.5s ease;
        }
        .dmx-ripple-echo {
          animation: dmx-ripple calc(2s / ${speed}) infinite;
          animation-delay: calc(var(--dmx-distance) * 100ms);
        }
      `}</style>
      {dots.map((dot) => {
        const ring = dot.distance;
        const opacity = opacityBase + (1 - ring / size) * (opacityPeak - opacityBase);
        
        return (
          <motion.div
            key={dot.id}
            className={`dmx-dot ${phase === 'active' ? 'dmx-ripple-echo' : ''}`}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              backgroundColor: '#000000',
              opacity: opacity,
              '--dmx-distance': dot.distance,
              '--dmx-base': opacityBase,
              '--dmx-peak': opacityPeak,
            }}
            animate={{
              opacity: phase === 'idle' ? opacity : [opacity, opacityPeak, opacity],
              scale: phase === 'idle' ? 1 : [1, 1.2, 1],
            }}
            transition={{
              duration: 2 / speed,
              repeat: Infinity,
              delay: dot.distance * 0.1,
              ease: "easeInOut"
            }}
          />
        );
      })}
    </div>
  );
}
