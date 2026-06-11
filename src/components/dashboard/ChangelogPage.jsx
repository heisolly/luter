import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkle, Bell, ArrowRight } from '@phosphor-icons/react'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .clg-root {
    font-family: 'Outfit', 'Inter', sans-serif;
    background: #F9FAFB;
    min-height: 100vh;
    padding-bottom: 64px;
  }
  body.dark-mode .clg-root { background: #111827; }

  /* ── Hero ─────────────────────────────────────────────── */
  .clg-hero {
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #86efac 100%);
    padding: 60px 24px 90px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .clg-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 70%, rgba(255,255,255,0.15) 0%, transparent 55%);
    pointer-events: none;
  }
  .clg-version-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.25);
    border: 1px solid rgba(255,255,255,0.45);
    color: #fff;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 5px 16px;
    border-radius: 999px;
    margin-bottom: 20px;
    backdrop-filter: blur(8px);
  }
  .clg-hero-title {
    color: #fff;
    font-size: clamp(2rem, 4.5vw, 3.2rem);
    font-weight: 800;
    margin: 0 0 10px;
    letter-spacing: -0.02em;
  }
  .clg-hero-sub {
    color: rgba(255,255,255,0.85);
    font-size: 1.05rem;
    margin: 0;
  }

  /* ── Content ──────────────────────────────────────────── */
  .clg-content {
    max-width: 720px;
    margin: -40px auto 0;
    padding: 0 20px;
    position: relative;
    z-index: 2;
  }

  /* ── Timeline ─────────────────────────────────────────── */
  .clg-timeline {
    position: relative;
    padding-left: 36px;
  }
  .clg-timeline::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, #22c55e, #C4B5FD 60%, #FFD2A6);
    border-radius: 2px;
  }

  .clg-entry {
    position: relative;
    margin-bottom: 36px;
  }
  .clg-dot {
    position: absolute;
    left: -32px;
    top: 18px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #22c55e;
    border: 3px solid #fff;
    box-shadow: 0 0 0 2px #22c55e;
    z-index: 1;
  }
  body.dark-mode .clg-dot { border-color: #1F2937; }

  .clg-card {
    background: #fff;
    border-radius: 18px;
    padding: 24px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.07);
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .clg-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 36px rgba(0,0,0,0.11);
  }
  body.dark-mode .clg-card { background: #1F2937; }

  .clg-card-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 12px;
  }
  .clg-ver-badge {
    font-size: 0.95rem;
    font-weight: 800;
    color: #333;
  }
  body.dark-mode .clg-ver-badge { color: #F9FAFB; }
  .clg-date {
    font-size: 0.78rem;
    color: #9CA3AF;
    font-weight: 500;
    margin-left: auto;
  }

  /* Tag pills */
  .clg-tag {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  .clg-tag-NEW    { background: #d1fae5; color: #065f46; }
  .clg-tag-IMPROVED { background: #ede9fe; color: #5b21b6; }
  .clg-tag-FIX    { background: #FFD2A6; color: #92400e; }
  body.dark-mode .clg-tag-NEW       { background: #064e3b; color: #6ee7b7; }
  body.dark-mode .clg-tag-IMPROVED  { background: #2d1b69; color: #c4b5fd; }
  body.dark-mode .clg-tag-FIX       { background: #451a03; color: #fcd34d; }

  .clg-card-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 10px;
  }
  body.dark-mode .clg-card-title { color: #F9FAFB; }

  .clg-bullets {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .clg-bullet {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 0.9rem;
    color: #4B5563;
    line-height: 1.5;
  }
  body.dark-mode .clg-bullet { color: #9CA3AF; }
  .clg-bullet::before {
    content: '→';
    color: #7a12cc;
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 1px;
  }

  /* ── Subscribe banner ─────────────────────────────────── */
  .clg-subscribe {
    background: linear-gradient(135deg, #7a12cc, #a855f7);
    border-radius: 20px;
    padding: 36px 28px;
    text-align: center;
    margin-top: 40px;
    box-shadow: 0 8px 40px rgba(122,18,204,0.25);
    position: relative;
    overflow: hidden;
  }
  .clg-subscribe::after {
    content: '';
    position: absolute;
    top: -30px; right: -30px;
    width: 120px; height: 120px;
    background: rgba(255,255,255,0.07);
    border-radius: 50%;
  }
  .clg-sub-title {
    color: #fff;
    font-size: 1.3rem;
    font-weight: 800;
    margin: 0 0 6px;
  }
  .clg-sub-desc {
    color: rgba(255,255,255,0.78);
    font-size: 0.9rem;
    margin: 0 0 20px;
  }
  .clg-sub-row {
    display: flex;
    gap: 10px;
    max-width: 400px;
    margin: 0 auto;
  }
  @media (max-width: 480px) {
    .clg-sub-row { flex-direction: column; }
  }
  .clg-sub-input {
    flex: 1;
    padding: 11px 16px;
    border-radius: 12px;
    border: none;
    font-family: 'Outfit', sans-serif;
    font-size: 0.92rem;
    outline: none;
    background: rgba(255,255,255,0.95);
    color: #111;
  }
  .clg-sub-btn {
    padding: 11px 22px;
    border-radius: 12px;
    border: none;
    background: #FFD2A6;
    color: #92400e;
    font-family: 'Outfit', sans-serif;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    transition: all 0.18s ease;
  }
  .clg-sub-btn:hover {
    background: #fbbf24;
    transform: translateY(-1px);
  }
  .clg-sub-success {
    color: #d1fae5;
    font-weight: 600;
    font-size: 0.92rem;
    margin-top: 12px;
  }
`

const CHANGELOG = [
  {
    version: 'v2.4.0',
    date: 'June 2025',
    tag: 'NEW',
    title: 'My Decks, Backpack & Arcade Redesign',
    bullets: [
      'Introduced My Decks — a dedicated space to manage all your flashcard collections',
      'Backpack dropdown now shows quick access to recent materials and pinned content',
      'Full Arcade redesign with new game modes and improved leaderboards',
    ],
  },
  {
    version: 'v2.3.0',
    date: 'April 2025',
    tag: 'IMPROVED',
    title: 'Dark Mode, Personal Dropdown & Credits',
    bullets: [
      'Full dark mode across every page — toggle from your profile menu',
      'Personal dropdown now shows XP level, streak, and credit balance at a glance',
      'New AI Credits system replaces the old token model with clearer usage tracking',
    ],
  },
  {
    version: 'v2.2.0',
    date: 'February 2025',
    tag: 'NEW',
    title: 'Sessions — Collaborative Study Rooms',
    bullets: [
      'Create or join real-time study sessions with classmates',
      'Shared whiteboard, synchronized flashcards, and live chat in every room',
      'Session history and replay available in the Sessions tab',
    ],
  },
  {
    version: 'v2.1.0',
    date: 'December 2024',
    tag: 'IMPROVED',
    title: 'AI Flashcard Generation Improvements',
    bullets: [
      'Up to 3× faster card generation with our upgraded AI pipeline',
      'Better topic chunking — cards are now more focused and exam-relevant',
      'Support for generating cards from PDF uploads directly in the Decks tab',
    ],
  },
  {
    version: 'v2.0.0',
    date: 'October 2024',
    tag: 'NEW',
    title: 'Full App Redesign',
    bullets: [
      'Brand-new UI system with Outfit typography, purple accent palette, and glassmorphism cards',
      'Redesigned sidebar with collapsible sections, quick actions, and search',
      'Dashboard Home now shows personalised study recommendations every day',
    ],
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function ChangelogPage() {
  const [email, setEmail] = useState('')
  const [subDone, setSubDone] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email.trim()) {
      setSubDone(true)
      setEmail('')
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="clg-root">
        {/* Hero */}
        <div className="clg-hero">
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="clg-version-pill">
              <Sparkle size={13} weight="fill" />
              v2.4.0 — June 2025
            </div>
            <h1 className="clg-hero-title">What's New</h1>
            <p className="clg-hero-sub">The latest updates, improvements and fixes to Luter</p>
          </motion.div>
        </div>

        <div className="clg-content">
          {/* Timeline */}
          <motion.div
            className="clg-timeline"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {CHANGELOG.map((entry, idx) => (
              <motion.div key={entry.version} className="clg-entry" variants={itemVariants}>
                <div className="clg-dot" style={{ background: idx === 0 ? '#22c55e' : idx === 1 ? '#7a12cc' : idx < 4 ? '#a855f7' : '#FFD2A6' }} />
                <div className="clg-card">
                  <div className="clg-card-header">
                    <span className="clg-ver-badge">{entry.version}</span>
                    <span className={`clg-tag clg-tag-${entry.tag}`}>{entry.tag}</span>
                    <span className="clg-date">{entry.date}</span>
                  </div>
                  <h3 className="clg-card-title">{entry.title}</h3>
                  <ul className="clg-bullets">
                    {entry.bullets.map((b, i) => (
                      <li key={i} className="clg-bullet">{b}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Subscribe banner */}
          <motion.div
            className="clg-subscribe"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Bell size={28} weight="fill" color="#FFD2A6" style={{ marginBottom: 10 }} />
            <p className="clg-sub-title">Stay in the Loop</p>
            <p className="clg-sub-desc">Get notified when we ship new features — no spam, ever.</p>
            {subDone ? (
              <p className="clg-sub-success">🎉 You're subscribed! We'll keep you posted.</p>
            ) : (
              <form className="clg-sub-row" onSubmit={handleSubscribe}>
                <input
                  className="clg-sub-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="clg-sub-btn">
                  Subscribe <ArrowRight size={15} weight="bold" />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
