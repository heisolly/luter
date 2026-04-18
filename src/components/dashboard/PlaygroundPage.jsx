import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, BrainCircuit } from 'lucide-react'

export default function PlaygroundPage() {
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
        position: 'absolute', top: -100, right: -100, width: 400, height: 400, 
        borderRadius: '50%', background: 'rgba(151, 24, 251, 0.03)', filter: 'blur(80px)' 
      }} />
      <div style={{ 
        position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, 
        borderRadius: '50%', background: 'rgba(151, 24, 251, 0.05)', filter: 'blur(60px)' 
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', zIndex: 1, maxWidth: 600 }}
      >
        <div style={{ 
          display: 'inline-flex', 
          padding: '10px 20px', 
          background: 'rgba(151, 24, 251, 0.06)', 
          borderRadius: 99, 
          marginBottom: 32,
          border: '1px solid rgba(151, 24, 251, 0.1)',
          alignItems: 'center',
          gap: 10
        }}>
          <Sparkles size={18} color="var(--primary)" />
          <span style={{ 
            fontSize: 12, 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '0.15em', 
            color: 'var(--primary)' 
          }}>
            Luter Playground
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
          A new way to <span style={{ color: 'var(--primary)' }}>Master.</span>
        </h1>

        <p style={{ 
          fontSize: isMobile ? '16px' : '18px', 
          color: '#666', 
          fontWeight: 500, 
          lineHeight: 1.6,
          marginBottom: 48
        }}>
          We're hand-crafting a revolutionary study space. The future of academic mastery is under construction.
        </p>

        <div style={{ 
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{ width: 120, height: 120, borderRadius: 32, background: 'rgba(151, 24, 251, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <BrainCircuit size={48} className="animate-pulse" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
