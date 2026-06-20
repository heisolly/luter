import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import {
  Lightbulb, Bug, Heart, PaperPlaneTilt,
  CheckCircle, Smiley, SmileyMeh, SmileySad,
  SmileyXEyes, SmileyWink
} from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'

const CSS = `
.fbk-root{font-family:var(--font-body);min-height:100vh;background:#F9FAFB;padding-bottom:80px}
body.dark-mode .fbk-root{background:#111827}
.fbk-hero{padding:52px 48px 44px;background:linear-gradient(135deg,#7a12cc 0%,#a855f7 55%,#C4B5FD 100%);position:relative;overflow:hidden}
.fbk-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 80% 50%,rgba(152,255,152,0.12) 0%,transparent 60%);pointer-events:none}
.fbk-hero-blob{position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none}
.fbk-content{max-width:720px;margin:0 auto;padding:40px 48px}
@media(max-width:768px){.fbk-hero{padding:36px 20px 32px}.fbk-content{padding:28px 16px}}
.fbk-hero-title{font-size:42px;font-weight:900;color:#fff;margin:0 0 10px;letter-spacing:-0.03em;line-height:1.1}
.fbk-hero-sub{font-size:17px;color:rgba(255,255,255,0.78);font-weight:500;margin:0}
.fbk-type-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
@media(max-width:600px){.fbk-type-grid{grid-template-columns:1fr}}
.fbk-type-card{padding:22px;border-radius:18px;border:2px solid transparent;cursor:pointer;text-align:left;font-family:inherit;transition:all 0.2s;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
body.dark-mode .fbk-type-card{background:#1F2937}
.fbk-type-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.1)}
.fbk-type-card.selected{transform:translateY(-3px)}
.fbk-type-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.fbk-type-label{font-size:15px;font-weight:800;color:#333;margin:0 0 5px}
body.dark-mode .fbk-type-label{color:#F9FAFB}
.fbk-type-desc{font-size:12px;color:#9CA3AF;font-weight:500;margin:0}
.fbk-card{background:#fff;border-radius:20px;border:1px solid #E5E7EB;padding:32px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
body.dark-mode .fbk-card{background:#1F2937;border-color:#374151}
.fbk-label{font-size:13px;font-weight:700;color:#333;margin:0 0 8px;display:block}
body.dark-mode .fbk-label{color:#F9FAFB}
.fbk-input{width:100%;padding:12px 16px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:inherit;color:#333;background:#fff;outline:none;transition:border-color 0.2s,box-shadow 0.2s;box-sizing:border-box}
body.dark-mode .fbk-input{background:#111827;border-color:#374151;color:#F9FAFB}
.fbk-input:focus{border-color:#C4B5FD;box-shadow:0 0 0 3px rgba(196,181,253,0.2)}
.fbk-textarea{resize:vertical;min-height:130px}
.fbk-mood-row{display:flex;gap:10px;margin-top:6px}
.fbk-mood-btn{width:52px;height:52px;border-radius:14px;border:2px solid #E5E7EB;background:#F9FAFB;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:24px;transition:all 0.18s;line-height:1}
body.dark-mode .fbk-mood-btn{background:#111827;border-color:#374151}
.fbk-mood-btn:hover{transform:scale(1.12);border-color:#C4B5FD}
.fbk-mood-btn.selected{border-color:#7a12cc;background:rgba(196,181,253,0.15);transform:scale(1.12);box-shadow:0 4px 16px rgba(122,18,204,0.2)}
.fbk-submit{width:100%;padding:16px;border-radius:14px;background:linear-gradient(135deg,#7a12cc,#9718fb);color:#fff;font-size:15px;font-weight:800;border:none;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s}
.fbk-submit:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(122,18,204,0.4)}
.fbk-submit:active{transform:translateY(0)}
.fbk-submit:disabled{opacity:0.6;cursor:not-allowed;transform:none}
.fbk-success{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px;text-align:center}
.fbk-check-ring{width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#98FF98,#4ade80);display:flex;align-items:center;justify-content:center;margin-bottom:28px;box-shadow:0 12px 40px rgba(74,222,128,0.35)}
`

