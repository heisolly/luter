/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  House,
  CaretLeft,
  CaretRight,
  CaretDown,
  CaretUp,
  FileText,
  FileDoc,
  FilePdf,
  FilePpt,
  Sparkle,
  Cards,
  CardsThree,
  Checks,
  ShareNetwork,
  DotsThree,
  Lightning,
  NotePencil,
  PencilSimple,
  ArrowRight,
  BookmarkSimple,
  User as UserIcon,
  ChatCircleText as ChatCircleTextIcon,
  ThumbsUp,
  CopySimple,
  ArrowUpRight,
  Microphone,
  SpeakerHigh,
  PaperPlaneRight,
  CircleNotch,
  SidebarSimple,
  SquaresFour,
  Stack,
  ClipboardText,
  List,
  ChatsCircle as ChatsCircleIcon,
  Users,
  X,
  PaperPlaneTilt as PaperPlaneIcon,
  Clock,
  Crown,
  GridFour,
  PenNib,
  Layout,
  ChatCircle,
  ChatCircleText,
  EyeSlash,
  PencilLine,
  Highlighter,
  PaintBrush,
  Timer,
  ArrowsOut,
  SignOut,
  ArrowsLeftRight,
  Trash,
  Copy,
  DownloadSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  FloppyDisk,
  ArrowUp,
  Pen,
  TextT,
  Function as PhosphorFunction,
  Eraser,
  ArrowsIn,
  CaretLineUp,
  CaretLineDown,
  Minus,
  Square,
  Flag,
  Article,
  FileText as FileTextIcon,
  ListBullets,
  ArrowsClockwise,
  Shuffle,
  SlidersHorizontal,
  BookOpen,
  Printer,
  WarningCircle,
  Trophy,
  CheckSquare,
  Play,
  Export,
  ChartBar,
  Question,
  Plus,
  Coins,
  SpeakerSlash,
  Gear
} from '@phosphor-icons/react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../../supabaseClient'
import { callGroqAPI, GROQ_MODELS } from '../../groqClient'
import { checkAndDeductCredits, CREDIT_COSTS } from '../../services/creditService'
import canvasConfetti from 'canvas-confetti'
import LuterLogo from '../shared/LuterLogo'
import { FlashcardEngine as FlashcardEngineComponent } from './flashcards/FlashcardEngine'

export function WorkstationNotes(props) {
  return <WorkstationNotesRichEditor {...props} />
}

