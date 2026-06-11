import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  Cards,
  CaretDown,
  Check,
  CheckSquare,
  CopySimple,
  FilePlus,
  FunnelSimple,
  Gauge,
  GraduationCap,
  MagnifyingGlass,
  MagicWand,
  PencilSimple,
  Plus,
  Shuffle,
  SignOut,
  SlidersHorizontal,
  SpeakerHigh,
  Star,
  Trash,
  TrendUp,
  UploadSimple,
  X,
} from '@phosphor-icons/react'

const FILTERS = [
  { id: 'new', label: 'New', icon: TrendUp, tone: 'blue' },
  { id: 'review', label: 'To Review', icon: ArrowsClockwise, tone: 'peach' },
  { id: 'mastered', label: 'Memorised', icon: GraduationCap, tone: 'mint' },
  { id: 'starred', label: 'Starred', icon: Star, tone: 'gold' },
]

const SETTINGS = [
  { key: 'pageRange', label: 'Page range', value: 'Next 3-4 pages', icon: CopySimple },
  { key: 'type', label: 'Flashcard types', value: 'Basic', icon: MagicWand },
  { key: 'detail', label: 'Flashcard details', value: 'Every detail', icon: Cards },
  { key: 'length', label: 'Flashcard length', value: 'Short cards', icon: FilePlus },
  { key: 'style', label: 'Style', value: 'No styling', icon: SlidersHorizontal },
  { key: 'frontLang', label: 'Flashcard front language', value: 'Auto Detect', icon: Cards },
  { key: 'backLang', label: 'Flashcard back language', value: 'Auto Detect', icon: Cards },
]

function normalizeCards(items) {
  const list = Array.isArray(items) ? items : (items?.flashcards || items?.items || items?.cards || [])
  return list.map((card, index) => {
    const front = card?.front || card?.question || card?.term || card?.q || (typeof card === 'string' ? card : '')
    const back = card?.back || card?.answer || card?.definition || card?.a || ''
    return {
      ...card,
      id: card?.id || `card_${index}`,
      front: front || 'Untitled question',
      back: back || 'No answer yet',
      status: card?.status || 'new',
    }
  })
}

