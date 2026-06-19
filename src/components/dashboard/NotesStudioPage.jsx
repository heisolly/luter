import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useOutletContext, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { Extension } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import Image from '@tiptap/extension-image'
import { Suggestion } from '@tiptap/suggestion'
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus'
import Collaboration from '@tiptap/extension-collaboration'
import { CollaborationCursor } from './renderers/CollaborationCursor'

import { RoomProvider, useOthers, useSelf, useStatus, useSyncStatus, useThreads, useStorage, useMutation, useUpdateMyPresence, useCollaboration } from './CollaborationProvider'
import { ClientSideSuspense } from './CollaborationProvider'
import { CommentsProvider, useComments } from './CommentsProvider'
import CommentsPane from './CommentsPane'
import { CommentExtension } from './CommentExtension'
import { supabase } from '../../supabaseClient'
import { callGroqAPI, GROQ_MODELS } from '../../groqClient'
import { checkAndDeductCredits, CREDIT_COSTS } from '../../services/creditService'
import { PluginKey } from '@tiptap/pm/state'
import ReactMarkdown from 'react-markdown'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Table2,
  Undo2,
  Redo2,
  MessageSquarePlus,
  WandSparkles,
  FileQuestion,
  Pilcrow,
  Users,
  Link2,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react'
import './NotesStudioPage.css'

// ─── Chat History Helpers ─────────────────────────────────────────────────────
const HISTORY_KEY = 'luter-ai-chat-history'
const MAX_SESSIONS = 20

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveSession(messages, id) {
  if (!messages.length) return
  const sessions = loadHistory()
  // Use provided id so the same conversation overwrites instead of duplicating
  const sessionId = id || `chat-${Date.now()}`
  const firstUser = messages.find(m => m.role === 'user')
  const newSession = {
    id: sessionId,
    title: firstUser?.content?.slice(0, 60) || 'Chat',
    messages,
    createdAt: new Date().toISOString(),
  }
  const existing = sessions.findIndex(s => s.id === sessionId)
  let updated
  if (existing >= 0) {
    updated = [...sessions]
    updated[existing] = newSession
  } else {
    updated = [newSession, ...sessions].slice(0, MAX_SESSIONS)
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  return updated
}

function getSharedNotesKey(userId) {
  return `luter:shared-notes:${userId}`
}

function getCachedNoteKey(userId, noteId) {
  return `luter:note-cache:${userId}:${noteId}`
}

function loadSharedNotes(userId) {
  if (!userId) return []
  try {
    return JSON.parse(localStorage.getItem(getSharedNotesKey(userId)) || '[]')
  } catch {
    return []
  }
}

function upsertSharedNote(userId, note) {
  if (!userId || !note?.id) return
  const existing = loadSharedNotes(userId).filter((item) => item.id !== note.id)
  localStorage.setItem(getSharedNotesKey(userId), JSON.stringify([note, ...existing].slice(0, 50)))
}

function cacheNoteDraft(userId, noteId, note) {
  if (!userId || !noteId) return
  localStorage.setItem(getCachedNoteKey(userId, noteId), JSON.stringify(note))
}

function loadCachedNoteDraft(userId, noteId) {
  if (!userId || !noteId) return null
  try {
    return JSON.parse(localStorage.getItem(getCachedNoteKey(userId, noteId)) || 'null')
  } catch {
    return null
  }
}

// ─── Slash Command Groups ──────────────────────────────────────────────────────
const slashGroups = [
  {
    label: 'Basic Blocks',
    items: [
      {
        id: 'text', title: 'Text', hint: 'Start writing with plain text',
        emoji: '📝', keywords: ['paragraph', 'plain', 'p'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
      },
      {
        id: 'h1', title: 'Heading 1', hint: 'Big section heading',
        emoji: 'H₁', keywords: ['title', 'h1', 'heading'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
      },
      {
        id: 'h2', title: 'Heading 2', hint: 'Medium section heading',
        emoji: 'H₂', keywords: ['subtitle', 'h2'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
      },
      {
        id: 'h3', title: 'Heading 3', hint: 'Small section heading',
        emoji: 'H₃', keywords: ['h3'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
      },
      {
        id: 'quote', title: 'Quote', hint: 'Capture a quote or highlight',
        emoji: '❝', keywords: ['blockquote', 'callout', 'quote'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
      },
      {
        id: 'divider', title: 'Divider', hint: 'Visually divide sections',
        emoji: '─', keywords: ['line', 'rule', 'separator', 'hr'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
      },
    ],
  },
  {
    label: 'Lists',
    items: [
      {
        id: 'bullet', title: 'Bullet List', hint: 'Simple unordered list',
        emoji: '•', keywords: ['ul', 'list', 'bullet', 'unordered'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
      },
      {
        id: 'numbered', title: 'Numbered List', hint: 'Ordered list',
        emoji: '①', keywords: ['ol', 'ordered', 'numbered'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
      },
      {
        id: 'todo', title: 'To-do List', hint: 'Track tasks with checkboxes',
        emoji: '☑', keywords: ['task', 'checkbox', 'todo', 'check'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
      },
    ],
  },
  {
    label: 'Advanced',
    items: [
      {
        id: 'code', title: 'Code Block', hint: 'Paste code or formulas',
        emoji: '⌨', keywords: ['code', 'formula', 'snippet'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
      },
      {
        id: 'table', title: 'Table', hint: '3 × 3 editable table',
        emoji: '⊞', keywords: ['grid', 'columns', 'table'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      },
    ],
  },
  {
    label: 'AI Study Tools',
    items: [
      {
        id: 'summary', title: 'AI Summary', hint: 'Generate a study summary block',
        emoji: '✦', keywords: ['ai', 'summary', 'study', 'summarize'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent([
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📋 Summary' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Write or generate a summary of the key points...' }] },
        ]).run(),
      },
      {
        id: 'concepts', title: 'Key Concepts', hint: 'List important study concepts',
        emoji: '💡', keywords: ['ai', 'concepts', 'key', 'ideas'],
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent([
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '💡 Key Concepts' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Concept 1: ' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Concept 2: ' }] }] },
          ]},
        ]).run(),
      },
    ],
  },
]

const allSlashItems = slashGroups.flatMap(g => g.items)

// ─── Slash Command Extension ───────────────────────────────────────────────────
const SlashCommand = Extension.create({
  name: 'slashCommand',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        pluginKey: new PluginKey('slashCommand'),
        allowSpaces: false,
        startOfLine: false,
        items: ({ query }) => {
          const search = query.toLowerCase().trim()
          if (!search) return allSlashItems
          return allSlashItems.filter(item => {
            const hay = [item.title, item.hint, ...(item.keywords || [])].join(' ').toLowerCase()
            return hay.includes(search)
          })
        },
        command: ({ editor, range, props }) => props.command({ editor, range }),
        render: () => {
          let popup = null
          let selectedIndex = 0
          let currentProps = null
          let searchQuery = ''

          const getGroups = (query) => {
            if (!query) return slashGroups
            const filtered = allSlashItems.filter(item => {
              const hay = [item.title, item.hint, ...(item.keywords || [])].join(' ').toLowerCase()
              return hay.includes(query.toLowerCase().trim())
            })
            return filtered.length ? [{ label: 'Search results', items: filtered }] : []
          }

          const positionPopup = () => {
            if (!popup || !currentProps?.clientRect) return
            const rect = currentProps.clientRect()
            if (!rect) return
            const left = Math.min(rect.left, window.innerWidth - 340)
            const spaceBelow = window.innerHeight - rect.bottom - 8
            const spaceAbove = rect.top - 8
            if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
              popup.style.top = `${rect.bottom + 8}px`
              popup.style.bottom = 'auto'
            } else {
              popup.style.bottom = `${window.innerHeight - rect.top + 8}px`
              popup.style.top = 'auto'
            }
            popup.style.left = `${Math.max(8, left)}px`
          }

          const renderContent = () => {
            if (!popup) return
            const groups = getGroups(searchQuery)
            const flatItems = groups.flatMap(g => g.items)
            selectedIndex = Math.min(selectedIndex, Math.max(flatItems.length - 1, 0))

            const list = popup.querySelector('.ns-sl-list')
            if (!list) return
            list.innerHTML = ''

            if (!flatItems.length) {
              list.innerHTML = '<div class="ns-sl-empty">No matching blocks found</div>'
              return
            }

            let fi = 0
            groups.forEach(group => {
              const groupEl = document.createElement('div')
              groupEl.className = 'ns-sl-group'

              const lbl = document.createElement('div')
              lbl.className = 'ns-sl-group-label'
              lbl.textContent = group.label
              groupEl.appendChild(lbl)

              group.items.forEach(item => {
                const idx = fi++
                const btn = document.createElement('button')
                btn.type = 'button'
                btn.className = `ns-sl-item${idx === selectedIndex ? ' selected' : ''}`
                btn.setAttribute('data-idx', idx)
                btn.innerHTML = `
                  <span class="ns-sl-icon">${item.emoji}</span>
                  <span class="ns-sl-copy">
                    <strong>${item.title}</strong>
                    <span>${item.hint}</span>
                  </span>
                `
                btn.addEventListener('mouseenter', () => { selectedIndex = idx; renderContent() })
                btn.addEventListener('mousedown', e => { e.preventDefault(); currentProps?.command(item) })
                groupEl.appendChild(btn)
              })

              list.appendChild(groupEl)
            })

            const sel = list.querySelector('.ns-sl-item.selected')
            sel?.scrollIntoView({ block: 'nearest' })
          }

          const buildPopup = () => {
            popup = document.createElement('div')
            popup.className = 'ns-slash-menu'

            const searchWrap = document.createElement('div')
            searchWrap.className = 'ns-sl-search-wrap'
            const input = document.createElement('input')
            input.className = 'ns-sl-search'
            input.placeholder = 'Search blocks and AI tools...'
            input.addEventListener('input', e => {
              searchQuery = e.target.value
              selectedIndex = 0
              renderContent()
            })
            input.addEventListener('keydown', e => {
              if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
                e.stopPropagation()
                const groups = getGroups(searchQuery)
                const flatItems = groups.flatMap(g => g.items)
                if (e.key === 'ArrowDown') { selectedIndex = (selectedIndex + 1) % Math.max(flatItems.length, 1); renderContent() }
                if (e.key === 'ArrowUp') { selectedIndex = (selectedIndex + flatItems.length - 1) % Math.max(flatItems.length, 1); renderContent() }
                if (e.key === 'Enter' && flatItems[selectedIndex]) { currentProps?.command(flatItems[selectedIndex]) }
              }
            })
            searchWrap.appendChild(input)

            const list = document.createElement('div')
            list.className = 'ns-sl-list'

            popup.appendChild(searchWrap)
            popup.appendChild(list)
            document.body.appendChild(popup)
          }

          return {
            onStart: props => {
              currentProps = props
              selectedIndex = 0
              searchQuery = ''
              buildPopup()
              renderContent()
              positionPopup()
            },
            onUpdate: props => {
              currentProps = props
              positionPopup()
            },
            onKeyDown: ({ event }) => {
              const groups = getGroups(searchQuery)
              const flatItems = groups.flatMap(g => g.items)
              if (event.key === 'ArrowDown') { selectedIndex = (selectedIndex + 1) % Math.max(flatItems.length, 1); renderContent(); return true }
              if (event.key === 'ArrowUp') { selectedIndex = (selectedIndex + flatItems.length - 1) % Math.max(flatItems.length, 1); renderContent(); return true }
              if (event.key === 'Enter') { if (flatItems[selectedIndex]) currentProps?.command(flatItems[selectedIndex]); return true }
              if (event.key === 'Escape') return false
              return false
            },
            onExit: () => { popup?.remove(); popup = null; searchQuery = '' },
          }
        },
      }),
    ]
  },
})

