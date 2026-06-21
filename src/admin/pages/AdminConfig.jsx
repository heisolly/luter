import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../supabaseClient'
import { CheckCircle, FloppyDisk, WarningCircle } from '@phosphor-icons/react'
import '../admin.css'

// Default hardcoded fallbacks
const DEFAULT_LIMITS = { free: 200, pro: 2000, beast: 10000 }
const DEFAULT_COSTS = {
  AI_CHAT: 20,
  GENERATE_FLASHCARDS: 10,
  GENERATE_QUIZ: 10,
  GENERATE_AI_NOTES: 80,
  EXPLAIN_TEXT: 10,
  GROUP_QUIZ: 30,
}

// Hidden internal api cost assumption per credit (not displayed directly to admins)
const HIDDEN_API_COST_PER_CREDIT = 0.00008

export default function AdminConfig() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [limits, setLimits] = useState({ ...DEFAULT_LIMITS })
  const [costs, setCosts] = useState({ ...DEFAULT_COSTS })

  // Simulator states
  const [simUsersFree, setSimUsersFree] = useState(100)
  const [simUsersPro, setSimUsersPro] = useState(50)
  const [simUsersBeast, setSimUsersBeast] = useState(10)
  const [simUsagePercent, setSimUsagePercent] = useState(40) // 40% average daily usage

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      setLoading(true)
      const { data, error: err } = await supabase.from('pricing_config').select('*').eq('id', 1).maybeSingle()
      if (err) throw err
      if (data) {
        if (data.limits) setLimits({ ...DEFAULT_LIMITS, ...data.limits })
        if (data.costs) setCosts({ ...DEFAULT_COSTS, ...data.costs })
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load config')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const { error: err } = await supabase.from('pricing_config').upsert({
        id: 1,
        limits,
        costs
      })
      if (err) throw err
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      setError('Failed to save config')
    } finally {
      setSaving(false)
    }
  }

  const handleLimitChange = (tier, val) => {
    setLimits(prev => ({ ...prev, [tier]: Number(val) }))
  }

  const handleCostChange = (feature, val) => {
    setCosts(prev => ({ ...prev, [feature]: Number(val) }))
  }

  // --- Profit Simulator ---
  const simulatorStats = useMemo(() => {
    const activeDays = 30
    const usageMultiplier = simUsagePercent / 100

    // Monthly Credit Usage
    const freeCredits = simUsersFree * limits.free * activeDays * usageMultiplier
    const proCredits = simUsersPro * limits.pro * activeDays * usageMultiplier
    const beastCredits = simUsersBeast * (limits.beast === Infinity ? 10000 : limits.beast) * activeDays * usageMultiplier
    
    const totalCredits = freeCredits + proCredits + beastCredits

    // Monthly Revenue
    // Assuming $9.99 for Pro, $19.99 for Beast (Modify as needed)
    const revenuePro = simUsersPro * 9.99
    const revenueBeast = simUsersBeast * 19.99
    const totalRevenue = revenuePro + revenueBeast

    // Monthly Cost (using hidden API cost multiplier)
    const totalCost = totalCredits * HIDDEN_API_COST_PER_CREDIT

    // Profit
    const profit = totalRevenue - totalCost
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0

    return { totalCredits, totalRevenue, totalCost, profit, margin }
  }, [limits, simUsersFree, simUsersPro, simUsersBeast, simUsagePercent])

  if (loading) {
    return <div className="admin-page"><p>Loading config...</p></div>
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Credit Economics & Plans</h1>
        <button className="admin-btn primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : <><FloppyDisk size={18} /> Save Changes</>}
        </button>
      </div>

      {error && <div className="admin-alert error"><WarningCircle /> {error}</div>}
      {success && <div className="admin-alert success"><CheckCircle /> Configuration saved successfully!</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        
        {/* Panel 1: Plan Limits */}
        <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#0f172a' }}>Daily Credit Limits</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Set how many credits each user tier receives per day.</p>
          
          {Object.keys(limits).map(tier => (
            <div key={tier} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{tier} Plan</span>
              <input 
                type="number" 
                value={limits[tier] === Infinity ? 999999 : limits[tier]} 
                onChange={e => handleLimitChange(tier, e.target.value)}
                style={{ width: 120, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>
          ))}
        </div>

        {/* Panel 2: Feature Costs */}
        <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#0f172a' }}>Feature Credit Costs</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Set how many credits are deducted per action.</p>

          <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
            {Object.keys(costs).map(feature => (
              <div key={feature} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{feature.replace(/_/g, ' ')}</span>
                <input 
                  type="number" 
                  value={costs[feature]} 
                  onChange={e => handleCostChange(feature, e.target.value)}
                  style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Simulator Panel */}
      <div style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>Profit Simulator</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Project your monthly revenue and profit based on user distribution and usage levels. (API costs are calculated internally)</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Free Users</label>
            <input type="number" value={simUsersFree} onChange={e => setSimUsersFree(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Pro Users ($9.99/mo)</label>
            <input type="number" value={simUsersPro} onChange={e => setSimUsersPro(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Beast Users ($19.99/mo)</label>
            <input type="number" value={simUsersBeast} onChange={e => setSimUsersBeast(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Avg Daily Usage (%)</label>
            <input type="number" value={simUsagePercent} onChange={e => setSimUsagePercent(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 13, color: '#64748b', fontWeight: 600 }}>Monthly Revenue</span>
            <span style={{ display: 'block', fontSize: 24, fontWeight: 900, color: '#0f172a' }}>${simulatorStats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid #e2e8f0', paddingLeft: 24 }}>
            <span style={{ display: 'block', fontSize: 13, color: '#64748b', fontWeight: 600 }}>Est. Cloud Costs</span>
            <span style={{ display: 'block', fontSize: 24, fontWeight: 900, color: '#ef4444' }}>${simulatorStats.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid #e2e8f0', paddingLeft: 24 }}>
            <span style={{ display: 'block', fontSize: 13, color: '#64748b', fontWeight: 600 }}>Projected Profit</span>
            <span style={{ display: 'block', fontSize: 24, fontWeight: 900, color: '#22c55e' }}>${simulatorStats.profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>{simulatorStats.margin}% margin</span>
          </div>
        </div>
      </div>
    </div>
  )
}