function WorkstationNotesLegacy({ content, material, onRegenerate }) {
  if (!content) return <EmptyState icon={BookOpen} label="Notes are being drafted..." />

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px', fontFamily: "var(--font-body)" }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '24px 32px', borderRadius: '24px', border: '1.5px solid #F1F5F9', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)' }}>
        <div>
          <div style={{ color: '#4B0082', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "var(--font-display)" }}>
             <BookOpen size={16} /> Structured study notes
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1A102D', margin: 0, fontFamily: "var(--font-display)", letterSpacing: '-0.02em' }}>{material?.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ActionButton onClick={() => window.print()} icon={Printer} label="Print" />
          <ActionButton icon={DownloadSimple} label="Export" />
          <ActionButton icon={ShareNetwork} label="Share" />
          <button
            onClick={onRegenerate}
            style={{ padding: '12px 24px', borderRadius: '14px', background: '#6D28D9', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px -5px rgba(109, 40, 217, 0.25)', fontFamily: 'var(--font-display)' }}
          >
            <ArrowsClockwise size={16} /> Regenerate
          </button>
        </div>
      </div>

      <div
        className="markdown-body"
        style={{
          background: 'white',
          padding: '60px',
          borderRadius: '40px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.08)',
          fontSize: '18px',
          lineHeight: 1.8,
          color: '#2D3748',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', top: 32, right: 40, opacity: 0.05 }}><LuterLogo size={120} /></div>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      <div style={{ marginTop: '40px', padding: '32px', background: '#FFFBEB', borderRadius: '32px', border: '1.5px solid #FEF3C7', display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WarningCircle weight="bold" size={28} color="#D97706" />
        </div>
        <div>
          <h4 style={{ color: '#92400E', fontWeight: 700, marginBottom: '4px', fontSize: '18px', fontFamily: "var(--font-display)" }}>Professor's Insight</h4>
          <p style={{ color: '#B45309', fontSize: '15px', margin: 0, fontWeight: 500 }}>These notes cover all major points from your lecture slides. Focus specifically on the "Core Mechanisms" section for the upcoming exam.</p>
        </div>
      </div>
    </motion.div>
  )
}

function escapeNoteHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderInlineNoteMarkdown(value = '') {
  let html = escapeNoteHtml(value)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')
  return html
}

function notesMarkdownToHtml(markdown = '') {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n')
  let html = ''
  let listType = null
  let paragraph = []

  const closeList = () => {
    if (!listType) return
    html += `</${listType}>`
    listType = null
  }

  const closeParagraph = () => {
    if (!paragraph.length) return
    html += `<p>${renderInlineNoteMarkdown(paragraph.join(' '))}</p>`
    paragraph = []
  }

  const openList = (type) => {
    if (listType === type) return
    closeList()
    html += `<${type}>`
    listType = type
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    const nextLine = (lines[index + 1] || '').trim()

    if (!line) {
      closeParagraph()
      closeList()
      continue
    }

    if (/^={3,}$/.test(line) || /^-{3,}$/.test(line)) continue

    if (/^={3,}$/.test(nextLine) || /^-{3,}$/.test(nextLine)) {
      closeParagraph()
      closeList()
      const tag = /^={3,}$/.test(nextLine) ? 'h2' : 'h3'
      html += `<${tag}>${renderInlineNoteMarkdown(line)}</${tag}>`
      index += 1
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      closeParagraph()
      closeList()
      const level = Math.min(heading[1].length + 1, 4)
      html += `<h${level}>${renderInlineNoteMarkdown(heading[2])}</h${level}>`
      continue
    }

    const bullet = line.match(/^[-*]\s+(.+)$/)
    if (bullet) {
      closeParagraph()
      openList('ul')
      html += `<li>${renderInlineNoteMarkdown(bullet[1])}</li>`
      continue
    }

    const numbered = line.match(/^\d+[.)]\s+(.+)$/)
    if (numbered) {
      closeParagraph()
      openList('ol')
      html += `<li>${renderInlineNoteMarkdown(numbered[1])}</li>`
      continue
    }

    closeList()
    paragraph.push(line)
  }

  closeParagraph()
  closeList()
  return html
}

function WorkstationNotesRichEditor({ content, material, onRegenerate, onCreateSummary, onListConcepts }) {
  const initialBody = typeof content === 'string' && content.trim() ? content : ''
  const editorRef = useRef(null)
  const [title, setTitle] = useState(material?.title ? `${material.title} notes` : 'Untitled')
  const [htmlSeed, setHtmlSeed] = useState(() => notesMarkdownToHtml(initialBody))

  useEffect(() => {
    setTitle(material?.title ? `${material.title} notes` : 'Untitled')
  }, [material?.id, material?.title])

  useEffect(() => {
    const nextHtml = notesMarkdownToHtml(typeof content === 'string' ? content : '')
    setHtmlSeed(nextHtml)
    if (editorRef.current && editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml
    }
  }, [content])

  const focusEditor = () => editorRef.current?.focus()

  const runEditorCommand = (command, value = null) => {
    focusEditor()
    document.execCommand(command, false, value)
  }

  const insertHtml = (html) => runEditorCommand('insertHTML', html)

  const addLink = () => {
    focusEditor()
    const url = window.prompt('Paste a link')
    if (url) runEditorCommand('createLink', url)
  }

  const insertTable = () => {
    insertHtml('<table><tbody><tr><th>Concept</th><th>Meaning</th></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>')
  }

  const insertEquation = () => {
    insertHtml('<span class="wn-equation">E = mc<sup>2</sup></span>')
  }

  const aiActions = [
    { label: 'Generate notes', icon: Sparkle, onClick: onRegenerate, tone: 'purple' },
    { label: 'Create summary', icon: Article, onClick: onCreateSummary, tone: 'peach' },
    { label: 'List concepts', icon: ListBullets, onClick: onListConcepts, tone: 'mint' },
  ]

  const toolbarGroups = [
    [
      { label: 'B', title: 'Bold', onClick: () => runEditorCommand('bold') },
      { label: 'I', title: 'Italic', onClick: () => runEditorCommand('italic') },
      { label: 'U', title: 'Underline', onClick: () => runEditorCommand('underline') },
      { label: 'S', title: 'Strikethrough', onClick: () => runEditorCommand('strikeThrough') },
    ],
    [
      { label: 'Bul', title: 'Bullet list', onClick: () => runEditorCommand('insertUnorderedList') },
      { label: '1.', title: 'Numbered list', onClick: () => runEditorCommand('insertOrderedList') },
    ],
    [
      { label: 'Left', title: 'Align left', onClick: () => runEditorCommand('justifyLeft') },
      { label: 'Center', title: 'Align center', onClick: () => runEditorCommand('justifyCenter') },
      { label: 'Right', title: 'Align right', onClick: () => runEditorCommand('justifyRight') },
    ],
    [
      { label: 'Sum', title: 'Formula', onClick: insertEquation },
      { label: 'Grid', title: 'Table', onClick: insertTable },
      { label: 'Link', title: 'Link', onClick: addLink },
    ],
    [
      { label: 'Undo', title: 'Undo', onClick: () => runEditorCommand('undo') },
      { label: 'Redo', title: 'Redo', onClick: () => runEditorCommand('redo') },
    ],
  ]

  return (
    <section className="wn-shell">
      <style>{`
        .wn-shell {
          --wn-bg: var(--sb-bg, #F9FAFB);
          --wn-surface: var(--sb-surface, #fff);
          --wn-text: var(--sb-text, #111827);
          --wn-secondary: var(--sb-text-secondary, #6B7280);
          --wn-muted: var(--sb-text-muted, #9CA3AF);
          --wn-border: var(--sb-border, #E5E7EB);
          --wn-purple: var(--sb-purple, #C4B5FD);
          --wn-mint: var(--sb-mint, #98FF98);
          --wn-peach: var(--sb-peach, #FFD2A6);
          min-height: 100%;
          width: 100%;
          padding: 24px 24px 40px;
          color: var(--wn-text);
          background: transparent;
          font-family: var(--font-display), DM Sans, Inter, sans-serif;
        }
        .wn-toolbar {
          width: fit-content;
          max-width: 100%;
          min-height: 58px;
          margin: 0 auto 44px;
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid var(--wn-border);
          background: color-mix(in srgb, var(--wn-surface) 94%, transparent);
          box-shadow: 0 14px 40px rgba(17,24,39,.07);
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
        }
        .wn-select, .wn-tool {
          height: 40px;
          border: 0;
          border-radius: 12px;
          background: transparent;
          color: var(--wn-text);
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .wn-select {
          padding: 0 12px;
          min-width: 78px;
          appearance: none;
        }
        .wn-select-small { min-width: 58px; }
        .wn-tool {
          min-width: 38px;
          padding: 0 10px;
          font-size: 14px;
        }
        .wn-tool:hover, .wn-select:hover { background: color-mix(in srgb, var(--wn-purple) 20%, transparent); }
        .wn-divider {
          width: 1px;
          height: 30px;
          background: var(--wn-border);
          margin: 0 3px;
          flex-shrink: 0;
        }
        .wn-editor {
          max-width: 760px;
          min-height: calc(100vh - 330px);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }
        .wn-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }
        .wn-title {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--wn-text);
          font-size: clamp(31px, 4vw, 42px);
          font-weight: 900;
          letter-spacing: 0;
        }
        .wn-alpha {
          min-height: 28px;
          border-radius: 999px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          background: color-mix(in srgb, var(--wn-peach) 36%, var(--wn-surface));
          color: #7C2D12;
          font-size: 12px;
          font-weight: 800;
        }
        .wn-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin: 8px 0 28px;
        }
        .wn-round, .wn-action {
          min-height: 44px;
          border-radius: 999px;
          border: 1px solid var(--wn-border);
          background: var(--wn-surface);
          color: var(--wn-text);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 900;
          cursor: pointer;
          transition: transform .16s ease, box-shadow .16s ease;
        }
        .wn-round { width: 44px; }
        .wn-action { padding: 0 16px; }
        .wn-action:hover, .wn-round:hover { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(122,18,204,.1); }
        .wn-action.tone-purple { background: color-mix(in srgb, var(--wn-purple) 52%, var(--wn-surface)); color: #3B0764; }
        .wn-action.tone-mint { background: color-mix(in srgb, var(--wn-mint) 42%, var(--wn-surface)); color: #14532D; }
        .wn-action.tone-peach { background: color-mix(in srgb, var(--wn-peach) 52%, var(--wn-surface)); color: #7C2D12; }
        .wn-body {
          flex: 1;
          width: 100%;
          min-height: 500px;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--wn-text);
          font: inherit;
          font-size: 17px;
          line-height: 1.75;
          font-weight: 500;
          cursor: text;
          padding-bottom: 110px;
        }
        .wn-body:empty::before {
          content: attr(data-placeholder);
          color: var(--wn-muted);
          font-weight: 500;
        }
        .wn-body h1, .wn-body h2, .wn-body h3, .wn-body h4 {
          color: var(--wn-text);
          margin: 28px 0 12px;
          line-height: 1.2;
          font-weight: 900;
        }
        .wn-body h2 { font-size: 26px; }
        .wn-body h3 { font-size: 22px; }
        .wn-body p { margin: 0 0 18px; }
        .wn-body ul, .wn-body ol {
          padding-left: 24px;
          margin: 0 0 20px;
        }
        .wn-body li { margin: 8px 0; }
        .wn-body strong { font-weight: 900; }
        .wn-body code, .wn-equation {
          border-radius: 8px;
          padding: 2px 7px;
          background: color-mix(in srgb, var(--wn-purple) 18%, var(--wn-surface));
          color: #4C1D95;
          font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
          font-weight: 700;
        }
        .wn-body a {
          color: #6D28D9;
          font-weight: 800;
          text-decoration: underline;
        }
        .wn-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 18px 0 22px;
          overflow: hidden;
          border-radius: 12px;
        }
        .wn-body th, .wn-body td {
          border: 1px solid var(--wn-border);
          padding: 10px 12px;
          text-align: left;
        }
        .wn-body th {
          background: color-mix(in srgb, var(--wn-mint) 24%, var(--wn-surface));
          font-weight: 900;
        }
        @media (max-width: 760px) {
          .wn-shell { padding-inline: 16px; }
          .wn-toolbar { margin-bottom: 28px; }
          .wn-title-row { align-items: flex-start; flex-direction: column; }
        }
      `}</style>

      <div className="wn-toolbar" aria-label="Notes formatting">
        <select className="wn-select" defaultValue="p" onChange={(event) => runEditorCommand('formatBlock', event.target.value)}>
          <option value="p">Text</option>
          <option value="h2">Heading</option>
          <option value="h3">Subhead</option>
          <option value="blockquote">Quote</option>
        </select>
        <select className="wn-select wn-select-small" defaultValue="3" onChange={(event) => runEditorCommand('fontSize', event.target.value)}>
          <option value="2">14</option>
          <option value="3">16</option>
          <option value="4">18</option>
          <option value="5">24</option>
        </select>
        {toolbarGroups.map((group, groupIndex) => (
          <React.Fragment key={`group-${groupIndex}`}>
            <span className="wn-divider" />
            {group.map((item) => (
              <button key={item.title} type="button" className="wn-tool" title={item.title} onMouseDown={(event) => event.preventDefault()} onClick={item.onClick}>
                {item.label}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="wn-editor">
        <div className="wn-title-row">
          <input className="wn-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled" />
          <span className="wn-alpha"><WarningCircle size={14} weight="bold" /> Alpha</span>
        </div>

        <div className="wn-actions">
          <button type="button" className="wn-round" title="Dictate note"><Microphone size={18} weight="bold" /></button>
          {aiActions.map((action) => {
            const ActionIcon = action.icon
            return (
              <button key={action.label} type="button" className={`wn-action tone-${action.tone}`} onClick={action.onClick}>
                <ActionIcon size={18} weight="bold" />
                {action.label}
              </button>
            )
          })}
        </div>

        <div
          ref={editorRef}
          className="wn-body"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Start writing notes..."
          dangerouslySetInnerHTML={{ __html: htmlSeed }}
        />
      </div>
    </section>
  )
}

function WorkstationNotesEditor({ content, material, onRegenerate, onCreateSummary, onListConcepts }) {
  const initialBody = typeof content === 'string' && content.trim()
    ? content
    : ''
  const [title, setTitle] = useState(material?.title ? `${material.title} notes` : 'Untitled')
  const [body, setBody] = useState(initialBody)

  useEffect(() => {
    setTitle(material?.title ? `${material.title} notes` : 'Untitled')
  }, [material?.id, material?.title])

  useEffect(() => {
    if (typeof content === 'string' && content.trim()) setBody(content)
  }, [content])

  const insertBlock = (text) => {
    setBody((value) => `${value}${value ? '\n\n' : ''}${text}`)
  }

  const aiActions = [
    { label: 'Generate notes', icon: Sparkle, onClick: onRegenerate, tone: 'purple' },
    { label: 'Create summary', icon: Article, onClick: onCreateSummary, tone: 'peach' },
    { label: 'List concepts', icon: ListBullets, onClick: onListConcepts, tone: 'mint' },
  ]

  const toolbar = [
    { label: 'B', title: 'Bold', onClick: () => insertBlock('**Important point:** ') },
    { label: 'I', title: 'Italic', onClick: () => insertBlock('_Add emphasis here_') },
    { label: 'U', title: 'Underline', onClick: () => insertBlock('<u>Underline this idea</u>') },
    { label: 'S', title: 'Strikethrough', onClick: () => insertBlock('~~Revise this~~') },
    { label: '•', title: 'Bullet list', onClick: () => insertBlock('- First point\n- Second point\n- Third point') },
    { label: '1.', title: 'Numbered list', onClick: () => insertBlock('1. First step\n2. Second step\n3. Third step') },
    { label: 'Σ', title: 'Formula', onClick: () => insertBlock('Formula: ') },
    { label: '▦', title: 'Table', onClick: () => insertBlock('| Concept | Meaning |\n| --- | --- |\n|  |  |') },
  ]

  return (
    <section className="wn-shell">
      <style>{`
        .wn-shell {
          --wn-bg: var(--sb-bg, #F9FAFB);
          --wn-surface: var(--sb-surface, #fff);
          --wn-text: var(--sb-text, #111827);
          --wn-secondary: var(--sb-text-secondary, #6B7280);
          --wn-muted: var(--sb-text-muted, #9CA3AF);
          --wn-border: var(--sb-border, #E5E7EB);
          --wn-purple: var(--sb-purple, #C4B5FD);
          --wn-mint: var(--sb-mint, #98FF98);
          --wn-peach: var(--sb-peach, #FFD2A6);
          --wn-purple-deep: var(--sb-purple-deep, #7a12cc);
          min-height: 100%;
          width: 100%;
          padding: 24px 24px 40px;
          color: var(--wn-text);
          background: transparent;
          font-family: var(--font-display), DM Sans, Inter, sans-serif;
        }
        .wn-toolbar {
          width: fit-content;
          max-width: 100%;
          min-height: 64px;
          margin: 0 auto 44px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid var(--wn-border);
          background: color-mix(in srgb, var(--wn-surface) 94%, transparent);
          box-shadow: 0 14px 40px rgba(17,24,39,.07);
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
        }
        .wn-style-select, .wn-tool {
          height: 42px;
          border: 0;
          border-radius: 13px;
          background: transparent;
          color: var(--wn-text);
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .wn-style-select { padding: 0 12px; gap: 6px; }
        .wn-tool { width: 42px; font-size: 22px; }
        .wn-tool:hover, .wn-style-select:hover { background: color-mix(in srgb, var(--wn-purple) 20%, transparent); }
        .wn-editor {
          max-width: 760px;
          min-height: calc(100vh - 330px);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }
        .wn-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }
        .wn-title {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--wn-text);
          font-size: clamp(31px, 4vw, 42px);
          font-weight: 900;
          letter-spacing: 0;
        }
        .wn-alpha {
          min-height: 28px;
          border-radius: 999px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          background: color-mix(in srgb, var(--wn-peach) 36%, var(--wn-surface));
          color: #7C2D12;
          font-size: 12px;
          font-weight: 800;
        }
        .wn-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin: 8px 0 28px;
        }
        .wn-round, .wn-action {
          min-height: 44px;
          border-radius: 999px;
          border: 1px solid var(--wn-border);
          background: var(--wn-surface);
          color: var(--wn-text);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 900;
          cursor: pointer;
          transition: transform .16s ease, box-shadow .16s ease;
        }
        .wn-round { width: 44px; }
        .wn-action { padding: 0 16px; }
        .wn-action:hover, .wn-round:hover { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(122,18,204,.1); }
        .wn-action.tone-purple { background: color-mix(in srgb, var(--wn-purple) 52%, var(--wn-surface)); color: #3B0764; }
        .wn-action.tone-mint { background: color-mix(in srgb, var(--wn-mint) 42%, var(--wn-surface)); color: #14532D; }
        .wn-action.tone-peach { background: color-mix(in srgb, var(--wn-peach) 52%, var(--wn-surface)); color: #7C2D12; }
        .wn-body {
          flex: 1;
          width: 100%;
          min-height: 460px;
          border: 0;
          outline: none;
          resize: none;
          background: transparent;
          color: var(--wn-text);
          font: inherit;
          font-size: 17px;
          line-height: 1.75;
          font-weight: 600;
        }
        .wn-body::placeholder { color: var(--wn-muted); }
        @media (max-width: 760px) {
          .wn-shell { padding-inline: 16px; }
          .wn-toolbar { margin-bottom: 28px; }
          .wn-title-row { align-items: flex-start; flex-direction: column; }
        }
      `}</style>

      <div className="wn-toolbar" aria-label="Notes formatting">
        <button type="button" className="wn-style-select">Text <CaretDown size={14} weight="bold" /></button>
        {toolbar.map((item) => (
          <button key={item.title} type="button" className="wn-tool" title={item.title} onClick={item.onClick}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="wn-editor">
        <div className="wn-title-row">
          <input className="wn-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled" />
          <span className="wn-alpha"><WarningCircle size={14} weight="bold" /> Alpha</span>
        </div>

        <div className="wn-actions">
          <button type="button" className="wn-round" title="Dictate note"><Microphone size={18} weight="bold" /></button>
          {aiActions.map((action) => {
            const ActionIcon = action.icon
            return (
              <button key={action.label} type="button" className={`wn-action tone-${action.tone}`} onClick={action.onClick}>
                <ActionIcon size={18} weight="bold" />
                {action.label}
              </button>
            )
          })}
        </div>

        <textarea
          className="wn-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Start writing notes..."
        />
      </div>
    </section>
  )
}

export function WorkstationSummary({ content, material }) {
  if (!content) return <EmptyState icon={Sparkle} label="Distilling key insights..." />

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px', fontFamily: "var(--font-body)" }}
    >
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', padding: '10px 20px', background: 'rgba(75, 0, 130, 0.08)', borderRadius: '100px', color: '#4B0082', fontWeight: 600, fontSize: '12px', marginBottom: '20px', border: '1px solid rgba(75, 0, 130, 0.1)', fontFamily: "var(--font-display)", letterSpacing: '0.03em' }}>
          ✨ Summary Brief
        </div>
        <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#1A102D', fontFamily: "var(--font-display)", letterSpacing: '-0.03em' }}>{material?.title}</h2>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #4B0082 0%, #4C1D95 100%)', padding: '2px', borderRadius: '40px', marginBottom: '48px', boxShadow: '0 30px 60px -12px rgba(75, 0, 130, 0.2)' }}>
        <div style={{ background: 'white', padding: '56px', borderRadius: '38px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.03 }}><LuterLogo size={180} /></div>
          <div className="markdown-body" style={{ fontSize: '19px', color: '#4A5568', lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <SummaryTile title="Est. Read Time" value="2 Minutes" icon={Clock} color="#4B0082" />
        <SummaryTile title="Complexity" value="Standard" icon={Layout} color="#F59E0B" />
      </div>
    </motion.div>
  )
}


export function WorkstationFlashcards({ flashcards = [], items = [], material, user, onRegenerate, isLoading = false }) {
  const getItems = () => {
    if (Array.isArray(flashcards) && flashcards.length > 0) return flashcards
    if (flashcards?.flashcards && Array.isArray(flashcards.flashcards)) return flashcards.flashcards
    if (flashcards?.items && Array.isArray(flashcards.items)) return flashcards.items
    if (Array.isArray(items) && items.length > 0) return items
    if (items?.flashcards && Array.isArray(items.flashcards)) return items.flashcards
    return []
  }
  const safeItems = getItems()

  return <FlashcardEngineComponent material={material} items={safeItems} user={user} onRegenerate={onRegenerate} isLoading={isLoading} />
}


export function WorkstationQuiz(props) {
  return <WorkstationQuizCustom {...props} />
}

function WorkstationQuizCustom({ quiz = [], items = [], material, onComplete, onRegenerate, isLoading = false }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState({})
  const [typeInAnswers, setTypeInAnswers] = useState({})
  const [isFinished, setIsFinished] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [userStats, setUserStats] = useState({ xp: 100, coins: 10 })
  const [followUpQuery, setFollowUpQuery] = useState('')
  const [followUpAnswer, setFollowUpAnswer] = useState(null)
  const [followUpLoading, setFollowUpLoading] = useState(false)

  // Fetch actual user stats from profiles table to make it live
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data, error } = await supabase
            .from('user_gamification')
            .select('xp, coins')
            .eq('user_id', session.user.id)
            .maybeSingle()
          if (data) {
            setUserStats({ xp: data.xp || 0, coins: data.coins || 0 })
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user stats:', err)
      }
    }
    fetchUserStats()
  }, [])

  const getQuestions = () => {
    if (Array.isArray(quiz) && quiz.length > 0) return quiz
    if (quiz?.questions && Array.isArray(quiz.questions)) return quiz.questions
    if (quiz?.items && Array.isArray(quiz.items)) return quiz.items
    if (Array.isArray(items) && items.length > 0) return items
    if (items?.questions && Array.isArray(items.questions)) return items.questions
    return []
  }

  const safeQuestions = getQuestions()
  const questionSignature = safeQuestions.map((q) => q?.id || q?.question || '').join('|')

  useEffect(() => {
    setIdx(0)
    setSelected({})
    setTypeInAnswers({})
    setIsFinished(false)
    setShowExplanation(false)
    setFollowUpAnswer(null)
    setFollowUpQuery('')
  }, [questionSignature, material?.id])

  if (safeQuestions.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <div style={{ width: '100px', height: '100px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Question weight="bold" size={48} color="#7C3AED" />
          </div>
        </div>
        <p style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>No quiz generated yet.</p>
        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>Generate a quiz to test your knowledge</p>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            style={{
              padding: '12px 24px', background: '#C4B5FD', color: '#4C1D95', border: 'none', borderRadius: '9999px',
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '14px',
              opacity: isLoading ? 0.65 : 1
            }}
          >
            <Sparkle size={16} /> {isLoading ? 'Generating...' : 'Generate Quiz'}
          </button>
        )}
      </div>
    )
  }

  const currentQuestion = safeQuestions[idx]
  const isAnswered = selected[idx] !== undefined || typeInAnswers[idx] !== undefined

  const getCorrectIndex = (q) => {
    if (!q) return -1
    const ans = q.correctAnswer ?? q.correct_answer ?? q.answer
    if (ans === undefined || ans === null) return -1
    if (typeof ans === 'number') return ans

    if (typeof ans === 'string') {
      const lower = ans.trim().toLowerCase()
      if (lower === 'a') return 0
      if (lower === 'b') return 1
      if (lower === 'c') return 2
      if (lower === 'd') return 3
      if (lower === 'true' || lower === 'yes') return 1
      if (lower === 'false' || lower === 'no') return 0
      const parsed = parseInt(lower, 10)
      if (!isNaN(parsed)) return parsed
      if (q.options) {
        const idx = q.options.findIndex(opt => {
          const text = (typeof opt === 'object' ? (opt.text || opt.choice || "") : opt).toString().toLowerCase()
          return text === lower
        })
        if (idx !== -1) return idx
      }
    }
    return -1
  }

  const correctIdx = getCorrectIndex(currentQuestion)

  const calculateScore = () => {
    return safeQuestions.reduce((acc, q, index) => {
      if (q.type === 'typein') {
        const userText = (typeInAnswers[index] || '').trim().toLowerCase()
        const expected = (q.expected_answer || q.answer || '').trim().toLowerCase()
        return acc + (userText && userText === expected ? 1 : 0)
      }
      const uAns = selected[index]
      const cIdx = getCorrectIndex(q)
      return acc + (uAns === cIdx ? 1 : 0)
    }, 0)
  }

  const handleSelect = (choiceIdx) => {
    if (isAnswered) return
    setSelected(prev => ({ ...prev, [idx]: choiceIdx }))
    if (soundOn) {
      try {
        const isCorrect = choiceIdx === correctIdx
        const audio = new Audio(isCorrect ? '/sounds/correct.mp3' : '/sounds/incorrect.mp3')
        audio.volume = 0.4
        audio.play().catch(() => {})
      } catch (e) {}
    }
  }

  const handleNext = () => {
    if (idx < safeQuestions.length - 1) {
      setIdx(idx + 1)
      setShowExplanation(false)
      setFollowUpAnswer(null)
      setFollowUpQuery('')
    } else {
      setIsFinished(true)
      onComplete?.({ score: calculateScore(), total: safeQuestions.length })
    }
  }

  const handleExplainToggle = () => {
    if (!isAnswered) return
    if (!showExplanation) {
      setShowExplanation(true)
    } else {
      setFollowUpAnswer(null)
      setFollowUpQuery('')
    }
  }

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault()
    if (!followUpQuery.trim() || followUpLoading) return
    setFollowUpLoading(true)
    const query = followUpQuery
    setFollowUpQuery('')

    try {
      const messages = [
        {
          role: 'system',
          content: `You are explaining a quiz question to a student.
Question: "${currentQuestion.question}"
Options: ${currentQuestion.options?.map((opt, i) => `${String.fromCharCode(65 + i)}: ${typeof opt === 'object' ? opt.text || opt.choice : opt}`).join(', ')}
Correct Answer: Option ${String.fromCharCode(65 + correctIdx)}
Explanation: "${currentQuestion.explanation || ''}"`
        },
        {
          role: 'user',
          content: query
        }
      ]

      const response = await callGroqAPI(messages, GROQ_MODELS.PROFESSOR)
      const reply = response.choices?.[0]?.message?.content || 'Sorry, I could not generate an answer.'
      setFollowUpAnswer(reply)
    } catch (err) {
      console.error('Follow-up error:', err)
      setFollowUpAnswer('Failed to get answer from AI. Please try again.')
    } finally {
      setFollowUpLoading(false)
    }
  }

  const getAnswerState = (index) => {
    if (safeQuestions[index]?.type === 'typein') {
      const userText = (typeInAnswers[index] || '').trim().toLowerCase()
      if (!userText) return 'unanswered'
      const expected = (safeQuestions[index].expected_answer || safeQuestions[index].answer || '').trim().toLowerCase()
      return userText === expected ? 'correct' : 'incorrect'
    }
    const userSelection = selected[index]
    if (userSelection === undefined) return 'unanswered'
    const correctSelection = getCorrectIndex(safeQuestions[index])
    return userSelection === correctSelection ? 'correct' : 'incorrect'
  }

  const optionText = (option) => {
    if (typeof option === 'object') return option.text || option.choice || JSON.stringify(option)
    return option
  }

  const score = calculateScore()
  const accuracy = safeQuestions.length ? Math.round((score / safeQuestions.length) * 100) : 0

  const resetQuiz = () => {
    setIdx(0)
    setSelected({})
    setTypeInAnswers({})
    setIsFinished(false)
    setShowExplanation(false)
    setFollowUpAnswer(null)
    setFollowUpQuery('')
  }

  if (isFinished) {
    return (
      <div className="custom-quiz-shell">
        <style>{`
          .custom-quiz-shell {
            --cq-bg: #F8FAFC;
            --cq-text: #0F172A;
            --cq-border: #E2E8F0;
            --cq-surface: #FFFFFF;
            --cq-purple: #C4B5FD;
            --cq-mint: #98FF98;
            --cq-peach: #FFD2A6;
            
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            min-height: 100%;
            background: var(--cq-bg);
            color: var(--cq-text);
            padding: 0 0 60px 0;
            box-sizing: border-box;
            font-family: Outfit, sans-serif;
          }
          body.dark-mode .custom-quiz-shell {
            --cq-bg: #0B0F19;
            --cq-text: #F8FAFC;
            --cq-border: #1E293B;
            --cq-surface: #131C2E;
          }
          .cq-header {
            width: 100%;
            height: 64px;
            background: var(--cq-surface);
            border-bottom: 1px solid var(--cq-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            box-sizing: border-box;
            margin-bottom: 32px;
          }
          .cq-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .cq-header-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--cq-text);
            max-width: 250px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .cq-header-middle {
            flex: 1;
            max-width: 400px;
            margin: 0 20px;
          }
          .cq-progress-bar {
            display: flex;
            gap: 6px;
            width: 100%;
          }
          .cq-progress-segment {
            height: 6px;
            border-radius: 99px;
            flex: 1;
            background: var(--cq-border);
            transition: all 0.2s ease;
          }
          .cq-progress-segment.active {
            background: #F87171;
          }
          .cq-progress-segment.correct {
            background: #22C55E;
          }
          .cq-progress-segment.incorrect {
            background: #EF4444;
          }
          .cq-header-right {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .cq-header-stat {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 800;
            color: #D97706;
          }
          .cq-header-btn {
            background: transparent;
            border: none;
            color: var(--cq-text);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px;
            border-radius: 8px;
            transition: background 0.15s;
          }
          .cq-header-btn:hover {
            background: var(--cq-border);
          }
          .cq-leave-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 10px;
            border: 1px solid var(--cq-border);
            background: var(--cq-surface);
            color: var(--cq-text);
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s;
            font-family: inherit;
          }
          .cq-leave-btn:hover {
            background: var(--cq-border);
          }
          .cq-card {
            width: 100%;
            max-width: 800px;
            background: var(--cq-surface);
            border: 1px solid var(--cq-border);
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
            box-sizing: border-box;
            margin-bottom: 24px;
            text-align: center;
          }
        `}</style>

        <div className="cq-header">
          <div className="cq-header-left">
            <FileDoc size={20} weight="fill" color="#9CA3AF" />
            <span className="cq-header-title">{material?.name || 'Quiz Session'}</span>
          </div>
          <div className="cq-header-middle">
            <div className="cq-progress-bar">
              {safeQuestions.map((_, i) => (
                <div key={i} className="cq-progress-segment correct" />
              ))}
            </div>
          </div>
          <div className="cq-header-right">
            <div className="cq-header-stat">
              <Sparkle size={16} weight="fill" color="#EAB308" />
              <span>+{userStats.xp} XP</span>
            </div>
            <div className="cq-header-stat">
              <Coins size={16} weight="fill" color="#EAB308" />
              <span>{userStats.coins} Coins</span>
            </div>
            <button type="button" className="cq-header-btn" onClick={() => setSoundOn(!soundOn)}>
              {soundOn ? <SpeakerHigh size={18} /> : <SpeakerSlash size={18} />}
            </button>
            <button type="button" className="cq-header-btn">
              <Gear size={18} />
            </button>
            <button type="button" className="cq-leave-btn" onClick={() => onComplete?.({ score, total: safeQuestions.length })}>
              <SignOut size={16} weight="bold" />
              <span>Leave Quiz</span>
            </button>
          </div>
        </div>

        <div className="cq-card">
          <img src="/mascot.png" alt="Mascot" style={{ width: 86, height: 86, marginBottom: 16 }} />
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
            {accuracy >= 70 ? 'Solid run!' : 'Good attempt!'}
          </h2>
          <p style={{ color: 'var(--cq-text-secondary)', fontWeight: 600, margin: '0 0 24px' }}>
            You got {score} of {safeQuestions.length} questions correct.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <div style={{ padding: 16, background: 'var(--cq-bg)', borderRadius: 14, border: '1px solid var(--cq-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cq-text-muted)', textTransform: 'uppercase' }}>Accuracy</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{accuracy}%</div>
            </div>
            <div style={{ padding: 16, background: 'var(--cq-bg)', borderRadius: 14, border: '1px solid var(--cq-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cq-text-muted)', textTransform: 'uppercase' }}>Correct</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{score}</div>
            </div>
            <div style={{ padding: 16, background: 'var(--cq-bg)', borderRadius: 14, border: '1px solid var(--cq-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cq-text-muted)', textTransform: 'uppercase' }}>Review</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{safeQuestions.length - score}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
            <div style={{ padding: '8px 16px', background: '#F5F3FF', border: '1.5px solid #C4B5FD', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#7a12cc', fontSize: 14 }}>
              ⚡ +{score * 10 + 20} XP
            </div>
            <div style={{ padding: '8px 16px', background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#D97706', fontSize: 14 }}>
              🪙 +{score * 2 + 5} Coins
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button type="button" className="cq-leave-btn" onClick={resetQuiz} style={{ background: 'var(--cq-purple)', border: 'none', color: '#4C1D95' }}>
              Retry
            </button>
            <button type="button" className="cq-leave-btn" onClick={() => onComplete?.({ score, total: safeQuestions.length })}>
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="custom-quiz-shell">
      <style>{`
        .custom-quiz-shell {
          --cq-bg: #F8FAFC;
          --cq-text: #0F172A;
          --cq-border: #E2E8F0;
          --cq-surface: #FFFFFF;
          --cq-purple: #C4B5FD;
          --cq-mint: #98FF98;
          --cq-peach: #FFD2A6;
          
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          min-height: 100%;
          background: var(--cq-bg);
          color: var(--cq-text);
          padding: 0 0 60px 0;
          box-sizing: border-box;
          font-family: Outfit, sans-serif;
        }
        body.dark-mode .custom-quiz-shell {
          --cq-bg: #0B0F19;
          --cq-text: #F8FAFC;
          --cq-border: #1E293B;
          --cq-surface: #131C2E;
        }
        .cq-header {
          width: 100%;
          height: 64px;
          background: var(--cq-surface);
          border-bottom: 1px solid var(--cq-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          box-sizing: border-box;
          margin-bottom: 32px;
        }
        .cq-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cq-header-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--cq-text);
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cq-header-middle {
          flex: 1;
          max-width: 400px;
          margin: 0 20px;
        }
        .cq-progress-bar {
          display: flex;
          gap: 6px;
          width: 100%;
        }
        .cq-progress-segment {
          height: 6px;
          border-radius: 99px;
          flex: 1;
          background: var(--cq-border);
          transition: all 0.2s ease;
        }
        .cq-progress-segment.active {
          background: #F87171;
        }
        .cq-progress-segment.correct {
          background: #22C55E;
        }
        .cq-progress-segment.incorrect {
          background: #EF4444;
        }
        .cq-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cq-header-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 800;
          color: #D97706;
        }
        .cq-header-btn {
          background: transparent;
          border: none;
          color: var(--cq-text);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .cq-header-btn:hover {
          background: var(--cq-border);
        }
        .cq-leave-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid var(--cq-border);
          background: var(--cq-surface);
          color: var(--cq-text);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .cq-leave-btn:hover {
          background: var(--cq-border);
        }
        .cq-card {
          width: 100%;
          max-width: 800px;
          background: var(--cq-surface);
          border: 1px solid var(--cq-border);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
          box-sizing: border-box;
          margin-bottom: 24px;
        }
        .cq-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .cq-live-sync {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          color: #EF4444;
        }
        .cq-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #EF4444;
          animation: cq-pulse-dot 2s infinite;
        }
        @keyframes cq-pulse-dot {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .cq-question-number {
          font-size: 14px;
          font-weight: 800;
          color: var(--cq-text);
        }
        .cq-question-box {
          width: 100%;
          background: #F4FBE7;
          border: 1.5px solid #D8F3B8;
          border-radius: 16px;
          padding: 24px;
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          color: #1A3008;
          margin-bottom: 24px;
          box-sizing: border-box;
        }
        body.dark-mode .cq-question-box {
          background: #1B2918;
          border-color: #2F4D27;
          color: #D8F3B8;
        }
        .cq-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 24px;
        }
        @media (max-width: 600px) {
          .cq-options-grid {
            grid-template-columns: 1fr;
          }
        }
        .cq-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 16px;
          border-radius: 14px;
          border: 1.5px solid var(--cq-border);
          background: var(--cq-surface);
          color: var(--cq-text);
          font-size: 14px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .cq-option:hover:not(:disabled) {
          border-color: var(--cq-purple);
          background: var(--cq-bg);
        }
        .cq-option-letter {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--cq-border);
          color: var(--cq-text);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          flex-shrink: 0;
        }
        .cq-option.selected {
          border-color: #FFA500;
          background: #FFD2A6;
          color: #7C2D12;
        }
        .cq-option.selected .cq-option-letter {
          background: #FFA500;
          color: white;
        }
        .cq-option.correct {
          border-color: #4ADE80;
          background: #DCFCE7;
          color: #14532D;
        }
        .cq-option.correct .cq-option-letter {
          background: #22C55E;
          color: white;
        }
        .cq-option.wrong {
          border-color: #F87171;
          background: #FEE2E2;
          color: #7F1D1D;
        }
        .cq-option.wrong .cq-option-letter {
          background: #EF4444;
          color: white;
        }
        .cq-explanation-box {
          background: var(--cq-bg);
          border-radius: 16px;
          padding: 20px;
          margin-top: 24px;
          text-align: left;
          position: relative;
        }
        .cq-explanation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .cq-explanation-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 800;
          color: #7C3AED;
        }
        .cq-explain-avatar {
          font-size: 18px;
        }
        .cq-explanation-close {
          background: transparent;
          border: none;
          color: var(--cq-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
        }
        .cq-explanation-close:hover {
          background: var(--cq-border);
        }
        .cq-explanation-body {
          font-size: 14px;
          line-height: 1.55;
          color: var(--cq-text);
          margin-bottom: 16px;
          font-weight: 500;
        }
        .cq-followup-form {
          display: flex;
          align-items: center;
          background: var(--cq-surface);
          border: 1px solid var(--cq-border);
          border-radius: 99px;
          padding: 4px 6px 4px 16px;
          box-sizing: border-box;
          position: relative;
        }
        .cq-followup-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 13px;
          color: var(--cq-text);
          font-family: inherit;
        }
        .cq-followup-send {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #7C3AED;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .cq-followup-send:hover:not(:disabled) {
          background: #6D28D9;
        }
        .cq-followup-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cq-typing-indicator {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }
        .cq-typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--cq-text-muted);
          animation: cq-bounce 1.4s infinite ease-in-out both;
        }
        .cq-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .cq-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes cq-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
        .cq-footer {
          display: flex;
          gap: 12px;
          width: 100%;
          max-width: 800px;
        }
        .cq-footer-btn {
          flex: 1;
          height: 48px;
          border-radius: 16px;
          border: 1px solid var(--cq-border);
          background: var(--cq-surface);
          color: var(--cq-text);
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .cq-footer-btn:hover:not(:disabled) {
          background: var(--cq-border);
        }
        .cq-footer-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cq-btn-badge {
          background: var(--cq-bg);
          border: 1px solid var(--cq-border);
          color: var(--cq-text-secondary);
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 11px;
          font-family: monospace;
        }
      `}</style>

      <div className="cq-header">
        <div className="cq-header-left">
          <FileDoc size={20} weight="fill" color="#9CA3AF" />
          <span className="cq-header-title">{material?.name || 'Quiz Session'}</span>
        </div>
        <div className="cq-header-middle">
          <div className="cq-progress-bar">
            {safeQuestions.map((_, i) => (
              <div
                key={i}
                className={`cq-progress-segment ${i === idx ? 'active' : ''} ${getAnswerState(i) === 'correct' ? 'correct' : ''} ${getAnswerState(i) === 'incorrect' ? 'incorrect' : ''}`}
              />
            ))}
          </div>
        </div>
        <div className="cq-header-right">
          <div className="cq-header-stat">
            <Sparkle size={16} weight="fill" color="#EAB308" />
            <span>+{userStats.xp} XP</span>
          </div>
          <div className="cq-header-stat">
            <Coins size={16} weight="fill" color="#EAB308" />
            <span>{userStats.coins} Coins</span>
          </div>
          <button type="button" className="cq-header-btn" onClick={() => setSoundOn(!soundOn)}>
            {soundOn ? <SpeakerHigh size={18} /> : <SpeakerSlash size={18} />}
          </button>
          <button type="button" className="cq-header-btn">
            <Gear size={18} />
          </button>
          <button type="button" className="cq-leave-btn" onClick={() => onComplete?.({ score: calculateScore(), total: safeQuestions.length })}>
            <SignOut size={16} weight="bold" />
            <span>Leave Quiz</span>
          </button>
        </div>
      </div>

      <div className="cq-card">
        <div className="cq-card-header">
          <div className="cq-live-sync">
            <span className="cq-live-dot" />
            <span>LIVE SYNC</span>
          </div>
          <div className="cq-question-number">
            Question {idx + 1}/{safeQuestions.length}
          </div>
        </div>

        <div className="cq-question-box">
          {currentQuestion?.question || 'Untitled Question'}
        </div>

        {currentQuestion?.type === 'typein' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              className="cq-followup-input"
              value={typeInAnswers[idx] || ''}
              placeholder="Type your answer here..."
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '1.5px solid var(--cq-border)',
                background: 'var(--cq-bg)',
                color: 'var(--cq-text)',
                fontSize: '15px'
              }}
              onChange={(e) => setTypeInAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
              disabled={isAnswered}
            />
            {!isAnswered && (
              <button
                type="button"
                className="cq-footer-btn"
                style={{ background: 'var(--cq-purple)', color: '#4C1D95', border: 'none' }}
                onClick={() => {
                  if (typeInAnswers[idx]?.trim()) {
                    setTypeInAnswers(prev => ({ ...prev, [idx]: typeInAnswers[idx] }))
                    setShowExplanation(true)
                  }
                }}
                disabled={!typeInAnswers[idx]?.trim()}
              >
                Submit
              </button>
            )}
          </div>
        ) : (
          <div className="cq-options-grid">
            {(currentQuestion?.options || []).slice(0, 4).map((option, optionIdx) => {
              const isSelected = selected[idx] === optionIdx
              const isCorrect = isAnswered && optionIdx === correctIdx
              const isWrong = isAnswered && isSelected && optionIdx !== correctIdx

              let optionClass = ''
              if (isCorrect) optionClass = 'correct'
              else if (isWrong) optionClass = 'wrong'
              else if (isSelected) optionClass = 'selected'

              return (
                <button
                  key={optionIdx}
                  type="button"
                  className={`cq-option ${optionClass}`}
                  onClick={() => handleSelect(optionIdx)}
                  disabled={isAnswered}
                >
                  <div className="cq-option-letter">{String.fromCharCode(65 + optionIdx)}</div>
                  <div className="cq-option-text">{optionText(option)}</div>
                </button>
              )
            })}
          </div>
        )}

        {showExplanation && (
          <div className="cq-explanation-box">
            <div className="cq-explanation-header">
              <div className="cq-explanation-title">
                <div className="cq-explain-avatar">🔮</div>
                <span>Explain</span>
              </div>
              <button type="button" className="cq-explanation-close" onClick={() => setShowExplanation(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="cq-explanation-body">
              {followUpAnswer || currentQuestion?.explanation || (correctIdx >= 0 ? `Correct answer: Option ${String.fromCharCode(65 + correctIdx)}.` : 'No explanation available.')}
              {followUpLoading && (
                <div className="cq-typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>
            <form className="cq-followup-form" onSubmit={handleFollowUpSubmit}>
              <input
                type="text"
                className="cq-followup-input"
                placeholder="Ask for a follow up"
                value={followUpQuery}
                onChange={(e) => setFollowUpQuery(e.target.value)}
                disabled={followUpLoading}
              />
              <button type="submit" className="cq-followup-send" disabled={!followUpQuery.trim() || followUpLoading}>
                <PaperPlaneRight size={16} weight="fill" />
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="cq-footer">
        <button
          type="button"
          className="cq-footer-btn"
          onClick={handleExplainToggle}
          disabled={!isAnswered}
        >
          <div className="cq-btn-badge">E</div>
          <span>{showExplanation ? 'Explain Again' : 'Explain'}</span>
        </button>
        <button
          type="button"
          className="cq-footer-btn"
          style={{ background: isAnswered ? 'var(--cq-purple)' : 'var(--cq-surface)', color: isAnswered ? '#4C1D95' : 'var(--cq-text-secondary)', border: isAnswered ? 'none' : '1px solid var(--cq-border)' }}
          onClick={handleNext}
          disabled={!isAnswered}
        >
          <div className="cq-btn-badge">↵</div>
          <span>{idx === safeQuestions.length - 1 ? 'Finish' : 'Next'}</span>
        </button>
      </div>
    </div>
  )
}

function WorkstationQuizLegacy({ quiz = [], items = [], material, onComplete, onRegenerate, isLoading = false }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState({})
  const [typeInAnswers, setTypeInAnswers] = useState({})
  const [isFinished, setIsFinished] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [explainMode, setExplainMode] = useState(false)

  const getQuestions = () => {
    if (Array.isArray(quiz) && quiz.length > 0) return quiz
    if (quiz?.questions && Array.isArray(quiz.questions)) return quiz.questions
    if (quiz?.items && Array.isArray(quiz.items)) return quiz.items
    if (Array.isArray(items) && items.length > 0) return items
    if (items?.questions && Array.isArray(items.questions)) return items.questions
    return []
  }
  const safeQuestions = getQuestions()
  const questionSignature = safeQuestions.map((question) => question?.id || question?.question || '').join('|')

  useEffect(() => {
    setIdx(0)
    setSelected({})
    setTypeInAnswers({})
    setIsFinished(false)
    setShowExplanation(false)
    setExplainMode(false)
  }, [questionSignature, material?.id])

  if (safeQuestions.length === 0) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: '24px' }}>
      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <div style={{ width: '100px', height: '100px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Question weight="bold" size={48} color="#7C3AED" />
        </div>
      </div>
      <p style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>No quiz generated yet.</p>
      <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>Generate a quiz to test your knowledge</p>
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          style={{
            padding: '12px 24px', background: '#C4B5FD', color: '#4C1D95', border: 'none', borderRadius: '9999px',
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '14px',
            opacity: isLoading ? 0.65 : 1
          }}
        >
          <Sparkle size={16} /> {isLoading ? 'Generating...' : 'Generate Quiz'}
        </button>
      )}
    </div>
  )

  const q = safeQuestions[idx]
  const isAnswered = selected[idx] !== undefined || typeInAnswers[idx] !== undefined

  const getCorrectIndex = (question) => {
    const ans = question.correctAnswer ?? question.correct_answer ?? question.answer
    if (ans === undefined || ans === null) return -1

    if (typeof ans === 'number') return ans

    if (typeof ans === 'string') {
      const lower = ans.trim().toLowerCase()
      if (lower === 'a') return 0
      if (lower === 'b') return 1
      if (lower === 'c') return 2
      if (lower === 'd') return 3
      if (lower === 'true' || lower === 'yes') return 1
      if (lower === 'false' || lower === 'no') return 0
      const parsed = parseInt(lower)
      if (!isNaN(parsed)) return parsed
      if (question.options) {
        const idx = question.options.findIndex(opt => {
          const text = (typeof opt === 'object' ? (opt.text || opt.choice || "") : opt).toString().toLowerCase()
          return text === lower
        })
        if (idx !== -1) return idx
      }
    }
    return ans
  }

  const calculateScore = () => {
    return safeQuestions.reduce((acc, question, index) => {
      const userAns = selected[index]
      if (question.type === 'typein') {
        const userText = (typeInAnswers[index] || '').trim().toLowerCase()
        const expected = (question.expected_answer || question.answer || '').trim().toLowerCase()
        return acc + (userText && userText === expected ? 1 : 0)
      }
      const correctIdx = getCorrectIndex(question)
      return acc + (userAns == correctIdx ? 1 : 0)
    }, 0)
  }

  const handleSelect = (choiceIdx) => {
    if (isAnswered) return
    setSelected(prev => ({ ...prev, [idx]: choiceIdx }))
  }

  const handleSubmit = () => {
    setShowExplanation(true)
  }

  const handleNext = () => {
    if (idx < safeQuestions.length - 1) {
      setIdx(idx + 1)
      setShowExplanation(false)
      setExplainMode(false)
    } else {
      setIsFinished(true)
    }
  }

  const handleExplain = () => {
    setExplainMode(!explainMode)
  }

  // Track answer states for progress bar
  const getAnswerState = (index) => {
    if (!selected[index] && !typeInAnswers[index]) return 'upcoming'
    const correctIdx = getCorrectIndex(safeQuestions[index])
    if (selected[index] === correctIdx) return 'correct'
    return 'incorrect'
  }

  if (isFinished) {
    const score = calculateScore()
    const accuracy = Math.round((score / safeQuestions.length) * 100)
    const correctCount = score
    const incorrectCount = safeQuestions.length - score

    let title, subtitle
    if (accuracy >= 80) {
      title = '🎉 Excellent!'
      subtitle = 'Outstanding performance!'
    } else if (accuracy >= 60) {
      title = 'Good Job!'
      subtitle = 'You\'re making great progress!'
    } else if (accuracy >= 40) {
      title = 'Keep Going!'
      subtitle = 'You\'re on the right track!'
    } else {
      title = 'Don\'t Give Up!'
      subtitle = 'Revisit the material and try again!'
    }

    let gradeLetter, gradeColor
    if (accuracy >= 90) { gradeLetter = 'A'; gradeColor = '#059669' }
    else if (accuracy >= 80) { gradeLetter = 'B'; gradeColor = '#059669' }
    else if (accuracy >= 70) { gradeLetter = 'C'; gradeColor = '#D97706' }
    else if (accuracy >= 60) { gradeLetter = 'D'; gradeColor = '#EF4444' }
    else { gradeLetter = 'F'; gradeColor = '#EF4444' }

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '24px' }}>
        {/* Mascot */}
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '2px solid #E5E7EB' }}>
          <Trophy weight="bold" size={32} color="#7C3AED" />
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '4px', margin: 0 }}>{title}</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px', margin: '0 0 20px 0' }}>{subtitle}</p>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', marginBottom: '20px' }}>
          {/* Grade Card */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <CheckSquare size={14} color="#374151" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>GRADE</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: gradeColor }}>{gradeLetter}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{accuracy}% Correct</div>
          </div>

          {/* Best Streak Card */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Lightning size={14} color="#374151" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>BEST STREAK</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827' }}>{Math.max(1, correctCount)}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>in a row</div>
          </div>

          {/* Breakdown Card */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', width: '100%' }}>
              <GridFour size={14} color="#374151" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>BREAKDOWN</span>
            </div>
            {/* Donut Chart */}
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#E5E7EB" strokeWidth="8" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#4ADE80" strokeWidth="8" 
                strokeDasharray={`${(correctCount / safeQuestions.length) * 175.93} 175.93`} 
                transform="rotate(-90 32 32)" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#F87171" strokeWidth="8" 
                strokeDasharray={`${(incorrectCount / safeQuestions.length) * 175.93} 175.93`} 
                strokeDashoffset={`-${(correctCount / safeQuestions.length) * 175.93}`}
                transform="rotate(-90 32 32)" />
            </svg>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80' }} />
                  <span style={{ fontSize: '11px', color: '#374151' }}>Correct</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{correctCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F87171' }} />
                  <span style={{ fontSize: '11px', color: '#374151' }}>Incorrect</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{incorrectCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setIdx(0); setIsFinished(false); setSelected({}); setTypeInAnswers({}); setShowExplanation(false); setExplainMode(false); }}
            style={{ flex: 1, minWidth: '80px', height: '40px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <CaretLeft size={14} /> Back
          </button>
          <button
            style={{ flex: 1, minWidth: '100px', height: '40px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <ChartBar size={14} /> View Results
          </button>
          <button
            onClick={() => { setIdx(0); setIsFinished(false); setSelected({}); setTypeInAnswers({}); setShowExplanation(false); setExplainMode(false); }}
            style={{ flex: 1, minWidth: '100px', height: '40px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Play size={14} /> Do New Quiz
          </button>
          <button
            onClick={onRegenerate}
            disabled={!onRegenerate || isLoading}
            style={{ flex: 1, minWidth: '110px', height: '40px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: (!onRegenerate || isLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: isLoading ? 0.65 : 1 }}
          >
            <ArrowsClockwise size={14} /> {isLoading ? 'Generating' : 'Regenerate'}
          </button>
          <button
            style={{ flex: 1, minWidth: '100px', height: '40px', background: '#C4B5FD', border: 'none', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, color: '#4C1D95', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Export size={14} /> Share Quiz
          </button>
        </div>
      </div>
    )
  }

  const correctIdx = getCorrectIndex(q)
  const isUserSelected = selected[idx] !== undefined
  const isCorrect = isAnswered && selected[idx] === correctIdx

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F9FAFB', padding: 0 }}>
      {/* HEADER BAR */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '4px', flex: 1, marginRight: '16px' }}>
          {safeQuestions.map((_, i) => (
            <div
              key={i}
              style={{
                height: '4px',
                borderRadius: '9999px',
                flex: 1,
                background: getAnswerState(i) === 'correct' ? '#4ADE80' : getAnswerState(i) === 'incorrect' ? '#F87171' : i === idx ? '#E5E7EB' : '#E5E7EB'
              }}
            />
          ))}
        </div>
        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{idx + 1} / {safeQuestions.length}</span>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              title="Regenerate quiz"
              style={{ width: '28px', height: '28px', borderRadius: '9999px', background: 'transparent', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isLoading ? 0.55 : 1 }}
            >
              <ArrowsClockwise size={14} color="#9CA3AF" />
            </button>
          )}
          <button style={{ width: '28px', height: '28px', borderRadius: '9999px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', hover: { background: '#F3F4F6' } }}>
            <Flag size={14} color="#9CA3AF" />
          </button>
          <button style={{ width: '28px', height: '28px', borderRadius: '9999px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', hover: { background: '#F3F4F6' } }}>
            <Copy size={14} color="#9CA3AF" />
          </button>
        </div>
      </div>

      {explainMode ? (
        /* EXPLAIN VIEW */
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <List size={16} color="#374151" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Explain</span>
            </div>
            <button onClick={() => setExplainMode(false)} style={{ width: '24px', height: '24px', borderRadius: '9999px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', hover: { background: '#F3F4F6' } }}>
              <X size={14} color="#9CA3AF" />
            </button>
          </div>

          {/* Explanation Bubble */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {/* Mascot Avatar */}
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #E5E7EB', flexShrink: 0, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkle size={24} color="#7C3AED" />
            </div>
            {/* Text Bubble */}
            <div style={{ flex: 1, background: '#F5F3FF', borderRadius: '4px 16px 16px 16px', padding: '14px 16px', fontSize: '13px', color: '#374151', lineHeight: 1.6, border: '1px solid #DDD6FE' }}>
              {q.explanation || 'Here\'s an explanation for this question...'}
            </div>
          </div>

          {/* Follow-up Input */}
          <div style={{ marginTop: 'auto', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px', background: 'white' }}>
            <input
              type="text"
              placeholder="Ask for a follow up"
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px', color: '#374151', background: 'transparent' }}
            />
            <button style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '9999px', background: '#7C3AED', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUp size={12} weight="bold" />
            </button>
          </div>
        </div>
      ) : (
        /* QUESTION VIEW */
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          {/* Question */}
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', lineHeight: 1.5, textAlign: 'center', marginBottom: '24px' }}>
            {idx + 1}. {q.question}
          </div>

          {/* Answer Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {(q.type === 'multiple' || !q.type) && q.options?.map((opt, i) => {
              const isSelected = selected[idx] === i
              const isOptionCorrect = isAnswered && i === correctIdx
              const isOptionWrong = isAnswered && i !== correctIdx

              let bg = 'white'
              let border = '1px solid #E5E7EB'
              let badgeBg = '#F3F4F6'
              let badgeColor = '#374151'

              if (isAnswered) {
                if (isOptionCorrect) {
                  bg = '#DCFCE7'
                  border = '1px solid #4ADE80'
                  badgeBg = '#4ADE80'
                  badgeColor = 'white'
                } else if (isOptionWrong) {
                  bg = '#FEE2E2'
                  border = '1px solid #F87171'
                  badgeBg = '#F87171'
                  badgeColor = 'white'
                }
              } else if (isSelected) {
                bg = '#F5F3FF'
                border = '1px solid #A78BFA'
                badgeBg = '#A78BFA'
                badgeColor = 'white'
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={isAnswered}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '12px',
                    cursor: isAnswered ? 'default' : 'pointer',
                    transition: 'all 150ms ease',
                    border,
                    background: bg,
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => { if (!isAnswered) { e.currentTarget.style.borderColor = '#DDD6FE'; e.currentTarget.style.background = '#F5F3FF' } }}
                  onMouseLeave={(e) => { if (!isAnswered && !isSelected) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white' } }}
                >
                  {/* Letter Badge */}
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: badgeBg,
                    color: badgeColor
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  {/* Option Text */}
                  <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.4 }}>
                    {typeof opt === 'object' ? (opt.text || opt.choice || JSON.stringify(opt)) : opt}
                  </span>
                </button>
              )
            })}

            {q.type === 'truefalse' && [1, 0].map((val) => {
              const isSelected = selected[idx] === val
              const isOptionCorrect = isAnswered && val === correctIdx
              const isOptionWrong = isAnswered && val !== correctIdx
              const label = val === 1 ? 'True' : 'False'

              let bg = 'white'
              let border = '1px solid #E5E7EB'

              if (isAnswered) {
                if (isOptionCorrect) {
                  bg = '#DCFCE7'
                  border = '1px solid #4ADE80'
                } else if (isOptionWrong) {
                  bg = '#FEE2E2'
                  border = '1px solid #F87171'
                }
              } else if (isSelected) {
                bg = '#F5F3FF'
                border = '1px solid #A78BFA'
              }

              return (
                <button
                  key={val}
                  onClick={() => handleSelect(val)}
                  disabled={isAnswered}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '12px',
                    cursor: isAnswered ? 'default' : 'pointer',
                    transition: 'all 150ms ease',
                    border,
                    background: bg,
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.4, fontWeight: 600 }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #F3F4F6', display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button
          onClick={handleExplain}
          style={{
            flex: 1,
            height: '44px',
            borderRadius: '9999px',
            background: 'white',
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer'
          }}
        >
          <span style={{ background: '#F3F4F6', color: '#6B7280', borderRadius: '6px', padding: '2px 6px', fontSize: '11px', fontFamily: 'monospace' }}>E</span>
          {showExplanation ? 'Explain Again' : 'Explain'}
        </button>
        <button
          onClick={() => { if (!isAnswered && isUserSelected) handleSubmit(); else handleNext(); }}
          disabled={!isUserSelected && !isAnswered}
          style={{
            flex: 2,
            height: '44px',
            borderRadius: '9999px',
            background: '#C4B5FD',
            color: '#4C1D95',
            border: 'none',
            cursor: (!isUserSelected && !isAnswered) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
            opacity: (!isUserSelected && !isAnswered) ? 0.5 : 1
          }}
        >
          <span style={{ background: 'rgba(255,255,255,0.3)', color: '#4C1D95', borderRadius: '6px', padding: '2px 6px', fontSize: '11px', fontFamily: 'monospace' }}>↵</span>
          {!isAnswered ? 'Submit' : (idx === safeQuestions.length - 1 ? 'Finish' : 'Next')}
        </button>
      </div>
    </div>
  )
}

function WorkstationQuizRedesign({ quiz = [], items = [], material, onComplete, onRegenerate, isLoading = false }) {
  const [mode, setMode] = useState('home')
  const [quizType, setQuizType] = useState('practice')
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState({})
  const [typeInAnswers, setTypeInAnswers] = useState({})
  const [isFinished, setIsFinished] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const getQuestions = () => {
    if (Array.isArray(quiz) && quiz.length > 0) return quiz
    if (quiz?.questions && Array.isArray(quiz.questions)) return quiz.questions
    if (quiz?.items && Array.isArray(quiz.items)) return quiz.items
    if (Array.isArray(items) && items.length > 0) return items
    if (items?.questions && Array.isArray(items.questions)) return items.questions
    return []
  }

  const safeQuestions = getQuestions()
  const questionSignature = safeQuestions.map((question) => question?.id || question?.question || '').join('|')

  useEffect(() => {
    setMode('home')
    setQuizType('practice')
    setIdx(0)
    setSelected({})
    setTypeInAnswers({})
    setIsFinished(false)
    setShowExplanation(false)
  }, [questionSignature, material?.id])

  const getCorrectIndex = (question) => {
    const ans = question?.correctAnswer ?? question?.correct_answer ?? question?.answer
    if (ans === undefined || ans === null) return -1
    if (typeof ans === 'number') return ans
    if (typeof ans === 'string') {
      const lower = ans.trim().toLowerCase()
      if (lower === 'a') return 0
      if (lower === 'b') return 1
      if (lower === 'c') return 2
      if (lower === 'd') return 3
      if (lower === 'true' || lower === 'yes') return 1
      if (lower === 'false' || lower === 'no') return 0
      const parsed = parseInt(lower, 10)
      if (!Number.isNaN(parsed)) return parsed
      const options = question?.options || []
      const optionIndex = options.findIndex((opt) => {
        const text = (typeof opt === 'object' ? (opt.text || opt.choice || '') : opt).toString().trim().toLowerCase()
        return text === lower
      })
      if (optionIndex !== -1) return optionIndex
    }
    return -1
  }

  const calculateScore = () => {
    return safeQuestions.reduce((acc, question, index) => {
      if (question?.type === 'typein') {
        const userText = (typeInAnswers[index] || '').trim().toLowerCase()
        const expected = (question.expected_answer || question.answer || '').trim().toLowerCase()
        return acc + (userText && userText === expected ? 1 : 0)
      }
      return acc + (selected[index] === getCorrectIndex(question) ? 1 : 0)
    }, 0)
  }

  const answeredCount = Object.keys(selected).length + Object.keys(typeInAnswers).length
  const score = calculateScore()
  const accuracy = safeQuestions.length ? Math.round((score / safeQuestions.length) * 100) : 0
  const currentQuestion = safeQuestions[idx]
  const correctIdx = getCorrectIndex(currentQuestion)
  const isAnswered = selected[idx] !== undefined || typeInAnswers[idx] !== undefined
  const progress = safeQuestions.length ? ((idx + (isAnswered ? 1 : 0)) / safeQuestions.length) * 100 : 0

  const resetQuiz = (nextMode = quizType) => {
    setMode('active')
    setQuizType(nextMode)
    setIdx(0)
    setSelected({})
    setTypeInAnswers({})
    setIsFinished(false)
    setShowExplanation(false)
  }

  const handleSelect = (choiceIdx) => {
    if (isAnswered) return
    setSelected((prev) => ({ ...prev, [idx]: choiceIdx }))
  }

  const handleNext = () => {
    if (idx < safeQuestions.length - 1) {
      setIdx((value) => value + 1)
      setShowExplanation(false)
      return
    }
    setIsFinished(true)
    onComplete?.({ score: calculateScore(), total: safeQuestions.length })
  }

  const optionText = (option) => {
    if (typeof option === 'object') return option.text || option.choice || JSON.stringify(option)
    return option
  }

  return (
    <section className="lq-shell">
      <style>{`
        .lq-shell {
          --lq-bg: var(--sb-bg, #F9FAFB);
          --lq-surface: var(--sb-surface, #fff);
          --lq-text: var(--sb-text, #111827);
          --lq-secondary: var(--sb-text-secondary, #6B7280);
          --lq-muted: var(--sb-text-muted, #9CA3AF);
          --lq-border: var(--sb-border, #E5E7EB);
          --lq-purple: var(--sb-purple, #C4B5FD);
          --lq-mint: var(--sb-mint, #98FF98);
          --lq-peach: var(--sb-peach, #FFD2A6);
          --lq-purple-deep: var(--sb-purple-deep, #7a12cc);
          min-height: 100%;
          color: var(--lq-text);
          background:
            radial-gradient(circle, color-mix(in srgb, var(--lq-text) 7%, transparent) 1px, transparent 1px),
            var(--lq-bg);
          background-size: 14px 14px;
          padding: 28px 40px 110px;
          font-family: var(--font-display), DM Sans, Inter, sans-serif;
        }
        .lq-card {
          background: color-mix(in srgb, var(--lq-surface) 96%, transparent);
          border: 1px solid var(--lq-border);
          border-radius: 22px;
          box-shadow: 0 18px 54px rgba(17,24,39,0.06);
        }
        .lq-home-grid { display: grid; grid-template-columns: minmax(320px, 1.1fr) minmax(320px, 0.9fr); gap: 24px; max-width: 1180px; margin: 0 auto; }
        .lq-hero { min-height: 310px; padding: 28px; display: grid; grid-template-columns: 1fr auto; gap: 28px; align-items: center; overflow: hidden; position: relative; }
        .lq-hero:before { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, color-mix(in srgb, var(--lq-purple) 32%, transparent), color-mix(in srgb, var(--lq-mint) 18%, transparent) 55%, color-mix(in srgb, var(--lq-peach) 28%, transparent)); opacity: 0.8; pointer-events: none; }
        .lq-hero > * { position: relative; }
        .lq-kicker { display: inline-flex; align-items: center; gap: 8px; min-height: 34px; padding: 0 12px; border-radius: 999px; background: var(--lq-surface); color: var(--lq-purple-deep); font-size: 12px; font-weight: 900; }
        .lq-hero h2 { margin: 18px 0 10px; font-size: clamp(30px, 4vw, 48px); line-height: 1; font-weight: 900; letter-spacing: 0; }
        .lq-hero p { margin: 0; max-width: 520px; color: var(--lq-secondary); font-size: 16px; line-height: 1.55; font-weight: 600; }
        .lq-mascot { width: 138px; height: 138px; object-fit: contain; filter: drop-shadow(0 18px 34px rgba(122,18,204,0.22)); }
        .lq-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
        .lq-btn { min-height: 44px; border-radius: 14px; border: 1px solid var(--lq-border); background: var(--lq-surface); color: var(--lq-text); padding: 0 18px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 900; cursor: pointer; transition: transform .16s ease, box-shadow .16s ease, background .16s ease; }
        .lq-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(122,18,204,.12); }
        .lq-btn.primary { background: var(--lq-purple); border-color: color-mix(in srgb, var(--lq-purple-deep) 45%, var(--lq-purple)); color: #3B0764; }
        .lq-btn.mint { background: var(--lq-mint); border-color: #86EFAC; color: #14532D; }
        .lq-btn.danger { background: #FEE2E2; border-color: #FCA5A5; color: #991B1B; }
        .lq-btn:disabled { opacity: .56; cursor: not-allowed; transform: none; box-shadow: none; }
        .lq-side { display: grid; gap: 14px; }
        .lq-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .lq-stat { min-height: 120px; padding: 18px; border-radius: 18px; border: 1px solid var(--lq-border); background: var(--lq-surface); }
        .lq-stat span { color: var(--lq-secondary); font-size: 12px; font-weight: 900; }
        .lq-stat strong { display: block; margin-top: 14px; font-size: 34px; line-height: 1; }
        .lq-stat.purple strong { color: var(--lq-purple-deep); }
        .lq-stat.mint strong { color: #15803D; }
        .lq-stat.peach strong { color: #9A3412; }
        .lq-mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .lq-mode-card { min-height: 172px; border-radius: 20px; border: 1px solid var(--lq-border); background: var(--lq-surface); padding: 20px; display: flex; flex-direction: column; justify-content: space-between; text-align: left; cursor: pointer; color: var(--lq-text); }
        .lq-mode-icon { width: 46px; height: 46px; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; }
        .lq-mode-card strong { display: block; font-size: 20px; margin-bottom: 4px; }
        .lq-mode-card small { color: var(--lq-secondary); font-weight: 700; line-height: 1.4; }
        .lq-empty { max-width: 460px; min-height: 440px; margin: 72px auto 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 34px; }
        .lq-empty img { width: 118px; height: 118px; object-fit: contain; margin-bottom: 18px; }
        .lq-empty h3 { margin: 0 0 8px; font-size: 25px; }
        .lq-empty p { margin: 0 0 22px; color: var(--lq-secondary); line-height: 1.5; }
        .lq-runner { min-height: calc(100vh - 176px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; }
        .lq-runner-top { position: fixed; left: 44px; right: 44px; top: 118px; z-index: 8; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 14px; pointer-events: none; }
        .lq-runner-top > * { pointer-events: auto; }
        .lq-progress { height: 8px; border-radius: 999px; background: color-mix(in srgb, var(--lq-border) 65%, transparent); overflow: hidden; }
        .lq-progress span { display: block; height: 100%; width: 0; border-radius: inherit; background: linear-gradient(90deg, var(--lq-purple), var(--lq-mint), var(--lq-peach)); transition: width .22s ease; }
        .lq-chip { justify-self: center; min-height: 42px; border-radius: 999px; padding: 0 16px; display: inline-flex; align-items: center; gap: 8px; background: var(--lq-surface); border: 1px solid var(--lq-border); font-weight: 900; color: var(--lq-secondary); }
        .lq-runner-actions { justify-self: end; display: flex; gap: 8px; }
        .lq-icon-btn { width: 42px; height: 42px; border-radius: 14px; border: 1px solid var(--lq-border); background: var(--lq-surface); color: var(--lq-text); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
        .lq-question-card { width: min(768px, calc(100vw - 80px)); min-height: 460px; padding: 36px; display: flex; flex-direction: column; justify-content: center; }
        .lq-question-card h3 { margin: 0 auto 34px; max-width: 680px; text-align: center; font-size: clamp(22px, 2.2vw, 28px); line-height: 1.25; font-weight: 900; letter-spacing: 0; }
        .lq-options { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .lq-option { min-height: 88px; border-radius: 16px; border: 1px solid var(--lq-border); background: var(--lq-surface); color: var(--lq-text); display: grid; grid-template-columns: 38px 1fr; align-items: center; gap: 14px; padding: 14px 16px; text-align: left; font-weight: 800; cursor: pointer; transition: transform .14s ease, border-color .14s ease, background .14s ease; }
        .lq-option:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--lq-purple); background: color-mix(in srgb, var(--lq-purple) 14%, var(--lq-surface)); }
        .lq-letter { width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--lq-border); display: inline-flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--lq-bg) 70%, var(--lq-surface)); font-weight: 900; }
        .lq-option.is-selected { border-color: var(--lq-purple-deep); background: color-mix(in srgb, var(--lq-purple) 38%, var(--lq-surface)); }
        .lq-option.is-correct { border-color: #22C55E; background: color-mix(in srgb, var(--lq-mint) 48%, var(--lq-surface)); color: #14532D; }
        .lq-option.is-wrong { border-color: #EF4444; background: #FEE2E2; color: #7F1D1D; }
        .lq-typein { min-height: 92px; border-radius: 18px; border: 1px solid var(--lq-border); padding: 0 20px; color: var(--lq-text); background: var(--lq-surface); font: inherit; font-size: 18px; outline: none; }
        .lq-explain { margin-top: 18px; border-radius: 18px; padding: 18px; background: color-mix(in srgb, var(--lq-peach) 36%, var(--lq-surface)); border: 1px solid color-mix(in srgb, var(--lq-peach) 80%, var(--lq-border)); color: var(--lq-text); line-height: 1.55; font-weight: 700; }
        .lq-bottom { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 10; padding: 8px; display: grid; grid-template-columns: 54px minmax(180px, 300px) minmax(180px, 300px); gap: 10px; border-radius: 20px; background: color-mix(in srgb, var(--lq-surface) 92%, transparent); border: 1px solid var(--lq-border); box-shadow: 0 18px 44px rgba(17,24,39,.12); backdrop-filter: blur(12px); }
        .lq-result { width: min(720px, calc(100vw - 80px)); padding: 34px; text-align: center; }
        .lq-result img { width: 86px; height: 86px; object-fit: contain; }
        .lq-result h2 { margin: 12px 0 8px; font-size: 36px; }
        .lq-result p { color: var(--lq-secondary); font-weight: 700; }
        .lq-result-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
        body.dark-mode .lq-shell { background-size: 14px 14px; }
        @media (max-width: 920px) {
          .lq-shell { padding: 20px 16px 112px; }
          .lq-home-grid, .lq-mode-grid, .lq-options { grid-template-columns: 1fr; }
          .lq-hero { grid-template-columns: 1fr; }
          .lq-runner-top { left: 16px; right: 16px; top: 106px; grid-template-columns: 1fr; }
          .lq-chip, .lq-runner-actions { justify-self: start; }
          .lq-question-card { width: 100%; padding: 24px 18px; }
          .lq-bottom { left: 12px; right: 12px; transform: none; grid-template-columns: 44px 1fr 1fr; }
        }
      `}</style>

      {safeQuestions.length === 0 ? (
        <div className="lq-empty lq-card">
          <img src="/mascot.png" alt="" />
          <h3>No quiz yet</h3>
          <p>Create a quiz from this material when you are ready to test recall.</p>
          <button type="button" className="lq-btn primary" onClick={onRegenerate} disabled={!onRegenerate || isLoading}>
            {isLoading ? <CircleNotch size={18} className="spin" /> : <Sparkle size={18} weight="bold" />}
            {isLoading ? 'Generating' : 'Generate quiz'}
          </button>
        </div>
      ) : mode === 'home' ? (
        <div className="lq-home-grid">
          <article className="lq-hero lq-card">
            <div>
              <span className="lq-kicker"><Question size={16} weight="bold" /> Quiz arena</span>
              <h2>Practice fast, then prove it.</h2>
              <p>Start with regular quiz mode for quick feedback, or switch to exam mode when you want a calmer, timed run.</p>
              <div className="lq-actions">
                <button type="button" className="lq-btn primary" onClick={() => resetQuiz('practice')}><Play size={18} weight="bold" /> Start quiz</button>
                <button type="button" className="lq-btn mint" onClick={() => resetQuiz('exam')}><Timer size={18} weight="bold" /> Exam mode</button>
                <button type="button" className="lq-btn" onClick={onRegenerate} disabled={!onRegenerate || isLoading}>
                  <ArrowsClockwise size={18} weight="bold" /> {isLoading ? 'Generating' : 'Regenerate'}
                </button>
              </div>
            </div>
            <img className="lq-mascot" src="/mascot.png" alt="" />
          </article>

          <aside className="lq-side">
            <div className="lq-stat-grid">
              <div className="lq-stat purple"><span>Questions</span><strong>{safeQuestions.length}</strong></div>
              <div className="lq-stat mint"><span>Answered</span><strong>{answeredCount}</strong></div>
              <div className="lq-stat peach"><span>Score</span><strong>{accuracy}%</strong></div>
            </div>
            <div className="lq-mode-grid">
              <button className="lq-mode-card" type="button" onClick={() => resetQuiz('practice')}>
                <span className="lq-mode-icon" style={{ background: 'var(--lq-purple)', color: '#3B0764' }}><CheckSquare size={24} weight="bold" /></span>
                <span><strong>Practice</strong><small>Instant feedback and explanations when you miss.</small></span>
              </button>
              <button className="lq-mode-card" type="button" onClick={() => resetQuiz('exam')}>
                <span className="lq-mode-icon" style={{ background: 'var(--lq-mint)', color: '#14532D' }}><Timer size={24} weight="bold" /></span>
                <span><strong>Exam</strong><small>Cleaner flow, fewer distractions, finish at the end.</small></span>
              </button>
            </div>
          </aside>
        </div>
      ) : isFinished ? (
        <div className="lq-runner">
          <article className="lq-result lq-card">
            <img src="/mascot.png" alt="" />
            <h2>{accuracy >= 70 ? 'Solid run' : 'Good attempt'}</h2>
            <p>You got {score} of {safeQuestions.length} questions correct.</p>
            <div className="lq-result-stats">
              <div className="lq-stat purple"><span>Accuracy</span><strong>{accuracy}%</strong></div>
              <div className="lq-stat mint"><span>Correct</span><strong>{score}</strong></div>
              <div className="lq-stat peach"><span>Review</span><strong>{Math.max(0, safeQuestions.length - score)}</strong></div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '20px 0' }}>
              <div style={{ padding: '8px 16px', background: '#F5F3FF', border: '1.5px solid #C4B5FD', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#7a12cc', fontSize: 14 }}>
                ⚡ +{score * 10 + 20} XP
              </div>
              <div style={{ padding: '8px 16px', background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#D97706', fontSize: 14 }}>
                🪙 +{score * 2 + 5} Coins
              </div>
            </div>
            <div className="lq-actions" style={{ justifyContent: 'center' }}>
              <button type="button" className="lq-btn primary" onClick={() => resetQuiz(quizType)}><ArrowsClockwise size={18} weight="bold" /> Retry</button>
              <button type="button" className="lq-btn" onClick={() => setMode('home')}><CaretLeft size={18} weight="bold" /> Dashboard</button>
              <button type="button" className="lq-btn mint" onClick={onRegenerate} disabled={!onRegenerate || isLoading}><Sparkle size={18} weight="bold" /> New questions</button>
            </div>
          </article>
        </div>
      ) : (
        <div className="lq-runner">
          <div className="lq-runner-top">
            <div className="lq-progress"><span style={{ width: `${progress}%` }} /></div>
            <div className="lq-chip">
              {quizType === 'exam' ? <Timer size={17} weight="bold" /> : <CheckSquare size={17} weight="bold" />}
              {idx + 1} / {safeQuestions.length}
            </div>
            <div className="lq-runner-actions">
              <button type="button" className="lq-icon-btn" title="Regenerate" onClick={onRegenerate} disabled={!onRegenerate || isLoading}><ArrowsClockwise size={18} /></button>
              <button type="button" className="lq-icon-btn" title="Flag"><Flag size={18} /></button>
              <button type="button" className="lq-btn danger" onClick={() => setMode('home')}><SignOut size={17} weight="bold" /> Leave</button>
            </div>
          </div>

          <article className="lq-question-card lq-card">
            <h3>{idx + 1}. {currentQuestion?.question || 'Untitled question'}</h3>
            {currentQuestion?.type === 'typein' ? (
              <input
                className="lq-typein"
                value={typeInAnswers[idx] || ''}
                placeholder="Type your answer..."
                onChange={(event) => setTypeInAnswers((prev) => ({ ...prev, [idx]: event.target.value }))}
              />
            ) : (
              <div className="lq-options">
                {(currentQuestion?.options || []).slice(0, 4).map((option, optionIdx) => {
                  const selectedOption = selected[idx] === optionIdx
                  const correctOption = isAnswered && optionIdx === correctIdx
                  const wrongOption = isAnswered && selectedOption && optionIdx !== correctIdx
                  return (
                    <button
                      key={`${idx}-${optionIdx}`}
                      type="button"
                      className={`lq-option ${selectedOption ? 'is-selected' : ''} ${correctOption ? 'is-correct' : ''} ${wrongOption ? 'is-wrong' : ''}`}
                      onClick={() => handleSelect(optionIdx)}
                      disabled={isAnswered}
                    >
                      <span className="lq-letter">{String.fromCharCode(65 + optionIdx)}</span>
                      <span>{optionText(option)}</span>
                    </button>
                  )
                })}
              </div>
            )}
            {showExplanation && (
              <div className="lq-explain">
                {currentQuestion?.explanation || (correctIdx >= 0 ? `Correct answer: ${String.fromCharCode(65 + correctIdx)}.` : 'No explanation is available for this question yet.')}
              </div>
            )}
          </article>

          <div className="lq-bottom">
            <button type="button" className="lq-icon-btn" onClick={() => setIdx((value) => Math.max(0, value - 1))} disabled={idx === 0}><CaretLeft size={18} /></button>
            <button type="button" className="lq-btn" onClick={() => setShowExplanation((value) => !value)} disabled={!isAnswered && currentQuestion?.type !== 'typein'}>
              <Sparkle size={17} weight="bold" /> Explain
            </button>
            <button type="button" className="lq-btn primary" onClick={handleNext} disabled={!isAnswered && currentQuestion?.type !== 'typein'}>
              {idx === safeQuestions.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={17} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function EmptyState({ icon: Icon, label, action }) {
  return (
    <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ position: 'relative', marginBottom: '32px' }}>
         <div style={{ width: '100px', height: '100px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 4px 12px rgba(75, 0, 130, 0.1)' }}>
            <Icon size={48} weight="bold" color="#4B0082" />
         </div>
         <motion.div
           animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
           transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
           style={{ position: 'absolute', inset: -20, border: '2.5px solid #4B0082', borderRadius: '50%' }}
         />
      </div>
      <p style={{ fontSize: '20px', fontWeight: 700, color: '#1A102D', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>{label}</p>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', marginBottom: action ? '24px' : '0' }}>Luter is curating your space...</div>
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '44px', height: '44px', borderRadius: '12px', background: 'white', border: '1.5px solid #F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer',
        transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}
      title={label}
    >
      <Icon size={20} weight="bold" />
    </button>
  )
}

function SummaryTile({ title, value, icon: Icon, color }) {
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', background: `${color}1A`, color: color, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A102D' }}>{value}</div>
      </div>
    </div>
  )
}

function NavButton({ icon: Icon, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'white', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: disabled ? '#E2E8F0' : '#7a12cc', cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: 'none' }}>
      <Icon size={24} />
    </button>
  )
}

/**
 * WorkstationSummaryEnhanced
 * Supports Full Summary and Page-by-Page Summary
 */
export function WorkstationSummaryEnhanced({
  content,
  material,
  pageSummaries = {},
  onFetchPageSummaries,
  onRegenerate,
  onJumpToPage,
  isLoading,
  user,
  courseId,
  onAskQuestion,
  onSaveNotes,
  numPages
}) {
  const [viewMode, setViewMode] = useState('full');
  const [selectedPage, setSelectedPage] = useState(null);
  const [isSummarizingPages, setIsSummarizingPages] = useState(false);
  const [expandedPages, setExpandedPages] = useState({});

  useEffect(() => {
    setSelectedPage(null);
  }, [material?.id]);
  
  // Hover states
  const [hoveredRegen, setHoveredRegen] = useState(false);
  const [hoveredSave, setHoveredSave] = useState(false);
  const [hoveredAskIndex, setHoveredAskIndex] = useState(null);
  
  // Save states
  const [saveAllState, setSaveAllState] = useState(null); // null, 'saving', 'saved'
  const [savedPageNotes, setSavedPageNotes] = useState({});

  const handleFetchPages = async () => {
    setIsSummarizingPages(true);
    await onFetchPageSummaries();
    setIsSummarizingPages(false);
  };

  const togglePage = (page) => {
    setExpandedPages(prev => ({ ...prev, [page]: !prev[page] }));
  };

  // Helper to parse key points from markdown
  const parseSummary = (text) => {
    if (!text) return { keyPoints: [], cleanText: '' };
    
    const lines = text.split('\n');
    const keyPoints = [];
    const cleanLines = [];
    
    for (let line of lines) {
      const trimmed = line.trim();
      // Matches standard bullets: - point, * point, • point
      const match = trimmed.match(/^[-*•]\s+(.+)$/);
      if (match) {
        keyPoints.push(match[1]);
      } else {
        cleanLines.push(line);
      }
    }
    
    // Fallback key points if none parsed
    const finalKeyPoints = keyPoints.length > 0 ? keyPoints : [
      "Core principles, theorems, and definitions present in the material.",
      "Key formulas, calculations, or methodology details.",
      "Practical examples, case studies, or application context.",
      "Conclusions, summary notes, and future considerations."
    ];
    
    return {
      keyPoints: finalKeyPoints,
      cleanText: cleanLines.join('\n').trim()
    };
  };

  const handleAskAboutPoint = (text) => {
    if (onAskQuestion) {
      onAskQuestion(`Can you explain this key point from the summary?\n\n"${text}"`);
    }
  };

  const handleAskAboutPage = (page, text) => {
    if (onAskQuestion) {
      onAskQuestion(`Can you explain the summary of Page ${page}?\n\n"${text}"`);
    }
  };

  const handleSavePageNote = async (page, text) => {
    if (onSaveNotes) {
      try {
        setSavedPageNotes(prev => ({ ...prev, [page]: 'saving' }));
        await onSaveNotes(`Page ${page} Summary:\n\n${text}`);
        setSavedPageNotes(prev => ({ ...prev, [page]: 'saved' }));
        setTimeout(() => {
          setSavedPageNotes(prev => ({ ...prev, [page]: null }));
        }, 2000);
      } catch (e) {
        setSavedPageNotes(prev => ({ ...prev, [page]: null }));
      }
    }
  };

  const handleSaveAllNotes = async () => {
    if (onSaveNotes && content) {
      try {
        setSaveAllState('saving');
        await onSaveNotes(content);
        setSaveAllState('saved');
        setTimeout(() => {
          setSaveAllState(null);
        }, 2000);
      } catch (e) {
        setSaveAllState(null);
      }
    }
  };

  const getPageBadge = (pageIndex, text) => {
    const trimmed = (text || '').toLowerCase();
    if (trimmed.includes('definition') || trimmed.includes('formula') || trimmed.includes('theorem')) {
      return 'Core Theory';
    }
    if (trimmed.includes('example') || trimmed.includes('exercise') || trimmed.includes('application')) {
      return 'Practical Application';
    }
    if (trimmed.includes('introduction') || trimmed.includes('overview') || pageIndex === 1) {
      return 'Overview';
    }
    if (trimmed.length > 500) {
      return 'Detailed Analysis';
    }
    return 'Key Insights';
  };

  // Stats calculation
  const wordsCount = (content || '').trim().split(/\s+/).filter(Boolean).length;
  const readTimeMin = Math.max(1, Math.ceil(wordsCount / 200));
  const headersCount = (content || '').match(/^#+\s/gm)?.length || 0;
  const topicsCount = headersCount > 0 ? headersCount : 4;

  const renderHeaderSection = (isCurrentlyLoading) => {
    const isSaveNotesDisabled = !content || isCurrentlyLoading || saveAllState === 'saved';
    return (
      <div style={{ padding: '28px 32px 0 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-display)' }}>
              Course insights
            </h1>
            <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px', margin: 0 }}>
              Distilled intelligence from your study material.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onRegenerate}
              disabled={isCurrentlyLoading}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '9999px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                background: hoveredRegen ? '#F9FAFB' : 'white',
                borderColor: hoveredRegen ? '#D1D5DB' : '#E5E7EB',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isCurrentlyLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                transform: hoveredRegen ? 'translateY(-1px)' : 'translateY(0)'
              }}
              onMouseEnter={() => !isCurrentlyLoading && setHoveredRegen(true)}
              onMouseLeave={() => setHoveredRegen(false)}
            >
              <ArrowsClockwise size={14} className={isCurrentlyLoading ? 'animate-spin' : ''} />
              <span>Regenerate</span>
            </button>
            
            <button
              onClick={handleSaveAllNotes}
              disabled={isSaveNotesDisabled}
              style={{
                background: isSaveNotesDisabled ? '#E5E7EB' : (hoveredSave ? '#6D28D9' : '#7C3AED'),
                color: isSaveNotesDisabled ? '#9CA3AF' : 'white',
                borderRadius: '9999px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isSaveNotesDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                transform: (!isSaveNotesDisabled && hoveredSave) ? 'translateY(-1px)' : 'translateY(0)',
                boxShadow: (!isSaveNotesDisabled && hoveredSave) ? '0 2px 4px rgba(124, 58, 237, 0.2)' : 'none'
              }}
              onMouseEnter={() => !isSaveNotesDisabled && setHoveredSave(true)}
              onMouseLeave={() => setHoveredSave(false)}
            >
              {saveAllState === 'saved' ? <Checks size={14} /> : <Plus size={14} />}
              <span>
                {saveAllState === 'saving' ? 'Saving...' : saveAllState === 'saved' ? 'Saved' : 'Save to notes'}
              </span>
            </button>
          </div>
        </div>
        
        <div style={{ position: 'relative', marginTop: '16px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: '#E5E7EB', zIndex: 1 }} />
          <div style={{
            position: 'relative',
            zIndex: 2,
            background: '#F3F4F6',
            borderRadius: '9999px',
            padding: '3px',
            display: 'inline-flex',
            gap: '2px',
            border: '1px solid #E5E7EB'
          }}>
            <button
              onClick={() => setViewMode('full')}
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: viewMode === 'full' ? 'white' : 'transparent',
                color: viewMode === 'full' ? '#7C3AED' : '#6B7280',
                boxShadow: viewMode === 'full' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Full Summary
            </button>
            <button
              onClick={() => setViewMode('pages')}
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: viewMode === 'pages' ? 'white' : 'transparent',
                color: viewMode === 'pages' ? '#7C3AED' : '#6B7280',
                boxShadow: viewMode === 'pages' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              By Page
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSkeleton = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Stat cards skeleton */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ flex: 1, height: '76px', borderRadius: '16px', background: 'white', border: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="summary-skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="summary-skeleton" style={{ width: '60px', height: '10px', borderRadius: '4px' }} />
                <div className="summary-skeleton" style={{ width: '90px', height: '14px', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Key points skeleton */}
        <div style={{ border: '1px solid #E5E7EB', borderRadius: '20px', background: 'white', padding: '24px 28px' }}>
          <div className="summary-skeleton" style={{ width: '120px', height: '16px', borderRadius: '4px', marginBottom: '20px' }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E5E7EB', flexShrink: 0 }} />
              <div className="summary-skeleton" style={{ flex: 1, height: '12px', borderRadius: '4px', width: `${95 - i * 5}%` }} />
            </div>
          ))}
        </div>

        {/* Paragraphs skeleton */}
        {[1, 2].map((i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '28px 32px' }}>
            <div className="summary-skeleton" style={{ width: '100%', height: '12px', borderRadius: '4px', marginBottom: '10px' }} />
            <div className="summary-skeleton" style={{ width: '95%', height: '12px', borderRadius: '4px', marginBottom: '10px' }} />
            <div className="summary-skeleton" style={{ width: '90%', height: '12px', borderRadius: '4px', marginBottom: '10px' }} />
            <div className="summary-skeleton" style={{ width: '60%', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  };

  const renderEmptyState = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', maxWidth: '400px', margin: '60px auto' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EEF2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED', marginBottom: '24px' }}>
          <Sparkle size={36} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
          No summary yet
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px', lineHeight: '1.5' }}>
          Let Luter distill the core takeaways, definitions, and theorems from this document for you.
        </p>
        <button
          onClick={onRegenerate}
          style={{
            background: '#7C3AED',
            color: 'white',
            borderRadius: '9999px',
            border: 'none',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#6D28D9'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#7C3AED'}
        >
          <Lightning size={16} />
          <span>Generate Summary</span>
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#F9FAFB', width: '100%' }}>
        {renderHeaderSection(true)}
        <div className="summary-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 80px 32px' }}>
          {renderSkeleton()}
        </div>
      </div>
    );
  }

  if (!content && !isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#F9FAFB', width: '100%' }}>
        {renderHeaderSection(false)}
        <div className="summary-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 80px 32px' }}>
          {renderEmptyState()}
        </div>
      </div>
    );
  }

  const parsed = parseSummary(content);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#F9FAFB', width: '100%' }}>
      {renderHeaderSection(false)}
      
      <div className="summary-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 80px 32px' }}>
        {viewMode === 'full' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quick Stats Grid */}
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Stat Card 1: Page Count */}
              <div style={{
                flex: 1,
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#EEF2F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4B5563'
                }}>
                  <BookOpen size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Length</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)' }}>
                    {numPages ? `${numPages} pages` : '—'}
                  </span>
                </div>
              </div>

              {/* Stat Card 2: Read Time */}
              <div style={{
                flex: 1,
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#EEF2F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4B5563'
                }}>
                  <Clock size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Read time</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)' }}>
                    {readTimeMin} min read
                  </span>
                </div>
              </div>

              {/* Stat Card 3: Key Topics */}
              <div style={{
                flex: 1,
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#EEF2F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4B5563'
                }}>
                  <Sparkle size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topics</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)' }}>
                    {topicsCount} key areas
                  </span>
                </div>
              </div>
            </div>

            {/* Key Points Card */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '20px', background: 'white', padding: '24px 28px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '20px', fontFamily: 'var(--font-display)' }}>
                Key points
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {parsed.keyPoints.map((point, index) => {
                  const isHovered = hoveredAskIndex === index;
                  return (
                    <li
                      key={index}
                      className="summary-point"
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        position: 'relative',
                        padding: '10px 12px',
                        marginLeft: '-12px',
                        borderRadius: '10px',
                        transition: 'all 0.2s',
                        background: isHovered ? '#F9FAFB' : 'transparent',
                        animationDelay: `${index * 50}ms`
                      }}
                      onMouseEnter={() => setHoveredAskIndex(index)}
                      onMouseLeave={() => setHoveredAskIndex(null)}
                    >
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#7C3AED',
                        marginTop: '8px',
                        flexShrink: 0
                      }} />
                      <div style={{
                        flex: 1,
                        fontSize: '14.5px',
                        lineHeight: '1.6',
                        color: '#374151',
                        paddingRight: isHovered ? '110px' : '0px',
                        transition: 'padding-right 0.2s'
                      }}>
                        {point}
                      </div>
                      {isHovered && (
                        <button
                          onClick={() => handleAskAboutPoint(point)}
                          title="Ask about this point"
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#F3F4F6',
                            border: 'none',
                            borderRadius: '9999px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#374151',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          <ChatCircle size={14} />
                          <span>Ask Luter</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Full Summary Text Card */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '28px 32px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '20px', fontFamily: 'var(--font-display)' }}>
                Full summary
              </div>
              <div className="markdown-body" style={{ fontSize: '15.5px', lineHeight: '1.8', color: '#374151' }}>
                <ReactMarkdown>{parsed.cleanText || content || ""}</ReactMarkdown>
              </div>
              
              {/* Sources badges */}
              {Object.keys(pageSummaries).length > 0 && (
                <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sources:</span>
                  {Object.keys(pageSummaries).sort((a, b) => parseInt(a) - parseInt(b)).map((page) => (
                    <button
                      key={page}
                      onClick={() => onJumpToPage && onJumpToPage(parseInt(page))}
                      style={{
                        background: '#EEF2F6',
                        color: '#4B5563',
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#E5E7EB';
                        e.currentTarget.style.color = '#111827';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#EEF2F6';
                        e.currentTarget.style.color = '#4B5563';
                      }}
                    >
                      <BookOpen size={10} />
                      <span>Page {page}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'pages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.keys(pageSummaries).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 40px', background: 'white', borderRadius: '24px', border: '1px dashed #D1D5DB' }}>
                <div style={{ width: '64px', height: '64px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#7C3AED' }}>
                  <Sparkle size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Page-by-Page Insights</h3>
                <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px', maxWidth: '320px', margin: '0 auto 24px', lineHeight: 1.5 }}>Deep dive into every single page of your material with granular summaries.</p>
                <button
                  onClick={handleFetchPages}
                  disabled={isSummarizingPages}
                  style={{ padding: '10px 24px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: '9999px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6D28D9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#7C3AED'}
                >
                  {isSummarizingPages ? <ArrowsClockwise className="animate-spin" size={16} /> : <Lightning size={16} />}
                  {isSummarizingPages ? 'Generating...' : 'Analyze Page by Page'}
                </button>
              </div>
            ) : (() => {
              const pageKeys = Object.keys(pageSummaries).sort((a, b) => parseInt(a) - parseInt(b));
              const activePageKey = selectedPage || (pageKeys.length > 0 ? pageKeys[0] : null);
              const saveState = activePageKey ? savedPageNotes[activePageKey] : null;
              const isSavePageDisabled = saveState === 'saving' || saveState === 'saved';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Picker Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>Select page:</span>
                    <select
                      value={activePageKey || ""}
                      onChange={(e) => setSelectedPage(e.target.value)}
                      style={{
                        background: 'white',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {pageKeys.map((pageKey) => (
                        <option key={pageKey} value={pageKey}>
                          Page {pageKey}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Page Card */}
                  {activePageKey && pageSummaries[activePageKey] && (
                    <div
                      style={{
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '20px',
                        padding: '28px 32px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)' }}>
                          Page {activePageKey}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleAskAboutPage(activePageKey, pageSummaries[activePageKey])}
                            style={{
                              border: '1px solid #E5E7EB',
                              borderRadius: '9999px',
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: '#374151',
                              background: 'white',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#F9FAFB';
                              e.currentTarget.style.borderColor = '#D1D5DB';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#E5E7EB';
                            }}
                          >
                            <ChatCircle size={14} />
                            <span>Ask Luter</span>
                          </button>
                          
                          <button
                            onClick={() => handleSavePageNote(activePageKey, pageSummaries[activePageKey])}
                            disabled={isSavePageDisabled}
                            style={{
                              background: isSavePageDisabled ? '#E5E7EB' : '#7C3AED',
                              color: isSavePageDisabled ? '#9CA3AF' : 'white',
                              borderRadius: '9999px',
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: 500,
                              border: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: isSavePageDisabled ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSavePageDisabled) {
                                e.currentTarget.style.background = '#6D28D9';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSavePageDisabled) {
                                e.currentTarget.style.background = '#7C3AED';
                              }
                            }}
                          >
                            {saveState === 'saved' ? <Checks size={14} /> : <Plus size={14} />}
                            <span>
                              {saveState === 'saving' ? 'Adding...' : saveState === 'saved' ? 'Added' : 'Save to notes'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="markdown-body" style={{ fontSize: '14.5px', lineHeight: '1.6', color: '#374151', marginTop: '16px' }}>
                        <ReactMarkdown>
                          {typeof pageSummaries[activePageKey] === 'string' ? pageSummaries[activePageKey] : "No insights for this page."}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * WorkstationWrite
 * A dedicated space for personal study notes with AI assistance
 */
export function WorkstationWrite({ initialContent = "", onSave, material, user }) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssisting, setIsAssisting] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleAiAssist = async (type) => {
    if (isAssisting) return;

    const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.WRITE_AI_ASSIST, false)
    if (!ok) return

    setIsAssisting(true);
    try {
      const prompt = `You are Luter AI. Assist the student with their study notes.
MATERIAL TITLE: ${material?.title}
MATERIAL CONTEXT (Extracted): ${material?.extracted_text?.slice(0, 4000)}

STUDENT CURRENT JOTS:
"""
${content}
"""

TASK: ${type === 'points' ? 'Expand these jots into structured academic points.' : 'Extract any important formulas, dates, or key terms from the context related to these jots.'}
Return the assistance in markdown format. Be concise.`;

      const res = await callGroqAPI([{ role: 'user', content: prompt }], GROQ_MODELS.SPEEDSTER, { systemPromptOverride: "You are an advanced academic study assistant." });
      const aiNote = res.choices[0].message.content;
      setContent(prev => prev + "\n\n---\n### AI Assist:\n" + aiNote);
    } catch (e) {
      console.error('AI Assist error:', e);
    } finally {
      setIsAssisting(false);
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    await onSave(content);
    setIsSaving(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px', background: 'white', fontFamily: 'var(--font-body)' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ color: '#4B0082', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-display)' }}>
              <PencilLine size={14} /> Notepad
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1A102D', margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Study jottings</h1>
          </div>
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            style={{ padding: '10px 20px', borderRadius: '12px', background: '#4B0082', border: 'none', color: 'white', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', letterSpacing: '0.01em', boxShadow: '0 4px 12px rgba(75, 0, 130, 0.2)' }}
          >
            {isSaving ? <CircleNotch className="animate-spin" size={16} /> : <FloppyDisk size={16} />}
            {isSaving ? 'Saving' : 'Save'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleAiAssist('points')}
            disabled={isAssisting}
            style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#F5F3FF', border: '1.5px solid #DDD6FE', color: '#4B0082', fontWeight: 600, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'var(--font-display)', letterSpacing: '0.01em', transition: 'all 0.2s' }}
          >
            <Sparkle size={14} /> AI points
          </button>
          <button
            onClick={() => handleAiAssist('formulas')}
            disabled={isAssisting}
            style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#FFF7ED', border: '1.5px solid #FFEDD5', color: '#EA580C', fontWeight: 600, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'var(--font-display)', letterSpacing: '0.01em', transition: 'all 0.2s' }}
          >
            <Lightning size={14} /> Formulas
          </button>
        </div>
      </header>

      <div style={{ flex: 1, position: 'relative', background: '#F9FAFB', borderRadius: '16px', border: '1px solid var(--luter-border)', padding: '20px' }}>
        <textarea
          placeholder="Start jotting down what you're learning..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: '100%', height: '100%', border: 'none', resize: 'none', outline: 'none', fontSize: '15px', lineHeight: '1.6', color: '#334155', background: 'transparent', fontFamily: 'inherit' }}
        />
        {isAssisting && (
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', padding: '8px 16px', background: '#1A102D', borderRadius: '100px', color: 'white', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', letterSpacing: '0.03em', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <CircleNotch size={14} className="animate-spin" />
            Luter is thinking...
          </div>
        )}
      </div>
    </div>
  );
}
