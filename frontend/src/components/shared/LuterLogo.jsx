import { motion } from 'framer-motion'
import logo from '../../../asset/logo.png'

export default function LuterLogo({ size = 32, fontSize = 28, showText = true, className = "" }) {
  return (
    <div 
      className={`luter-logo-container ${className}`} 
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');`}</style>
      
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <motion.img 
          src={logo} 
          alt="Luter" 
          style={{ height: size, width: 'auto', objectFit: 'contain', display: 'block' }}
          whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {showText && (
        <h1 style={{ 
          fontFamily: "'Caveat', cursive", 
          fontSize: fontSize, 
          fontWeight: 700,
          margin: 0, 
          color: '#111', 
          lineHeight: 1,
          transform: 'rotate(-2deg)',
          letterSpacing: '-0.02em',
          userSelect: 'none'
        }}>
          Luter
        </h1>
      )}
    </div>
  )
}
