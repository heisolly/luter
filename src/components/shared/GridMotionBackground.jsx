import React from 'react';
import { motion } from 'framer-motion';
import ShapeGrid from './ShapeGrid';

/**
 * NebulaFlowBackground
 * A premium design system background with vibrant corner glows
 * and ultra-thin flowing lines for a professional Luter aesthetic.
 */
export default function GridMotionBackground() {
  return (
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        background: '#ffffff', // Clean white base
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    >
      {/* ─── Layer 1: Ambient Corner Glows (Prominent) ─── */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 0.9, 0.7],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          bottom: '0%',
          left: '-5%',
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.3) 0%, transparent 75%)',
          filter: 'blur(60px)',
          borderRadius: '50%',
          zIndex: 2
        }}
      />

      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          bottom: '0%',
          right: '-5%',
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.25) 0%, transparent 75%)',
          filter: 'blur(70px)',
          borderRadius: '50%',
          zIndex: 2
        }}
      />

      {/* ─── Layer 2: Ultra-Subtle Flowing Grid ─── */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.12, zIndex: 5 }}>
        <ShapeGrid 
          speed={0.25} 
          squareSize={75}
          direction="down"
          borderColor="rgba(147, 51, 234, 0.25)"
          hoverFillColor="rgba(147, 51, 234, 0.05)"
          hoverTrailAmount={3}
        />
      </div>

      {/* ─── Layer 3: Glassmorphic Noise (Tangible texture) ─── */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          zIndex: 10,
          mixBlendMode: 'overlay'
        }}
      />

      {/* ─── Layer 4: Soft Vignette Overlay ─── */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(255, 255, 255, 0.2) 100%)',
          zIndex: 1
        }}
      />
    </div>
  );
}