function IconButton({ children, label, onClick, active = false, disabled = false }) {
  return (
    <button className={`fc-icon-btn ${active ? 'is-active' : ''}`} type="button" title={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function FlashcardEngine({ material, items = [], onRegenerate, isLoading = false }) {
  const cards = useMemo(() => normalizeCards(items), [items])
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('Default')
  const [activeFilter, setActiveFilter] = useState('new')
  const [starredIds, setStarredIds] = useState(new Set())
  const [masteredIds, setMasteredIds] = useState(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [showStudyPicker, setShowStudyPicker] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [cards.length])

  const counts = {
    new: cards.filter((card) => !masteredIds.has(card.id)).length,
    review: Math.max(0, cards.length - masteredIds.size),
    mastered: masteredIds.size,
    starred: starredIds.size,
  }

  const visibleCards = cards
    .filter((card) => {
      const term = `${card.front} ${card.back}`.toLowerCase()
      const matchesQuery = !query || term.includes(query.toLowerCase())
      if (!matchesQuery) return false
      if (activeFilter === 'mastered') return masteredIds.has(card.id)
      if (activeFilter === 'starred') return starredIds.has(card.id)
      return true
    })
    .sort((a, b) => {
      if (sort === 'Starred') return Number(starredIds.has(b.id)) - Number(starredIds.has(a.id))
      if (sort === 'Newest') return String(b.id).localeCompare(String(a.id))
      return 0
    })

  const currentCard = cards[currentIndex] || cards[0]

  const toggleStar = (cardId) => {
    setStarredIds((prev) => {
      const next = new Set(prev)
      next.has(cardId) ? next.delete(cardId) : next.add(cardId)
      return next
    })
  }

  const startStudy = () => {
    setShowStudyPicker(false)
    setStudyMode(true)
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const nextCard = () => {
    setCurrentIndex((index) => Math.min(cards.length - 1, index + 1))
    setIsFlipped(false)
  }

  const previousCard = () => {
    setCurrentIndex((index) => Math.max(0, index - 1))
    setIsFlipped(false)
  }

  const markCard = (result) => {
    if (result === 'done' && currentCard) {
      setMasteredIds((prev) => new Set(prev).add(currentCard.id))
    }
    nextCard()
  }

  if (studyMode && currentCard) {
    return (
      <FlashcardStyles>
        <section className="fc-study-shell">
          <header className="fc-study-header">
            <div className="fc-study-crumb">
              <span>{material?.title || 'Study Deck'}</span>
              <span>/</span>
              <strong>Spaced Repetition</strong>
            </div>
            <div className="fc-study-stats">
              <span><Cards size={16} weight="bold" /> {Math.max(0, cards.length - masteredIds.size)} To-Do</span>
              <span><Check size={16} weight="bold" /> {masteredIds.size} Done</span>
            </div>
            <div className="fc-study-actions">
              <button type="button" className="fc-pill-btn" onClick={() => setCurrentIndex(Math.floor(Math.random() * cards.length))}>
                <Shuffle size={17} weight="bold" /> Shuffle
              </button>
              <button type="button" className="fc-quit-btn" onClick={() => setStudyMode(false)}>
                <SignOut size={17} weight="bold" /> Quit Study
              </button>
            </div>
          </header>

          <div className="fc-study-progress">
            <span style={{ width: `${((currentIndex + 1) / Math.max(1, cards.length)) * 100}%` }} />
          </div>

          <main className="fc-study-stage">
            <motion.article
              key={currentCard.id + String(isFlipped)}
              className="fc-study-card"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsFlipped((value) => !value)}
            >
              <div className="fc-study-card-tools">
                <IconButton label="Read aloud"><SpeakerHigh size={18} /></IconButton>
                <div className="fc-study-card-right">
                  <IconButton label="Copy"><CopySimple size={18} /></IconButton>
                  <IconButton label="Edit" onClick={(event) => { event?.stopPropagation?.(); setEditingCard(currentCard) }}><PencilSimple size={18} /></IconButton>
                  <IconButton label="Delete"><Trash size={18} /></IconButton>
                  <IconButton label="Star" active={starredIds.has(currentCard.id)} onClick={(event) => { event?.stopPropagation?.(); toggleStar(currentCard.id) }}><Star size={18} weight={starredIds.has(currentCard.id) ? 'fill' : 'regular'} /></IconButton>
                </div>
              </div>
              <div className="fc-study-question">{isFlipped ? currentCard.back : currentCard.front}</div>
              <div className="fc-card-divider" />
              <div className="fc-study-answer">{isFlipped ? currentCard.front : currentCard.back}</div>
            </motion.article>

            <div className="fc-study-response">
              <button type="button" className="fc-nav-btn" onClick={previousCard} disabled={currentIndex === 0}>
                <ArrowLeft size={18} />
              </button>
              <button type="button" className="fc-hard-btn" onClick={() => markCard('hard')}>Hard</button>
              <button type="button" className="fc-ok-btn" onClick={() => markCard('done')}>OK</button>
              <button type="button" className="fc-nav-btn" onClick={nextCard} disabled={currentIndex === cards.length - 1}>
                <ArrowRight size={18} />
              </button>
            </div>
          </main>
        </section>

        <AnimatePresence>
          {editingCard && <EditCardModal card={editingCard} onClose={() => setEditingCard(null)} />}
        </AnimatePresence>
      </FlashcardStyles>
    )
  }

  return (
    <FlashcardStyles>
      <section className="fc-shell">
        <div className="fc-top-row">
          <div className="fc-filter-group">
            <div className="fc-filter-label"><FunnelSimple size={14} /> Filters:</div>
            {FILTERS.map((filter) => {
              const FilterIcon = filter.icon
              return (
                <button
                  key={filter.id}
                  type="button"
                  className={`fc-filter-chip tone-${filter.tone} ${activeFilter === filter.id ? 'is-active' : ''}`}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  <FilterIcon size={17} weight={filter.id === 'starred' ? 'regular' : 'bold'} />
                  <span>{filter.label}: {counts[filter.id]}</span>
                </button>
              )
            })}
          </div>

          <label className="fc-search">
            <span><MagnifyingGlass size={15} /> Search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cards..." />
          </label>

          <label className="fc-sort">
            <span><SlidersHorizontal size={14} /> Sort by:</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option>Default</option>
              <option>Newest</option>
              <option>Starred</option>
            </select>
          </label>
        </div>

        <div className="fc-engagement-strip">
          <div className="fc-engagement-copy">
            <img src="/mascot.png" alt="" />
            <div>
              <span>Memory board</span>
              <strong>Build recall in short loops.</strong>
              <p>Warm up with a few cards, sprint through weak spots, then lock in the ones you keep missing.</p>
            </div>
          </div>
          <div className="fc-lanes">
            <button type="button" className="tone-purple" onClick={() => setShowStudyPicker(true)}>
              <Cards size={18} weight="bold" />
              <span>Warm up</span>
            </button>
            <button type="button" className="tone-mint" onClick={startStudy} disabled={!cards.length}>
              <Gauge size={18} weight="bold" />
              <span>Recall sprint</span>
            </button>
            <button type="button" className="tone-peach" onClick={() => setActiveFilter('mastered')}>
              <GraduationCap size={18} weight="bold" />
              <span>Mastery</span>
            </button>
          </div>
        </div>

        <div className={`fc-canvas ${cards.length ? 'has-cards' : ''}`}>
          {cards.length === 0 ? (
            <div className="fc-empty-card">
              <img className="fc-mascot" src="/mascot.png" alt="" />
              <h3>No cards yet</h3>
              <p>Auto-generate them with the button below</p>
              <div className="fc-empty-actions">
                <button type="button" className="fc-generate-btn" onClick={onRegenerate} disabled={!onRegenerate || isLoading}>
                  <MagicWand size={18} weight="bold" /> {isLoading ? 'Generating' : 'Generate'}
                </button>
                <IconButton label="Flashcard settings" onClick={() => setShowSettings(true)}>
                  <SlidersHorizontal size={18} weight="bold" />
                </IconButton>
              </div>
            </div>
          ) : (
            <div className="fc-grid">
              {visibleCards.map((card, index) => (
                <motion.article
                  layout
                  key={card.id}
                  className="fc-preview-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16 }}
                  onClick={() => {
                    setCurrentIndex(cards.findIndex((item) => item.id === card.id))
                    setStudyMode(true)
                  }}
                >
                  <div className="fc-card-top">
                    <span className="fc-card-badge"><TrendUp size={18} weight="bold" /></span>
                    <div className="fc-card-actions">
                      <IconButton label="Copy"><CopySimple size={16} /></IconButton>
                      <IconButton label="Edit" onClick={(event) => { event.stopPropagation(); setEditingCard(card) }}><PencilSimple size={16} /></IconButton>
                      <IconButton label="Star" active={starredIds.has(card.id)} onClick={(event) => { event.stopPropagation(); toggleStar(card.id) }}><Star size={16} weight={starredIds.has(card.id) ? 'fill' : 'regular'} /></IconButton>
                    </div>
                  </div>
                  <p className="fc-card-front">{card.front}</p>
                  <div className="fc-card-divider" />
                  <p className="fc-card-back">{card.back}</p>
                  <span className="fc-card-index">{index + 1}</span>
                </motion.article>
              ))}
            </div>
          )}
        </div>

        <div className="fc-bottom-bar">
          <button type="button" className="fc-bottom-btn" onClick={() => setEditingCard({ front: '', back: '' })}>
            <Plus size={17} weight="bold" /> Add Card <CaretDown size={14} weight="bold" />
          </button>
          <button type="button" className="fc-bottom-btn">
            <UploadSimple size={17} weight="bold" /> Import Cards
          </button>
          <button type="button" className="fc-bottom-btn">
            <CheckSquare size={17} weight="bold" /> Bulk Select
          </button>
          <div className="fc-zoom">
            <MagnifyingGlass size={17} />
            <span>100%</span>
            <button type="button">-</button>
            <button type="button">+</button>
          </div>
        </div>

        {cards.length > 0 && (
          <button type="button" className="fc-study-floating" onClick={() => setShowStudyPicker(true)}>
            <GraduationCap size={18} weight="bold" /> Study Deck
          </button>
        )}

        <AnimatePresence>
          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
          {showStudyPicker && <StudyPicker cards={cards} onClose={() => setShowStudyPicker(false)} onStart={startStudy} />}
          {editingCard && <EditCardModal card={editingCard} onClose={() => setEditingCard(null)} />}
          {isLoading && <GeneratingModal cards={cards} onClose={() => {}} />}
        </AnimatePresence>
      </section>
    </FlashcardStyles>
  )
}

function SettingsModal({ onClose }) {
  return (
    <ModalFrame onClose={onClose} width="948px">
      <div className="fc-settings-head">
        <span><SlidersHorizontal size={20} weight="bold" /> Flashcards Settings</span>
      </div>
      <div className="fc-settings-body">
        <div className="fc-settings-list">
          {SETTINGS.map((setting) => {
            const SettingIcon = setting.icon
            return (
              <label key={setting.key} className="fc-setting-field">
                <span>{setting.label}</span>
                <button type="button">
                  <SettingIcon size={19} weight="bold" />
                  {setting.value}
                  <CaretDown size={16} weight="bold" />
                </button>
              </label>
            )
          })}
          <label className="fc-setting-field is-wide">
            <span>Custom prompt</span>
            <textarea placeholder="Add a specific instruction for this deck..." />
          </label>
        </div>
        <div className="fc-settings-preview">
          <span><MagnifyingGlass size={17} /> Preview</span>
          <div className="fc-preview-large">
            <p>What's the capital of Italy?</p>
            <div className="fc-card-divider" />
            <p>Rome</p>
          </div>
        </div>
      </div>
      <footer className="fc-modal-actions">
        <button type="button" className="fc-bottom-btn">Save for this Deck</button>
        <button type="button" className="fc-generate-btn">Save for All Decks</button>
      </footer>
    </ModalFrame>
  )
}

function GeneratingModal({ cards }) {
  const preview = cards[0]
  return (
    <ModalFrame width="512px" lockClose>
      <div className="fc-generating-head">
        <h3>Generating cards...</h3>
        <p>While Luter is crafting your cards, you can review the first ones as they appear.</p>
      </div>
      <div className="fc-generating-card">
        <div className="fc-card-top">
          <span className="fc-card-badge"><TrendUp size={18} weight="bold" /></span>
          <div className="fc-card-actions">
            <IconButton label="Read"><SpeakerHigh size={16} /></IconButton>
            <IconButton label="Copy"><CopySimple size={16} /></IconButton>
            <IconButton label="Edit"><PencilSimple size={16} /></IconButton>
            <IconButton label="Delete"><Trash size={16} /></IconButton>
            <IconButton label="Star"><Star size={16} /></IconButton>
          </div>
        </div>
        <p className="fc-card-front">{preview?.front || 'Reading the source and drafting a focused question...'}</p>
        <div className="fc-card-divider" />
        <p className="fc-card-back">{preview?.back || 'The answer will appear as soon as the first card is ready.'}</p>
      </div>
      <footer className="fc-generating-foot">
        <span className="fc-loading-line"><i /></span>
        <button className="fc-generate-btn" type="button" disabled>Done</button>
      </footer>
    </ModalFrame>
  )
}

function StudyPicker({ cards, onClose, onStart }) {
  const options = [
    { title: 'Spaced Repetition', caption: `Study ${cards.length} cards with the best algorithm`, icon: TrendUp, tone: 'purple' },
    { title: 'Fast Review', caption: `Study ${cards.length} cards without spacing`, icon: Gauge, tone: 'blue' },
    { title: 'Quiz', caption: 'Test your knowledge with quizzes', icon: CheckSquare, tone: 'mint' },
    { title: 'Exam Simulation', caption: 'Evaluate yourself under pressure', icon: ArrowsClockwise, tone: 'cyan' },
  ]

  return (
    <ModalFrame onClose={onClose} width="768px">
      <div className="fc-study-picker-head">
        <span><GraduationCap size={22} weight="bold" /> Study Mode</span>
      </div>
      <div className="fc-study-picker-filters">
        <span><FunnelSimple size={15} /> Active Filters</span>
        <button type="button"><TrendUp size={17} weight="bold" /> {cards.length}</button>
        <button type="button"><SlidersHorizontal size={17} /> Study Order</button>
      </div>
      <div className="fc-study-picker-grid">
        {options.map((option) => {
          const OptionIcon = option.icon
          return (
            <button key={option.title} type="button" className={`fc-study-option tone-${option.tone}`} onClick={option.title === 'Spaced Repetition' ? onStart : undefined}>
              <span><OptionIcon size={28} weight="bold" /></span>
              <strong>{option.title}</strong>
              <small>{option.caption}</small>
            </button>
          )
        })}
      </div>
    </ModalFrame>
  )
}

function EditCardModal({ card, onClose }) {
  const [front, setFront] = useState(card?.front || '')
  const [back, setBack] = useState(card?.back || '')

  return (
    <ModalFrame onClose={onClose} width="880px">
      <div className="fc-edit-head">
        <button type="button" className="fc-bottom-btn"><ArrowsClockwise size={17} /> Undo</button>
        <button type="button" className="fc-ok-small" onClick={onClose}><Check size={17} /> Done</button>
      </div>
      <div className="fc-edit-card">
        <textarea value={front} onChange={(event) => setFront(event.target.value)} />
        <div className="fc-editor-toolbar">
          <button type="button">Aa</button>
          <button type="button">=</button>
          <button type="button">T</button>
          <button type="button">S</button>
        </div>
        <textarea value={back} onChange={(event) => setBack(event.target.value)} />
      </div>
    </ModalFrame>
  )
}

function ModalFrame({ children, onClose, width = '640px', lockClose = false }) {
  return (
    <motion.div className="fc-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="fc-modal"
        style={{ width }}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.18 }}
      >
        {!lockClose && (
          <button type="button" className="fc-modal-close" onClick={onClose}>
            <X size={18} weight="bold" />
          </button>
        )}
        {children}
      </motion.div>
    </motion.div>
  )
}

function FlashcardStyles({ children }) {
  return (
    <>
      {children}
      <style>{`
        .fc-shell, .fc-study-shell {
          --fc-bg: var(--sb-bg, #F9FAFB);
          --fc-surface: var(--sb-surface, #fff);
          --fc-text: var(--sb-text, #111827);
          --fc-secondary: var(--sb-text-secondary, #6B7280);
          --fc-muted: var(--sb-text-muted, #9CA3AF);
          --fc-border: var(--sb-border, #E5E7EB);
          --fc-purple: var(--sb-purple, #C4B5FD);
          --fc-purple-deep: var(--sb-purple-deep, #7a12cc);
          --fc-mint: var(--sb-mint, #98FF98);
          --fc-peach: var(--sb-peach, #FFD2A6);
          width: 100%;
          height: 100%;
          min-height: 620px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle, rgba(17, 24, 39, 0.055) 1px, transparent 1px),
            var(--fc-bg);
          background-size: 14px 14px;
          color: var(--fc-text);
          font-family: var(--font-outfit), Outfit, Inter, sans-serif;
        }
        .fc-top-row {
          display: grid;
          grid-template-columns: minmax(360px, auto) 156px minmax(132px, auto);
          align-items: start;
          gap: 16px;
          padding: 20px 28px 12px;
        }
        .fc-filter-group, .fc-search, .fc-sort, .fc-bottom-bar, .fc-zoom, .fc-empty-card, .fc-preview-card, .fc-modal, .fc-study-card, .fc-study-response, .fc-engagement-strip {
          background: color-mix(in srgb, var(--fc-surface) 94%, transparent);
          border: 1px solid color-mix(in srgb, var(--fc-border) 86%, transparent);
          box-shadow: 0 8px 28px rgba(17, 24, 39, 0.04);
        }
        .fc-filter-group {
          min-height: 76px;
          border-radius: 18px;
          padding: 12px;
          display: flex;
          align-items: end;
          gap: 8px;
          flex-wrap: wrap;
        }
        .fc-filter-label, .fc-search span, .fc-sort span {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--fc-muted);
          font-size: 12px;
          font-weight: 700;
        }
        .fc-filter-chip {
          height: 32px;
          border: 0;
          border-radius: 12px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          color: var(--fc-muted);
          background: transparent;
          cursor: pointer;
        }
        .fc-filter-chip.is-active { background: color-mix(in srgb, var(--fc-purple) 22%, transparent); color: #5B21B6; }
        .fc-filter-chip.tone-blue { color: #3159C9; }
        .fc-filter-chip.tone-peach { color: #E9875D; }
        .fc-filter-chip.tone-mint { color: #4FBF82; }
        .fc-filter-chip.tone-gold { color: #E7A64A; }
        .fc-search, .fc-sort {
          border-radius: 18px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .fc-search input, .fc-sort select, .fc-setting-field button, .fc-setting-field textarea {
          width: 100%;
          min-height: 40px;
          border: 1px solid var(--fc-border);
          border-radius: 13px;
          background: var(--fc-surface);
          color: var(--fc-text);
          outline: none;
          padding: 0 12px;
          font: inherit;
        }
        .fc-engagement-strip {
          margin: 0 28px 12px;
          min-height: 104px;
          border-radius: 22px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          overflow: hidden;
          position: relative;
        }
        .fc-engagement-strip:before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--fc-purple) 28%, transparent), transparent 38%),
            linear-gradient(315deg, color-mix(in srgb, var(--fc-mint) 22%, transparent), transparent 42%),
            linear-gradient(90deg, transparent 48%, color-mix(in srgb, var(--fc-peach) 26%, transparent));
          pointer-events: none;
        }
        .fc-engagement-copy, .fc-lanes { position: relative; z-index: 1; }
        .fc-engagement-copy {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .fc-engagement-copy img {
          width: 66px;
          height: 66px;
          object-fit: contain;
          filter: drop-shadow(0 12px 20px rgba(122, 18, 204, 0.16));
          flex-shrink: 0;
        }
        .fc-engagement-copy span {
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          background: var(--fc-purple);
          color: #3B0764;
          font-size: 11px;
          font-weight: 900;
          margin-bottom: 6px;
        }
        .fc-engagement-copy strong {
          display: block;
          color: var(--fc-text);
          font-size: 21px;
          line-height: 1.1;
          font-weight: 900;
        }
        .fc-engagement-copy p {
          margin: 5px 0 0;
          color: var(--fc-secondary);
          font-size: 13px;
          line-height: 1.35;
          font-weight: 650;
          max-width: 560px;
        }
        .fc-lanes {
          display: grid;
          grid-template-columns: repeat(3, minmax(116px, 1fr));
          gap: 8px;
          flex: 0 1 430px;
        }
        .fc-lanes button {
          min-height: 58px;
          border: 1px solid var(--fc-border);
          border-radius: 16px;
          background: var(--fc-surface);
          color: var(--fc-text);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 900;
          cursor: pointer;
          transition: transform .16s ease, box-shadow .16s ease;
        }
        .fc-lanes button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(122, 18, 204, .12); }
        .fc-lanes button:disabled { opacity: .52; cursor: not-allowed; }
        .fc-lanes .tone-purple { background: color-mix(in srgb, var(--fc-purple) 58%, var(--fc-surface)); color: #3B0764; }
        .fc-lanes .tone-mint { background: color-mix(in srgb, var(--fc-mint) 48%, var(--fc-surface)); color: #14532D; }
        .fc-lanes .tone-peach { background: color-mix(in srgb, var(--fc-peach) 54%, var(--fc-surface)); color: #7C2D12; }
        .fc-canvas {
          height: calc(100% - 248px);
          overflow: auto;
          padding: 28px 28px 96px;
        }
        .fc-canvas.has-cards { padding-top: 16px; }
        .fc-empty-card {
          width: 288px;
          min-height: 380px;
          border-radius: 22px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 28px;
        }
        .fc-empty-icon, .fc-card-badge {
          width: 38px;
          height: 38px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #3159C9;
          background: color-mix(in srgb, #DBEAFE 70%, transparent);
        }
        .fc-mascot {
          width: 78px;
          height: 78px;
          object-fit: contain;
          filter: drop-shadow(0 14px 24px rgba(122,18,204,.18));
        }
        .fc-empty-card h3 { margin: 18px 0 4px; font-size: 21px; font-weight: 800; }
        .fc-empty-card p { margin: 0 0 18px; color: var(--fc-secondary); font-size: 14px; line-height: 1.45; }
        .fc-empty-actions, .fc-card-actions, .fc-study-card-right, .fc-study-actions, .fc-modal-actions, .fc-generating-foot {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .fc-generate-btn, .fc-pill-btn, .fc-bottom-btn, .fc-ok-small {
          min-height: 42px;
          border-radius: 13px;
          border: 1px solid var(--fc-border);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 18px;
          font-weight: 800;
          font-size: 15px;
          color: var(--fc-text);
          background: var(--fc-surface);
          cursor: pointer;
        }
        .fc-generate-btn {
          background: var(--fc-purple);
          color: #3B0764;
          border-color: color-mix(in srgb, var(--fc-purple-deep) 40%, var(--fc-purple));
        }
        .fc-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid var(--fc-border);
          background: var(--fc-surface);
          color: var(--fc-secondary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .fc-icon-btn.is-active { color: var(--fc-purple-deep); background: color-mix(in srgb, var(--fc-purple) 24%, var(--fc-surface)); }
        .fc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(256px, 1fr));
          gap: 20px;
          align-items: stretch;
        }
        .fc-preview-card {
          min-height: 384px;
          border-radius: 20px;
          padding: 16px;
          position: relative;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .fc-preview-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(122, 18, 204, 0.11); }
        .fc-card-top { display: flex; justify-content: space-between; align-items: flex-start; min-height: 42px; }
        .fc-card-actions { opacity: 0; transition: opacity 0.16s ease; }
        .fc-preview-card:hover .fc-card-actions { opacity: 1; }
        .fc-card-front, .fc-card-back, .fc-study-question, .fc-study-answer {
          margin: 0;
          color: var(--fc-text);
          text-align: center;
          line-height: 1.38;
        }
        .fc-card-front {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 600;
        }
        .fc-card-divider { width: 100%; height: 1px; background: var(--fc-border); margin: 16px 0; }
        .fc-card-back {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--fc-secondary);
          font-size: 16px;
          font-weight: 500;
        }
        .fc-card-index { position: absolute; right: 14px; bottom: 12px; color: var(--fc-muted); font-size: 11px; }
        .fc-bottom-bar {
          position: absolute;
          left: 50%;
          bottom: 22px;
          transform: translateX(-50%);
          border-radius: 18px;
          padding: 6px;
          display: flex;
          gap: 6px;
          align-items: center;
          z-index: 5;
        }
        .fc-zoom {
          min-height: 42px;
          border-radius: 14px;
          padding: 0 8px 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 6px;
        }
        .fc-zoom button {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 1px solid var(--fc-border);
          background: var(--fc-surface);
          color: var(--fc-text);
        }
        .fc-study-floating {
          position: absolute;
          top: 18px;
          right: 28px;
          min-height: 40px;
          border-radius: 13px;
          border: 1px solid color-mix(in srgb, var(--fc-purple-deep) 50%, var(--fc-purple));
          background: var(--fc-purple);
          color: #3B0764;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          cursor: pointer;
        }
        .fc-modal-backdrop {
          --fc-bg: var(--sb-bg, #F9FAFB);
          --fc-surface: var(--sb-surface, #fff);
          --fc-text: var(--sb-text, #111827);
          --fc-secondary: var(--sb-text-secondary, #6B7280);
          --fc-muted: var(--sb-text-muted, #9CA3AF);
          --fc-border: var(--sb-border, #E5E7EB);
          --fc-purple: var(--sb-purple, #C4B5FD);
          --fc-purple-deep: var(--sb-purple-deep, #7a12cc);
          --fc-mint: var(--sb-mint, #98FF98);
          --fc-peach: var(--sb-peach, #FFD2A6);
          position: fixed;
          inset: 0;
          z-index: 400;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(249, 250, 251, 0.62);
          backdrop-filter: blur(12px);
        }
        body.dark-mode .fc-modal-backdrop { background: rgba(17, 24, 39, 0.72); }
        .fc-modal {
          max-width: calc(100vw - 40px);
          max-height: calc(100vh - 40px);
          overflow: auto;
          border-radius: 24px;
          padding: 24px;
          position: relative;
        }
        .fc-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid var(--fc-border);
          background: var(--fc-surface);
          color: var(--fc-text);
          cursor: pointer;
        }
        .fc-settings-head, .fc-study-picker-head {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 18px;
          color: var(--fc-secondary);
          margin-bottom: 24px;
        }
        .fc-settings-head span, .fc-study-picker-head span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 15px;
          background: color-mix(in srgb, var(--fc-bg) 80%, var(--fc-surface));
          padding: 12px 16px;
        }
        .fc-settings-body {
          display: grid;
          grid-template-columns: minmax(360px, 1fr) 1fr;
          gap: 28px;
        }
        .fc-settings-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 24px;
        }
        .fc-setting-field { display: flex; flex-direction: column; gap: 8px; }
        .fc-setting-field span { color: var(--fc-secondary); font-size: 13px; font-weight: 800; }
        .fc-setting-field button { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-weight: 700; cursor: pointer; }
        .fc-setting-field.is-wide { grid-column: 1 / -1; }
        .fc-setting-field textarea { min-height: 72px; padding: 12px; resize: none; }
        .fc-settings-preview {
          border-radius: 20px;
          padding: 18px;
          background:
            radial-gradient(circle, rgba(17, 24, 39, 0.06) 1px, transparent 1px),
            color-mix(in srgb, var(--fc-bg) 70%, var(--fc-surface));
          background-size: 14px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }
        .fc-settings-preview > span { align-self: stretch; display: flex; gap: 6px; color: var(--fc-secondary); font-weight: 800; }
        .fc-preview-large {
          width: min(306px, 100%);
          min-height: 404px;
          border-radius: 20px;
          background: var(--fc-surface);
          border: 1px solid var(--fc-border);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 34px;
        }
        .fc-preview-large p { margin: 0; text-align: center; color: var(--fc-secondary); font-size: 17px; }
        .fc-modal-actions { margin-top: 24px; }
        .fc-modal-actions > * { flex: 1; }
        .fc-generating-head h3 { margin: 0 0 14px; font-size: 22px; }
        .fc-generating-head p { margin: 0 0 12px; color: var(--fc-secondary); line-height: 1.45; }
        .fc-generating-card {
          min-height: 632px;
          border: 1px solid var(--fc-border);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }
        .fc-generating-foot { margin-top: 24px; }
        .fc-loading-line { flex: 1; height: 8px; background: var(--fc-border); border-radius: 999px; overflow: hidden; }
        .fc-loading-line i { display: block; width: 42%; height: 100%; background: var(--fc-purple); animation: fc-loading 1.4s infinite ease-in-out; }
        @keyframes fc-loading { 0% { transform: translateX(-110%); } 100% { transform: translateX(260%); } }
        .fc-study-picker-filters { display: flex; gap: 10px; align-items: center; color: var(--fc-muted); font-weight: 800; margin-bottom: 18px; }
        .fc-study-picker-filters button { min-height: 36px; border-radius: 12px; border: 1px solid var(--fc-border); background: var(--fc-surface); color: var(--fc-secondary); padding: 0 12px; display: inline-flex; align-items: center; gap: 7px; font-weight: 800; }
        .fc-study-picker-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .fc-study-option {
          min-height: 202px;
          border-radius: 14px;
          border: 1px solid var(--fc-border);
          background: var(--fc-surface);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
        }
        .fc-study-option span { width: 48px; height: 48px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; }
        .fc-study-option strong { font-size: 21px; }
        .fc-study-option small { color: var(--fc-muted); font-size: 14px; }
        .fc-study-option.tone-purple span { color: #5B21B6; background: color-mix(in srgb, var(--fc-purple) 42%, transparent); }
        .fc-study-option.tone-blue span { color: #0369A1; background: #E0F2FE; }
        .fc-study-option.tone-mint span { color: #15803D; background: #DCFCE7; }
        .fc-study-option.tone-cyan span { color: #0F766E; background: #CCFBF1; }
        .fc-study-shell { min-height: 100%; }
        .fc-study-header {
          height: 112px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 18px;
          padding: 0 28px;
          background: var(--fc-surface);
          border-bottom: 1px solid var(--fc-border);
        }
        .fc-study-crumb, .fc-study-stats { display: flex; align-items: center; gap: 10px; color: var(--fc-secondary); }
        .fc-study-stats span { min-height: 38px; border-radius: 14px; padding: 0 14px; display: inline-flex; align-items: center; gap: 7px; background: color-mix(in srgb, var(--fc-bg) 72%, var(--fc-surface)); font-weight: 800; }
        .fc-study-actions { justify-content: end; }
        .fc-quit-btn {
          min-height: 42px;
          border-radius: 13px;
          border: 1px solid #EF4444;
          background: #FEE2E2;
          color: #991B1B;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          cursor: pointer;
        }
        .fc-study-progress { width: min(760px, 62vw); height: 8px; border-radius: 999px; background: color-mix(in srgb, var(--fc-border) 70%, transparent); margin: -24px auto 0; overflow: hidden; }
        .fc-study-progress span { display: block; height: 100%; background: var(--fc-purple); border-radius: inherit; transition: width 0.22s ease; }
        .fc-study-stage { height: calc(100% - 112px); min-height: 620px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: 40px 28px; }
        .fc-study-card {
          width: min(956px, 78vw);
          min-height: 560px;
          border-radius: 24px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
        }
        .fc-study-card-tools { display: flex; justify-content: space-between; align-items: flex-start; }
        .fc-study-question, .fc-study-answer { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 21px; font-weight: 500; padding: 18px; }
        .fc-study-response {
          width: min(1052px, 86vw);
          border-radius: 20px;
          padding: 10px;
          display: grid;
          grid-template-columns: 54px 1fr 1fr 54px;
          gap: 12px;
        }
        .fc-nav-btn { border: 0; background: transparent; color: var(--fc-muted); cursor: pointer; }
        .fc-hard-btn, .fc-ok-btn {
          min-height: 54px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
        }
        .fc-hard-btn { border: 1px solid #FB923C; background: #FFEDD5; color: #9A3412; }
        .fc-ok-btn { border: 1px solid #84CC16; background: #ECFCCB; color: #365314; }
        .fc-edit-head { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 20px; }
        .fc-ok-small { background: #DCFCE7; color: #166534; border-color: #BBF7D0; }
        .fc-edit-card {
          min-height: 500px;
          border: 1px solid var(--fc-border);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .fc-edit-card textarea {
          flex: 1;
          border: 0;
          background: var(--fc-surface);
          color: var(--fc-text);
          resize: none;
          outline: none;
          padding: 48px 24px;
          text-align: center;
          font: inherit;
          font-size: 20px;
        }
        .fc-editor-toolbar { border-top: 1px solid var(--fc-border); border-bottom: 1px solid var(--fc-border); padding: 8px 12px; display: flex; gap: 10px; }
        .fc-editor-toolbar button { border: 0; background: transparent; color: var(--fc-secondary); font-weight: 800; }
        @media (max-width: 920px) {
          .fc-top-row { grid-template-columns: 1fr; }
          .fc-engagement-strip { margin: 0 16px 12px; align-items: stretch; flex-direction: column; }
          .fc-engagement-copy { align-items: flex-start; }
          .fc-lanes { width: 100%; flex: none; grid-template-columns: 1fr; }
          .fc-canvas { height: calc(100% - 420px); padding-inline: 16px; }
          .fc-sort { width: 160px; }
          .fc-settings-body, .fc-settings-list, .fc-study-picker-grid { grid-template-columns: 1fr; }
          .fc-bottom-bar { left: 12px; right: 12px; transform: none; overflow-x: auto; }
          .fc-study-header { grid-template-columns: 1fr; height: auto; padding: 18px; }
          .fc-study-actions { justify-content: start; }
          .fc-study-card, .fc-study-response { width: 100%; }
        }
      `}</style>
    </>
  )
}
