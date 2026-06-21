import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiCloseLine as X, RiVipCrownFill as Crown, RiLockFill as Lock, 
  RiFlashlightFill as Zap, RiStarFill as Star, RiCheckLine as Check, 
  RiArrowRightLine as ArrowRight, RiShieldFill as Shield
} from 'react-icons/ri'

export default function PremiumModal({ 
  isOpen, 
  onClose, 
  onUpgrade,
  onStartTrial 
}) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div style={backdropStyles} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={modalStyles}
          onClick={e => e.stopPropagation()}
        >
          {/* Header Section */}
          <div style={headerContainerStyles}>
            <div style={floatingIconStyles}>
              <Crown size={32} />
            </div>
            <h2 style={modalTitleStyles}>Join Luter <span style={goldTextStyles}>Executive</span></h2>
            <p style={modalSubtitleStyles}>Secure your academic future with the world's most powerful AI study companion.</p>
          </div>

          {/* Benefits Grid */}
          <div style={benefitsGridStyles}>
            <BenefitItem icon={Zap} title="Hyper-Speed Ingestion" desc="Process 500+ page textbooks in seconds." />
            <BenefitItem icon={Lock} title="Full Curriculum Access" desc="Unlock all course summaries and flashcards." />
            <BenefitItem icon={Star} title="AI Math Expert" desc="Step-by-step solutions for complex equations." />
            <BenefitItem icon={Shield} title="Priority Support" desc="24/7 dedicated academic concierge." />
          </div>

          {/* Action Area */}
          <div style={actionAreaStyles}>
            <button style={primaryBtnStyles} onClick={onUpgrade}>
              Continue to Secure Checkout <ArrowRight size={18} />
            </button>
            
            <div style={secondaryButtonsStyles}>
              <button style={ghostBtnStyles} onClick={onStartTrial}>
                Start 7-Day Trial First
              </button>
              <button style={closeBtnStyles} onClick={onClose}>
                Maybe Later
              </button>
            </div>
          </div>

          {/* Footer Trust */}
          <div style={modalFooterStyles}>
            <div style={trustBadgeStyles}><Shield size={12} /> Secure Stripe Payment</div>
            <div style={trustBadgeStyles}><Check size={12} /> Cancel Anytime</div>
          </div>

          {/* Close X */}
          <button style={absoluteCloseStyles} onClick={onClose}><X size={20} /></button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function BenefitItem({ icon: Icon, title, desc }) {
  return (
    <div style={benefitItemStyles}>
      <div style={benefitIconStyles}><Icon size={18} /></div>
      <div>
        <h4 style={benefitTitleStyles}>{title}</h4>
        <p style={benefitDescStyles}>{desc}</p>
      </div>
    </div>
  )
}

// ── STYLES ──

const backdropStyles = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const modalStyles = {
  width: '100%',
  maxWidth: 500,
  background: '#0a0a0a',
  borderRadius: 40,
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '60px 40px 40px',
  position: 'relative',
  boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
  color: '#fff',
  fontFamily: "'Outfit', sans-serif",
};

const headerContainerStyles = {
  textAlign: 'center',
  marginBottom: 48,
};

const floatingIconStyles = {
  width: 80,
  height: 80,
  borderRadius: 24,
  background: 'linear-gradient(135deg, #7a12cc, #9718fb)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  boxShadow: '0 20px 40px rgba(122,18,204,0.4)',
};

const modalTitleStyles = {
  fontSize: 32,
  fontWeight: 900,
  margin: '0 0 12px 0',
  letterSpacing: '-0.04em',
};

const goldTextStyles = {
  background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const modalSubtitleStyles = {
  fontSize: 16,
  color: '#94a3b8',
  lineHeight: 1.6,
  margin: 0,
};

const benefitsGridStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  marginBottom: 48,
};

const benefitItemStyles = {
  display: 'flex',
  gap: 16,
  alignItems: 'flex-start',
};

const benefitIconStyles = {
  width: 36,
  height: 36,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: '#a78bfa',
};

const benefitTitleStyles = {
  fontSize: 16,
  fontWeight: 700,
  margin: '0 0 4px 0',
};

const benefitDescStyles = {
  fontSize: 13,
  color: '#64748b',
  lineHeight: 1.4,
  margin: 0,
};

const actionAreaStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const primaryBtnStyles = {
  width: '100%',
  height: '56px',
  borderRadius: '999px',
  background: 'linear-gradient(to right, #A855F7, #C7B9FF)',
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: 800,
  fontFamily: 'var(--font-display)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 10px 15px -3px rgba(75, 0, 130, 0.15)',
};

const secondaryButtonsStyles = {
  display: 'flex',
  gap: 12,
};

const ghostBtnStyles = {
  flex: 1,
  padding: '16px',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
};

const closeBtnStyles = {
  flex: 1,
  padding: '16px',
  borderRadius: 16,
  background: 'transparent',
  color: '#64748b',
  fontSize: 14,
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
};

const modalFooterStyles = {
  marginTop: 32,
  display: 'flex',
  justifyContent: 'center',
  gap: 20,
};

const trustBadgeStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  color: '#475569',
  fontWeight: 700,
};

const absoluteCloseStyles = {
  position: 'absolute',
  top: 24,
  right: 24,
  background: 'transparent',
  border: 'none',
  color: '#475569',
  cursor: 'pointer',
};