const TYPES = [
  { id: 'feature', label: 'Feature Request', desc: 'Suggest a new feature or improvement', icon: Lightbulb, color: '#7a12cc', bg: 'rgba(196,181,253,0.18)', border: '#C4B5FD' },
  { id: 'bug', label: 'Bug Report', desc: 'Something not working as expected?', icon: Bug, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: '#fca5a5' },
  { id: 'general', label: 'General Feedback', desc: 'Share any thoughts or suggestions', icon: Heart, color: '#16a34a', bg: 'rgba(152,255,152,0.2)', border: '#98FF98' },
]

const MOODS = ['😔', '😐', '🙂', '😊', '🤩']

function injectStyles() {
  if (document.getElementById('fbk-styles')) return
  const el = document.createElement('style')
  el.id = 'fbk-styles'
  el.textContent = CSS
  document.head.appendChild(el)
}

export default function FeedbackPage() {
  const ctx = useOutletContext?.() || {}
  const user = ctx.user

  const [type, setType] = useState('general')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [mood, setMood] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { injectStyles() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await supabase.from('feedback').insert({
        user_id: user?.id || null,
        type,
        subject: subject.trim(),
        message: message.trim(),
        mood,
        created_at: new Date().toISOString(),
      })
      setSubmitted(true)
    } catch (err) {
      setError('Failed to send. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fbk-root">
      {/* Hero */}
      <div className="fbk-hero">
        <div className="fbk-hero-blob" style={{ width: 300, height: 300, background: 'rgba(196,181,253,0.25)', top: -80, right: -60 }} />
        <div className="fbk-hero-blob" style={{ width: 180, height: 180, background: 'rgba(152,255,152,0.12)', bottom: -40, left: '30%' }} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="fbk-hero-title">Share Your Feedback</h1>
          <p className="fbk-hero-sub">Help us make Luter better — every message is read by the team.</p>
        </motion.div>
      </div>

      <div className="fbk-content">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div key="success" className="fbk-success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <motion.div className="fbk-check-ring" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
                <CheckCircle size={48} color="white" weight="fill" />
              </motion.div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#333', margin: '0 0 12px' }}>Thank you! 🎉</h2>
              <p style={{ fontSize: 16, color: '#6B7280', margin: '0 0 32px', maxWidth: 360 }}>
                Your feedback has been sent. We really appreciate you taking the time to help us improve.
              </p>
              <button
                className="fbk-submit"
                style={{ width: 'auto', padding: '13px 32px' }}
                onClick={() => { setSubmitted(false); setSubject(''); setMessage(''); setMood(null) }}
              >
                Send More Feedback
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Type selection */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>
                  What type of feedback?
                </p>
                <div className="fbk-type-grid">
                  {TYPES.map(t => {
                    const Icon = t.icon
                    return (
                      <button
                        key={t.id}
                        className={`fbk-type-card${type === t.id ? ' selected' : ''}`}
                        style={type === t.id ? { borderColor: t.border, background: t.bg } : {}}
                        onClick={() => setType(t.id)}
                      >
                        <div className="fbk-type-icon" style={{ background: type === t.id ? t.bg : '#F3F4F6' }}>
                          <Icon size={24} color={t.color} weight={type === t.id ? 'fill' : 'regular'} />
                        </div>
                        <p className="fbk-type-label">{t.label}</p>
                        <p className="fbk-type-desc">{t.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Form */}
              <form className="fbk-card" onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label className="fbk-label">Subject (optional)</label>
                  <input
                    className="fbk-input"
                    placeholder="Brief subject line..."
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label className="fbk-label">Your message *</label>
                  <textarea
                    className="fbk-input fbk-textarea"
                    placeholder="Tell us everything — the more detail the better..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: 28 }}>
                  <label className="fbk-label">How are you feeling about Luter?</label>
                  <div className="fbk-mood-row">
                    {MOODS.map((emoji, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`fbk-mood-btn${mood === i ? ' selected' : ''}`}
                        onClick={() => setMood(i)}
                        title={['Very sad', 'Neutral', 'Good', 'Happy', 'Love it'][i]}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                {error && (
                  <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{error}</p>
                )}
                <button className="fbk-submit" type="submit" disabled={submitting || !message.trim()}>
                  <PaperPlaneTilt size={18} weight="fill" />
                  {submitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