// ─── Mention Stub Extension ────────────────────────────────────────────────────
const MentionStub = Extension.create({
  name: 'mentionStub',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '@',
        pluginKey: new PluginKey('mentionStub'),
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).insertContent(`@${props.id} `).run()
        },
        items: ({ query }) => {
          const names = ['Luter AI', 'John Doe', 'Jane Smith']
          return names.filter(n => n.toLowerCase().includes(query.toLowerCase())).map(n => ({ id: n }))
        },
        render: () => {
          let popup = null
          return {
            onStart: props => {
              popup = document.createElement('div')
              popup.className = 'ns-mention-menu'
              document.body.appendChild(popup)
              
              const rect = props.clientRect()
              if (rect) {
                popup.style.top = `${rect.bottom + 8}px`
                popup.style.left = `${rect.left}px`
              }
              
              const ul = document.createElement('ul')
              props.items.forEach(item => {
                const li = document.createElement('li')
                li.textContent = item.id
                li.onclick = () => props.command(item)
                ul.appendChild(li)
              })
              popup.appendChild(ul)
            },
            onUpdate: props => {
              if (!popup) return
              popup.innerHTML = ''
              const ul = document.createElement('ul')
              props.items.forEach(item => {
                const li = document.createElement('li')
                li.textContent = item.id
                li.onclick = () => props.command(item)
                ul.appendChild(li)
              })
              popup.appendChild(ul)
            },
            onKeyDown: ({ event }) => {
              if (event.key === 'Escape') { popup?.remove(); return true }
              return false
            },
            onExit: () => { popup?.remove() }
          }
        }
      })
    ]
  }
})

// ─── Color from ID ─────────────────────────────────────────────────────────────
function colorFromId(value = 'guest') {
  const colors = ['#C4B5FD', '#98FF98', '#FFD2A6', '#93C5FD', '#FDA5A5', '#86EFAC']
  let hash = 0
  for (const c of value) hash = (hash * 31 + c.charCodeAt(0)) % colors.length
  return colors[Math.abs(hash)]
}

function getUserDisplayName(user, profile) {
  return (
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Scholar'
  )
}

