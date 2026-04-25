import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiTrophyFill as Trophy, RiSwordFill as Sword, RiMagicFill as Sparkles } from 'react-icons/ri'

export default function CompetePage() {
  const { isMobile } = useOutletContext()

  return (
    <div style={{ 
      minHeight: '100%',
      width: '100%',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '40px 20px' : '80px 40px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <div style={{ 
        position: 'absolute', top: -50, left: -50, width: 300, height: 300, 
        borderRadius: '50%', background: 'rgba(122, 18, 204, 0.03)', filter: 'blur(80px)' 
      }} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', zIndex: 1, maxWidth: 600 }}
      >
        <div style={{ 
          display: 'inline-flex', 
          padding: '10px 20px', 
          background: 'rgba(122, 18, 204, 0.06)', 
          borderRadius: 99, 
          marginBottom: 32,
          border: '1px solid rgba(122, 18, 204, 0.1)',
          alignItems: 'center',
          gap: 10
        }}>
          <Trophy size={18} color="#7a12cc" />
          <span style={{ 
            fontSize: 12, 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '0.15em', 
            color: '#7a12cc' 
          }}>
            Luter Arena
          </span>
        </div>

        <h1 style={{ 
          fontSize: isMobile ? '36px' : '56px', 
          fontWeight: 900, 
          color: '#111', 
          lineHeight: 1.1, 
          marginBottom: 24,
          letterSpacing: '-0.04em'
        }}>
          Prepare for <span style={{ color: '#7a12cc' }}>Battle.</span>
        </h1>

        <p style={{ 
          fontSize: isMobile ? '16px' : '18px', 
          color: '#666', 
          fontWeight: 500, 
          lineHeight: 1.6,
          marginBottom: 48
        }}>
          We're forging a new competitive landscape where knowledge is power. The arena is being optimized for the next generation of scholars.
        </p>

        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: 20
        }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: '#7a12cc10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a12cc' }}>
            <Sword size={32} className="animate-pulse" />
          </div>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: '#7a12cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 20px rgba(122, 18, 204, 0.3)' }}>
            <Sparkles size={32} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
