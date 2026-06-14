import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { CREDIT_COSTS, TIER_LIMITS, getActionLabel } from '../../services/creditService'

const STORAGE_KEY = 'luter_pricing_config'

export default function AdminPricing() {
  const [tab, setTab] = useState('credits')
  const [costs, setCosts] = useState({ ...CREDIT_COSTS })
  const [limits, setLimits] = useState({ ...TIER_LIMITS })
  const [pricing, setPricing] = useState({ proMonthly: 7, beastMonthly: 15, proYearly: 65, beastYearly: 140 })
  const [resetTime, setResetTime] = useState('04:00')
  const [freeNaira, setFreeNaira] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load from DB on mount, fall back to localStorage
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('pricing_config')
          .select('costs, limits, pricing, reset_time, free_naira')
          .eq('id', 1)
          .maybeSingle()

        if (data) {
          if (data.costs && Object.keys(data.costs).length > 0) setCosts(data.costs)
          if (data.limits && Object.keys(data.limits).length > 0) setLimits(data.limits)
          if (data.pricing && Object.keys(data.pricing).length > 0) setPricing(data.pricing)
          if (data.reset_time) setResetTime(data.reset_time)
          if (typeof data.free_naira === 'boolean') setFreeNaira(data.free_naira)
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn('[AdminPricing] DB load failed, trying localStorage:', err.message)
      }

      // Fallback to localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const cfg = JSON.parse(raw)
          if (cfg.costs) setCosts(prev => ({ ...prev, ...cfg.costs }))
          if (cfg.limits) setLimits(prev => ({ ...prev, ...cfg.limits }))
          if (cfg.pricing) setPricing(prev => ({ ...prev, ...cfg.pricing }))
          if (cfg.resetTime) setResetTime(cfg.resetTime)
          if (typeof cfg.freeNaira === 'boolean') setFreeNaira(cfg.freeNaira)
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000)
      return () => clearTimeout(t)
    }
  }, [saved])

  const handleSave = async () => {
    const payload = { costs, limits, pricing, reset_time: resetTime, free_naira: freeNaira }

    // Save to DB
    try {
      const { error } = await supabase
        .from('pricing_config')
        .upsert({ id: 1, ...payload }, { onConflict: 'id' })
      if (error) throw error
    } catch (err) {
      console.warn('[AdminPricing] DB save failed, falling back to localStorage:', err.message)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        costs, limits, pricing, resetTime, freeNaira,
      }))
    }

    setSaved(true)
  }

  const handleReset = () => {
    const defaults = {
      costs: { ...CREDIT_COSTS },
      limits: { ...TIER_LIMITS },
      pricing: { proMonthly: 7, beastMonthly: 15, proYearly: 65, beastYearly: 140 },
      resetTime: '04:00',
      freeNaira: false,
    }
    setCosts(defaults.costs)
    setLimits(defaults.limits)
    setPricing(defaults.pricing)
    setResetTime(defaults.resetTime)
    setFreeNaira(defaults.freeNaira)

    supabase
      .from('pricing_config')
      .upsert({
        id: 1,
        costs: defaults.costs,
        limits: defaults.limits,
        pricing: defaults.pricing,
        reset_time: defaults.resetTime,
        free_naira: defaults.freeNaira,
      }, { onConflict: 'id' })
      .catch(err => console.warn('[AdminPricing] Reset DB save failed:', err.message))

    setSaved(true)
  }

  const updateCost = (key, val) => {
    setCosts(prev => ({ ...prev, [key]: Math.max(0, parseInt(val) || 0) }))
  }

  const updateLimit = (tier, val) => {
    const n = parseInt(val) || 0
    setLimits(prev => ({ ...prev, [tier]: n === 0 ? Infinity : n }))
  }

  const sortedKeys = Object.keys(CREDIT_COSTS).sort()

  if (loading) {
    return (
      <div style={{ padding: '1.5rem 2rem', maxWidth: 1000, margin: '0 auto', fontFamily: 'var(--font-outfit, Inter, sans-serif)' }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading pricing config...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 1000, margin: '0 auto', color: 'var(--color-text-primary)', fontFamily: 'var(--font-outfit, Inter, sans-serif)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Pricing Configuration</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>Override credit costs, daily limits, and subscription pricing. Saved to Supabase.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleReset} style={{ padding: '8px 16px', borderRadius: 8, border: '.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', fontSize: 13, cursor: 'pointer' }}>Reset defaults</button>
          <button onClick={handleSave} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: saved ? '#1D9E75' : '#7C3AED', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{saved ? 'Saved!' : 'Save changes'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: 'var(--color-background-secondary)', borderRadius: 8, padding: 4, marginBottom: '1.5rem' }}>
        {[
          { key: 'credits', label: 'Credit costs' },
          { key: 'limits', label: 'Daily limits' },
          { key: 'pricing', label: 'Subscription pricing' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              flex: 1, textAlign: 'center', padding: '7px 0', fontSize: 13, fontWeight: 500,
              borderRadius: 6, cursor: 'pointer',
              color: tab === t.key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              background: tab === t.key ? 'var(--color-background-primary)' : 'transparent',
              border: tab === t.key ? '.5px solid var(--color-border-tertiary)' : 'none',
            }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'credits' && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Each credit is worth ~$0.00005 in API cost. These values affect how many credits a user spends per action.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Feature</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>API cost</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Credits</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Cost/credit</th>
              </tr>
            </thead>
            <tbody>
              {sortedKeys.map(key => {
                const credits = costs[key] ?? CREDIT_COSTS[key]
                const apiCost = (credits * 0.00005).toFixed(5)
                return (
                  <tr key={key}>
                    <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--color-border-tertiary)' }}>{getActionLabel(key)}</td>
                    <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)' }}>${apiCost}</td>
                    <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                      <input type="number" min="0" value={credits} onChange={e => updateCost(key, e.target.value)}
                        style={{ width: 70, padding: '4px 8px', borderRadius: 6, border: '.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13 }} />
                    </td>
                    <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)' }}>
                      {credits === 0 ? 'free' : `${(0.00005).toFixed(5)}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'limits' && (
        <div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Daily credit limits</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>Set to 0 for unlimited. Credits reset daily.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {['free', 'pro', 'beast'].map(tier => (
                <div key={tier} style={{ background: 'var(--color-background-primary)', borderRadius: 8, padding: '1rem', border: '.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize', marginBottom: 8, color: tier === 'free' ? '#888780' : tier === 'pro' ? '#378ADD' : '#1D9E75' }}>
                    {tier === 'beast' ? 'Beast (Unlimited)' : tier === 'pro' ? 'Pro' : 'Free'}
                  </div>
                  <input type="number" min="0" value={limits[tier] === Infinity ? 0 : limits[tier]} onChange={e => updateLimit(tier, e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 16, fontWeight: 500, boxSizing: 'border-box' }} />
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{limits[tier] === Infinity ? 'unlimited' : `credits/day`}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: '1.5rem' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Reset schedule</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>When do credits reset each day?</p>
            <input type="time" value={resetTime} onChange={e => setResetTime(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 14 }} />
          </div>
        </div>
      )}

      {tab === 'pricing' && (
        <div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Pro plan</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Monthly ($)</div>
                <input type="number" min="0" step="0.5" value={pricing.proMonthly} onChange={e => setPricing(prev => ({ ...prev, proMonthly: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 16, fontWeight: 500, boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Yearly ($)</div>
                <input type="number" min="0" step="0.5" value={pricing.proYearly} onChange={e => setPricing(prev => ({ ...prev, proYearly: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 16, fontWeight: 500, boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Beast plan</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Monthly ($)</div>
                <input type="number" min="0" step="0.5" value={pricing.beastMonthly} onChange={e => setPricing(prev => ({ ...prev, beastMonthly: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 16, fontWeight: 500, boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Yearly ($)</div>
                <input type="number" min="0" step="0.5" value={pricing.beastYearly} onChange={e => setPricing(prev => ({ ...prev, beastYearly: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 16, fontWeight: 500, boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: '1.5rem' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Display options</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={freeNaira} onChange={e => setFreeNaira(e.target.checked)} />
              Show naira pricing on Free tier card
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