// ─── AI Chat Panel (Playful & Draggable) ──────────────────────────────────────────────
export function AiChatPanel({ isOpen, onClose, mode, setMode, editor, currentNoteId, panelWidth, setPanelWidth, user, profile }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aiModeType, setAiModeType] = useState('Default')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState(loadHistory)
  const [conversationId] = useState(() => {
    try { return crypto.randomUUID() }
    catch { return Math.random().toString(36).substring(2) + Date.now().toString(36) }
  })

  // Detect standalone /ai-chat route — no nav to notes, no close/widget buttons
  const location = useLocation()
  const isStandaloneChat = location.pathname.includes('/ai-chat')

  // Read workstation material context (set by WorkstationPage before navigating here)
  const [wsContext] = useState(() => {
    try {
      const raw = sessionStorage.getItem('luter-ws-ai-context')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  // Context is only available when: inside notes editor (editor exists) OR workstation material was passed
  const hasRealContext = Boolean(editor) || Boolean(wsContext?.text)
  const contextLabel = wsContext?.title
    ? `📎 ${wsContext.title.slice(0, 40)}${wsContext.title.length > 40 ? '…' : ''}`
    : editor
      ? 'Current page'
      : null

  // Default context ON only when there's real context to attach
  const [contextEnabled, setContextEnabled] = useState(hasRealContext)
  
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  // Save current chat session when navigating away / starting new
  const startNewChat = () => {
    if (messages.length > 0) {
      const updated = saveSession(messages, conversationId)
      if (updated) setChatHistory(updated)
    }
    setMessages([])
    setHistoryOpen(false)
  }

  const loadSession = (session) => {
    if (messages.length > 0) saveSession(messages, conversationId)
    setMessages(session.messages)
    setHistoryOpen(false)
  }

  const deleteSession = (e, sessionId) => {
    e.stopPropagation()
    const updated = chatHistory.filter(s => s.id !== sessionId)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    setChatHistory(updated)
  }
  
  const quickActions = [
    { label: 'Search for anything', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    { label: 'Write meeting agenda', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
    { label: 'Analyze PDFs or images', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
    { label: 'Create a task tracker', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  ]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save session on unmount
  useEffect(() => {
    return () => {
      if (messages.length > 0) saveSession(messages, conversationId)
    }
  }, [messages, conversationId])

  // Dragging logic
  const isDragging = useRef(false)
  
  const handleMouseDown = (e) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.classList.add('ns-dragging')
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return
      // Calculate new width: viewport width - mouse X
      const newWidth = Math.max(280, Math.min(window.innerWidth - e.clientX, 800))
      setPanelWidth(newWidth)
    }
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = 'default'
        document.body.classList.remove('ns-dragging')
      }
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [setPanelWidth])

  const handleSetMode = (newMode) => {
    setMode(newMode)
    setMenuOpen(false)
    // Only navigate when inside the Notes editor, never on the standalone /ai-chat page
    if (!isStandaloneChat) {
      if (newMode === 'fullscreen') navigate(`/dashboard/ai-chat?note=${currentNoteId}`)
      else navigate(`/dashboard/notes/editor?note=${currentNoteId}`)
    }
  }

  const handleClose = () => {
    // On standalone /ai-chat there is no close — nothing to navigate back to
    if (isStandaloneChat) return
    if (mode === 'fullscreen') {
      navigate(`/dashboard/notes/editor?note=${currentNoteId}`)
      setMode('sidebar')
    }
    onClose()
  }

  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest('.ns-ai-layout-menu-wrap')) setMenuOpen(false)
      if (!e.target.closest('.ns-ai-settings-wrap') && !e.target.closest('.ns-ai-input-settings-btn')) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', content: text, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    const shouldEditDocument = contextEnabled && editor && promptShouldEditDocument(text)
    const placeholderText = `Luter AI is working on: ${text.slice(0, 64)}${text.length > 64 ? '...' : ''}`
    
    try {
      const cost = CREDIT_COSTS.NOTES_AI_CHAT
      const { ok } = await checkAndDeductCredits(user?.id, cost, profile?.is_premium)
      if (!ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: "You've used up your AI credits for today. They reset daily — come back tomorrow or upgrade to Pro for more!", id: Date.now() + 1 }])
        setLoading(false)
        return
      }

      if (shouldEditDocument) {
        editor.chain().focus('end').insertContent(`<blockquote><p>${escapeHtml(placeholderText)}</p></blockquote>`).run()
      }

      // Build context from editor
      let contextStr = ''
      if (contextEnabled && editor) {
        const textContent = editor.getText()
        if (textContent.trim()) {
          contextStr = `\n\n--- DOCUMENT CONTEXT ---\n${textContent.slice(0, 10000)}\n------------------------\nUser is currently editing this document. You may use the entire note as context.`
        }
      }

      // Also pick up workstation material context (set by WorkstationPage before navigating)
      if (!contextStr && contextEnabled) {
        try {
          const wsCtx = sessionStorage.getItem('luter-ws-ai-context')
          if (wsCtx) {
            const { title: matTitle, text: matText } = JSON.parse(wsCtx)
            if (matText) {
              contextStr = `\n\n--- STUDY MATERIAL: ${matTitle || 'Uploaded material'} ---\n${matText.slice(0, 10000)}\n---\nUse this material as context when answering.`
            }
          }
        } catch {}
      }
      
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const aiResponse = await callGroqAPI(
        [...history, { role: 'user', content: shouldEditDocument ? getDocumentAiPrompt(text, editor) : text + contextStr }],
        GROQ_MODELS.PROFESSOR,
        { temperature: 0.7 }
      )
      
      const responseText = aiResponse?.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that."
      if (shouldEditDocument) {
        const range = findTextRange(editor, placeholderText)
        const contentHtml = markdownToEditorHtml(responseText)
        if (range) {
          editor.chain().focus().insertContentAt(range, contentHtml).run()
        } else {
          editor.chain().focus('end').insertContent(contentHtml).run()
        }
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: shouldEditDocument ? 'Done. I updated the note so everyone in the room can see the new content live.' : responseText,
        id: Date.now() + 1,
      }])
    } catch (err) {
      console.error(err)
      if (shouldEditDocument) {
        const range = findTextRange(editor, placeholderText)
        if (range) {
          editor.chain().focus().insertContentAt(range, '<p>Luter AI could not finish this edit. Please try again.</p>').run()
        }
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oops, an error occurred while connecting to the AI.",
        id: Date.now() + 1,
      }])
    } finally {
      setLoading(false)
    }
  }

  const insertToNote = (text) => {
    let html = text
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*?<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
      .split(/\n\n+/)
      .map(p => {
        if (p.startsWith('<h') || p.startsWith('<ul')) return p;
        return `<p>${p.replace(/\n/g, '<br/>')}</p>`
      })
      .join('\n')

    editor?.chain().focus().insertContent(html).run()
  }

  if (!isOpen && mode !== 'fullscreen') return null

  const isFullscreen = mode === 'fullscreen'
  const hasMessages = messages.length > 0

  // Suggested actions for fullscreen two-column layout
  const suggestedActions = [
    { label: 'Write meeting agenda', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { label: 'Analyze PDFs or images', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
    { label: 'Create a task tracker', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  ]

  // textarea ref lives at panel level — single source of truth for input value
  // Using UNCONTROLLED textarea to avoid React re-render cursor corruption
  const textareaRef = useRef(null)

  // Auto-grow height via ref — no state involved
  const growTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const handleTextareaInput = (e) => {
    growTextarea()
    // We only need the value when sending — do NOT call setInput here
    // to prevent controlled re-render cursor corruption
  }

  const handleTextareaKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const text = textareaRef.current?.value || ''
      if (!text.trim()) return
      sendMessage(text)
      // Clear textarea directly and reset height
      if (textareaRef.current) {
        textareaRef.current.value = ''
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  // Also update sendMessage to read from ref when called via suggestion chips
  const handleSendFromRef = () => {
    const text = textareaRef.current?.value || ''
    if (!text.trim()) return
    sendMessage(text)
    if (textareaRef.current) {
      textareaRef.current.value = ''
      textareaRef.current.style.height = 'auto'
    }
  }

  // The shared input block
  const InputBlock = ({ isBottom = false }) => (
    <div className={`ns-ai-input-container${isBottom ? ' is-bottom' : ''}`}>
      <div className="ns-ai-input-wrapper">
        {/* Context badge — only when real context exists */}
        {hasRealContext && (
          <div className="ns-ai-input-top">
            {contextEnabled && contextLabel ? (
              <span className="ns-ai-new-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                {contextLabel}
                <button className="ns-ai-badge-close" onClick={() => setContextEnabled(false)}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </span>
            ) : (
              <button className="ns-ai-add-context-btn" onClick={() => setContextEnabled(true)}>
                + Add context
              </button>
            )}
          </div>
        )}

        {/* Textarea — uncontrolled to prevent cursor corruption */}
        <textarea
          ref={textareaRef}
          className="ns-ai-input"
          defaultValue=""
          onChange={handleTextareaInput}
          onKeyDown={handleTextareaKey}
          placeholder="Do anything with AI..."
          rows={1}
          style={{ resize: 'none', overflowY: 'hidden' }}
          autoFocus={isFullscreen && !hasMessages}
        />

        <div className="ns-ai-input-bottom">
          <div className="ns-ai-input-tools">
            <div className="ns-ai-settings-dropdown">
              <button className={`ns-ai-input-settings-btn ${settingsOpen ? 'active' : ''}`} onClick={() => setSettingsOpen(!settingsOpen)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
              </button>
              {settingsOpen && (
                <div className="ns-ai-settings-wrap">
                  <div className="ns-set-item">
                    <div className="ns-set-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      Web access
                    </div>
                    <div className="ns-set-toggle active"><div className="ns-set-knob"/></div>
                  </div>
                  <div className="ns-set-item">
                    <div className="ns-set-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                      My sources
                    </div>
                    <span className="ns-set-val">3 {'>'}</span>
                  </div>
                  <div className="ns-set-divider"/>
                  <div className="ns-set-item" onClick={() => setAiModeType('Default')}>
                    <div className="ns-set-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Mode
                    </div>
                    <span className="ns-set-val">{aiModeType} {'>'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="ns-ai-input-actions">
            <span className="ns-ai-auto-text">{aiModeType === 'Default' ? 'Auto' : aiModeType}</span>
            <button title="Voice input">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
            <button className="submit" onClick={handleSendFromRef} disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <aside
      className={`ns-ai-panel mode-${mode}${hasMessages ? ' has-messages' : ''}`}
      style={mode === 'sidebar' ? { width: panelWidth } : {}}
    >
      {/* Drag Handle */}
      {mode === 'sidebar' && (
        <div className="ns-ai-drag-handle" onMouseDown={handleMouseDown} />
      )}

      {/* ── Header ── */}
      <div className="ns-ai-panel-header">
        <div className="ns-ai-top-left">
          <span className="ns-ai-title">New AI chat</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div className="ns-ai-top-right">
          {/* History button — always visible */}
          <button className="ns-ai-icon-btn" title="Chat history" onClick={() => setHistoryOpen(v => !v)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M3 21h18"/></svg>
          </button>
          {/* New chat button — always visible */}
          <button className="ns-ai-icon-btn" title="New chat" onClick={startNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="10" y1="11" x2="14" y2="11"/></svg>
          </button>

          {/* Layout switcher + Close — only shown inside the Notes editor, not on /ai-chat */}
          {!isStandaloneChat && (
            <>
              <div className="ns-ai-layout-menu-wrap">
                <button className={`ns-ai-icon-btn ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
                  {mode === 'sidebar'    && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>}
                  {mode === 'floating'   && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="14" y="14" width="5" height="5" rx="1"/></svg>}
                  {mode === 'fullscreen' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>}
                </button>
                {menuOpen && (
                  <div className="ns-ai-layout-menu">
                    <button onClick={() => handleSetMode('sidebar')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                      Sidebar {mode === 'sidebar' && <span className="ns-ai-check">✓</span>}
                    </button>
                    <button onClick={() => handleSetMode('floating')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="14" y="14" width="5" height="5" rx="1"/></svg>
                      Floating {mode === 'floating' && <span className="ns-ai-check">✓</span>}
                    </button>
                    <button onClick={() => handleSetMode('fullscreen')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                      Full screen {mode === 'fullscreen' && <span className="ns-ai-check">✓</span>}
                    </button>
                  </div>
                )}
              </div>
              <button className="ns-ai-icon-btn close-btn" title="Close" onClick={handleClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* History Panel */}
      {historyOpen && (
        <div className="ns-ai-history-panel">
          <div className="ns-ai-history-header">
            <span>Chat History</span>
            <button onClick={() => setHistoryOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {chatHistory.length === 0 ? (
            <div className="ns-ai-history-empty">No past chats yet</div>
          ) : (
            <div className="ns-ai-history-list">
              {chatHistory.map(session => (
                <div key={session.id} className="ns-ai-history-item" onClick={() => loadSession(session)}>
                  <div className="ns-ai-history-title">{session.title}</div>
                  <div className="ns-ai-history-meta">{new Date(session.createdAt).toLocaleDateString()}</div>
                  <button className="ns-ai-history-del" onClick={(e) => deleteSession(e, session.id)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FULLSCREEN EMPTY STATE — centered Notion AI style ── */}
      {isFullscreen && !hasMessages ? (
        <div className="ns-ai-messages">
          <div className="ns-ai-empty-state">
            <div className="ns-ai-mascot-wrap">
              <img src="/mascot.png" alt="Luter AI" className="ns-ai-mascot" />
              <span className="ns-ai-magic-stars">✨</span>
            </div>
            <h3>What magic shall we make happen?</h3>

            {/* Input — centered, prominent */}
            <InputBlock />

            {/* Two-column grid */}
            <div className="ns-ai-quick-grid">
              <div>
                <div className="ns-ai-quick-col-header">Recent chats</div>
                {chatHistory.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9CA3AF', padding: '2px 6px' }}>No recent chats yet</p>
                ) : (
                  chatHistory.slice(0, 3).map(session => (
                    <button key={session.id} className="ns-ai-quick-action" onClick={() => loadSession(session)}>
                      <span className="ns-ai-quick-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.title}</span>
                    </button>
                  ))
                )}
              </div>
              <div>
                <div className="ns-ai-quick-col-header">Suggested</div>
                {suggestedActions.map(a => (
                  <button key={a.label} className="ns-ai-quick-action" onClick={() => sendMessage(a.label)}>
                    <span className="ns-ai-quick-icon">{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── NORMAL / CONVERSATION view ── */
        <>
          <div className={`ns-ai-messages${hasMessages ? ' has-messages' : ''}`}>
            {!isFullscreen && messages.length === 0 && (
              <div className="ns-ai-empty-state">
                <div className="ns-ai-mascot-wrap">
                  <img src="/mascot.png" alt="Luter Mascot" className="ns-ai-mascot" />
                  <span className="ns-ai-magic-stars">✨</span>
                </div>
                <h3>What magic shall we make happen?</h3>
                <div className="ns-ai-quick-grid">
                  {quickActions.map(a => (
                    <button key={a.label} className="ns-ai-quick-action" onClick={() => sendMessage(a.label)}>
                      <span className="ns-ai-quick-icon">{a.icon}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`ns-ai-msg ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <img src="/mascot.png" className="ns-ai-msg-avatar" alt="AI" />
                )}
                <div className="ns-ai-msg-bubble">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : msg.content}
                  {msg.role === 'assistant' && editor && !isFullscreen && aiModeType !== 'Ask' && (
                    <button className="ns-ai-insert-btn" onClick={() => insertToNote(msg.content)}>+ Insert</button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ns-ai-msg assistant">
                <img src="/mascot.png" className="ns-ai-msg-avatar" alt="AI" />
                <div className="ns-ai-msg-bubble ns-ai-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <InputBlock isBottom={isFullscreen} />
        </>
      )}
    </aside>
  )
}

// ─── Share Dropdown ────────────────────────────────────────────────────────────
function ShareDropdown({ roomId, onClose }) {
  const [copied, setCopied] = useState(false)
  const shortId = roomId.split(':').pop()
  
  // Construct the absolute share URL with the exact note ID
  const shareUrl = `${window.location.origin}/dashboard/notes/editor?note=${shortId}&shared=1`

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(shareUrl) } catch { }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('.ns-share-wrap')) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="ns-share-dropdown ns-share-dropdown-premium">
      <div className="ns-share-header">
        <div className="ns-share-icon-wrap">
          <Users size={20} className="text-indigo-600" />
        </div>
        <div className="ns-share-header-text">
          <strong>Share & Collaborate</strong>
          <p>Anyone with this link can join and edit in real time.</p>
        </div>
      </div>
      
      <div className="ns-share-link-section">
        <div className="ns-share-link-label">
          <Link2 size={14} /> Invite Link
        </div>
        <div className="ns-share-link-row">
          <input className="ns-share-link-input" value={shareUrl} readOnly onClick={(e) => e.target.select()} />
          <button className={`ns-share-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="ns-share-room-id">
        <div className="ns-share-room-id-left">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>Secure Room ID</span>
        </div>
        <code className="ns-share-room-code">{shortId}</code>
      </div>
    </div>
  )
}

function NotesLiveCursors() {
  const others = useOthers()

  return (
    <div className="ns-live-cursors" aria-hidden="true">
      {others.map((other) => {
        const cursor = other.presence?.cursor
        if (!cursor) return null

        const user = other.presence?.user || {}
        const color = user.color || '#7C3AED'

        return (
          <div
            key={other.connectionId}
            className="ns-live-cursor"
            style={{
              transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
              '--cursor-color': color,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 3L18 11.2L11.4 12.7L8.2 18.7L4 3Z" fill={color} stroke="white" strokeWidth="1.4" />
            </svg>
            <span className="ns-live-cursor-name">{user.name || 'Peer'}</span>
            {other.presence?.cursorChat && (
              <span className="ns-live-cursor-chat">{other.presence.cursorChat}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function NotesCommentNotifications({ threads, onOpenComments }) {
  const [toasts, setToasts] = useState([])
  const seenRef = useRef(new Set())
  const initializedRef = useRef(false)

  useEffect(() => {
    const currentThreadIds = new Set((threads || []).map((thread) => thread.id))

    if (!initializedRef.current) {
      seenRef.current = currentThreadIds
      initializedRef.current = true
      return
    }

    const newThreads = (threads || []).filter((thread) => !seenRef.current.has(thread.id))
    if (newThreads.length) {
      newThreads.forEach((thread) => seenRef.current.add(thread.id))
      setToasts((prev) => [
        ...newThreads.map((thread) => ({
          id: thread.id,
          title: 'New comment',
          body: 'A collaborator added a note comment.',
        })),
        ...prev,
      ].slice(0, 3))
    }

    seenRef.current = currentThreadIds
  }, [threads])

  useEffect(() => {
    if (!toasts.length) return undefined
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1))
    }, 4500)
    return () => window.clearTimeout(timer)
  }, [toasts])

  if (!toasts.length) return null

  return (
    <div className="ns-comment-toasts">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className="ns-comment-toast"
          onClick={() => {
            onOpenComments?.()
            setToasts((prev) => prev.filter((item) => item.id !== toast.id))
          }}
        >
          <span className="ns-comment-toast-icon">#</span>
          <span>
            <strong>{toast.title}</strong>
            <small>{toast.body}</small>
          </span>
        </button>
      ))}
    </div>
  )
}

function NotesCommentsPanel({ open, threads = [], onClose }) {
  if (!open) return null

  const openThreads = threads.filter((thread) => !thread.resolved)
  const resolvedThreads = threads.filter((thread) => thread.resolved)

  return (
    <aside className="ns-comments-panel">
      <div className="ns-comments-head">
        <div>
          <strong>Comments</strong>
          <span>{openThreads.length} open</span>
        </div>
        <button type="button" className="ns-icon-close" onClick={onClose} aria-label="Close comments">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="ns-comments-hint">
        Highlight text and use the comment button in the floating toolbar to anchor a new thread.
      </div>

      <div className="ns-comments-list">
        {!threads.length && (
          <div className="ns-comments-empty">
            <strong>No comments yet</strong>
            <span>Threads created in this note will appear here live.</span>
          </div>
        )}
        {openThreads.map((thread) => (
          <Thread key={thread.id} thread={thread} />
        ))}
        {!!resolvedThreads.length && (
          <details className="ns-resolved-comments">
            <summary>{resolvedThreads.length} resolved</summary>
            {resolvedThreads.map((thread) => (
              <Thread key={thread.id} thread={thread} />
            ))}
          </details>
        )}
      </div>
    </aside>
  )
}

function Cursor({ color, x, y, name, chat }) {
  return (
    <div
      className="ns-cursor"
      style={{
        transform: `translateX(${x}px) translateY(${y}px)`,
        position: 'fixed',
        top: 0, left: 0, pointerEvents: 'none', zIndex: 9999, transition: 'transform 0.1s cubic-bezier(0.2, 0, 0, 1)'
      }}
    >
      <svg width="24" height="36" viewBox="0 0 24 36" fill={color} stroke="white" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(-20deg)', transformOrigin: 'top left' }}>
        <path d="M5.65376 21.2087C5.46734 21.6508 4.82903 21.5794 4.7508 21.1077L2.14818 5.37243C2.06203 4.85172 2.52841 4.38533 3.04913 4.47149L18.7844 7.07411C19.256 7.15234 19.3274 7.79066 18.8853 7.97708L12.5976 10.6276L10.6276 12.5976L5.65376 21.2087Z"/>
      </svg>
      <div className="ns-cursor-name" style={{ backgroundColor: color }}>
        {name}
      </div>
      {chat && (
        <div className="ns-cursor-chat-bubble" style={{ backgroundColor: color }}>
          {chat}
        </div>
      )}
    </div>
  )
}

function CursorOverlay() {
  const others = useOthers()
  return (
    <>
      {others.map(({ connectionId, presence }) => {
        if (!presence?.cursor) return null
        return (
          <Cursor
            key={connectionId}
            color={presence.user?.color || '#000'}
            x={presence.cursor.x}
            y={presence.cursor.y}
            name={presence.user?.name || 'Anonymous'}
            chat={presence.cursorChat}
          />
        )
      })}
    </>
  )
}

function LiveCursorChat({ user }) {
  const [message, setMessage] = useState('')
  const updateMyPresence = useUpdateMyPresence()
  const clearTimerRef = useRef(null)

  const sendCursorChat = (event) => {
    event.preventDefault()
    const text = message.trim()
    if (!text) return

    updateMyPresence({ cursorChat: text })
    setMessage('')

    window.clearTimeout(clearTimerRef.current)
    clearTimerRef.current = window.setTimeout(() => {
      updateMyPresence({ cursorChat: null })
    }, 5000)
  }

  useEffect(() => {
    return () => window.clearTimeout(clearTimerRef.current)
  }, [])

  return (
    <form className="ns-cursor-chat" onSubmit={sendCursorChat}>
      <span>{(user?.user_metadata?.full_name || user?.email || 'You').charAt(0).toUpperCase()}</span>
      <input
        value={message}
        maxLength={80}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Cursor chat"
        aria-label="Live cursor chat"
      />
      <button type="submit" disabled={!message.trim()} aria-label="Send cursor chat">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </form>
  )
}

function getEditorSelectionText(editor) {
  if (!editor) return ''
  const { from, to } = editor.state.selection
  return editor.state.doc.textBetween(from, to, ' ').trim()
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function markdownToEditorHtml(text) {
  const lines = String(text || '').split(/\n+/)
  const blocks = []
  let listItems = []

  const flushList = () => {
    if (!listItems.length) return
    blocks.push(`<ul>${listItems.map(item => `<li><p>${parseInlineStyles(item)}</p></li>`).join('')}</ul>`)
    listItems = []
  }

  const parseInlineStyles = (str) => {
    let parsed = escapeHtml(str)
    // Images: ![alt](url)
    parsed = parsed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    // Bold: **text**
    parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic: *text*
    parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Inline Code: `text`
    parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>')
    return parsed
  }

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)/)
    const numbered = trimmed.match(/^\d+\.\s+(.+)/)
    if (bullet || numbered) {
      listItems.push((bullet || numbered)[1])
      return
    }

    flushList()
    if (trimmed.startsWith('### ')) blocks.push(`<h3>${parseInlineStyles(trimmed.slice(4))}</h3>`)
    else if (trimmed.startsWith('## ')) blocks.push(`<h2>${parseInlineStyles(trimmed.slice(3))}</h2>`)
    else if (trimmed.startsWith('# ')) blocks.push(`<h1>${parseInlineStyles(trimmed.slice(2))}</h1>`)
    else blocks.push(`<p>${parseInlineStyles(trimmed)}</p>`)
  })

  flushList()
  return blocks.join('') || '<p></p>'
}

function findTextRange(editor, text) {
  if (!editor || !text) return null
  let found = null
  editor.state.doc.descendants((node, pos) => {
    if (found || !node.isText) return
    const index = node.text.indexOf(text)
    if (index >= 0) found = { from: pos + index, to: pos + index + text.length }
  })
  return found
}

function promptShouldEditDocument(prompt) {
  // Only trigger document editing for very explicit "write/insert/add to note" commands
  // General questions like "summarize this", "explain", "quiz me" should just chat normally
  return /\b(write (this|that|a|an|the)|add (this|that|it) to (the |my )?(note|doc)|insert (this|that|into)|draft (this|a|an)|put (this|that) in (the |my )?(note|doc)|update (the |my )?(note|doc)|rewrite (the |my )?(note|doc)|improve (the |my )?(note|doc))\b/i.test(prompt)
}

function getDocumentAiPrompt(userPrompt, editor) {
  const noteText = editor?.getText?.()?.trim() || ''
  const noteHtml = editor?.getHTML?.() || ''
  const selection = getEditorSelectionText(editor)
  return [
    'You are Luter AI editing a collaborative study note.',
    'Return only the content that should be inserted into the document.',
    'Do not include preambles like "Done", "Here is", or explanations outside the requested content.',
    'Use concise headings, bullets, and useful study structure when helpful.',
    '',
    `User request: ${userPrompt}`,
    selection ? `\nSelected text:\n${selection}` : '',
    noteText ? `\nFull note text:\n${noteText.slice(0, 10000)}` : '\nThe current note is empty.',
    noteHtml ? `\nCurrent note HTML:\n${noteHtml.slice(0, 12000)}` : '',
  ].join('\n')
}

async function runSelectionAiAction(editor, action) {
  const selectedText = getEditorSelectionText(editor)
  const sourceText = selectedText || editor?.getText()?.trim()
  if (!editor || !sourceText) return

  const prompts = {
    explain: `Explain this study note clearly and briefly:\n\n${sourceText}`,
    summarize: `Summarize this selection into concise study bullets:\n\n${sourceText}`,
    quiz: `Create 3 quick quiz questions from this note selection. Include answers:\n\n${sourceText}`,
  }

  const response = await callGroqAPI(
    [{ role: 'user', content: prompts[action] }],
    GROQ_MODELS.PROFESSOR,
    { temperature: 0.55 }
  )
  const text = response?.choices?.[0]?.message?.content || ''
  if (text.trim()) {
    editor.chain().focus().insertContent(`<blockquote><p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p></blockquote>`).run()
  }
}

function SelectionAiActions({ editor, user, profile }) {
  const [loadingAction, setLoadingAction] = useState(null)

  const handleAction = async (action) => {
    if (!editor || loadingAction) return
    setLoadingAction(action)
    try {
      const cost = action === 'explain' ? CREDIT_COSTS.EXPLAIN_TEXT : action === 'summarize' ? CREDIT_COSTS.GENERATE_SUMMARY : CREDIT_COSTS.GENERATE_QUIZ
      const { ok } = await checkAndDeductCredits(user?.id, cost, profile?.is_premium)
      if (!ok) {
        console.warn('[Credits] Insufficient credits for', action)
        setLoadingAction(null)
        return
      }
      await runSelectionAiAction(editor, action)
    } catch (error) {
      console.error('AI toolbar action failed:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="ns-lb-ai-actions">
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleAction('explain')} disabled={!!loadingAction}>
        <WandSparkles size={13} />
        {loadingAction === 'explain' ? 'Thinking' : 'Explain'}
      </button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleAction('summarize')} disabled={!!loadingAction}>
        <Pilcrow size={13} />
        {loadingAction === 'summarize' ? 'Thinking' : 'Summarize'}
      </button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleAction('quiz')} disabled={!!loadingAction}>
        <FileQuestion size={13} />
        {loadingAction === 'quiz' ? 'Thinking' : 'Quiz'}
      </button>
    </div>
  )
}

function NativeDocumentToolbar({ editor, workstationMode = false }) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!editor) return undefined
    const update = () => forceUpdate((value) => value + 1)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  const run = (callback) => {
    if (!editor) return
    callback()
    editor.commands.focus()
  }

  const addComment = () => {
    if (!editor) return
    try {
      editor.chain().focus().addPendingComment().run()
    } catch (error) {
      console.warn('Could not open Liveblocks comment composer:', error)
    }
  }

  const buttons = [
    { id: 'undo', label: 'Undo', icon: Undo2, disabled: !editor?.can().undo?.(), action: () => editor.chain().focus().undo().run() },
    { id: 'redo', label: 'Redo', icon: Redo2, disabled: !editor?.can().redo?.(), action: () => editor.chain().focus().redo().run() },
    { type: 'divider' },
    { id: 'bold', label: 'Bold', icon: Bold, active: editor?.isActive('bold'), action: () => editor.chain().focus().toggleBold().run() },
    { id: 'italic', label: 'Italic', icon: Italic, active: editor?.isActive('italic'), action: () => editor.chain().focus().toggleItalic().run() },
    { id: 'underline', label: 'Underline', icon: UnderlineIcon, active: editor?.isActive('underline'), action: () => editor.chain().focus().toggleUnderline().run() },
    { id: 'strike', label: 'Strikethrough', icon: Strikethrough, active: editor?.isActive('strike'), action: () => editor.chain().focus().toggleStrike().run() },
    { id: 'highlight', label: 'Highlight', icon: Highlighter, active: editor?.isActive('highlight'), action: () => editor.chain().focus().toggleHighlight({ color: '#C4B5FD' }).run() },
    { type: 'divider' },
    { id: 'h1', label: 'Heading 1', icon: Heading1, active: editor?.isActive('heading', { level: 1 }), action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { id: 'h2', label: 'Heading 2', icon: Heading2, active: editor?.isActive('heading', { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { id: 'quote', label: 'Quote', icon: Quote, active: editor?.isActive('blockquote'), action: () => editor.chain().focus().toggleBlockquote().run() },
    { id: 'code', label: 'Code block', icon: Code2, active: editor?.isActive('codeBlock'), action: () => editor.chain().focus().toggleCodeBlock().run() },
    { type: 'divider' },
    { id: 'bullet', label: 'Bullet list', icon: List, active: editor?.isActive('bulletList'), action: () => editor.chain().focus().toggleBulletList().run() },
    { id: 'ordered', label: 'Numbered list', icon: ListOrdered, active: editor?.isActive('orderedList'), action: () => editor.chain().focus().toggleOrderedList().run() },
    { id: 'task', label: 'Task list', icon: ListChecks, active: editor?.isActive('taskList'), action: () => editor.chain().focus().toggleTaskList().run() },
    { type: 'divider' },
    { id: 'table', label: 'Insert table', icon: Table2, action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { id: 'comment', label: 'Comment', icon: MessageSquarePlus, action: addComment },
  ]

  return (
    <div className={`ns-native-toolbar ${workstationMode ? 'workstation-toolbar' : ''}`} aria-label="Document toolbar">
      {buttons.map((item, index) => {
        if (item.type === 'divider') return <span key={`divider-${index}`} className="ns-native-divider" />
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            className={item.active ? 'active' : ''}
            disabled={!editor || item.disabled}
            onClick={() => run(item.action)}
            style={workstationMode ? { color: '#111827' } : {}}
          >
            <Icon size={workstationMode ? 18 : 16} strokeWidth={workstationMode ? 2 : 2.25} />
          </button>
        )
      })}
    </div>
  )
}

// ─── Live Note Editor ──────────────────────────────────────────────────────────
export function LiveNoteEditor({ title, roomId, displayName, user, profile, isSharedLink = false, hideHeader = false, workstationMode = false, emptyState = null, onOpenAiChat }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isAiChatRoute = location.pathname.includes('/ai-chat')

  const status = useStatus()
  const isStorageReady = status === 'connected' || status === 'reconnecting'
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 760)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 760)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const [aiOpen, setAiOpen] = useState(isAiChatRoute)
  const [aiMode, setAiMode] = useState(isAiChatRoute || isMobile ? 'fullscreen' : 'sidebar')
  const [aiPanelWidth, setAiPanelWidth] = useState(380)
  const [shareOpen, setShareOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [pendingComment, setPendingComment] = useState(null)
  
  // Auto-switch AI mode based on screen size
  useEffect(() => {
    if (isMobile && aiMode === 'sidebar') setAiMode('fullscreen')
  }, [isMobile, aiMode])

  const others = useOthers()
  const self = useSelf()
  const syncStatus = useSyncStatus({ smooth: true })
  const updateMyPresence = useUpdateMyPresence()
  const localUserInfo = useMemo(() => ({
    id: user?.id || 'guest',
    name: displayName || 'Scholar',
    avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || null,
    color: colorFromId(user?.id || displayName),
    role: 'editor',
  }), [displayName, profile?.avatar_url, user?.id, user?.user_metadata?.avatar_url])
  
  const { threads, setActiveThreadId } = useComments() || { threads: [] };
  
  const noteTitle = useStorage((root) => root.noteTitle)
  const noteIcon = useStorage((root) => root.noteIcon) || '📄'
  const noteCover = useStorage((root) => root.noteCover) || null
  
  const saveTimeoutRef = useRef(null)
  const latestHtmlRef = useRef('<p></p>')
  const hydratedFromSupabaseRef = useRef(false)
  const supabaseNoteReadyRef = useRef(false)
  const noteId = roomId.split(':').pop()

  const rememberLocalNote = useCallback((html) => {
    if (!user?.id) return
    const finalTitle = ((noteTitle !== undefined ? noteTitle : title) || 'Untitled Note').trim() || 'Untitled Note'
    const contentHtml = html || '<p></p>'
    const noteSnapshot = {
      id: noteId,
      title: finalTitle,
      icon: noteIcon || '📄',
      cover_url: noteCover || null,
      content_html: contentHtml,
      content: contentHtml,
      updated_at: new Date().toISOString(),
      shared: isSharedLink,
    }

    cacheNoteDraft(user.id, noteId, noteSnapshot)
    if (isSharedLink) upsertSharedNote(user.id, noteSnapshot)
  }, [isSharedLink, noteCover, noteIcon, noteId, noteTitle, title, user?.id])

  const saveToSupabase = useCallback((html) => {
    if (!user?.id) return Promise.resolve()
    if (isSharedLink) return Promise.resolve()
    if (!supabaseNoteReadyRef.current) return Promise.resolve()
    const finalTitle = (noteTitle !== undefined ? noteTitle : title) || 'Untitled Note'
    const contentHtml = html || '<p></p>'
    
    return supabase.from('notes').upsert({
      id: noteId,
      user_id: user.id,
      title: finalTitle,
      icon: noteIcon || '📄',
      cover_url: noteCover || null,
      content_html: contentHtml,
      content: contentHtml,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.error("Error saving to Supabase:", error)
    })
  }, [user?.id, isSharedLink, noteId, noteTitle, title, noteIcon, noteCover])
  

  const setTitleStorage = useMutation(({ storage }, newTitle) => {
    storage.set('noteTitle', newTitle)
  }, [])
  
  const setIcon = useMutation(({ storage }, icon) => {
    storage.set('noteIcon', icon)
  }, [])
  
  const setCover = useMutation(({ storage }, cover) => {
    storage.set('noteCover', cover)
  }, [])

  const [showIconMenu, setShowIconMenu] = useState(false)
  const [showCoverMenu, setShowCoverMenu] = useState(false)
  
  const safeSetTitleStorage = useCallback((newTitle) => {
    if (!isStorageReady) return
    setTitleStorage(newTitle)
  }, [isStorageReady, setTitleStorage])

  const safeSetIcon = useCallback((icon) => {
    if (!isStorageReady) return
    setIcon(icon)
  }, [isStorageReady, setIcon])

  const safeSetCover = useCallback((cover) => {
    if (!isStorageReady) return
    setCover(cover)
  }, [isStorageReady, setCover])
  
  const EMOJIS = ['📄', '🔥', '✨', '🚀', '💡', '📚', '🧠', '✍️', '🎮', '🎨', '🎯', '🌟']
  const COVERS = [
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
    null // option to remove cover
  ]

  // Ensure states sync with URL
  useEffect(() => {
    if (isAiChatRoute) {
      setAiOpen(true)
      setAiMode('fullscreen')
    } else {
      if (aiMode === 'fullscreen') {
        setAiMode('sidebar')
      }
    }
  }, [isAiChatRoute])

  const SpaceAiTrigger = Extension.create({
    name: 'spaceAiTrigger',
    addKeyboardShortcuts() {
      return {
        'Space': () => {
          const { empty, $anchor } = this.editor.state.selection
          // Only trigger on empty paragraphs at the start of the line
          if (empty && $anchor.parent.content.size === 0 && $anchor.parent.type.name === 'paragraph') {
            if (onOpenAiChat) {
              onOpenAiChat()
            } else {
              setAiOpen(true)
            }
            return true // Prevent default space insertion
          }
          return false
        }
      }
    }
  })

  const { yDoc, provider, awareness } = useCollaboration();
  const yjsCollab = yDoc ? Collaboration.configure({ document: yDoc }) : null;
  const yjsCursor = (yDoc && awareness) ? CollaborationCursor.configure({
    provider: { awareness }, // Tiptap expects an object with an 'awareness' property
    user: {
      name: localUserInfo.name,
      color: localUserInfo.color,
      avatar: localUserInfo.avatar
    }
  }) : null;

  const editor = useEditor({
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      latestHtmlRef.current = editor.getHTML()
      rememberLocalNote(latestHtmlRef.current)
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        saveToSupabase(latestHtmlRef.current)
      }, 2000)
    },
    onSelectionUpdate: ({ editor }) => {
      const isComment = editor.isActive('comment');
      if (isComment) {
        const attributes = editor.getAttributes('comment');
        if (attributes.threadId) {
          setCommentsOpen(true);
          if (setActiveThreadId) setActiveThreadId(attributes.threadId);
        }
      } else {
        // If they click away, we don't necessarily need to close the panel, but we might want to clear the active thread if they aren't typing a reply
        // if (setActiveThreadId) setActiveThreadId(null);
      }
    },
    extensions: [
      yjsCollab,
      yjsCursor,
      CommentExtension,
      StarterKit.configure({ history: false, undoRedo: false, link: false, underline: false }),
      Placeholder.configure({
        placeholder: "Press 'space' for AI or '/' for commands...",
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      Image,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Typography,
      SlashCommand,
      MentionStub,
      SpaceAiTrigger,
    ],
    editorProps: { attributes: { class: 'ns-prosemirror' } },
  })

  useEffect(() => {
    updateMyPresence({
      user: localUserInfo,
      status: 'active',
    })

    if (editor?.commands?.updateUser) {
      editor.commands.updateUser({
        name: localUserInfo.name,
        color: localUserInfo.color,
        avatar: localUserInfo.avatar,
      })
    }
  }, [editor, localUserInfo, updateMyPresence])

  useEffect(() => {
    if (!editor || !user?.id || !isStorageReady || hydratedFromSupabaseRef.current) return
    hydratedFromSupabaseRef.current = true
    if (isSharedLink) {
      supabaseNoteReadyRef.current = true
      const cached = loadCachedNoteDraft(user.id, noteId)
      const cachedHtml = cached?.content_html || cached?.content
      if (cachedHtml && editor.isEmpty) {
        latestHtmlRef.current = cachedHtml
        editor.commands.setContent(cachedHtml)
      } else {
        latestHtmlRef.current = editor.getHTML()
      }
      rememberLocalNote(latestHtmlRef.current)
      return
    }
    const cached = loadCachedNoteDraft(user.id, noteId)
    if (cached?.title) safeSetTitleStorage(cached.title)
    if (cached?.icon) safeSetIcon(cached.icon)
    if (cached?.cover_url !== undefined) safeSetCover(cached.cover_url)
    const cachedHtml = cached?.content_html || cached?.content
    if (cachedHtml && editor.isEmpty) {
      latestHtmlRef.current = cachedHtml
      editor.commands.setContent(cachedHtml)
    }

    supabase
      .from('notes')
      .select('title, icon, cover_url, content_html, content')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading note from Supabase:', error)
          supabaseNoteReadyRef.current = true
          return
        }

        supabaseNoteReadyRef.current = true

        if (data?.title) safeSetTitleStorage(data.title)
        if (data?.icon) safeSetIcon(data.icon)
        if (data?.cover_url !== undefined) safeSetCover(data.cover_url)

        const savedHtml = data?.content_html || data?.content
        if (savedHtml && editor.isEmpty) {
          latestHtmlRef.current = savedHtml
          editor.commands.setContent(savedHtml)
        }
        if (savedHtml) rememberLocalNote(savedHtml)

        if (!data) {
          latestHtmlRef.current = editor.getHTML()
          rememberLocalNote(latestHtmlRef.current)
          saveToSupabase(latestHtmlRef.current)
        }
      })
  }, [editor, isSharedLink, noteId, rememberLocalNote, saveToSupabase, setCover, setIcon, setTitleStorage, user?.id])

  useEffect(() => {
    if (!editor || !user?.id) return

    const flushSave = () => {
      clearTimeout(saveTimeoutRef.current)
      latestHtmlRef.current = editor.getHTML()
      rememberLocalNote(latestHtmlRef.current)
      saveToSupabase(latestHtmlRef.current)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushSave()
    }

    window.addEventListener('pagehide', flushSave)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', flushSave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      flushSave()
    }
  }, [editor, rememberLocalNote, saveToSupabase, user?.id])

  // Save when metadata changes
  useEffect(() => {
    if (editor) {
       latestHtmlRef.current = editor.getHTML()
       rememberLocalNote(latestHtmlRef.current)
       clearTimeout(saveTimeoutRef.current)
       saveTimeoutRef.current = setTimeout(() => {
         saveToSupabase(latestHtmlRef.current)
       }, 2000)
    }
  }, [noteTitle, noteIcon, noteCover, rememberLocalNote, saveToSupabase, editor])
  
  const [isSaving, setIsSaving] = useState(false)
  const handleManualSave = async () => {
    if (!editor) return
    setIsSaving(true)
    const html = editor.getHTML()
    latestHtmlRef.current = html
    rememberLocalNote(html)
    await saveToSupabase(html)
    setTimeout(() => setIsSaving(false), 800)
  }

  const totalUsers = others.length + (self ? 1 : 0)
  const openCommentCount = threads.filter((thread) => !thread.resolved).length
  const currentNoteTitle = (noteTitle ?? title ?? '').trim() || 'Untitled Note'
  const isSyncing = syncStatus === 'synchronizing'
  const connectionLabel = status === 'connected'
    ? (isSyncing ? 'Syncing' : `${totalUsers}`)
    : status === 'connecting' ? 'Connecting...' : 'Offline'
  const connectionTitle = status === 'connected'
    ? (isSyncing ? 'Saving queued Liveblocks changes' : `${totalUsers} online`)
    : status === 'connecting' ? 'Connecting' : 'Offline changes are cached locally and will sync when possible'

  const toggleCommentsPanel = useCallback(() => {
    setCommentsOpen((value) => {
      const next = !value
      if (next) {
        setAiOpen(false)
        setShareOpen(false)
      }
      return next
    })
  }, [])

  const toggleAiPanel = useCallback(() => {
    setAiOpen((value) => {
      const next = !value
      if (next) {
        setCommentsOpen(false)
        setShareOpen(false)
      }
      return next
    })
  }, [])

  const toggleSharePanel = useCallback(() => {
    setShareOpen((value) => {
      const next = !value
      if (next) {
        setAiOpen(false)
        setCommentsOpen(false)
      }
      return next
    })
  }, [])

  const updateCursorPresence = useCallback((event) => {
    updateMyPresence({
      cursor: {
        x: event.clientX,
        y: event.clientY,
      },
      status: 'active',
    })
  }, [updateMyPresence])

  const clearCursorPresence = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  useEffect(() => clearCursorPresence, [clearCursorPresence])

  return (
    <div
      className={`ns-page ${aiOpen && !commentsOpen ? 'ns-ai-open' : ''} ${aiMode === 'fullscreen' ? 'ns-ai-fullscreen' : ''}`}
      onPointerMove={updateCursorPresence}
      onPointerLeave={clearCursorPresence}
    >
      <CursorOverlay />
      <NotesLiveCursors />
      <NotesCommentNotifications threads={threads} onOpenComments={toggleCommentsPanel} />
      {/* ── Top Bar ── */}
      {!hideHeader && (
        <header className="ns-topbar">
          {/* Left: Breadcrumbs + Exit on mobile */}
        <div className="ns-breadcrumbs">
          {isMobile && (
            <button
              className="ns-exit-btn"
              onClick={() => navigate('/dashboard/notes')}
              aria-label="Exit note"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Exit
            </button>
          )}
          {!isMobile && <span className="ns-bc-item">Scholar</span>}
          {!isMobile && <span className="ns-bc-sep">/</span>}
          {!isMobile && <span className="ns-bc-item active">{currentNoteTitle}</span>}
          {isMobile && (
            <span
              className={`ns-status-dot ${isSyncing ? 'connecting' : status}`}
              style={{ marginLeft: 6, flexShrink: 0 }}
              title={connectionTitle}
            />
          )}
        </div>

        {/* Center: Status */}
        <div
          className="ns-topbar-center"
          title={connectionTitle}
        >
          <span className={`ns-status-dot ${isSyncing ? 'connecting' : status}`} />
          <span className="ns-status-text" data-sync-label={connectionLabel}>
            {status === 'connected'
              ? totalUsers
              : status === 'connecting' ? 'Connecting…' : 'Offline'}
          </span>
        </div>

        {/* Right: Avatars + Share + AI */}
        <div className="ns-topbar-right">
          <div className="ns-avatars">
            {others.slice(0, 4).map(other => (
              <div
                key={other.connectionId}
                className="ns-avatar"
                style={{ backgroundColor: other.presence?.user?.color || '#C4B5FD' }}
                title={other.presence?.user?.name || 'Peer'}
              >
                {(other.presence?.user?.name || 'P').charAt(0).toUpperCase()}
              </div>
            ))}
            {self && (
              <div
                className="ns-avatar ns-avatar-me"
                style={{ backgroundColor: self.presence?.user?.color || '#98FF98' }}
                title={`${self.presence?.user?.name || 'You'} (you)`}
              >
                {(self.presence?.user?.name || 'Y').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="ns-share-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="ns-share-btn" onClick={handleManualSave} disabled={isSaving}>
              {isSaving ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              )}
              {!isMobile && (isSaving ? 'Saving...' : 'Save')}
            </button>

            <div style={{ position: 'relative' }}>
              <button
                className={`ns-share-btn ${shareOpen ? 'active' : ''}`}
                onClick={toggleSharePanel}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                {!isMobile && 'Share'}
              </button>
              {shareOpen && <ShareDropdown roomId={roomId} onClose={() => setShareOpen(false)} />}
            </div>
          </div>

          <button
            className={`ns-comments-toggle ${commentsOpen ? 'active' : ''}`}
            onClick={toggleCommentsPanel}
            title="Comments"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
            <span>Comments</span>
            {!!openCommentCount && <b>{openCommentCount}</b>}
          </button>

          <button
            className={`ns-ai-toggle-btn ${aiOpen && !commentsOpen ? 'active' : ''}`}
            onClick={toggleAiPanel}
            title="Ask AI"
          >
            <span className="ns-ai-sparkle">✦</span>
            <span>Ask AI</span>
          </button>
        </div>
      </header>
      )}

      {(!hideHeader || workstationMode) && <NativeDocumentToolbar editor={editor} workstationMode={workstationMode} />}

      {/* ── Body: Editor + Comments ── */}
      <div className={`ns-body-row${aiOpen && !commentsOpen && aiMode === 'sidebar' ? ' ns-ai-sidebar-open' : ''} ${workstationMode ? 'workstation-mode' : ''}`}>
        <div className="ns-body">
          {/* Editor */}
          <main className="ns-main" style={{ paddingRight: aiOpen && !commentsOpen && aiMode === 'sidebar' ? 0 : undefined }}>
            <div className="ns-editor-wrap">
              {noteCover && (
                <div className="ns-page-cover" style={{ backgroundImage: `url(${noteCover})` }}></div>
              )}
              {/* Clean Notion Header */}
              <div className={`ns-page-clean-header ${noteCover ? 'has-cover' : ''}`}>
                <div className="ns-page-icon-display" onClick={() => setShowIconMenu(!showIconMenu)}>
                  {noteIcon}
                </div>
                <div className="ns-page-controls">
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowIconMenu(!showIconMenu)}>☺ Change icon</button>
                    {showIconMenu && (
                      <div className="ns-icon-picker">
                        {EMOJIS.map(e => <button key={e} onClick={() => { safeSetIcon(e); setShowIconMenu(false) }}>{e}</button>)}
                      </div>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowCoverMenu(!showCoverMenu)}>🖼️ Change cover</button>
                    {showCoverMenu && (
                      <div className="ns-cover-picker">
                        {COVERS.map((c, i) => (
                          <button key={i} onClick={() => { safeSetCover(c); setShowCoverMenu(false) }}>
                            {c ? <div style={{width:40,height:20,background:`url(${c}) center/cover`}}/> : 'Remove'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  className="ns-page-h1-input"
                  placeholder="Untitled Note"
                  value={noteTitle ?? title ?? ''}
                  onChange={e => safeSetTitleStorage(e.target.value)}
                />
              </div>

              <div className="ns-paper">
                <EditorContent editor={editor} />
                {editor?.isEmpty && emptyState && (typeof emptyState === 'function' ? emptyState(editor) : emptyState)}
              </div>
              {editor && (
                <BubbleMenu editor={editor} className="ns-bubble-menu shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 flex items-center gap-1" tippyOptions={{ duration: 100, maxWidth: 500 }}>
                  <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100 text-gray-700 dark:text-gray-300'}`}>
                    <Bold size={15} />
                  </button>
                  <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100 text-gray-700 dark:text-gray-300'}`}>
                    <Italic size={15} />
                  </button>
                  <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded-lg transition-colors ${editor.isActive('underline') ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100 text-gray-700 dark:text-gray-300'}`}>
                    <UnderlineIcon size={15} />
                  </button>
                  <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100 text-gray-700 dark:text-gray-300'}`}>
                    <Strikethrough size={15} />
                  </button>
                  
                  <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
                  
                  <button 
                    onClick={() => {
                      const { from, to } = editor.state.selection;
                      const text = editor.state.doc.textBetween(from, to, ' ');
                      if (!text.trim()) return;
                      const newThreadId = crypto.randomUUID();
                      editor.chain().focus().setComment(newThreadId).run();
                      setPendingComment({ threadId: newThreadId, quote: text });
                      setCommentsOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    <MessageSquarePlus size={15} />
                    Comment
                  </button>

                  <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
                  
                  <SelectionAiActions editor={editor} user={user} profile={profile} />
                </BubbleMenu>
              )}
            </div>
            <LiveCursorChat user={user} />
          </main>

          <CommentsPane
            isOpen={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            user={user}
            profile={profile}
            pendingComment={pendingComment}
            setPendingComment={setPendingComment}
          />
        </div>

        {/* AI Panel in SIDEBAR mode sits here, inside the row wrapper */}
        {aiOpen && !commentsOpen && aiMode === 'sidebar' && !workstationMode && (
          <AiChatPanel
            isOpen={aiOpen}
            onClose={() => setAiOpen(false)}
            mode={aiMode}
            setMode={setAiMode}
            editor={editor}
            currentNoteId={roomId.split(':').pop()}
            panelWidth={aiPanelWidth}
            setPanelWidth={setAiPanelWidth}
            user={user}
            profile={profile}
          />
        )}
      </div>

      {/* AI Panel in FLOATING or FULLSCREEN mode — outside the row, uses fixed positioning */}
      {aiOpen && !commentsOpen && aiMode !== 'sidebar' && !workstationMode && (
        <AiChatPanel
          isOpen={aiOpen}
          onClose={() => setAiOpen(false)}
          mode={aiMode}
          setMode={setAiMode}
          editor={editor}
          currentNoteId={roomId.split(':').pop()}
          panelWidth={aiPanelWidth}
          setPanelWidth={setAiPanelWidth}
          user={user}
          profile={profile}
        />
      )}
    </div>
  )
}

// ─── Root Page ─────────────────────────────────────────────────────────────────
export default function NotesStudioPage() {
  const { user, profile } = useOutletContext() || {}
  const [searchParams, setSearchParams] = useSearchParams()
  const [fallbackId] = useState(() => {
    const stored = sessionStorage.getItem('luter-note-fallback-id')
    if (stored) return stored
    const id = crypto.randomUUID()  // full UUID, no truncation
    sessionStorage.setItem('luter-note-fallback-id', id)
    return id
  })

  // Derive exact room ID
  const noteIdRaw = searchParams.get('note') || searchParams.get('materialId') || fallbackId
  const roomId = useMemo(() => `luter:notes:${noteIdRaw}`, [noteIdRaw])

  const location = useLocation()
  const isAiChatRootRoute = location.pathname === '/dashboard/ai-chat' || location.pathname === '/ai-chat'

  // Automatically update the URL if ?note= is missing so link sharing works perfectly
  // — but NOT on the /ai-chat route, where we never want a ?note= in the URL
  useEffect(() => {
    if (isAiChatRootRoute) return
    if (!searchParams.has('note')) {
      const newParams = new URLSearchParams(searchParams)
      newParams.set('note', noteIdRaw)
      setSearchParams(newParams, { replace: true })
    }
  }, [noteIdRaw, searchParams, setSearchParams, isAiChatRootRoute])

  const title = searchParams.get('materialTitle') || 'Untitled Note'
  const displayName = getUserDisplayName(user, profile)
  const isSharedLink = searchParams.get('shared') === '1'

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        cursorChat: null,
        status: 'active',
        currentTool: 'notes',
        user: {
          id: user?.id || 'guest',
          name: displayName,
          avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || null,
          color: colorFromId(user?.id || displayName),
          role: 'editor',
        },
      }}
      initialStorage={{
        noteTitle: title || 'Untitled Note',
        noteIcon: '📄',
        noteCover: null
      }}
    >
      <ClientSideSuspense fallback={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', width: '100%', color: '#7C3AED', fontFamily: 'DM Sans' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg><div>Loading Note...</div></div>}>
        <CommentsProvider roomId={roomId}>
          <LiveNoteEditor title={title} roomId={roomId} displayName={displayName} user={user} profile={profile} isSharedLink={isSharedLink} />
        </CommentsProvider>
      </ClientSideSuspense>
    </RoomProvider>
  )
}
