import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Zap, BrainCircuit, Rocket } from 'lucide-react'

export default function CompetePage() {
  const { isMobile } = useOutletContext()

  return (
    <div style={{ 
      height: 'calc(100vh - 40px)', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: isMobile ? 20 : 40,
      textAlign: 'center',
      background: '#fff'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: 600 }}
      >
        <div style={{ 
          display: 'inline-flex', 
          padding: '12px 24px', 
          background: 'rgba(151, 24, 251, 0.05)', 
          borderRadius: 99, 
          marginBottom: 32,
          border: '1px solid rgba(151, 24, 251, 0.1)',
          alignItems: 'center',
          gap: 12
        }}>
          <Sparkles size={20} color="var(--primary)" />
          <span style={{ 
            fontSize: 13, 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '0.15em', 
            color: 'var(--primary)' 
          }}>
            Luter Playground
          </span>
        </div>

        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 6vw, 4rem)', 
          fontWeight: 900, 
          color: '#111', 
          lineHeight: 1, 
          marginBottom: 24,
          letterSpacing: '-0.04em'
        }}>
          Something big is <br/> brewing here.
        </h1>

        <p style={{ 
          fontSize: 18, 
          color: '#666', 
          fontWeight: 600, 
          marginBottom: 48, 
          lineHeight: 1.6,
          maxWidth: 480,
          margin: '0 auto 48px'
        }}>
          We're reimagining the student competition experience from the ground up. 
          Get ready for a new era of collaborative learning.
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
          gap: 16,
          textAlign: 'left'
        }}>
          {[
            { icon: BrainCircuit, title: 'Smart Intelligence', desc: 'AI-driven challenges tailored to your curriculum.' },
            { icon: Zap, title: 'Instant Battles', desc: 'Real-time 1v1 duels with lightning speed.' },
          ].map((item, idx) => (
            <div key={idx} style={{ 
              padding: 24, 
              background: '#f9fafb', 
              borderRadius: 24, 
              border: '1px solid #f1f5f9' 
            }}>
              <item.icon size={24} style={{ marginBottom: 12, color: '#111' }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: '#666', fontWeight: 500, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
