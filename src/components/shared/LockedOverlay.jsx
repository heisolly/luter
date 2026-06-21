/**
 * LockedOverlay — reusable feature-gate overlay for Luter
 *
 * Props:
 *   feature      {string}  Short feature name e.g. "Mock Exams"
 *   description  {string}  One-line explanation of what the user is missing
 *   requiredPlan {string}  "Pro" | "Beast" (defaults to "Pro")
 *   inline       {boolean} If true, renders as an inline card instead of full overlay
 *   onUpgrade    {fn}      Called when the upgrade button is clicked (optional — navigates to /upgrade if omitted)
 */
import { useNavigate } from 'react-router-dom'
import { Lock, Lightning, Crown } from '@phosphor-icons/react'

const PLAN_COLORS = {
  Pro:   { accent: '#F97316', soft: '#FFF7ED', badge: '#9A3412' },
  Beast: { accent: '#059669', soft: '#ECFDF5', badge: '#065F46' },
}

export default function LockedOverlay({
  feature = 'This Feature',
  description = 'Upgrade your plan to unlock this feature.',
  requiredPlan = 'Pro',
  inline = false,
  onUpgrade,
}) {
  const navigate = useNavigate()
  const colors = PLAN_COLORS[requiredPlan] || PLAN_COLORS.Pro
  const PlanIcon = requiredPlan === 'Beast' ? Crown : Lightning

  function handleUpgrade() {
    if (onUpgrade) return onUpgrade()
    navigate('/upgrade')
  }

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      textAlign: 'center',
      padding: inline ? '2rem 1.5rem' : '2.5rem 2rem',
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
    }}>
      {/* Lock circle */}
      <div style={{
        width: 64, height: 64,
        borderRadius: '50%',
        background: colors.soft,
        border: `2px solid ${colors.accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Lock size={28} weight="fill" color={colors.accent} />
      </div>

      {/* Plan badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: colors.accent,
        color: '#fff',
        fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '3px 10px',
        borderRadius: 9999,
      }}>
        <PlanIcon size={12} weight="fill" />
        {requiredPlan} Feature
      </div>

      {/* Feature name */}
      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary, #111)' }}>
        {feature}
      </p>

      {/* Description */}
      <p style={{
        margin: 0,
        fontSize: 13,
        color: 'var(--color-text-secondary, #666)',
        maxWidth: 320,
        lineHeight: 1.6,
      }}>
        {description}
      </p>

      {/* CTA */}
      <button
        onClick={handleUpgrade}
        style={{
          marginTop: 4,
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: colors.accent,
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '10px 22px',
          fontSize: 14, fontWeight: 700,
          cursor: 'pointer',
          boxShadow: `0 4px 16px ${colors.accent}40`,
          transition: 'opacity 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
      >
        <PlanIcon size={16} weight="fill" />
        Upgrade to {requiredPlan}
      </button>
    </div>
  )

  if (inline) {
    return (
      <div style={{
        border: `1.5px dashed ${colors.accent}60`,
        borderRadius: 16,
        background: colors.soft,
        margin: '1rem 0',
      }}>
        {content}
      </div>
    )
  }

  // Full overlay — absolutely positioned over parent (parent must be position:relative)
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      background: 'var(--color-background-primary, #fff)cc',
      borderRadius: 'inherit',
    }}>
      {content}
    </div>
  )
}
