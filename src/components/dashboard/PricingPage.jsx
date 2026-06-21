import { useOutletContext, useNavigate } from 'react-router-dom'

const TIER_ACCENTS = { free: '#888780', pro: '#378ADD', beast: '#1D9E75' }

function formatNaira(usd) {
  return `₦${(usd * 1370).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default function PricingPage() {
  const context = useOutletContext()
  const profile = context?.profile ?? null
  const navigate = useNavigate()

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 1060, margin: '0 auto', color: 'var(--color-text-primary)', fontFamily: 'var(--font-display, Inter, sans-serif)' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Pricing Hub</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>Choose the plan that fits your study needs.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '1.5rem' }}>
        {[
          { tier: 'free', name: 'Free', price: '$0', sub: '/mo', naira: '₦0 · always free', rows: [
            { label: 'Daily credits', val: '200', cls: '' },
            { label: 'AI chat', val: '~10/day', cls: '' },
            { label: 'AI Notes', val: '~2/day', cls: '' },
            { label: 'Flashcards/quizzes', val: 'included', cls: 'ok' },
            { label: 'Audio upload', val: 'no', cls: 'danger' },
            { label: 'Group study', val: 'limited', cls: 'warn' },
            { label: 'Mock exams', val: 'limited', cls: 'warn' },
          ]},
          { tier: 'pro', name: 'Pro', price: '$7.00', prefix: '$', sub: '/mo', naira: `${formatNaira(7)}/mo · ${formatNaira(3.5)}/2 wks`, rows: [
            { label: 'Daily credits', val: '2,000', cls: '' },
            { label: 'AI chat', val: '~100/day', cls: '' },
            { label: 'AI Notes', val: '~25/day', cls: '' },
            { label: 'Flashcards/quizzes', val: 'included', cls: 'ok' },
            { label: 'Audio upload', val: '5 files/day', cls: 'warn' },
            { label: 'Group study', val: 'included', cls: 'ok' },
            { label: 'Mock exams', val: 'included', cls: 'ok' },
          ]},
          { tier: 'beast', name: 'Beast', price: '$15.00', prefix: '$', sub: '/mo', naira: `${formatNaira(15)}/mo · ${formatNaira(7.5)}/2 wks`, rows: [
            { label: 'Daily credits', val: 'unlimited', cls: 'ok' },
            { label: 'AI chat', val: 'unlimited', cls: 'ok' },
            { label: 'AI Notes', val: 'unlimited', cls: 'ok' },
            { label: 'Flashcards/quizzes', val: 'unlimited', cls: 'ok' },
            { label: 'Audio upload', val: 'unlimited', cls: 'ok' },
            { label: 'Group study', val: 'unlimited', cls: 'ok' },
            { label: 'Mock exams', val: 'unlimited', cls: 'ok' },
          ]},
        ].map(plan => (
          <div key={plan.tier} style={{
            background: 'var(--color-background-primary)',
            border: '.5px solid var(--color-border-tertiary)',
            borderRadius: 12, padding: '1.1rem 1rem', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: TIER_ACCENTS[plan.tier] }} />
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{plan.name}</p>
            <p style={{ fontSize: 26, fontWeight: 500, margin: '0 0 1px', color: 'var(--color-text-primary)' }}>
              {plan.prefix && <sup style={{ fontSize: 13, fontWeight: 400, verticalAlign: 'super' }}>{plan.prefix}</sup>}
              {plan.price}<sub style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{plan.sub}</sub>
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>{plan.naira}</p>
            <hr style={{ border: 'none', borderTop: '.5px solid var(--color-border-tertiary)', margin: '10px 0' }} />
            {plan.rows.map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{r.label}</span>
                <span style={{ fontWeight: 500, color: r.cls === 'ok' ? '#0F6E56' : r.cls === 'warn' ? '#BA7517' : r.cls === 'danger' ? '#A32D2D' : undefined }}>{r.val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '.85rem 1rem', fontSize: 12, color: 'var(--color-text-secondary)' }}>
        <strong style={{ color: 'var(--color-text-primary)' }}>Yearly plans:</strong> &nbsp;Pro $65/yr (saves ~$19) &nbsp;·&nbsp; Beast $140/yr (saves ~$40).
      </div>
    </div>
  )
}
