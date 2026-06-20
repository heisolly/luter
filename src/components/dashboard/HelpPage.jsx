import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlass,
  BookOpen,
  Cards,
  GameController,
  CreditCard,
  CaretDown,
  EnvelopeSimple,
  DiscordLogo,
  ArrowRight,
} from '@phosphor-icons/react'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .hlp-root {
    font-family: 'var(--font-outfit)', sans-serif;
    background: #F9FAFB;
    min-height: 100vh;
    padding-bottom: 64px;
  }
  body.dark-mode .hlp-root { background: #111827; }

  /* ── Hero ─────────────────────────────────────────────── */
  .hlp-hero {
    background: linear-gradient(135deg, #FFD2A6 0%, #fbbf24 50%, #f97316 100%);
    padding: 60px 24px 100px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .hlp-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.18) 0%, transparent 55%);
    pointer-events: none;
  }
  .hlp-hero-tag {
    display: inline-block;
    background: rgba(255,255,255,0.28);
    border: 1px solid rgba(255,255,255,0.45);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 14px;
    border-radius: 999px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 18px;
  }
  .hlp-hero-title {
    color: #fff;
    font-size: clamp(2rem, 4.5vw, 3.2rem);
    font-weight: 800;
    margin: 0 0 10px;
    letter-spacing: -0.02em;
  }
  .hlp-hero-sub {
    color: rgba(255,255,255,0.85);
    font-size: 1.05rem;
    margin: 0 0 32px;
  }

  /* ── Search ───────────────────────────────────────────── */
  .hlp-search-wrap {
    max-width: 560px;
    margin: 0 auto;
    position: relative;
  }
  .hlp-search-icon {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #9CA3AF;
    pointer-events: none;
  }
  .hlp-search-input {
    width: 100%;
    padding: 16px 20px 16px 52px;
    border-radius: 16px;
    border: none;
    font-family: 'Outfit', sans-serif;
    font-size: 1rem;
    color: #111827;
    outline: none;
    box-shadow: 0 8px 40px rgba(0,0,0,0.15);
    box-sizing: border-box;
    background: #fff;
    transition: box-shadow 0.2s;
  }
  .hlp-search-input:focus {
    box-shadow: 0 8px 48px rgba(0,0,0,0.22), 0 0 0 3px rgba(122,18,204,0.2);
  }

  /* ── Content wrapper ──────────────────────────────────── */
  .hlp-content {
    max-width: 760px;
    margin: -44px auto 0;
    padding: 0 20px;
    position: relative;
    z-index: 2;
  }

  /* ── Quick links ──────────────────────────────────────── */
  .hlp-quick-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 40px;
  }
  @media (max-width: 600px) {
    .hlp-quick-grid { grid-template-columns: repeat(2, 1fr); }
  }
  .hlp-quick-card {
    background: #fff;
    border-radius: 16px;
    padding: 20px 14px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.07);
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: all 0.2s ease;
    text-decoration: none;
    display: block;
  }
  body.dark-mode .hlp-quick-card { background: #1F2937; }
  .hlp-quick-card:hover {
    border-color: #C4B5FD;
    transform: translateY(-3px);
    box-shadow: 0 8px 32px rgba(122,18,204,0.12);
  }
  .hlp-quick-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 10px;
  }
  .hlp-quick-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 6px;
  }
  body.dark-mode .hlp-quick-label { color: #F9FAFB; }
  .hlp-quick-arrow {
    color: #9CA3AF;
    font-size: 0.75rem;
  }

  /* ── Section heading ──────────────────────────────────── */
  .hlp-section-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .hlp-section-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: #111827;
    margin: 0;
  }
  body.dark-mode .hlp-section-title { color: #F9FAFB; }
  .hlp-count-badge {
    background: #ede9fe;
    color: #7a12cc;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
  }
  body.dark-mode .hlp-count-badge { background: #2d1b69; color: #c4b5fd; }

  /* ── FAQ accordion ────────────────────────────────────── */
  .hlp-faq-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 40px;
  }
  .hlp-faq-item {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    overflow: hidden;
    border: 1.5px solid transparent;
    transition: border-color 0.2s;
  }
  .hlp-faq-item.open { border-color: #C4B5FD; }
  body.dark-mode .hlp-faq-item { background: #1F2937; }

  .hlp-faq-trigger {
    width: 100%;
    background: none;
    border: none;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    text-align: left;
    gap: 12px;
  }
  .hlp-faq-q {
    font-size: 0.95rem;
    font-weight: 600;
    color: #111827;
    line-height: 1.4;
  }
  body.dark-mode .hlp-faq-q { color: #F9FAFB; }
  .hlp-faq-caret {
    flex-shrink: 0;
    color: #7a12cc;
    transition: transform 0.3s ease;
  }
  .hlp-faq-caret.open { transform: rotate(180deg); }

  .hlp-faq-body {
    padding: 0 20px 18px;
    font-size: 0.9rem;
    color: #4B5563;
    line-height: 1.7;
  }
  body.dark-mode .hlp-faq-body { color: #9CA3AF; }

  /* ── Contact section ──────────────────────────────────── */
  .hlp-contact {
    background: #fff;
    border-radius: 20px;
    padding: 36px 28px;
    text-align: center;
    box-shadow: 0 4px 28px rgba(0,0,0,0.07);
  }
  body.dark-mode .hlp-contact { background: #1F2937; }
  .hlp-contact-title {
    font-size: 1.3rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 6px;
  }
  body.dark-mode .hlp-contact-title { color: #F9FAFB; }
  .hlp-contact-sub {
    color: #6B7280;
    font-size: 0.9rem;
    margin: 0 0 24px;
  }
  body.dark-mode .hlp-contact-sub { color: #9CA3AF; }
  .hlp-contact-btns {
    display: flex;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .hlp-contact-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 13px 24px;
    border-radius: 14px;
    border: none;
    font-family: 'Outfit', sans-serif;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
  }
  .hlp-contact-btn.email {
    background: linear-gradient(135deg, #7a12cc, #a855f7);
    color: #fff;
    box-shadow: 0 4px 18px rgba(122,18,204,0.25);
  }
  .hlp-contact-btn.email:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(122,18,204,0.35);
  }
  .hlp-contact-btn.discord {
    background: #5865F2;
    color: #fff;
    box-shadow: 0 4px 18px rgba(88,101,242,0.25);
  }
  .hlp-contact-btn.discord:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(88,101,242,0.35);
  }

  /* ── No results ───────────────────────────────────────── */
  .hlp-no-results {
    text-align: center;
    padding: 40px 0;
    color: #9CA3AF;
    font-size: 0.95rem;
  }
`

const QUICK_LINKS = [
  { label: 'Getting Started', icon: <BookOpen size={22} weight="fill" />, color: '#7a12cc', bg: '#ede9fe' },
  { label: 'Flashcards', icon: <Cards size={22} weight="fill" />, color: '#22c55e', bg: '#d1fae5' },
  { label: 'Arcade Games', icon: <GameController size={22} weight="fill" />, color: '#f97316', bg: '#ffedd5' },
  { label: 'Billing', icon: <CreditCard size={22} weight="fill" />, color: '#f59e0b', bg: '#fef3c7' },
]

const FAQS = [
  {
    q: 'What is Luter?',
    a: 'Luter is an AI-powered study platform designed to help students learn smarter. It combines AI flashcard generation, collaborative study sessions, mock exams, and gamified learning all in one place.',
  },
  {
    q: 'How do I generate flashcards?',
    a: 'Go to the Decks section from your sidebar. Click "New Deck", then choose to generate cards from a topic name, paste text, or upload a PDF. Our AI will create focused, exam-ready cards automatically.',
  },
  {
    q: 'How do AI credits work?',
    a: 'AI credits power every AI action on Luter — generating flashcards, AI notes, quiz creation, and more. You get a monthly allowance based on your plan. You can also purchase extra credits in the Store.',
  },
  {
    q: 'How does the Arcade work?',
    a: 'The Arcade lets you play study games — trivia, flashcard races, and competitive quizzes — using content from your courses. Invite friends to compete or join public games for XP and leaderboard rankings.',
  },
  {
    q: 'Can I study offline?',
    a: 'Luter caches your most recently accessed decks and notes for offline use. A banner will appear at the top if you lose your connection. Some features (like AI generation and sessions) require an internet connection.',
  },
  {
    q: 'How do I join a study session?',
    a: 'Go to Sessions in your sidebar and click "Join Session". Enter the room code shared by your classmate, or ask them to send you a direct invite link from the Share button in their session.',
  },
  {
    q: 'How do I upgrade my plan?',
    a: 'Click Upgrade in your sidebar or navigate to Dashboard → Upgrade. Choose a plan that fits your needs and complete checkout securely via Stripe. Your credits and features activate instantly.',
  },
  {
    q: 'How do I contact support?',
    a: 'You can reach us by email at support@luter.app or join our Discord server for real-time help from the team and community. We typically respond within 24 hours on weekdays.',
  },
]

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [openIdx, setOpenIdx] = useState(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return FAQS
    const q = query.toLowerCase()
    return FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
  }, [query])

  const toggle = (i) => setOpenIdx(openIdx === i ? null : i)

  return (
    <>
      <style>{STYLES}</style>
      <div className="hlp-root">
        {/* Hero */}
        <div className="hlp-hero">
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="hlp-hero-tag">🤝 Support Center</span>
            <h1 className="hlp-hero-title">Help &amp; Support</h1>
            <p className="hlp-hero-sub">Find answers fast — we've got you covered</p>
            <div className="hlp-search-wrap">
              <MagnifyingGlass className="hlp-search-icon" size={20} weight="bold" />
              <input
                className="hlp-search-input"
                type="text"
                placeholder="Search for anything..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                id="hlp-search"
              />
            </div>
          </motion.div>
        </div>

        <div className="hlp-content">
          {/* Quick links */}
          {!query && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="hlp-quick-grid">
                {QUICK_LINKS.map((ql, i) => (
                  <motion.div
                    key={ql.label}
                    className="hlp-quick-card"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                  >
                    <div className="hlp-quick-icon" style={{ background: ql.bg, color: ql.color }}>
                      {ql.icon}
                    </div>
                    <div className="hlp-quick-label">{ql.label}</div>
                    <div className="hlp-quick-arrow">
                      <ArrowRight size={14} weight="bold" color={ql.color} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="hlp-section-head">
              <h2 className="hlp-section-title">Frequently Asked Questions</h2>
              <span className="hlp-count-badge">{filtered.length}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="hlp-no-results">
                😕 No results for "<strong>{query}</strong>". Try different keywords.
              </div>
            ) : (
              <div className="hlp-faq-list">
                {filtered.map((faq, i) => (
                  <motion.div
                    key={faq.q}
                    className={`hlp-faq-item ${openIdx === i ? 'open' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <button
                      className="hlp-faq-trigger"
                      onClick={() => toggle(i)}
                      aria-expanded={openIdx === i}
                      id={`hlp-faq-${i}`}
                    >
                      <span className="hlp-faq-q">{faq.q}</span>
                      <CaretDown
                        size={18}
                        weight="bold"
                        className={`hlp-faq-caret ${openIdx === i ? 'open' : ''}`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {openIdx === i && (
                        <motion.div
                          key="body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="hlp-faq-body">{faq.a}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="hlp-contact"
          >
            <p className="hlp-contact-title">Still need help?</p>
            <p className="hlp-contact-sub">Our team is available Monday–Friday, 9 AM–6 PM WAT</p>
            <div className="hlp-contact-btns">
              <a
                href="mailto:support@luter.app"
                className="hlp-contact-btn email"
                id="hlp-email-support"
              >
                <EnvelopeSimple size={18} weight="fill" />
                Email Support
              </a>
              <a
                href="https://discord.gg/luter"
                target="_blank"
                rel="noopener noreferrer"
                className="hlp-contact-btn discord"
                id="hlp-discord-support"
              >
                <DiscordLogo size={18} weight="fill" />
                Join Discord
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
