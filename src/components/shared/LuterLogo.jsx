/* eslint-disable no-unused-vars */
import { motion } from 'framer-motion'

export default function LuterLogo({ size = 32, fontSize = 28, showText = true, white = false, className = "" }) {
  return (
    <div 
      className={`luter-logo-container ${className}`} 
      style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <motion.img 
          src="/logo.png" 
          alt="Luter" 
          style={{ 
            height: size, width: 'auto', objectFit: 'contain', display: 'block',
            filter: white ? 'brightness(0) invert(1)' : 'none'
          }}
          whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {showText && (
        <h1 style={{ 
          fontFamily: "'Outfit', sans-serif", 
          fontSize: fontSize, 
          fontWeight: 1000,
          margin: 0, 
          color: white ? 'white' : '#111', 
          lineHeight: 1,
          letterSpacing: '-0.04em',
          userSelect: 'none'
        }}>
          luter.
        </h1>
      )}
    </div>
  )
}
