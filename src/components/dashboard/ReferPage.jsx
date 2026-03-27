import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Copy, Share2, Award, Zap, Star, MessageCircle, GraduationCap, ArrowRight, CheckCircle2, Camera } from 'lucide-react'

// Custom Instagram SVG for premium look
const InstagramIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)

export default function ReferPage({ user }) {
  const [copied, setCopied] = useState(false)
  const refLink = `https://luter.ai/ref/${user?.id?.slice(0,8) || 'student'}`

  const copyRef = () => {
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWA = () => {
    window.open(`https://wa.me/?text=Study smarter with me on Luter AI! 🎯 Lock in for your exams: ${refLink}`, '_blank')
  }

  return (
    <div style={{ padding: '40px', maxWidth: 1000, margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* ── Signature Purple Header ── */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f5eeff', padding: '6px 12px', borderRadius: 99, marginBottom: 16, border: '1px solid #e9d5ff' }}>
          <Award size={14} color="#7a12cc" strokeWidth={2.5} />
          <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7a12cc' }}>Referral Hub</span>
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 1000, color: '#111', margin: '0 0 12px', letterSpacing: '-0.04em' }}>Invite Friends. Earn <span style={{ color: '#7a12cc' }}>XP.</span></h1>
        <p style={{ fontSize: 16, color: '#666', fontWeight: 500, lineHeight: 1.6, maxWidth: 540 }}>
          Help fellow students unlock their potential with Luter AI. You both get exclusive XP boosters for every successful sign-up.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
        
        {/* Left Column: Share Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          <div style={{ 
            background: 'white', border: '1.5px solid #7a12cc', borderRadius: 24, padding: '32px', 
            boxShadow: '10px 10px 0px rgba(122, 18, 204, 0.04)' 
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 900, color: '#7a12cc99', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Study Invite Link</h2>
            
            <div style={{ 
              background: '#fdfbff', 
              padding: '10px', 
              borderRadius: 16, 
              border: '1px solid #f5eeff', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              marginBottom: 20
            }}>
              <div style={{ flex: 1, padding: '0 12px', color: '#111', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {refLink}
              </div>
              <button 
                onClick={copyRef}
                style={{ 
                  padding: '10px 20px', borderRadius: 12, background: '#7a12cc', color: 'white', 
                  border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.1s',
                  boxShadow: '0 4px 12px rgba(122, 18, 204, 0.2)'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={shareWA}
                style={{ 
                  flex: 1, height: 52, borderRadius: 14, background: 'white', color: '#7a12cc', 
                  border: '1.5px solid #f5eeff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.1s'
                }}
                onMouseDown={e => {e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.borderColor = '#7a12cc'}}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ display: 'flex', background: '#f5eeff', padding: '6px', borderRadius: 8 }}>
                  <MessageCircle size={18} />
                </div>
                WhatsApp
              </button>
              <button 
                style={{ 
                  flex: 1, height: 52, borderRadius: 14, background: 'white', color: '#7a12cc', 
                  border: '1.5px solid #f5eeff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.1s'
                }}
                onMouseDown={e => {e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.borderColor = '#7a12cc'}}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ display: 'flex', background: '#f5eeff', padding: '6px', borderRadius: 8 }}>
                  <InstagramIcon size={18} />
                </div>
                Insta Story
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 8 }}>How to earn XP</h3>
            {[
              { i: <Copy size={18} />, t: "Share your link", d: "Send it to your study groups or post on social." },
              { i: <GraduationCap size={18} />, t: "Friend joins", d: "They get a free premium trial when they sign up." },
              { i: <Zap size={18} />, t: "Collect rewards", d: "You both get 500 XP immediately." }
            ].map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 16, padding: '16px', borderRadius: 20, background: '#fdfbff', border: '1px solid #f5eeff' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'white', border: '1px solid #f5eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a12cc', flexShrink: 0 }}>
                  {step.i}
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: '0 0 2px' }}>{step.t}</h4>
                  <p style={{ fontSize: 12, color: '#7a12cc99', fontWeight: 500, margin: 0 }}>{step.d}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Column: Clean White & Purple Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ 
            background: 'white', 
            border: '1.5px solid #7a12cc',
            borderRadius: 24, padding: '32px',
            boxShadow: '0 20px 40px rgba(122, 18, 204, 0.04)'
          }}>
            <h3 style={{ fontSize: 12, fontWeight: 900, color: '#7a12cc99', margin: '0 0 24px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Stats</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div>
                <div style={{ fontSize: 44, fontWeight: 1000, marginBottom: 4, color: '#111', letterSpacing: '-0.04em' }}>0</div>
                <div style={{ fontSize: 12, color: '#7a12cc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Friends Invited</div>
              </div>
              
              <div style={{ height: '1px', background: '#f5eeff' }} />
              
              <div>
                <div style={{ fontSize: 44, fontWeight: 1000, marginBottom: 4, color: '#7a12cc', letterSpacing: '-0.04em' }}>
                  0 <span style={{ fontSize: 24 }}>XP</span>
                </div>
                <div style={{ fontSize: 12, color: '#7a12cc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Earned</div>
              </div>
            </div>
            
            <div style={{ marginTop: 40, padding: '24px', borderRadius: 20, border: '1.5px solid #f5eeff', background: '#fdfbff' }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#7a12cc' }}>
                 <Star size={16} color="#7a12cc" fill="#7a12cc" />
                 Next Milestone
              </div>
              <div style={{ height: 8, width: '100%', background: '#eee', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ width: '0%', height: '100%', background: '#7a12cc' }} />
              </div>
              <div style={{ fontSize: 11, color: '#7a12cc99', fontWeight: 700 }}>Invite 5 friends for the "Ambassador" badge</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
