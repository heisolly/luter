import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { Chart, BarController, BarElement, LineController, LineElement, PointElement, DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js'
import { TIER_LIMITS, CREDIT_COSTS, getActionLabel } from '../../services/creditService'

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

const TOKENS = [
  { feature: 'AI Notes', model: 'llama-3.3-70b', cost: 0.0050, credits: 80, tiers: ['Pro', 'Beast'] },
  { feature: 'Open material', model: 'llama-3.3-70b', cost: 0.0050, credits: 50, tiers: ['Pro', 'Beast'] },
  { feature: 'AI chat (1 msg)', model: 'llama-3.3-70b', cost: 0.0016, credits: 20, tiers: ['Pro', 'Beast'] },
  { feature: 'Notes Studio chat', model: 'llama-3.3-70b', cost: 0.0016, credits: 20, tiers: ['Pro', 'Beast'] },
  { feature: 'Explain text', model: 'llama-3.3-70b', cost: 0.0009, credits: 10, tiers: ['Free', 'Pro', 'Beast'] },
  { feature: 'Group quiz', model: 'llama-3.3-70b', cost: 0.0050, credits: 30, tiers: ['Pro', 'Beast'] },
  { feature: 'Battle: performance', model: 'llama-3.3-70b', cost: 0.0016, credits: 30, tiers: ['Pro', 'Beast'] },
  { feature: 'Mock exam: ask tutor', model: 'llama-3.3-70b', cost: 0.0016, credits: 20, tiers: ['Pro', 'Beast'] },
  { feature: 'Summary', model: 'llama-3.1-8b', cost: 0.0002, credits: 5, tiers: ['Free', 'Pro', 'Beast'] },
  { feature: 'Flashcards (set)', model: 'llama-3.1-8b', cost: 0.0002, credits: 10, tiers: ['Free', 'Pro', 'Beast'] },
  { feature: 'Quiz (5 questions)', model: 'llama-3.1-8b', cost: 0.0003, credits: 10, tiers: ['Free', 'Pro', 'Beast'] },
  { feature: 'Mock exam (10 Qs)', model: 'llama-3.1-8b', cost: 0.0004, credits: 15, tiers: ['Pro', 'Beast'] },
  { feature: 'Battle: questions', model: 'llama-3.1-8b', cost: 0.0002, credits: 10, tiers: ['Pro', 'Beast'] },
  { feature: 'Mock exam: weakness', model: 'llama-3.1-8b', cost: 0.0002, credits: 10, tiers: ['Pro', 'Beast'] },
  { feature: 'Battle: hint', model: 'llama-3.1-8b', cost: 0.0001, credits: 5, tiers: ['Pro', 'Beast'] },
  { feature: 'Voice agent query', model: 'llama-3.1-8b', cost: 0.0001, credits: 5, tiers: ['Pro', 'Beast'] },
  { feature: 'Write: AI assist', model: 'llama-3.1-8b', cost: 0.0001, credits: 5, tiers: ['Pro', 'Beast'] },
  { feature: 'Image OCR', model: 'llama-3.2-11b-vision', cost: 0.0001, credits: 0, tiers: ['Free', 'Pro', 'Beast'] },
  { feature: 'Audio (per min)', model: 'whisper-large-v3', cost: 0.0030, credits: 20, tiers: ['Beast'], perMinute: true },
  { feature: 'Audio (5 min file)', model: 'whisper-large-v3', cost: 0.0150, credits: 100, tiers: ['Beast'] },
  { feature: 'Audio (30 min file)', model: 'whisper-large-v3', cost: 0.0900, credits: 600, tiers: ['Beast'] },
]

const TIER_ACCENTS = { free: '#888780', pro: '#378ADD', beast: '#1D9E75' }
const TIER_NAMES = { free: 'Free', pro: 'Pro', beast: 'Beast' }

const SCALES = [100, 500, 1000, 2000, 5000, 10000]

function costClass(cost) {
  if (cost >= 0.005) return { fontWeight: 500, color: '#A32D2D' }
  if (cost >= 0.001) return { fontWeight: 500, color: '#BA7517' }
  return { color: '#0F6E56', fontWeight: 500 }
}

function tierPill(tier) {
  const cls = tier === 'Free' ? 'pill pill-gray' : tier === 'Pro' ? 'pill pill-blue' : 'pill pill-teal'
  return <span key={tier} className={cls}>{tier}</span>
}

function formatNaira(usd) {
  return `₦${(usd * 1370).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default function PricingPage() {
  const context = useOutletContext()
  const profile = context?.profile ?? null
  const user = context?.user ?? null
  const navigate = useNavigate()

  const [tab, setTab] = useState('plans')

  const plCanvas = useRef(null)
  const beCanvas = useRef(null)
  const donutCanvas = useRef(null)
  const plChart = useRef(null)
  const beChart = useRef(null)
  const donutChart = useRef(null)

  const [sim, setSim] = useState({ freeN: 1000, conv: 7, proSplit: 60, freeInt: 40, proP: 7, beastP: 15, sal: 500, mkt: 150, host: 80 })

  const updateSim = useCallback((key, val) => {
    setSim(prev => ({ ...prev, [key]: val }))
  }, [])

  const compute = useCallback(() => {
    const { freeN, conv, proSplit, freeInt, proP, beastP, sal, mkt, host } = sim
    const paid = Math.round(freeN * conv / 100)
    const proN = Math.round(paid * proSplit / 100)
    const beastN = paid - proN
    const oh = sal + mkt + host
    const FREE_CR = TIER_LIMITS.free
    const PRO_CR = TIER_LIMITS.pro
    const COST_CR = 0.00005
    const BEAST_DAY = 0.23
    const fApi = freeN * FREE_CR * (freeInt / 100) * COST_CR * 30
    const pApi = proN * PRO_CR * 0.6 * COST_CR * 30
    const bApi = beastN * BEAST_DAY * 30
    const tApi = fApi + pApi + bApi
    const tCost = tApi + oh
    const rev = proN * proP + beastN * beastP
    const profit = rev - tCost
    const margin = rev > 0 ? (profit / rev) * 100 : -100
    const avgRev = paid > 0 ? rev / paid : 0
    const avgApi = paid > 0 ? (pApi + bApi) / paid : 0
    const netPerUser = avgRev - avgApi
    const beU = netPerUser > 0 ? Math.ceil(tCost / netPerUser) : 999
    return { paid, proN, beastN, oh, fApi, pApi, bApi, tApi, tCost, rev, profit, margin, beU }
  }, [sim])

  const drawPlChart = useCallback((c) => {
    if (plChart.current) { plChart.current.destroy(); plChart.current = null }
    const revs = [], costs = [], profits = []
    const { conv, proSplit, freeInt, proP, beastP, sal, mkt, host } = sim
    const oh = sal + mkt + host
    const FREE_CR = TIER_LIMITS.free, PRO_CR = TIER_LIMITS.pro, COST_CR = 0.00005, BEAST_DAY = 0.23
    SCALES.forEach(n => {
      const p = Math.round(n * conv / 100), pro = Math.round(p * proSplit / 100), beast = p - pro
      const api = (n * FREE_CR * (freeInt / 100) * COST_CR * 30) + (pro * PRO_CR * 0.6 * COST_CR * 30) + (beast * BEAST_DAY * 30)
      const r = pro * proP + beast * beastP
      revs.push(Math.round(r)); costs.push(Math.round(api + oh)); profits.push(Math.round(r - api - oh))
    })
    const profColors = profits.map(p => p >= 0 ? '#1D9E75' : '#E24B4A')
    const ctx = c.getContext('2d')
    plChart.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: SCALES.map(n => n >= 1000 ? (n / 1000) + 'k' : '' + n),
        datasets: [
          { label: 'Revenue', data: revs, backgroundColor: '#378ADD', borderWidth: 0 },
          { label: 'Total cost', data: costs, backgroundColor: '#E24B4A', borderWidth: 0 },
          { label: 'Profit', data: profits, backgroundColor: profColors, borderWidth: 0 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ' $' + ctx.parsed.y.toLocaleString() } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#888780', font: { size: 10 } }, title: { display: true, text: 'free users', color: '#888780', font: { size: 10 } } },
          y: { grid: { color: 'rgba(136,135,128,0.12)' }, ticks: { color: '#888780', font: { size: 10 }, callback: v => '$' + Math.abs(v).toLocaleString() } }
        }
      }
    })
  }, [sim])

  const drawBeChart = useCallback((c) => {
    if (beChart.current) { beChart.current.destroy(); beChart.current = null }
    const { proP, beastP, proSplit } = sim
    const ohPts = [100, 200, 400, 600, 800, 1000, 1500, 2000]
    const beUs = ohPts.map(oh => {
      const pA = TIER_LIMITS.pro * 0.6 * 0.00005 * 30, bA = 0.23 * 30
      const avgR = proP * (proSplit / 100) + beastP * (1 - proSplit / 100)
      const avgA = pA * (proSplit / 100) + bA * (1 - proSplit / 100)
      const m = avgR - avgA; return m > 0 ? Math.ceil(oh / m) : 999
    })
    const ctx = c.getContext('2d')
    beChart.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ohPts.map(o => '$' + o),
        datasets: [{ label: 'Paid users needed', data: beUs, borderColor: '#7F77DD', backgroundColor: 'rgba(127,119,221,0.08)', fill: true, tension: 0.3, pointBackgroundColor: '#534AB7', pointRadius: 3, borderWidth: 2 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} paid users` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#888780', font: { size: 10 } }, title: { display: true, text: 'monthly overhead ($)', color: '#888780', font: { size: 10 } } },
          y: { grid: { color: 'rgba(136,135,128,0.12)' }, ticks: { color: '#888780', font: { size: 10 } } }
        }
      }
    })
  }, [sim])

  const drawDonut = useCallback((c) => {
    if (donutChart.current) { donutChart.current.destroy(); donutChart.current = null }
    const { freeN, conv, proSplit, freeInt, sal, mkt, host } = sim
    const paid = Math.round(freeN * conv / 100)
    const proN = Math.round(paid * proSplit / 100)
    const beastN = paid - proN
    const oh = sal + mkt + host
    const COST_CR = 0.00005
    const fApi = Math.round(freeN * TIER_LIMITS.free * (freeInt / 100) * COST_CR * 30)
    const pApi = Math.round(proN * TIER_LIMITS.pro * 0.6 * COST_CR * 30)
    const bApi = Math.round(beastN * 0.23 * 30)
    const ctx = c.getContext('2d')
    donutChart.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Free API', 'Pro API', 'Beast API', 'Overhead'],
        datasets: [{ data: [fApi, pApi, bApi, oh], backgroundColor: ['#B5D4F4', '#378ADD', '#1D9E75', '#EF9F27'], borderWidth: 0, hoverOffset: 4 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: {
          legend: { position: 'right', labels: { font: { size: 11 }, color: '#888780', boxWidth: 10, padding: 10 } },
          tooltip: { callbacks: { label: ctx => ' $' + ctx.parsed.toLocaleString() } }
        }
      }
    })
  }, [sim])

  useEffect(() => {
    if (tab === 'sim' && plCanvas.current && beCanvas.current && donutCanvas.current) {
      drawPlChart(plCanvas.current)
      drawBeChart(beCanvas.current)
      drawDonut(donutCanvas.current)
      return () => {
        if (plChart.current) plChart.current.destroy()
        if (beChart.current) beChart.current.destroy()
        if (donutChart.current) donutChart.current.destroy()
      }
    }
  }, [tab, sim, drawPlChart, drawBeChart, drawDonut])

  const c = compute()
  const pc = c.profit >= 0 ? 'ok' : c.profit > -300 ? 'warn' : 'danger'
  const mc = c.margin >= 20 ? 'ok' : c.margin >= 0 ? 'warn' : 'danger'

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 1060, margin: '0 auto', color: 'var(--color-text-primary)', fontFamily: 'var(--font-outfit)' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Pricing Hub</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>Plans, token costs, and profitability — all in one place.</p>

      <div style={{ display: 'flex', gap: 4, background: 'var(--color-background-secondary)', borderRadius: 8, padding: 4, marginBottom: '1.5rem' }}>
        {[
          { key: 'plans', label: 'Plans & pricing' },
          { key: 'tokens', label: 'Token costs' },
          { key: 'sim', label: 'Profit simulator' },
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

      {tab === 'plans' && (
        <>
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
              ], footer: [
                { label: 'Our cost/user/mo', val: '~$0.60', cls: 'danger' },
                { label: 'Revenue', val: '$0', cls: '' },
                { label: 'Margin', val: '-$0.60', cls: 'danger' },
              ]},
              { tier: 'pro', name: 'Pro', price: '$7.00', prefix: '$', sub: '/mo', naira: `${formatNaira(7)}/mo · ${formatNaira(3.5)}/2 wks`, rows: [
                { label: 'Daily credits', val: '1,500', cls: '' },
                { label: 'AI chat', val: '~75/day', cls: '' },
                { label: 'AI Notes', val: '~18/day', cls: '' },
                { label: 'Flashcards/quizzes', val: 'included', cls: 'ok' },
                { label: 'Audio upload', val: '5 files/day', cls: 'warn' },
                { label: 'Group study', val: 'included', cls: 'ok' },
                { label: 'Mock exams', val: 'included', cls: 'ok' },
              ], footer: [
                { label: 'Our cost/user/mo', val: '~$4.50 avg', cls: 'warn' },
                { label: 'Revenue', val: '$7.00', cls: 'ok' },
                { label: 'Gross margin', val: '~$2.50 (36%)', cls: 'ok' },
              ]},
              { tier: 'beast', name: 'Beast', price: '$15.00', prefix: '$', sub: '/mo', naira: `${formatNaira(15)}/mo · ${formatNaira(7.5)}/2 wks`, rows: [
                { label: 'Daily credits', val: 'unlimited', cls: 'ok' },
                { label: 'AI chat', val: 'unlimited', cls: 'ok' },
                { label: 'AI Notes', val: 'unlimited', cls: 'ok' },
                { label: 'Flashcards/quizzes', val: 'unlimited', cls: 'ok' },
                { label: 'Audio upload', val: 'unlimited', cls: 'ok' },
                { label: 'Group study', val: 'unlimited', cls: 'ok' },
                { label: 'Mock exams', val: 'unlimited', cls: 'ok' },
              ], footer: [
                { label: 'Our cost/user/mo', val: '~$7.00 avg', cls: 'warn' },
                { label: 'Revenue', val: '$15.00', cls: 'ok' },
                { label: 'Gross margin', val: '~$8.00 (53%)', cls: 'ok' },
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
                <hr style={{ border: 'none', borderTop: '.5px solid var(--color-border-tertiary)', margin: '10px 0' }} />
                {plan.footer.map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{r.label}</span>
                    <span style={{ fontWeight: 500, color: r.cls === 'ok' ? '#0F6E56' : r.cls === 'warn' ? '#BA7517' : r.cls === 'danger' ? '#A32D2D' : undefined }}>{r.val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '.85rem 1rem', fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Yearly plans:</strong> &nbsp;Pro $65/yr (saves ~$19) &nbsp;·&nbsp; Beast $140/yr (saves ~$40) &nbsp;·&nbsp; Locks in users, reduces churn, gives you upfront cash.
          </div>
        </>
      )}

      {tab === 'tokens' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ width: '26%', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500, padding: '6px 8px 6px 0', borderBottom: '.5px solid var(--color-border-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.03em' }}>Feature</th>
                <th style={{ width: '24%', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500, padding: '6px 8px 6px 0', borderBottom: '.5px solid var(--color-border-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.03em' }}>Model</th>
                <th style={{ width: '12%', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500, padding: '6px 8px 6px 0', borderBottom: '.5px solid var(--color-border-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.03em' }}>Cost/call</th>
                <th style={{ width: '10%', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500, padding: '6px 8px 6px 0', borderBottom: '.5px solid var(--color-border-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.03em' }}>Credits</th>
                <th style={{ width: '28%', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500, padding: '6px 8px 6px 0', borderBottom: '.5px solid var(--color-border-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.03em' }}>Available on</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map(t => (
                <tr key={t.feature}>
                  <td style={{ padding: '7px 8px 7px 0', borderBottom: '.5px solid var(--color-border-tertiary)', verticalAlign: 'middle' }}>{t.feature}</td>
                  <td style={{ padding: '7px 8px 7px 0', borderBottom: '.5px solid var(--color-border-tertiary)', verticalAlign: 'middle', color: 'var(--color-text-secondary)' }}>{t.model}</td>
                  <td style={{ padding: '7px 8px 7px 0', borderBottom: '.5px solid var(--color-border-tertiary)', verticalAlign: 'middle', ...costClass(t.cost) }}>${t.cost.toFixed(4)}</td>
                  <td style={{ padding: '7px 8px 7px 0', borderBottom: '.5px solid var(--color-border-tertiary)', verticalAlign: 'middle' }}>{t.credits}{t.perMinute ? '/min' : ''}</td>
                  <td style={{ padding: '7px 8px 7px 0', borderBottom: '.5px solid var(--color-border-tertiary)', verticalAlign: 'middle' }}>{t.tiers.map(tierPill)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'sim' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ marginBottom: '.5rem' }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.4rem' }}>Users</div>
              {[
                { key: 'freeN', label: 'Free users', min: 0, max: 10000, step: 50, suffix: n => n.toLocaleString() },
                { key: 'conv', label: 'Conversion rate', min: 1, max: 25, step: 1, suffix: n => n + '%' },
                { key: 'proSplit', label: 'Pro/Beast split', min: 10, max: 90, step: 5, suffix: n => n + '/' + (100 - n) },
                { key: 'freeInt', label: 'Free usage', min: 10, max: 100, step: 5, suffix: n => n + '%' },
              ].map(s => (
                <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 56px', alignItems: 'center', gap: 8, marginBottom: '.4rem' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.label}</span>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={sim[s.key]} onChange={e => updateSim(s.key, parseFloat(e.target.value))} style={{ width: '100%' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, textAlign: 'right' }}>{s.suffix(sim[s.key])}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '.5rem' }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.4rem' }}>Pricing</div>
              {[
                { key: 'proP', label: 'Pro ($/mo)', min: 3, max: 20, step: 0.5, suffix: n => '$' + n.toFixed(2) },
                { key: 'beastP', label: 'Beast ($/mo)', min: 8, max: 30, step: 0.5, suffix: n => '$' + n.toFixed(2) },
              ].map(s => (
                <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 56px', alignItems: 'center', gap: 8, marginBottom: '.4rem' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.label}</span>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={sim[s.key]} onChange={e => updateSim(s.key, parseFloat(e.target.value))} style={{ width: '100%' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, textAlign: 'right' }}>{s.suffix(sim[s.key])}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '.5rem' }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.4rem' }}>Overhead</div>
              {[
                { key: 'sal', label: 'Salaries', min: 0, max: 3000, step: 50, suffix: n => '$' + n },
                { key: 'mkt', label: 'Marketing', min: 0, max: 1000, step: 25, suffix: n => '$' + n },
                { key: 'host', label: 'Hosting & tools', min: 0, max: 500, step: 10, suffix: n => '$' + n },
              ].map(s => (
                <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 56px', alignItems: 'center', gap: 8, marginBottom: '.4rem' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.label}</span>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={sim[s.key]} onChange={e => updateSim(s.key, parseFloat(e.target.value))} style={{ width: '100%' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, textAlign: 'right' }}>{s.suffix(sim[s.key])}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1rem' }}>
              {[
                { label: 'Paid users', val: c.paid, cls: '' },
                { label: 'Revenue/mo', val: '$' + Math.round(c.rev).toLocaleString(), cls: 'ok' },
                { label: 'API cost/mo', val: '$' + Math.round(c.tApi).toLocaleString(), cls: 'warn' },
                { label: 'Overhead/mo', val: '$' + c.oh.toLocaleString(), cls: 'warn' },
                { label: 'Total cost/mo', val: '$' + Math.round(c.tCost).toLocaleString(), cls: 'danger' },
                { label: 'Net profit', val: (c.profit >= 0 ? '+' : '') + '$' + Math.round(c.profit).toLocaleString(), cls: pc },
                { label: 'Net margin', val: Math.round(c.margin) + '%', cls: mc },
                { label: 'Break-even', val: c.beU + ' paid', cls: '' },
              ].map(m => (
                <div key={m.label} style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '.7rem .85rem' }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.03em' }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: m.cls === 'ok' ? '#0F6E56' : m.cls === 'warn' ? '#BA7517' : m.cls === 'danger' ? '#A32D2D' : undefined }}>{m.val}</div>
                </div>
              ))}
            </div>
            <div style={{
              borderRadius: 8, padding: '9px 12px', fontSize: 12,
              display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: '1rem',
              background: c.profit >= 0 ? '#E1F5EE' : c.profit > -300 ? '#FAEEDA' : '#FCEBEB',
              color: c.profit >= 0 ? '#085041' : c.profit > -300 ? '#633806' : '#791F1F',
            }}>
              {c.profit >= 0
                ? `Profitable — $${Math.round(c.profit).toLocaleString()}/mo after all costs. ${c.margin >= 20 ? 'Healthy margin.' : 'Margin is thin — consider raising prices slightly.'}`
                : `Losing $${Math.abs(Math.round(c.profit)).toLocaleString()}/mo. Need ${c.beU} paid users to break even — ${Math.max(0, c.beU - c.paid)} more than now.`}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 4 }}>Revenue vs costs at scale</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                <span><span style={{ width: 8, height: 8, borderRadius: 2, display: 'inline-block', background: '#378ADD', marginRight: 4 }}></span>Revenue</span>
                <span><span style={{ width: 8, height: 8, borderRadius: 2, display: 'inline-block', background: '#E24B4A', marginRight: 4 }}></span>Total cost</span>
                <span><span style={{ width: 8, height: 8, borderRadius: 2, display: 'inline-block', background: '#1D9E75', marginRight: 4 }}></span>Profit</span>
              </div>
              <div style={{ position: 'relative', width: '100%', height: 200 }}><canvas ref={plCanvas} /></div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 4 }}>Break-even paid users by overhead</div>
              <div style={{ position: 'relative', width: '100%', height: 160 }}><canvas ref={beCanvas} /></div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 4 }}>Cost breakdown this month</div>
              <div style={{ position: 'relative', width: '100%', height: 160 }}><canvas ref={donutCanvas} /></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pill{display:inline-block;font-size:10px;padding:2px 7px;border-radius:20px;margin:1px}
        .pill-gray{background:#F1EFE8;color:#444441}
        .pill-blue{background:#E6F1FB;color:#0C447C}
        .pill-teal{background:#E1F5EE;color:#085041}
        input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:var(--color-border-tertiary);outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:#7C3AED;cursor:pointer;border:2px solid var(--color-background-primary)}
        input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#7C3AED;cursor:pointer;border:2px solid var(--color-background-primary)}
      `}</style>
    </div>
  )
}
