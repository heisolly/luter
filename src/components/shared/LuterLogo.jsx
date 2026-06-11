/* eslint-disable no-unused-vars */
import { motion } from 'framer-motion'

export default function LuterLogo({ size = 32, fontSize = 28, showText = true, white = false, className = "" }) {
  return (
    <div 
      className={`luter-logo-container ${className}`} 
      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
    >
      <motion.img 
        src="/Header logo.png" 
        alt="Luter" 
        style={{ 
          height: Math.max(size, 40), width: 'auto', objectFit: 'contain', display: 'block',
          filter: white ? 'brightness(0) invert(1)' : 'none'
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      />
    </div>
  )
}
