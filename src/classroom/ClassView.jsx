import React, { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import {
  Plus, ArrowCounterClockwise, ChatsTeardrop, List,
  Clock, BookOpen, CheckSquareOffset, Folder, GearSix, DotsNine, DotsThreeVertical,
  Sparkle, Users, Copy, Check, PaperPlaneRight, X, CalendarBlank,
  ClipboardText, Question, BookBookmark, Repeat, UserPlus, SortAscending, Paperclip,
  MagnifyingGlass, Microphone, ThumbsUp, ThumbsDown, Lightning, Phone, ArrowSquareOut, ChatCircle, ArrowLeft
} from '@phosphor-icons/react';
import '../components/dashboard/SidebarRedesign.css';
import { callGroqAPI, GROQ_MODELS } from '../groqClient';
import ClassroomSidebar from './ClassroomSidebar';
import { useSessionStore } from '../store/useSessionStore';
import { supabase } from '../supabaseClient';
import DirectMessageChat from './DirectMessageChat';
import InviteMemberModal from './InviteMemberModal';
import ClassroomCalendar from './ClassroomCalendar';
import ClassroomWorkspace from './ClassroomWorkspace';
import VoiceChatWidget from '../components/dashboard/VoiceChatWidget';
import { Whiteboard } from '../components/dashboard/Whiteboard';
import { LiveNoteEditor } from '../components/dashboard/NotesStudioPage';
import WorkstationFlashcards from '../components/dashboard/WorkstationFlashcards';
import WorkstationQuizzes from '../components/dashboard/WorkstationQuizzes';
import MaterialRenderer from '../components/dashboard/MaterialRenderer';
import AnnotationToolbar from '../components/dashboard/AnnotationToolbar';
import { RoomProvider } from '../components/dashboard/CollaborationProvider';
import { CommentsProvider } from '../components/dashboard/CommentsProvider';
import { ClientSideSuspense } from '../components/dashboard/CollaborationProvider';
import { CaretLeft, CaretRight, CaretDown, CheckCircle, FileText, Cards, Chalkboard, Highlighter, PencilLine, PushPin } from '@phosphor-icons/react';



/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const CSS_STRING = `
.rv-root {
  display: flex;
  height: 100vh;
  width: 100%;
  background: var(--sb-bg, #F7F7F8);
  color: var(--sb-text, #111827);
  font-family: 'Outfit', 'Outfit', 'Outfit', sans-serif;
  overflow: hidden;
}
body.dark-mode .rv-root {
  background: #1A1A2E;
  color: #E5E7EB;
}

/* ── Classroom Sidebar ── */
.rv-sidebar {
  width: 256px;
  flex-shrink: 0;
  background: var(--sb-bg, #ffffff);
  border-right: 1px solid var(--sb-border, #E5E7EB);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
}
body.dark-mode .rv-sidebar {
  background: #1F2937;
  border-color: rgba(255,255,255,0.07);
}

/* Header row: hamburger + logo + breadcrumb */
.rv-sb-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px 10px;
  flex-shrink: 0;
}
.rv-sb-hamburger {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #5F6368;
  flex-shrink: 0;
  transition: background 0.15s;
}
.rv-sb-hamburger:hover { background: rgba(0,0,0,0.06); }
body.dark-mode .rv-sb-hamburger { color: #9CA3AF; }
body.dark-mode .rv-sb-hamburger:hover { background: rgba(255,255,255,0.06); }
.rv-sb-logo-icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
  flex-shrink: 0;
}
.rv-sb-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15px;
  font-weight: 500;
  color: #3C4043;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
body.dark-mode .rv-sb-breadcrumb { color: #E5E7EB; }
.rv-sb-breadcrumb-sep {
  color: #9AA0A6;
  font-size: 14px;
  flex-shrink: 0;
}
.rv-sb-breadcrumb-class {
  font-weight: 600;
  color: #3C4043;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
body.dark-mode .rv-sb-breadcrumb-class { color: #F3F4F6; }

/* Nav area */
.rv-sb-nav {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
  overflow-x: hidden;
}
.rv-sb-nav::-webkit-scrollbar { display: none; }
.rv-sb-nav { scrollbar-width: none; }

/* Regular nav item */
.rv-sb-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 16px;
  height: 42px;
  border: none;
  background: transparent;
  color: #3C4043;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  text-align: left;
  border-radius: 0 999px 999px 0;
  transition: background 0.15s;
  text-decoration: none;
  margin-right: 16px;
  padding-right: 24px;
  box-sizing: border-box;
  position: relative;
  white-space: nowrap;
}
body.dark-mode .rv-sb-item { color: #D1D5DB; }
.rv-sb-item:hover { background: #F1F3F4; }
body.dark-mode .rv-sb-item:hover { background: rgba(255,255,255,0.05); }
.rv-sb-item.active {
  background: #E6F4EA;
  color: #1E6E3B;
  font-weight: 600;
}
body.dark-mode .rv-sb-item.active {
  background: rgba(152,255,152,0.1);
  color: #86EFAC;
}
.rv-sb-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #5F6368;
}
body.dark-mode .rv-sb-icon { color: #9CA3AF; }
.rv-sb-item.active .rv-sb-icon { color: #1E6E3B; }
body.dark-mode .rv-sb-item.active .rv-sb-icon { color: #86EFAC; }

/* Sub-items (Teaching > To Review) */
.rv-sb-subitem {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 16px 0 52px;
  height: 38px;
  border: none;
  background: transparent;
  color: #3C4043;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.15s;
  border-radius: 0 999px 999px 0;
  padding-right: 24px;
  box-sizing: border-box;
  white-space: nowrap;
}
body.dark-mode .rv-sb-subitem { color: #9CA3AF; }
.rv-sb-subitem:hover { background: #F1F3F4; }
body.dark-mode .rv-sb-subitem:hover { background: rgba(255,255,255,0.05); }
.rv-sb-subitem.active { background: #E6F4EA; color: #1E6E3B; font-weight: 600; }
body.dark-mode .rv-sb-subitem.active { background: rgba(152,255,152,0.1); color: #86EFAC; }

/* Active class pill (the highlighted classroom item) */
.rv-sb-class-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px 0 16px;
  height: 46px;
  border: none;
  background: #E8F0FE;
  color: #1A56D6;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: calc(100% - 16px);
  text-align: left;
  border-radius: 0 999px 999px 0;
  transition: background 0.15s;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
}
body.dark-mode .rv-sb-class-pill {
  background: rgba(99,143,245,0.15);
  color: #93BBFF;
}
.rv-sb-class-pill:hover { background: #DAE8FD; }
body.dark-mode .rv-sb-class-pill:hover { background: rgba(99,143,245,0.22); }
.rv-sb-class-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #1A56D6;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  text-transform: uppercase;
}
body.dark-mode .rv-sb-class-avatar { background: #4A7CF5; }
.rv-sb-class-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Divider */
.rv-sb-divider {
  height: 1px;
  background: #E5E7EB;
  margin: 6px 0;
}
body.dark-mode .rv-sb-divider { background: rgba(255,255,255,0.07); }

/* Section gap */
.rv-sb-gap { height: 8px; }

/* Expand row for Teaching */
.rv-sb-expand-row {
  display: flex;
  align-items: center;
  width: 100%;
}
.rv-sb-expand-row .rv-sb-item {
  flex: 1;
  margin-right: 0;
}
.rv-sb-caret-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #5F6368;
  flex-shrink: 0;
  border-radius: 50%;
  transition: background 0.15s;
  margin-right: 6px;
}
.rv-sb-caret-btn:hover { background: #F1F3F4; }
body.dark-mode .rv-sb-caret-btn { color: #9CA3AF; }
body.dark-mode .rv-sb-caret-btn:hover { background: rgba(255,255,255,0.05); }

/* Profile footer */
.rv-sb-footer {
  padding: 8px 0 12px;
  border-top: 1px solid #E5E7EB;
  flex-shrink: 0;
}
body.dark-mode .rv-sb-footer { border-color: rgba(255,255,255,0.07); }
.rv-sb-profile-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.15s;
  text-align: left;
}
.rv-sb-profile-btn:hover { background: #F1F3F4; }
body.dark-mode .rv-sb-profile-btn:hover { background: rgba(255,255,255,0.05); }
.rv-sb-profile-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #C4B5FD, #7C3AED);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.rv-sb-profile-info {
  flex: 1;
  min-width: 0;
}
.rv-sb-profile-name {
  font-size: 13px;
  font-weight: 700;
  color: #3C4043;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}
body.dark-mode .rv-sb-profile-name { color: #F3F4F6; }
.rv-sb-profile-email {
  font-size: 11px;
  color: #80868B;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

/* Profile dropdown */
.rv-sb-profile-menu {
  position: absolute;
  bottom: 62px;
  left: 12px;
  right: 12px;
  background: var(--sb-surface, #ffffff);
  border: 1px solid #E5E7EB;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 200;
  overflow: hidden;
}
body.dark-mode .rv-sb-profile-menu {
  background: #1F2937;
  border-color: rgba(255,255,255,0.08);
}
.rv-sb-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #3C4043;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
body.dark-mode .rv-sb-menu-item { color: #D1D5DB; }
.rv-sb-menu-item:hover { background: #F1F3F4; }
body.dark-mode .rv-sb-menu-item:hover { background: rgba(255,255,255,0.05); }
.rv-sb-menu-item.danger { color: #D93025; }
body.dark-mode .rv-sb-menu-item.danger { color: #F87171; }
.rv-sb-menu-divider { height: 1px; background: #E5E7EB; margin: 4px 0; }
body.dark-mode .rv-sb-menu-divider { background: rgba(255,255,255,0.07); }

/* Dark mode toggle row */
.rv-sb-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #3C4043;
  border: none;
  background: transparent;
  width: 100%;
  cursor: pointer;
  transition: background 0.15s;
}
body.dark-mode .rv-sb-toggle-row { color: #D1D5DB; }
.rv-sb-toggle-row:hover { background: #F1F3F4; }
body.dark-mode .rv-sb-toggle-row:hover { background: rgba(255,255,255,0.05); }
.rv-sb-toggle-switch {
  margin-left: auto;
  position: relative;
  width: 34px;
  height: 18px;
  display: inline-block;
}
.rv-sb-toggle-switch input { opacity: 0; width: 0; height: 0; }
.rv-sb-toggle-track {
  position: absolute;
  inset: 0;
  background: #ccc;
  border-radius: 99px;
  transition: background 0.2s;
  cursor: pointer;
}
.rv-sb-toggle-track::before {
  content: '';
  position: absolute;
  width: 14px; height: 14px;
  left: 2px; top: 2px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}
.rv-sb-toggle-switch input:checked + .rv-sb-toggle-track { background: #98FF98; }
.rv-sb-toggle-switch input:checked + .rv-sb-toggle-track::before { transform: translateX(16px); }

/* ── Main ── */
.rv-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ── Top Bar ── */
.rv-topbar {
  height: 56px;
  background: var(--sb-surface, #ffffff);
  border-bottom: 1px solid var(--sb-border, #E5E7EB);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  gap: 12px;
}
body.dark-mode .rv-topbar {
  background: #111122;
  border-color: rgba(255,255,255,0.06);
}
.rv-topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rv-topbar-class-name {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.rv-topbar-level-badge {
  padding: 3px 10px;
  background: #C4B5FD;
  color: #4C1D95;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}
body.dark-mode .rv-topbar-level-badge {
  background: rgba(196,181,253,0.15);
  color: #C4B5FD;
}
.rv-topbar-dept-badge {
  padding: 3px 10px;
  background: rgba(152,255,152,0.15);
  color: #15803d;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}
body.dark-mode .rv-topbar-dept-badge {
  background: rgba(152,255,152,0.08);
  color: #98FF98;
}
.rv-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rv-code-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--sb-bg, #F7F7F8);
  border: 1px solid var(--sb-border, #E5E7EB);
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s;
  letter-spacing: 0.04em;
}
.rv-code-chip:hover {
  border-color: #98FF98;
  background: rgba(152,255,152,0.06);
}
body.dark-mode .rv-code-chip {
  background: #1A1A2E;
  border-color: rgba(255,255,255,0.1);
  color: #E5E7EB;
}
.rv-btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--sb-border, #E5E7EB);
  background: var(--sb-surface, #ffffff);
  color: var(--sb-text-secondary, #6B7280);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s;
}
.rv-btn-icon:hover {
  border-color: #C4B5FD;
  color: var(--sb-text, #111827);
}
body.dark-mode .rv-btn-icon {
  background: #1A1A2E;
  border-color: rgba(255,255,255,0.1);
  color: #9CA3AF;
}
body.dark-mode .rv-btn-icon:hover {
  border-color: #C4B5FD;
  color: #ffffff;
}

/* ── Content Area ── */
.rv-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  gap: 0;
  min-height: 0;
}

/* ── Stream Column ── */
.rv-stream {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 28px 28px 28px 28px;
  gap: 20px;
  min-width: 0;
  overflow-y: auto;
}

/* ── Banner ── */
.rv-banner {
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  min-height: 180px;
  display: flex;
  align-items: flex-end;
  padding: 24px;
  flex-shrink: 0;
}
.rv-banner-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 40%, #0E4D3A 100%);
  z-index: 0;
}
body.dark-mode .rv-banner-bg {
  background: linear-gradient(135deg, #0D0D1A 0%, #1a1a3e 50%, #0a2e1a 100%);
}
.rv-banner-illustration {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 55%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 20px 30px;
  z-index: 1;
  pointer-events: none;
  gap: 16px;
}
.rv-banner-device {
  border-radius: 12px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  flex-shrink: 0;
}
.rv-banner-device.laptop {
  width: 100px;
  height: 70px;
}
.rv-banner-device.tablet {
  width: 60px;
  height: 80px;
}
.rv-banner-device.phone {
  width: 40px;
  height: 72px;
}
.rv-banner-screen {
  width: 80%;
  height: 60%;
  border-radius: 4px;
  background: linear-gradient(135deg, #98FF98 0%, #C4B5FD 100%);
  opacity: 0.7;
}
.rv-banner-dots {
  display: flex;
  gap: 3px;
}
.rv-banner-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
}
.rv-banner-content {
  position: relative;
  z-index: 2;
}
.rv-banner-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
.rv-banner-title {
  font-size: 26px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.rv-banner-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  margin-top: 6px;
  font-weight: 500;
}

/* ── Announce Composer ── */
.rv-composer {
  background: var(--sb-surface, #ffffff);
  border: 1px solid var(--sb-border, #E5E7EB);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
body.dark-mode .rv-composer {
  background: #111122;
  border-color: rgba(255,255,255,0.06);
}
.rv-composer-top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.rv-composer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #C4B5FD, #98FF98);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #111827;
  flex-shrink: 0;
}
.rv-composer-input {
  flex: 1;
  border: 1.5px solid var(--sb-border, #E5E7EB);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
  font-family: inherit;
  background: var(--sb-bg, #F7F7F8);
  color: var(--sb-text, #111827);
  outline: none;
  transition: border-color 0.2s;
  resize: none;
  min-height: 44px;
}
body.dark-mode .rv-composer-input {
  background: #1A1A2E;
  border-color: rgba(255,255,255,0.08);
  color: #E5E7EB;
}
.rv-composer-input:focus {
  border-color: #98FF98;
}
.rv-composer-input::placeholder {
  color: var(--sb-text-secondary, #9CA3AF);
}
.rv-composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rv-composer-hints {
  display: flex;
  gap: 8px;
}
.rv-composer-hint-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--sb-border, #E5E7EB);
  font-size: 12px;
  font-weight: 600;
  color: var(--sb-text-secondary, #6B7280);
  cursor: pointer;
  background: transparent;
  transition: all 0.18s;
}
.rv-composer-hint-chip:hover {
  border-color: #C4B5FD;
  color: var(--sb-text, #111827);
}
body.dark-mode .rv-composer-hint-chip {
  border-color: rgba(255,255,255,0.08);
  color: #9CA3AF;
}
body.dark-mode .rv-composer-hint-chip:hover {
  border-color: #C4B5FD;
  color: #E5E7EB;
}
.rv-composer-send {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #98FF98;
  color: #111827;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s;
  flex-shrink: 0;
}
.rv-composer-send:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(152,255,152,0.3);
}
.rv-composer-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ── Empty Stream ── */
.rv-stream-empty {
  background: var(--sb-surface, #ffffff);
  border: 1px solid var(--sb-border, #E5E7EB);
  border-radius: 16px;
  padding: 36px 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
body.dark-mode .rv-stream-empty {
  background: #111122;
  border-color: rgba(255,255,255,0.06);
}
.rv-stream-empty-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(196,181,253,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rv-stream-empty-text {
  flex: 1;
}
.rv-stream-empty-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
}
.rv-stream-empty-desc {
  font-size: 13px;
  color: var(--sb-text-secondary, #6B7280);
  line-height: 1.6;
}

/* ── Post Card ── */
.rv-post-card {
  background: var(--sb-surface, #ffffff);
  border: 1px solid var(--sb-border, #E5E7EB);
  border-radius: 16px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}
body.dark-mode .rv-post-card {
  background: #111122;
  border-color: rgba(255,255,255,0.06);
}
.rv-post-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
body.dark-mode .rv-post-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
.rv-post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 12px;
}
.rv-post-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #98FF98, #C4B5FD);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #111827;
  flex-shrink: 0;
}
.rv-post-meta {
  flex: 1;
}
.rv-post-author {
  font-size: 14px;
  font-weight: 700;
}
.rv-post-time {
  font-size: 12px;
  color: var(--sb-text-secondary, #9CA3AF);
  margin-top: 1px;
}
.rv-post-more-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--sb-text-secondary, #9CA3AF);
  transition: background 0.15s;
}
.rv-post-more-btn:hover {
  background: rgba(0,0,0,0.05);
}
body.dark-mode .rv-post-more-btn:hover {
  background: rgba(255,255,255,0.05);
}
.rv-post-body {
  padding: 0 20px 16px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--sb-text, #111827);
}
body.dark-mode .rv-post-body {
  color: #D1D5DB;
}
.rv-post-actions {
  padding: 10px 20px;
  border-top: 1px solid var(--sb-border, #E5E7EB);
  display: flex;
  gap: 8px;
}
body.dark-mode .rv-post-actions {
  border-color: rgba(255,255,255,0.06);
}
.rv-post-action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid var(--sb-border, #E5E7EB);
  background: transparent;
  color: var(--sb-text-secondary, #6B7280);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.rv-post-action-btn:hover {
  border-color: #C4B5FD;
  color: var(--sb-text, #111827);
}
body.dark-mode .rv-post-action-btn {
  border-color: rgba(255,255,255,0.08);
  color: #9CA3AF;
}
body.dark-mode .rv-post-action-btn:hover {
  border-color: #C4B5FD;
  color: #E5E7EB;
}

/* ── Right Panel ── */
.rv-right-panel {
  width: 290px;
  flex-shrink: 0;
  border-left: 1px solid var(--sb-border, #E5E7EB);
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  padding: 24px 18px;
  gap: 18px;
}
body.dark-mode .rv-right-panel {
  border-color: rgba(255,255,255,0.06);
}

/* ── Panel Widget ── */
.rv-panel-widget {
  background: var(--sb-surface, #ffffff);
  border: 1px solid var(--sb-border, #E5E7EB);
  border-radius: 16px;
  overflow: hidden;
}
body.dark-mode .rv-panel-widget {
  background: #111122;
  border-color: rgba(255,255,255,0.06);
}
.rv-panel-widget-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--sb-border, #E5E7EB);
  display: flex;
  align-items: center;
  gap: 8px;
}
body.dark-mode .rv-panel-widget-header {
  border-color: rgba(255,255,255,0.06);
}
.rv-panel-widget-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.01em;
  flex: 1;
}
.rv-panel-widget-body {
  padding: 16px;
}
.rv-upcoming-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 0 8px;
  text-align: center;
}
.rv-upcoming-empty-icon {
  font-size: 28px;
  line-height: 1;
}
.rv-upcoming-empty-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--sb-text-secondary, #6B7280);
}

/* ── Class Info Widget ── */
.rv-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--sb-border, #F3F4F6);
}
body.dark-mode .rv-info-row {
  border-color: rgba(255,255,255,0.04);
}
.rv-info-row:last-child {
  border-bottom: none;
}
.rv-info-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--sb-bg, #F7F7F8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
body.dark-mode .rv-info-icon {
  background: #1A1A2E;
}
.rv-info-label {
  font-size: 11px;
  color: var(--sb-text-secondary, #9CA3AF);
  font-weight: 600;
}
.rv-info-value {
  font-size: 13px;
  font-weight: 700;
}

/* ── People Widget ── */
.rv-people-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}
.rv-people-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rv-people-av {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
  color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rv-people-name {
  font-size: 13px;
  font-weight: 700;
}
.rv-people-role-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
}

/* ── Modal ── */
.rv-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.rv-modal {
  background: var(--sb-surface, #ffffff);
  border-radius: 20px;
  padding: 28px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
body.dark-mode .rv-modal {
  background: #111122;
  border: 1px solid rgba(255,255,255,0.08);
}
.rv-modal-title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 20px;
  letter-spacing: -0.02em;
}
.rv-modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--sb-bg, #F7F7F8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sb-text-secondary, #6B7280);
}

/* ── Buttons ── */
.rv-btn-primary {
  background: #98FF98;
  color: #111827;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.18s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.rv-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(152,255,152,0.25);
}
.rv-btn-secondary {
  background: transparent;
  color: var(--sb-text, #111827);
  border: 1px solid var(--sb-border, #E5E7EB);
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.18s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
body.dark-mode .rv-btn-secondary {
  border-color: rgba(255,255,255,0.1);
  color: #E5E7EB;
}
.rv-btn-secondary:hover {
  border-color: #C4B5FD;
}

/* ── Schedule Entry ── */
.rv-schedule-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}
.rv-schedule-time {
  font-size: 12px;
  font-weight: 700;
  color: var(--sb-text-secondary, #9CA3AF);
  min-width: 56px;
}
.rv-schedule-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #98FF98;
  flex-shrink: 0;
}
.rv-schedule-label {
  font-size: 13px;
  font-weight: 600;
}

/* Scrollbar */
.rv-stream::-webkit-scrollbar,
.rv-right-panel::-webkit-scrollbar {
  width: 4px;
}
.rv-stream::-webkit-scrollbar-thumb,
.rv-right-panel::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 99px;
}
body.dark-mode .rv-stream::-webkit-scrollbar-thumb,
body.dark-mode .rv-right-panel::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.08);
}

/* Responsive */
@media (max-width: 900px) {
  .rv-right-panel {
    display: none;
  }
}
@media (max-width: 700px) {
  .rv-clv-sidebar {
    display: none;
  }
  .rv-stream {
    padding: 16px;
  }
}
`;

function injectStyles() {
  const existing = document.getElementById('rv-stream-styles');
  if (existing) {
    existing.textContent = CSS_STRING;
    return;
  }
  const tag = document.createElement('style');
  tag.id = 'rv-stream-styles';
  tag.textContent = CSS_STRING;
  document.head.appendChild(tag);
}

const PEOPLE = [
  { name: 'You', initials: 'YO', color: '#98FF98', role: 'Teacher' },
  { name: 'Felix A.', initials: 'FA', color: '#C4B5FD', role: 'Student' },
  { name: 'Jasper M.', initials: 'JM', color: '#FFD2A6', role: 'Student' },
  { name: 'Luna K.', initials: 'LK', color: '#86EFAC', role: 'Student' },
];

function generateClassCode(classId) {
  const safe = (classId || 'class').replace(/[^a-z0-9]/gi, '').toLowerCase();
  return (safe + 'xxxxxxxx').slice(0, 8);
}

/* ── Dark-mode hook (mirrors DashboardSidebar) ── */
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('luter-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    const handleStorage = (e) => { if (e.key === 'luter-theme') setIsDark(e.newValue === 'dark'); };
    const handleCustom = (e) => setIsDark(e.detail === 'dark');
    window.addEventListener('storage', handleStorage);
    window.addEventListener('theme-change', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('theme-change', handleCustom);
    };
  }, [isDark]);

  const setGlobalDark = (newDark) => {
    setIsDark(newDark);
    localStorage.setItem('luter-theme', newDark ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newDark ? 'dark' : 'light' }));
  };

  return [isDark, setGlobalDark];
}

function ClassworkCreateMenu({ onCreateSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#1a73e8', color: 'white', border: 'none', borderRadius: '24px',
          padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '14px', fontWeight: 500, cursor: 'pointer',
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
        }}
      >
        <Plus size={20} weight="bold" /> Create
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '8px',
          background: 'white', borderRadius: '8px', width: '220px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e0e0e0', zIndex: 100, padding: '8px 0'
        }}>
          {[
            { id: 'assignment', icon: <ClipboardText size={20} />, label: 'Assignment' },
            { id: 'quiz', icon: <ClipboardText size={20} />, label: 'Quiz assignment' },
            { id: 'question', icon: <Question size={20} />, label: 'Question' },
            { id: 'material', icon: <BookBookmark size={20} />, label: 'Material' },
            { id: 'reuse', icon: <Repeat size={20} />, label: 'Reuse post' },
            { divider: true, id: 'd1' },
            { id: 'topic', icon: <List size={20} />, label: 'Topic' },
          ].map((item) => (
            item.divider ? (
              <div key={item.id} style={{ height: '1px', background: '#e0e0e0', margin: '8px 0' }} />
            ) : (
              <button key={item.id} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                padding: '10px 24px', background: 'transparent', border: 'none',
                color: '#3c4043', fontSize: '14px', cursor: 'pointer', textAlign: 'left'
              }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f3f4'}
                 onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                 onClick={() => {
                   setIsOpen(false);
                   if (onCreateSelect) onCreateSelect(item.id);
                 }}
              >
                <div style={{ color: '#5f6368' }}>{item.icon}</div>
                <span>{item.label}</span>
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClassView() {
  const { classId } = useParams();
  const contextOutlet = useOutletContext() || {};
  const [user, setUser] = useState(contextOutlet.user || null);

  useEffect(() => {
    if (contextOutlet.user) {
      setUser(contextOutlet.user);
      return;
    }
    const fetchDirectUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    fetchDirectUser();
  }, [contextOutlet.user]);
  const navigate = useNavigate();
  const { sessions, loadSessions } = useSessionStore();
  const rooms = sessions.filter(s => s.session_type === 'classroom');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [mutedStudents, setMutedStudents] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [activeDmRecipient, setActiveDmRecipient] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [newTimetableEntry, setNewTimetableEntry] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:30',
    subject: '',
    room: ''
  });

  const [attachments, setAttachments] = useState([]);
  const [isComposing, setIsComposing] = useState(false);
  const [attachmentInput, setAttachmentInput] = useState({ type: 'youtube', url: '', title: '' });
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);

  const [groupMessages, setGroupMessages] = useState([]);
  const [groupInputText, setGroupInputText] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteModalRole, setInviteModalRole] = useState('student');

  const [refreshKey, setRefreshKey] = useState(0);

  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [floatingInputText, setFloatingInputText] = useState('');
  const floatingMessagesEndRef = useRef(null);

  // Grok AI States
  const [isGrokOpen, setIsGrokOpen] = useState(false);
  const [grokMessages, setGrokMessages] = useState([
    { role: 'assistant', content: `Heyy! 👋 What's up? How can I help today?`, suggestions: ["Tell me more", "Share a fun fact"] }
  ]);
  const [grokInputText, setGrokInputText] = useState('');
  const [grokSending, setGrokSending] = useState(false);
  const [grokModel, setGrokModel] = useState('Fast'); // 'Fast' | 'Grok'
  const [showGrokModelDropdown, setShowGrokModelDropdown] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState(null);
  const grokMessagesEndRef = useRef(null);

  // X Messaging States
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [messagingSearchQuery, setMessagingSearchQuery] = useState('');
  const [messagingActiveView, setMessagingActiveView] = useState('list'); // 'list' | 'lounge' | 'dm'
  const [messagingActiveDmRecipient, setMessagingActiveDmRecipient] = useState(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmInputText, setDmInputText] = useState('');
  const [dmLoading, setDmLoading] = useState(false);
  const [recentDms, setRecentDms] = useState([]);
  const dmMessagesEndRef = useRef(null);

  const currentRoom = rooms.find(r => r.id === classId);
  const isOwner = currentRoom?.user_id === user?.id;
  const isTeacher = isOwner || teachers.some(t => t.id === user?.id);

  // Classwork & Submissions State variables
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedStudentTab, setSelectedStudentTab] = useState('To-Do');
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', points: 100, due_date: '' });
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradingPoints, setGradingPoints] = useState('');
  const [gradingFeedback, setGradingFeedback] = useState('');

  // Scheduling States
  const [announcementScheduledFor, setAnnouncementScheduledFor] = useState('');
  const [assignmentScheduledFor, setAssignmentScheduledFor] = useState('');

  // Rubric States
  const [newRubricCriteria, setNewRubricCriteria] = useState([]); // [{ title, description, maxPoints }]
  const [showRubricBuilder, setShowRubricBuilder] = useState(false);
  const [rubricCriteriaInput, setRubricCriteriaInput] = useState({ title: '', description: '', maxPoints: 10 });
  const [gradingRubricGrades, setGradingRubricGrades] = useState({}); // { criterionTitle: score }

  // Comment Bank States
  const [commentBank, setCommentBank] = useState(() => {
    try {
      const saved = localStorage.getItem('luter:classroom:comment_bank');
      return saved ? JSON.parse(saved) : [
        "Excellent reasoning and well-structured response!",
        "Please proofread your work to correct grammatical errors.",
        "Solid effort, but you need to expand on the practical examples.",
        "Ensure all attachments are correctly uploaded.",
        "Excellent analysis, matches all rubric guidelines perfectly."
      ];
    } catch (e) {
      return [
        "Excellent reasoning and well-structured response!",
        "Please proofread your work to correct grammatical errors.",
        "Solid effort, but you need to expand on the practical examples."
      ];
    }
  });
  const [showCommentBankPopover, setShowCommentBankPopover] = useState(false);

  // Originality Report States
  const [isScanningOriginality, setIsScanningOriginality] = useState(false);

  // Accessibility & Language States
  const [accessibilityFontSize, setAccessibilityFontSize] = useState(100); // %
  const [accessibilityContrast, setAccessibilityContrast] = useState(false);
  const [accessibilityTtsActive, setAccessibilityTtsActive] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en'); // 'en' | 'yo' | 'ha' | 'ig' | 'fr' | 'es'
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);

  // Analytics & Audit States
  const [auditLogs, setAuditLogs] = useState([
    { action: 'Classroom loaded', user: 'System', time: new Date().toLocaleTimeString() },
    { action: 'Timetable synced', user: 'System', time: new Date().toLocaleTimeString() }
  ]);

  const handleSetRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('deck_session_members')
        .update({ role: newRole })
        .eq('session_id', classId)
        .eq('user_id', userId);
      if (error) throw error;
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('[ClassView] Error updating member role:', err);
      alert('Failed to update member role: ' + err.message);
    }
  };

  // Fetch Members
  useEffect(() => {
    if (!classId || !currentRoom) return;

    const fetchClassDetails = async () => {
      try {
        const { data: memberData, error: memberErr } = await supabase
          .from('deck_session_members')
          .select('*')
          .eq('session_id', classId);

        if (memberErr) throw memberErr;

        let userIds = (memberData || []).map(m => m.user_id) || [];
        if (currentRoom?.user_id && !userIds.includes(currentRoom.user_id)) {
          userIds.push(currentRoom.user_id);
        }

        let profiles = [];
        if (userIds.length > 0) {
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('id, full_name, username')
            .in('id', userIds);
          if (!profileErr && profileData) profiles = profileData;
        }

        const mapped = (memberData || []).map(m => {
          const profile = profiles.find(p => p.id === m.user_id);
          return {
            id: m.user_id,
            name: profile?.username || profile?.full_name || 'Student',
            role: m.role || 'student'
          };
        });

        const teacherList = [];
        if (currentRoom?.user_id) {
          const ownerProfile = profiles.find(p => p.id === currentRoom.user_id);
          teacherList.push({
            id: currentRoom.user_id,
            name: ownerProfile?.username || ownerProfile?.full_name || 'Teacher',
            role: 'teacher'
          });
        }

        mapped.forEach(m => {
          if (m.id !== currentRoom?.user_id) {
            if (m.role === 'teacher') {
              teacherList.push(m);
            }
          }
        });

        const studentList = mapped.filter(m => m.id !== currentRoom?.user_id && m.role !== 'teacher');

        setTeachers(teacherList);
        setStudents(studentList);
      } catch (err) {
        console.error('[ClassView] Error fetching class details:', err);
      }
    };

    fetchClassDetails();
  }, [classId, currentRoom, refreshKey]);

  // Fetch Muted Students
  useEffect(() => {
    if (!classId) return;
    const fetchMuted = async () => {
      try {
        const { data, error } = await supabase
          .from('class_muted_students')
          .select('student_id')
          .eq('class_id', classId);
        if (!error && data) {
          const ids = data.map(d => d.student_id);
          setMutedStudents(ids);
          if (user?.id && ids.includes(user.id)) {
            setIsMuted(true);
          } else {
            setIsMuted(false);
          }
        }
      } catch (e) {
        console.error('Error fetching muted students:', e);
      }
    };
    fetchMuted();
  }, [classId, user]);

  // Fetch Timetable
  useEffect(() => {
    if (!classId) return;
    const fetchTimetable = async () => {
      try {
        const { data, error } = await supabase
          .from('class_timetable')
          .select('*')
          .eq('class_id', classId)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });
        if (!error && data) setTimetable(data);
      } catch (e) {
        console.error('Error fetching timetable:', e);
      }
    };
    fetchTimetable();
  }, [classId]);

  // Fetch assignments and submissions
  useEffect(() => {
    if (!classId) return;

    const fetchClasswork = async () => {
      try {
        const { data: assignData, error: assignErr } = await supabase
          .from('class_assignments')
          .select('*')
          .eq('class_id', classId)
          .order('created_at', { ascending: false });
        if (assignErr) throw assignErr;
        setAssignments(assignData || []);

        const assignIds = (assignData || []).map(a => a.id);
        if (assignIds.length > 0) {
          const { data: subData, error: subErr } = await supabase
            .from('class_submissions')
            .select('*')
            .in('assignment_id', assignIds);
          if (!subErr && subData) {
            setSubmissions(subData);
          }
        } else {
          setSubmissions([]);
        }
      } catch (err) {
        console.error('[ClassView] Error fetching classwork:', err);
      }
    };

    fetchClasswork();

    // Subscribe to assignments
    const channelAssignments = supabase
      .channel(`class-assignments-${classId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_assignments', filter: `class_id=eq.${classId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAssignments(prev => {
              if (prev.some(a => a.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setAssignments(prev => prev.filter(a => a.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setAssignments(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
          }
        }
      )
      .subscribe();

    // Subscribe to submissions
    const channelSubmissions = supabase
      .channel(`class-submissions-${classId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_submissions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSubmissions(prev => {
              if (prev.some(s => s.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'DELETE') {
            setSubmissions(prev => prev.filter(s => s.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setSubmissions(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelAssignments);
      supabase.removeChannel(channelSubmissions);
    };
  }, [classId, refreshKey]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load metadata from localStorage (saved by ClassroomDashboard)
  const [meta, setMeta] = useState(() => {
    try {
      const saved = localStorage.getItem(`luter_class_metadata_${classId}`);
      return saved ? JSON.parse(saved) : {
        title: classId || 'Classroom',
        level: '100 Level',
        department: 'Computer Science',
        schedule: null,
        createdAt: new Date().toLocaleDateString()
      };
    } catch {
      return { title: classId || 'Classroom', level: '100 Level', department: 'Computer Science', schedule: null };
    }
  });

  const [activeNav, setActiveNav] = useState('stream');
  const [teachingOpen, setTeachingOpen] = useState(true);
  const [workspaceTab, setWorkspaceTab] = useState('notes');
  const [activeMaterialOverlay, setActiveMaterialOverlay] = useState(null); // { title, url, type }
  const [activeWorkspaceTool, setActiveWorkspaceTool] = useState(null); // 'annotate' | 'highlight' | 'pin'
  const [drawMode, setDrawMode] = useState(null); // 'pen' | 'highlighter' | 'eraser'
  const [strokeColor, setStrokeColor] = useState('#7C3AED');
  const [strokeSize, setStrokeSize] = useState(4);



  const [announcements, setAnnouncements] = useState(() => {
    try {
      const saved = localStorage.getItem(`luter_announcements_${classId}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [composerText, setComposerText] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const classCode = generateClassCode(classId);

  const userInitials = (() => {
    const name = user?.raw_user_meta_data?.name || user?.email || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  })();
  const userName = user?.raw_user_meta_data?.name || user?.email || 'Teacher';

  useEffect(() => {
    injectStyles();
  }, []);

  // Realtime Announcements subscription
  useEffect(() => {
    if (!classId) return;

    // 1. Fetch initial announcements
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('class_announcements')
          .select('*')
          .eq('class_id', classId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (err) {
        console.error('[ClassView] Error fetching announcements:', err);
      }
    };

    fetchAnnouncements();

    // 2. Subscribe to realtime changes
    const channel = supabase
      .channel(`class-announcements-${classId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_announcements',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAnnouncements(prev => {
              // Avoid duplicate adds if state was updated by the poster already
              if (prev.some(a => a.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setAnnouncements(prev => prev.filter(a => a.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setAnnouncements(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId]);

  // Realtime Group Messages subscription
  useEffect(() => {
    if (!classId) return;

    // 1. Fetch initial group messages
    const fetchGroupMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('class_group_messages')
          .select('*')
          .eq('class_id', classId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setGroupMessages(data || []);
      } catch (err) {
        console.error('[ClassView] Error fetching group messages:', err);
      }
    };

    fetchGroupMessages();

    // 2. Subscribe to realtime changes
    const channel = supabase
      .channel(`class-group-messages-${classId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_group_messages',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGroupMessages(prev => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'DELETE') {
            setGroupMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId]);

  // Scroll to bottom for Grok AI messages
  useEffect(() => {
    if (isGrokOpen && grokMessagesEndRef.current) {
      grokMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [grokMessages, isGrokOpen]);

  // Scroll to bottom for DM messages
  useEffect(() => {
    if (isMessagingOpen && messagingActiveView === 'dm' && dmMessagesEndRef.current) {
      dmMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dmMessages, isMessagingOpen, messagingActiveView]);

  // Scroll to bottom for Group Lounge messages
  useEffect(() => {
    if (isMessagingOpen && messagingActiveView === 'lounge' && floatingMessagesEndRef.current) {
      floatingMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [groupMessages, isMessagingOpen, messagingActiveView]);

  // Fetch recent DMs list helper
  const fetchRecentDms = async () => {
    if (!classId || !user?.id) return;
    try {
      const { data, error } = await supabase
        .from('class_messages')
        .select('*')
        .eq('class_id', classId)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const threadsMap = {};
      data?.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        if (!threadsMap[partnerId]) {
          threadsMap[partnerId] = msg;
        }
      });

      const threadsList = Object.keys(threadsMap).map(partnerId => {
        const latestMsg = threadsMap[partnerId];
        const partner = students.find(s => s.id === partnerId) || teachers.find(t => t.id === partnerId);
        
        const partnerName = partner ? partner.name : "Class Member";
        const email = partner ? partner.email : "";
        const cleanHandle = email 
          ? email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') 
          : partnerName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        
        const initials = partnerName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return {
          id: partnerId,
          name: partnerName,
          handle: cleanHandle,
          initials: initials || 'CM',
          avatarUrl: partner?.user_metadata?.avatar_url || null,
          lastMessage: latestMsg.message_text,
          time: latestMsg.created_at,
          unread: false
        };
      });

      setRecentDms(threadsList);
    } catch (err) {
      console.error('[ClassView] Error fetching recent DMs:', err);
    }
  };

  // Trigger recent DMs load
  useEffect(() => {
    fetchRecentDms();
  }, [classId, user?.id, students, teachers]);

  // Intercept old direct message sidebar triggers and redirect to new floating X-style messaging panel
  useEffect(() => {
    if (activeDmRecipient) {
      const cleanHandle = activeDmRecipient.email 
        ? activeDmRecipient.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') 
        : activeDmRecipient.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      const initials = activeDmRecipient.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      openDmChat({
        id: activeDmRecipient.id,
        name: activeDmRecipient.name,
        handle: cleanHandle,
        initials: initials || 'CM'
      });
      setIsMessagingOpen(true);
      setIsGrokOpen(false);
      setActiveDmRecipient(null);
    }
  }, [activeDmRecipient]);

  const activeDmRecipientRef = useRef(null);
  useEffect(() => {
    activeDmRecipientRef.current = messagingActiveDmRecipient;
  }, [messagingActiveDmRecipient]);

  // Real-time subscription to DMs
  useEffect(() => {
    if (!classId || !user?.id) return;

    const channel = supabase
      .channel(`class-all-dms-subscription-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_messages',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg.sender_id === user.id || newMsg.recipient_id === user.id) {
            const currentRecipient = activeDmRecipientRef.current;
            if (currentRecipient && 
                ((newMsg.sender_id === user.id && newMsg.recipient_id === currentRecipient.id) ||
                 (newMsg.sender_id === currentRecipient.id && newMsg.recipient_id === user.id))) {
              setDmMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
            fetchRecentDms();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId, user?.id]);

  // Open DM conversation
  const openDmChat = async (recipient) => {
    setMessagingActiveDmRecipient(recipient);
    setMessagingActiveView('dm');
    setDmMessages([]);
    setDmLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_messages')
        .select('*')
        .eq('class_id', classId)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setDmMessages(data || []);
    } catch (err) {
      console.error('[ClassView] Error fetching DM messages:', err);
    } finally {
      setDmLoading(false);
    }
  };

  // Send Direct Message
  const sendDmMessage = async (text) => {
    if (!text.trim() || !messagingActiveDmRecipient) return;
    try {
      const { error } = await supabase.from('class_messages').insert({
        class_id: classId,
        sender_id: user?.id,
        recipient_id: messagingActiveDmRecipient.id,
        message_text: text.trim()
      });
      if (error) throw error;
    } catch (err) {
      console.error('[ClassView] Error sending DM message:', err);
    }
  };

  // Grok AI Response handler
  const handleSendGrok = async (customText = null) => {
    const textToSend = customText !== null ? customText : grokInputText;
    if (!textToSend.trim() || grokSending) return;

    const userMsg = { role: 'user', content: textToSend.trim() };
    setGrokMessages(prev => [...prev, userMsg]);
    setGrokInputText('');
    setGrokSending(true);

    try {
      const contextText = `
        You are Luter AI, a study tutor.
        The classroom title: "${displayTitle}"
        Announcements posted:
        ${announcements.map(a => `- ${a.author_name}: "${a.content}"`).join('\n')}

        Assignments:
        ${assignments.map(a => `- "${a.title}": "${a.description}" (Due: ${a.due_date})`).join('\n')}
      `;

      const apiMessages = [
        ...grokMessages.map(m => ({ role: m.role, content: m.content })),
        userMsg
      ];

      const modelToUse = grokModel === 'Grok' ? GROQ_MODELS.PROFESSOR : GROQ_MODELS.SPEEDSTER;

      const resObj = await callGroqAPI(apiMessages, modelToUse, {
        systemPromptOverride: `You are Luter AI, a helpful tutor.
        Here is the current classroom context:
        ${contextText}

        Be encouraging, sharp, and concise. Explain concepts clearly. Use university/NUC contexts where helpful.`
      });
      const res = resObj?.choices?.[0]?.message?.content || '';

      setGrokMessages(prev => [...prev, { 
        role: 'assistant', 
        content: res,
        suggestions: [
          "Tell me more",
          "Share a fun fact"
        ]
      }]);
    } catch (err) {
      setGrokMessages(prev => [...prev, { role: 'assistant', content: "Failed to load response: " + err.message }]);
    } finally {
      setGrokSending(false);
    }
  };

  const handlePost = async () => {
    const text = composerText.trim();
    if (!text) return;

    try {
      const payload = {
        class_id: classId,
        author_id: user?.id,
        author_name: userName,
        author_initials: userInitials,
        content: text,
        attachments: attachments,
        comments: []
      };

      if (announcementScheduledFor) {
        payload.scheduled_for = new Date(announcementScheduledFor).toISOString();
      }

      const { error } = await supabase
        .from('class_announcements')
        .insert(payload);

      if (error) throw error;

      // Update Audit Logs
      setAuditLogs(prev => [
        {
          action: announcementScheduledFor ? 'Announcement scheduled' : 'Announcement posted',
          user: userName,
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);

      setComposerText('');
      setAttachments([]);
      setAnnouncementScheduledFor('');
      setIsComposing(false);
    } catch (err) {
      console.error('[ClassView] Error posting announcement:', err);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1500);
    });
  };

  const handleScanOriginality = async () => {
    if (!gradingSubmission || gradingSubmission.mock || isScanningOriginality) return;
    setIsScanningOriginality(true);
    
    setAuditLogs(prev => [
      { action: 'Plagiarism scan started', user: userName, time: new Date().toLocaleTimeString() },
      ...prev
    ]);

    setTimeout(async () => {
      try {
        const text = gradingSubmission.submission_text || "";
        let plagiarismPercent = 0;
        let sources = [];
        
        if (text.length > 50) {
          plagiarismPercent = (text.length % 29) + 5;
          sources = [
            { source: "Nigeria Academic Archive", match: Math.round(plagiarismPercent * 0.4) + "%" },
            { source: "Wikipedia - Education", match: Math.round(plagiarismPercent * 0.6) + "%" }
          ];
        } else {
          plagiarismPercent = 5;
          sources = [
            { source: "Generic Web Match", match: "5%" }
          ];
        }
        
        const report = {
          percent: plagiarismPercent,
          sources: sources,
          scan_date: new Date().toLocaleDateString()
        };
        
        const { error } = await supabase
          .from('class_submissions')
          .update({ originality_report: report })
          .eq('id', gradingSubmission.id);
           
        if (!error) {
          setGradingSubmission(prev => ({ ...prev, originality_report: report }));
          setSubmissions(prev => prev.map(s => s.id === gradingSubmission.id ? { ...s, originality_report: report } : s));
          
          setAuditLogs(prev => [
            { action: `Plagiarism scan completed: ${plagiarismPercent}%`, user: userName, time: new Date().toLocaleTimeString() },
            ...prev
          ]);
        }
      } catch (err) {
        console.error("Error scanning originality:", err);
      } finally {
        setIsScanningOriginality(false);
      }
    }, 1500);
  };

  const handleGroupInputChange = (e) => {
    const val = e.target.value;
    setGroupInputText(val);

    const mentionMatch = val.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      setShowMentionDropdown(true);
      
      const inputEl = e.target;
      const rect = inputEl.getBoundingClientRect();
      setMentionPosition({
        top: rect.top - 200,
        left: rect.left + 20
      });
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleSelectMention = (member) => {
    const updated = groupInputText.replace(/@(\w*)$/, `@${member.name} `);
    setGroupInputText(updated);
    setShowMentionDropdown(false);
  };

  const renderMessageText = (text) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} style={{ color: '#1a73e8', fontWeight: 600 }}>{part}</span>;
      }
      return part;
    });
  };

  const allClassMembers = [...teachers, ...students];
  const filteredMentionMembers = allClassMembers.filter(m => 
    m.name?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const groupMessagesEndRef = useRef(null);
  useEffect(() => {
    if (activeNav === 'chat') {
      groupMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [groupMessages, activeNav]);

  const displayTitle = currentRoom?.session_name || meta?.title || classId || 'Classroom';

  const displayName = user?.raw_user_meta_data?.name?.split(' ')[0] || 'Scholar';

  const handleSignOut = async () => {
    const { supabase } = await import('../supabaseClient');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Class title initial for the pill avatar
  const classInitial = displayTitle.charAt(0).toUpperCase();

  return (
    <div 
      className="rv-root" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        background: '#ffffff',
        fontSize: `${accessibilityFontSize}%`,
        filter: accessibilityContrast ? 'contrast(1.5) grayscale(0.5)' : 'none',
        transition: 'all 0.2s'
      }}
    >
      
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', display: 'flex' }}>
            <List size={24} weight="regular" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/Header logo.png" alt="Logo" style={{ width: '32px' }} />
            <span style={{ fontSize: '22px', color: '#5f6368', fontWeight: 500 }}>
              Classroom <span style={{ margin: '0 8px' }}>›</span> <span style={{ color: '#3c4043' }}>{displayTitle}</span>
            </span>
          </div>
        </div>

        {/* Translation Mapping */}
        {(() => {
          window.__CLASSROOM_TRANSLATIONS = {
            en: { stream: "Stream", classwork: "Classwork", people: "People", chat: "Chat", timetable: "Timetable", workspace: "Workspace", grades: "Grades", analytics: "Analytics" },
            yo: { stream: "Ìṣàn (Stream)", classwork: "Isẹ́ Kíláàsì", people: "Àwọn Ènìyàn", chat: "Fífòránṣẹ́", timetable: "Àkókò Kíláàsì", workspace: "Àyè Iṣẹ́", grades: "Àwọn Máàkì", analytics: "Àyẹ̀wò" },
            ha: { stream: "Rafi (Stream)", classwork: "Aikin Aji", people: "Mutane", chat: "Hira", timetable: "Tsarin Lokaci", workspace: "Wurin Aiki", grades: "Maki", analytics: "Bincike" },
            ig: { stream: "Mmiri (Stream)", classwork: "Ọrụ Klas", people: "Ndị mmadụ", chat: "Nkata", timetable: "Tebụl Oge", workspace: "Ebe Ọrụ", grades: "Akara ule", analytics: "Nchịkọta" },
            fr: { stream: "Flux", classwork: "Travaux", people: "Membres", chat: "Discussion", timetable: "Emploi du temps", workspace: "Espace de travail", grades: "Notes", analytics: "Analyses" },
            es: { stream: "Novedades", classwork: "Trabajo en clase", people: "Personas", chat: "Chat", timetable: "Horario", workspace: "Espacio de trabajo", grades: "Calificaciones", analytics: "Estadísticas" }
          };
        })()}

        {/* Header Tabs */}
        <div style={{ display: 'flex', position: 'absolute', left: '50%', transform: 'translateX(-50%)', height: '65px' }}>
          {['Stream', 'Classwork', 'People', 'Chat', 'Timetable', 'Workspace', 'Grades', ...(isTeacher ? ['Analytics'] : [])].map(tab => {
            const rawKey = tab.toLowerCase();
            const translatedLabel = window.__CLASSROOM_TRANSLATIONS[currentLanguage]?.[rawKey] || tab;
            return (
              <button 
                key={tab}
                onClick={() => setActiveNav(rawKey)}
                style={{
                  background: 'none', border: 'none', padding: '0 24px', height: '100%',
                  borderBottom: activeNav === rawKey ? '4px solid #1a73e8' : '4px solid transparent',
                  color: activeNav === rawKey ? '#1a73e8' : '#5f6368',
                  fontWeight: 500, fontSize: '14px', cursor: 'pointer', transition: 'color 0.2s'
                }}
              >
                {translatedLabel}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#5f6368' }}>
          
          {/* Accessibility / Language Button */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowAccessibilityPanel(!showAccessibilityPanel)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368',
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
                borderRadius: '50%', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
              title="Accessibility & Multi-Language Tools"
            >
              <span style={{ fontSize: '20px' }}>🌐</span>
            </button>
            
            {showAccessibilityPanel && (
              <div style={{
                position: 'absolute', right: 0, top: '42px', width: '280px', background: '#ffffff',
                border: '1px solid #dadce0', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                zIndex: 3000, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
                fontFamily: 'Outfit, sans-serif'
              }}>
                <div style={{ fontWeight: 700, color: '#202124', borderBottom: '1px solid #dadce0', paddingBottom: '8px', fontSize: '14px' }}>
                  Accessibility & Language
                </div>

                {/* Font Size controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#5f6368' }}>Text Size: {accessibilityFontSize}%</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setAccessibilityFontSize(prev => Math.max(80, prev - 10))}
                      style={{ flex: 1, padding: '6px', border: '1px solid #dadce0', background: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      A-
                    </button>
                    <button 
                      onClick={() => setAccessibilityFontSize(100)}
                      style={{ padding: '6px 12px', border: '1px solid #dadce0', background: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => setAccessibilityFontSize(prev => Math.min(150, prev + 10))}
                      style={{ flex: 1, padding: '6px', border: '1px solid #dadce0', background: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* High Contrast Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#5f6368' }}>High Contrast</span>
                  <input 
                    type="checkbox" 
                    checked={accessibilityContrast}
                    onChange={(e) => setAccessibilityContrast(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </div>

                {/* Hover Speech Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#5f6368' }}>Text-to-Speech (TTS)</span>
                  <input 
                    type="checkbox" 
                    checked={accessibilityTtsActive}
                    onChange={(e) => setAccessibilityTtsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </div>

                {/* Select Language */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#5f6368' }}>Display Language</span>
                  <select 
                    value={currentLanguage}
                    onChange={(e) => setCurrentLanguage(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '13px', outline: 'none', background: 'white' }}
                  >
                    <option value="en">English (US)</option>
                    <option value="yo">Yoruba (Yorùbá)</option>
                    <option value="ha">Hausa (Harshen Hausa)</option>
                    <option value="ig">Igbo (Asụsụ Igbo)</option>
                    <option value="fr">French (Français)</option>
                    <option value="es">Spanish (Español)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#a142f4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 500 }}>
            {userInitials}
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <div style={{ width: sidebarCollapsed ? '72px' : '280px', flexShrink: 0, transition: 'width 0.2s', height: '100%' }}>
          <ClassroomSidebar collapsed={sidebarCollapsed} activeNav={`room-${classId}`} setActiveNav={() => {}} rooms={rooms} />
        </div>

        {/* Main Stream Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {activeNav === 'stream' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Banner */}
          <div style={{ 
            height: '240px', background: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)', 
            borderRadius: '8px', position: 'relative', overflow: 'hidden', padding: '24px',
            display: 'flex', alignItems: 'flex-end'
          }}>
            <h1 style={{ color: 'white', fontSize: '36px', fontWeight: 500, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {displayTitle}
            </h1>
            <button style={{ 
              position: 'absolute', top: '16px', right: '16px', background: 'white', border: 'none', 
              padding: '8px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, 
              color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <Sparkle size={18} /> Customize
            </button>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            
            {/* Left Column */}
            <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ border: '1px solid #dadce0', borderRadius: '8px', padding: '16px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#3c4043' }}>Class code</span>
                  <DotsThreeVertical size={20} color="#5f6368" style={{ cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '22px', color: '#1a73e8' }}>{classCode}</span>
                  <button onClick={handleCopyCode} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a73e8' }}>
                    {codeCopied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              <div style={{ border: '1px solid #dadce0', borderRadius: '8px', padding: '16px', background: 'white' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#3c4043', margin: '0 0 16px 0' }}>Upcoming</h3>
                <p style={{ fontSize: '13px', color: '#5f6368', margin: '0 0 16px 0' }}>No work due soon</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ background: 'none', border: 'none', color: '#1a73e8', fontWeight: 500, cursor: 'pointer', fontSize: '14px' }}>
                    View all
                  </button>
                </div>
              </div>

              {/* EdTech Add-ons & Google Workspace Card */}
              <div style={{ border: '1px solid #dadce0', borderRadius: '8px', padding: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#3c4043', margin: 0 }}>EdTech & Workspace</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { name: 'Google Drive', icon: '📁', url: 'https://drive.google.com' },
                    { name: 'Google Docs', icon: '📄', url: 'https://docs.google.com' },
                    { name: 'YouTube Edu', icon: '📺', url: 'https://youtube.com' },
                    { name: 'PhET Simulations', icon: '🔬', url: 'https://phet.colorado.edu' },
                    { name: 'Quizlet Deck', icon: '🎴', url: 'https://quizlet.com' }
                  ].map((tool, tIdx) => (
                    <a 
                      key={tIdx} 
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', 
                        borderRadius: '6px', background: '#f8f9fa', textDecoration: 'none', 
                        fontSize: '12px', color: '#3c4043', fontWeight: 500, border: '1px solid #e0e0e0',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#e8f0fe';
                        e.currentTarget.style.borderColor = '#1a73e8';
                        e.currentTarget.style.color = '#1967D2';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                        e.currentTarget.style.color = '#3c4043';
                      }}
                    >
                      <span style={{ fontSize: '15px' }}>{tool.icon}</span>
                      <span>{tool.name}</span>
                    </a>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column / Feed */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Announce box */}
               {isMuted ? (
                <div style={{ 
                  border: '1px solid #dc3545', borderRadius: '8px', padding: '16px', 
                  background: '#fdf2f2', display: 'flex', alignItems: 'center', gap: '16px',
                  color: '#dc3545', fontSize: '14px', fontWeight: 500
                }}>
                  You are muted and cannot post announcements or comments in this class.
                </div>
              ) : isComposing ? (
                <div style={{ border: '1px solid #dadce0', borderRadius: '8px', padding: '16px', background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                  <textarea
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder="Announce something to your class..."
                    style={{ width: '100%', minHeight: '100px', border: 'none', outline: 'none', resize: 'vertical', fontSize: '15px', color: '#202124' }}
                  />

                  {/* Attachments List */}
                  {attachments.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '12px 0' }}>
                      {attachments.map((att, attIdx) => (
                        <div key={attIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#f1f3f4', borderRadius: '16px', border: '1px solid #dadce0' }}>
                          <span style={{ fontSize: '12px', color: '#3c4043' }}>{att.title || att.url}</span>
                          <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== attIdx))} style={{ background: 'none', border: 'none', color: '#d93025', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attachment Creator */}
                  {showAttachmentForm && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dadce0', margin: '12px 0' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select 
                          value={attachmentInput.type} 
                          onChange={(e) => setAttachmentInput(prev => ({ ...prev, type: e.target.value }))}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '13px' }}
                        >
                          <option value="youtube">YouTube Link</option>
                          <option value="link">Web Link / Doc</option>
                          <option value="file">File Upload (Simulated)</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder={attachmentInput.type === 'file' ? 'Enter file name' : 'Enter URL'} 
                          value={attachmentInput.url} 
                          onChange={(e) => setAttachmentInput(prev => ({ ...prev, url: e.target.value }))}
                          style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '13px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          placeholder="Link/File Title (Optional)" 
                          value={attachmentInput.title} 
                          onChange={(e) => setAttachmentInput(prev => ({ ...prev, title: e.target.value }))}
                          style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '13px' }}
                        />
                        <button 
                          onClick={() => {
                            if (!attachmentInput.url.trim()) return;
                            setAttachments(prev => [...prev, {
                              type: attachmentInput.type,
                              url: attachmentInput.url,
                              title: attachmentInput.title || attachmentInput.url.split('/').pop() || 'Attachment'
                            }]);
                            setAttachmentInput({ type: 'youtube', url: '', title: '' });
                            setShowAttachmentForm(false);
                          }}
                          style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                          Add
                        </button>
                        <button 
                          onClick={() => setShowAttachmentForm(false)}
                          style={{ background: 'none', border: '1px solid #dadce0', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #dadce0', paddingTop: '12px', marginTop: '12px' }}>
                    <button 
                      onClick={() => setShowAttachmentForm(true)}
                      style={{
                        background: 'none', border: '1px solid #1a73e8', color: '#1a73e8',
                        padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
                      }}
                    >
                      + Add attachment
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isTeacher && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid #dadce0', paddingRight: '12px' }}>
                          <span style={{ fontSize: '12px', color: '#5f6368', fontWeight: 600 }}>Schedule Post:</span>
                          <input 
                            type="datetime-local" 
                            value={announcementScheduledFor} 
                            onChange={(e) => setAnnouncementScheduledFor(e.target.value)} 
                            style={{ 
                              padding: '4px 8px', borderRadius: '4px', border: '1px solid #dadce0', 
                              fontSize: '12px', outline: 'none', color: '#3c4043' 
                            }}
                          />
                        </div>
                      )}
                      <button 
                        onClick={() => {
                          setIsComposing(false);
                          setAnnouncementScheduledFor('');
                        }}
                        style={{
                          background: 'none', border: 'none', color: '#5f6368',
                          padding: '8px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handlePost}
                        disabled={!composerText.trim()}
                        style={{
                          background: composerText.trim() ? '#1a73e8' : '#f1f3f4',
                          color: composerText.trim() ? 'white' : '#70757a',
                          border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                        }}
                      >
                        {announcementScheduledFor ? 'Schedule' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsComposing(true)}
                  style={{ 
                    border: '1px solid #dadce0', borderRadius: '8px', padding: '16px', 
                    background: 'white', display: 'flex', alignItems: 'center', gap: '16px',
                    boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)', cursor: 'pointer'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#a142f4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 500 }}>
                    {userInitials}
                  </div>
                  <span style={{ fontSize: '15px', color: '#5f6368' }}>Announce something to your class</span>
                </div>
              )}

              {/* Feed List */}
              {announcements.length === 0 ? (
                <div style={{ border: '1px solid #dadce0', borderRadius: '8px', padding: '32px', background: 'white', display: 'flex', gap: '32px', alignItems: 'center' }}>
                  <div style={{ width: '120px', height: '120px', background: '#f1f3f4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChatsTeardrop size={64} color="#dadce0" weight="duotone" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 400, color: '#3c4043', margin: '0 0 8px 0' }}>This is where you can talk to your class</h2>
                    <p style={{ fontSize: '14px', color: '#5f6368', margin: '0 0 24px 0', maxWidth: '400px' }}>
                      Use the stream to share announcements, post assignments, and respond to student questions
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {announcements.filter(post => {
                    if (!post.scheduled_for) return true;
                    if (new Date(post.scheduled_for) <= new Date()) return true;
                    return isTeacher;
                  }).map((post) => (
                    <div key={post.id} style={{ border: '1px solid #dadce0', borderRadius: '8px', background: 'white', overflow: 'hidden' }}>
                      {/* Announcement Main Body */}
                      <div style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#a142f4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 500 }}>
                              {post.author_initials || 'U'}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#3c4043' }}>{post.author_name}</div>
                              <div style={{ fontSize: '12px', color: '#70757a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</span>
                                {post.scheduled_for && new Date(post.scheduled_for) > new Date() && (
                                  <span style={{ padding: '2px 6px', background: '#ffeeca', color: '#b06000', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                                    🕒 Scheduled for {new Date(post.scheduled_for).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {(isOwner || post.author_id === user?.id) && (
                            <button 
                              onClick={async () => {
                                const { error } = await supabase.from('class_announcements').delete().eq('id', post.id);
                                if (!error) setAnnouncements(prev => prev.filter(a => a.id !== post.id));
                              }}
                              style={{ background: 'none', border: 'none', color: '#d93025', cursor: 'pointer', fontSize: '13px' }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', color: '#3c4043', lineHeight: '1.5', margin: '16px 0 0 0', whiteSpace: 'pre-wrap' }}>
                          {post.content}
                        </p>

                        {/* Attachments rendering */}
                        {post.attachments && post.attachments.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                            {post.attachments.map((att, attIdx) => (
                              <a 
                                key={attIdx} 
                                href={att.url.startsWith('http') ? att.url : '#'} 
                                onClick={(e) => {
                                  if (att.type === 'file' || att.url.toLowerCase().endsWith('.pdf') || att.url.toLowerCase().endsWith('.docx') || att.url.toLowerCase().endsWith('.png') || att.url.toLowerCase().endsWith('.jpg') || att.url.toLowerCase().endsWith('.jpeg')) {
                                    e.preventDefault();
                                    setActiveMaterialOverlay({ title: att.title, url: att.url, type: att.type });
                                  }
                                }}
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ 
                                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', 
                                  border: '1px solid #dadce0', borderRadius: '8px', textDecoration: 'none', 
                                  background: '#f8f9fa', width: '280px', color: 'inherit'
                                }}
                              >
                                <div style={{ color: '#1a73e8' }}>
                                  {att.type === 'youtube' ? <ChatsTeardrop size={24} /> : <BookBookmark size={24} />}
                                </div>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#3c4043' }}>{att.title}</div>
                                  <div style={{ fontSize: '11px', color: '#70757a' }}>{att.type.toUpperCase()}</div>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Comments list rendering */}
                      <div style={{ borderTop: '1px solid #e0e0e0', padding: '16px 24px', background: '#f8f9fa' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: (post.comments || []).length > 0 ? '16px' : '0' }}>
                          {(post.comments || []).map((comment, cIdx) => (
                            <div key={cIdx} style={{ display: 'flex', gap: '12px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#17a2b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 500 }}>
                                {comment.author_initials || 'C'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#202124' }}>{comment.author_name}</span>
                                  <span style={{ fontSize: '10px', color: '#70757a' }}>{comment.created_at}</span>
                                </div>
                                <p style={{ fontSize: '13px', color: '#3c4043', margin: '4px 0 0 0' }}>{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {!isMuted && (
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            const commentInput = e.target.elements[`comment_${post.id}`];
                            const commentText = commentInput.value.trim();
                            if (!commentText) return;
                            
                            const newComment = {
                              author_name: userName,
                              author_initials: userInitials,
                              content: commentText,
                              created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            };
                            
                            const updatedComments = [...(post.comments || []), newComment];
                            
                            const { error } = await supabase
                              .from('class_announcements')
                              .update({ comments: updatedComments })
                              .eq('id', post.id);
                            
                            if (!error) {
                              setAnnouncements(prev => prev.map(a => a.id === post.id ? { ...a, comments: updatedComments } : a));
                              commentInput.value = '';
                            }
                          }} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                              type="text"
                              name={`comment_${post.id}`}
                              placeholder="Add class comment..."
                              style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #dadce0', fontSize: '13px', outline: 'none' }}
                            />
                            <button type="submit" style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <PaperPlaneRight size={14} weight="fill" />
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
        )}

          {activeNav === 'classwork' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Header with Create Button / Classwork Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 400, color: '#3c4043', margin: 0 }}>Classwork</h2>
                  <p style={{ fontSize: '14px', color: '#5f6368', margin: '4px 0 0 0' }}>Assignments, quizzes, and resources</p>
                </div>
                {(isOwner || isTeacher) && (
                  <ClassworkCreateMenu onCreateSelect={(type) => {
                    if (type === 'assignment') {
                      setIsAssignmentModalOpen(true);
                    }
                  }} />
                )}
              </div>

              {/* Detail view of submissions (if selected by teacher) */}
              {selectedAssignment && (isOwner || isTeacher) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8f9fa', borderRadius: '8px', padding: '20px', border: '1px solid #dadce0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dadce0', paddingBottom: '12px' }}>
                    <div>
                      <button 
                        onClick={() => { setSelectedAssignment(null); setGradingSubmission(null); }}
                        style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: '14px', fontWeight: 500, padding: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        ← Back to Classwork
                      </button>
                      <h3 style={{ margin: 0, fontSize: '20px', color: '#202124', fontWeight: 600 }}>Submissions for: {selectedAssignment.title}</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5f6368' }}>Max Points: {selectedAssignment.points} | Due: {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleString() : 'No due date'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '24px', minHeight: '400px' }}>
                    {/* Student List Sidebar */}
                    <div style={{ width: '280px', borderRight: '1px solid #dadce0', paddingRight: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#3c4043', fontWeight: 600 }}>Students ({students.length})</h4>
                      {students.length === 0 ? (
                        <div style={{ fontSize: '13px', color: '#70757a', fontStyle: 'italic' }}>No students enrolled.</div>
                      ) : (
                        students.map(student => {
                          const sub = submissions.find(s => s.assignment_id === selectedAssignment.id && s.student_id === student.id);
                          const isGraded = sub && sub.grade !== null;
                          return (
                            <button
                              key={student.id}
                              onClick={() => {
                                setGradingSubmission(sub || { assignment_id: selectedAssignment.id, student_id: student.id, student_name: student.name, mock: true });
                                setGradingPoints(sub?.grade || '');
                                setGradingFeedback(sub?.private_feedback || '');
                              }}
                              style={{
                                width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid ' + (gradingSubmission?.student_id === student.id ? '#1a73e8' : '#dadce0'),
                                background: gradingSubmission?.student_id === student.id ? '#e8f0fe' : 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px'
                              }}
                            >
                              <span style={{ fontSize: '14px', fontWeight: 500, color: '#3c4043' }}>{student.name}</span>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: isGraded ? '#28a745' : (sub ? '#e0a800' : '#dc3545') }}>
                                {isGraded ? `Graded: ${sub.grade}/${selectedAssignment.points}` : (sub ? 'Turned In (Pending)' : 'Missing')}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Submission Details & Grading Panel */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {gradingSubmission ? (
                        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #dadce0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', color: '#202124', fontWeight: 600 }}>Work by {gradingSubmission.student_name}</h4>
                          
                          {gradingSubmission.mock || !gradingSubmission.submission_text ? (
                            <div style={{ padding: '24px', textAlign: 'center', background: '#f8f9fa', borderRadius: '6px', border: '1px dashed #dadce0', fontSize: '14px', color: '#70757a' }}>
                              No work turned in yet.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {gradingSubmission.submission_text && (
                                <div style={{ background: '#f8f9fa', padding: '12px 16px', borderRadius: '6px', border: '1px solid #dadce0', fontSize: '14px', color: '#202124', whiteSpace: 'pre-wrap' }}>
                                  {gradingSubmission.submission_text}
                                </div>
                              )}

                              {/* Originality Scan Section */}
                              <div style={{ border: '1px solid #dadce0', borderRadius: '8px', padding: '16px', background: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#3c4043' }}>Originality Report</span>
                                    <span style={{ fontSize: '10px', background: '#e8f0fe', color: '#1967d2', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>AI Scan</span>
                                  </div>
                                  <button
                                    onClick={handleScanOriginality}
                                    disabled={isScanningOriginality || gradingSubmission.mock}
                                    style={{
                                      padding: '6px 12px', borderRadius: '4px', border: 'none',
                                      background: isScanningOriginality ? '#f1f3f4' : '#1a73e8',
                                      color: isScanningOriginality ? '#70757a' : 'white',
                                      fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                    }}
                                  >
                                    {isScanningOriginality ? 'Scanning...' : (gradingSubmission.originality_report ? 'Re-scan' : 'Scan Plagiarism')}
                                  </button>
                                </div>

                                {gradingSubmission.originality_report ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span style={{
                                        fontSize: '20px', fontWeight: 700,
                                        color: gradingSubmission.originality_report.percent > 25 ? '#dc3545' : '#28a745'
                                      }}>
                                        {gradingSubmission.originality_report.percent}% Similarity
                                      </span>
                                      <span style={{ fontSize: '11px', color: '#5f6368' }}>Scanned on {gradingSubmission.originality_report.scan_date}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#5f6368' }}>
                                      <strong>Matched Sources:</strong> {gradingSubmission.originality_report.sources.map(s => `${s.source} (${s.match})`).join(', ')}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '12px', color: '#5f6368', fontStyle: 'italic' }}>
                                    No plagiarism scan has been run on this submission.
                                  </div>
                                )}
                              </div>

                              {/* Rubrics Grading Section */}
                              {selectedAssignment.rubric && selectedAssignment.rubric.length > 0 && (
                                <div style={{ border: '1px solid #dadce0', borderRadius: '8px', padding: '16px', background: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#3c4043' }}>Grading Rubric</span>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selectedAssignment.rubric.map((criterion, idx) => (
                                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 14px', borderRadius: '6px', border: '1px solid #dadce0' }}>
                                        <div>
                                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#202124' }}>{criterion.title}</div>
                                          {criterion.description && <div style={{ fontSize: '11px', color: '#5f6368', marginTop: '2px' }}>{criterion.description}</div>}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <input 
                                            type="number"
                                            min={0}
                                            max={criterion.maxPoints}
                                            value={gradingRubricGrades[criterion.title] || ''}
                                            onChange={(e) => {
                                              const score = Math.min(criterion.maxPoints, Math.max(0, parseInt(e.target.value) || 0));
                                              const updated = { ...gradingRubricGrades, [criterion.title]: score };
                                              setGradingRubricGrades(updated);
                                              const sum = Object.values(updated).reduce((a, b) => a + b, 0);
                                              setGradingPoints(sum.toString());
                                            }}
                                            style={{ width: '50px', padding: '4px', border: '1px solid #dadce0', borderRadius: '4px', textAlign: 'center', fontSize: '13px' }}
                                          />
                                          <span style={{ fontSize: '13px', color: '#5f6368' }}>/ {criterion.maxPoints}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Grade Input Form */}
                          <div style={{ borderTop: '1px solid #dadce0', paddingTop: '16px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                              <label style={{ fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '6px', width: '150px' }}>
                                Grade
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input 
                                    type="text"
                                    placeholder="--"
                                    value={gradingPoints}
                                    onChange={(e) => setGradingPoints(e.target.value)}
                                    disabled={selectedAssignment.rubric && selectedAssignment.rubric.length > 0}
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dadce0', width: '60px', textAlign: 'center', fontSize: '14px', background: (selectedAssignment.rubric && selectedAssignment.rubric.length > 0) ? '#f1f3f4' : 'white' }}
                                  />
                                  <span style={{ fontSize: '14px', color: '#5f6368' }}>/ {selectedAssignment.points}</span>
                                </div>
                              </label>

                              <button
                                disabled={gradingSubmission.mock}
                                onClick={async () => {
                                  if (gradingSubmission.mock) return;
                                  const { error } = await supabase
                                    .from('class_submissions')
                                    .update({
                                      grade: gradingPoints.trim() === '' ? null : gradingPoints.trim(),
                                      private_feedback: gradingFeedback.trim(),
                                      rubric_grades: gradingRubricGrades
                                    })
                                    .eq('id', gradingSubmission.id);
                                  
                                  if (!error) {
                                    alert('Grade returned successfully!');
                                    setRefreshKey(prev => prev + 1);
                                  } else {
                                    alert('Failed to return grade: ' + error.message);
                                  }
                                }}
                                style={{
                                  background: gradingSubmission.mock ? '#f1f3f4' : '#1a73e8',
                                  color: gradingSubmission.mock ? '#70757a' : 'white',
                                  border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: gradingSubmission.mock ? 'not-allowed' : 'pointer',
                                  fontSize: '14px', fontWeight: 500
                                }}
                              >
                                Return Grade
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#3c4043', fontWeight: 600 }}>Private Feedback</span>
                                <div style={{ position: 'relative' }}>
                                  <button 
                                    onClick={() => setShowCommentBankPopover(!showCommentBankPopover)}
                                    style={{ background: 'none', border: '1px solid #dadce0', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#5f6368' }}
                                  >
                                    📁 Comment Bank
                                  </button>
                                  {showCommentBankPopover && (
                                    <div style={{
                                      position: 'absolute', right: 0, bottom: '28px', width: '280px', background: '#ffffff',
                                      border: '1px solid #dadce0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                      zIndex: 100, padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px'
                                    }}>
                                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#5f6368', paddingBottom: '4px', borderBottom: '1px solid #f1f3f4', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Select to insert</span>
                                        <button 
                                          onClick={() => {
                                            if (!gradingFeedback.trim()) return;
                                            setCommentBank(prev => {
                                              const updated = [...prev, gradingFeedback.trim()];
                                              localStorage.setItem('luter:classroom:comment_bank', JSON.stringify(updated));
                                              return updated;
                                            });
                                          }}
                                          style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                                        >
                                          + Save Feedback
                                        </button>
                                      </div>
                                      <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {commentBank.map((comment, idx) => (
                                          <button
                                            key={idx}
                                            onClick={() => {
                                              setGradingFeedback(prev => (prev ? prev + "\n" + comment : comment));
                                              setShowCommentBankPopover(false);
                                            }}
                                            style={{ width: '100%', padding: '6px 8px', background: 'none', border: 'none', textAlign: 'left', fontSize: '11.5px', color: '#3c4043', cursor: 'pointer', borderRadius: '4px' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                          >
                                            {comment}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <textarea 
                                value={gradingFeedback}
                                onChange={(e) => setGradingFeedback(e.target.value)}
                                placeholder="Add private feedback for the student..."
                                rows={2}
                                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '13px', resize: 'vertical' }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '8px', border: '1px solid #dadce0', padding: '40px', color: '#70757a', fontSize: '14px' }}>
                          Select a student from the list to view their work and grade.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Student View tabs */}
                  {!(isOwner || isTeacher) && (
                    <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #dadce0', marginBottom: '8px' }}>
                      {['To-Do', 'Done & Graded'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => {
                            setSelectedStudentTab(tab);
                            setSelectedAssignment(null);
                          }}
                          style={{
                            background: 'none', border: 'none', borderBottom: selectedStudentTab === tab ? '3px solid #1a73e8' : '3px solid transparent',
                            color: selectedStudentTab === tab ? '#1a73e8' : '#5f6368', padding: '8px 16px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                          }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* List of assignments */}
                  {assignments.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '80px' }}>
                      <div style={{ width: '160px', height: '160px', background: '#f1f3f4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                        <BookOpen size={64} color="#dadce0" weight="duotone" />
                      </div>
                      <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#3c4043', margin: '0 0 8px 0' }}>
                        {isOwner || isTeacher ? "This is where you'll assign work" : "No assignments posted yet"}
                      </h2>
                      <p style={{ fontSize: '14px', color: '#5f6368', margin: 0, textAlign: 'center', maxWidth: '300px' }}>
                        {isOwner || isTeacher ? "You can add assignments and other work for the class, then organize it into topics" : "Your teacher hasn't assigned any work to this class yet."}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {(() => {
                        let filtered = assignments.filter(a => {
                          if (!a.scheduled_for) return true;
                          if (new Date(a.scheduled_for) <= new Date()) return true;
                          return isTeacher;
                        });
                        
                        if (!(isOwner || isTeacher)) {
                          if (selectedStudentTab === 'To-Do') {
                            filtered = filtered.filter(a => !submissions.some(s => s.assignment_id === a.id && s.student_id === user?.id));
                          } else {
                            filtered = filtered.filter(a => submissions.some(s => s.assignment_id === a.id && s.student_id === user?.id));
                          }
                        }

                        if (filtered.length === 0) {
                          return (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#70757a', fontStyle: 'italic', fontSize: '14px' }}>
                              No assignments in this section.
                            </div>
                          );
                        }

                        return filtered.map(assign => {
                          const isExpanded = selectedAssignment?.id === assign.id;
                          const sub = submissions.find(s => s.assignment_id === assign.id && s.student_id === user?.id);
                          const isGraded = sub && sub.grade !== null;

                          return (
                            <div key={assign.id} style={{ border: '1px solid #dadce0', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
                              <div 
                                onClick={() => setSelectedAssignment(isExpanded ? null : assign)}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: isExpanded ? '#f8f9fa' : 'white' }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e8f0fe', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ClipboardText size={22} weight="fill" />
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <h4 style={{ margin: 0, fontSize: '16px', color: '#3c4043', fontWeight: 500 }}>{assign.title}</h4>
                                      {assign.scheduled_for && new Date(assign.scheduled_for) > new Date() && (
                                        <span style={{ padding: '2px 6px', background: '#ffeeca', color: '#b06000', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                                          🕒 Scheduled
                                        </span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#70757a' }}>
                                      Posted {new Date(assign.created_at).toLocaleDateString()}
                                      {assign.due_date && ` | Due: ${new Date(assign.due_date).toLocaleString()}`}
                                      {assign.scheduled_for && new Date(assign.scheduled_for) > new Date() && ` | Releases: ${new Date(assign.scheduled_for).toLocaleString()}`}
                                    </span>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#5f6368' }}>{assign.points} pts</span>
                                  {!(isOwner || isTeacher) && (
                                    <span style={{
                                      padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                                      background: isGraded ? '#e6f4ea' : (sub ? '#fef7e0' : '#fce8e6'),
                                      color: isGraded ? '#137333' : (sub ? '#b06000' : '#c5221f')
                                    }}>
                                      {isGraded ? `Graded: ${sub.grade}` : (sub ? 'Turned In' : 'Missing')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div style={{ padding: '20px', borderTop: '1px solid #dadce0', background: 'white', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  {assign.description && (
                                    <p style={{ margin: 0, fontSize: '14px', color: '#3c4043', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{assign.description}</p>
                                  )}

                                  {assign.attachments && assign.attachments.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                                      {assign.attachments.map((att, attIdx) => (
                                        <a 
                                          key={attIdx} 
                                          href={att.url.startsWith('http') ? att.url : '#'} 
                                          onClick={(e) => {
                                            if (att.type === 'file' || att.url.toLowerCase().endsWith('.pdf') || att.url.toLowerCase().endsWith('.docx') || att.url.toLowerCase().endsWith('.png') || att.url.toLowerCase().endsWith('.jpg') || att.url.toLowerCase().endsWith('.jpeg')) {
                                              e.preventDefault();
                                              setActiveMaterialOverlay({ title: att.title, url: att.url, type: att.type });
                                            }
                                          }}
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          style={{ 
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', 
                                            border: '1px solid #dadce0', borderRadius: '8px', textDecoration: 'none', 
                                            background: '#f8f9fa', width: '280px', color: 'inherit'
                                          }}
                                        >
                                          <div style={{ color: '#1a73e8' }}>
                                            <BookBookmark size={24} />
                                          </div>
                                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#3c4043' }}>{att.title}</div>
                                            <div style={{ fontSize: '11px', color: '#70757a' }}>{att.type.toUpperCase()}</div>
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  )}

                                  {/* Teacher actions */}
                                  {(isOwner || isTeacher) ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f3f4', paddingTop: '16px' }}>
                                      <div style={{ fontSize: '13px', color: '#5f6368' }}>
                                        {submissions.filter(s => s.assignment_id === assign.id).length} turned in | {students.length} total students
                                      </div>
                                      <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm('Are you sure you want to delete this assignment? All submissions will also be deleted.')) {
                                              await supabase.from('class_assignments').delete().eq('id', assign.id);
                                              setAssignments(prev => prev.filter(a => a.id !== assign.id));
                                              setSelectedAssignment(null);
                                            }
                                          }}
                                          style={{ background: 'none', border: '1px solid #dc3545', color: '#dc3545', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                        >
                                          Delete
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedAssignment(assign);
                                            setGradingSubmission(null);
                                          }}
                                          style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                        >
                                          View Submissions
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    // Student actions
                                    <div style={{ borderTop: '1px solid #f1f3f4', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                      {sub ? (
                                        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '6px', border: '1px solid #dadce0' }}>
                                          <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#3c4043' }}>Your Submission</h5>
                                          {sub.submission_text && (
                                            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#202124', whiteSpace: 'pre-wrap' }}>{sub.submission_text}</p>
                                          )}

                                          {isGraded && (
                                            <div style={{ marginTop: '12px', padding: '16px', background: '#e8f0fe', borderRadius: '6px', border: '1px solid #1a73e8', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a73e8' }}>Grade: {sub.grade} / {assign.points}</div>
                                              
                                              {/* Student Rubric display */}
                                              {assign.rubric && assign.rubric.length > 0 && sub.rubric_grades && (
                                                <div style={{ background: '#ffffff', borderRadius: '6px', border: '1px solid #dadce0', padding: '12px', marginTop: '4px' }}>
                                                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#5f6368', display: 'block', marginBottom: '6px' }}>Rubric Details</span>
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {assign.rubric.map((criterion, rIdx) => (
                                                      <div key={rIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#3c4043' }}>
                                                        <div>
                                                          <strong>{criterion.title}</strong>
                                                          {criterion.description && <div style={{ fontSize: '10px', color: '#70757a' }}>{criterion.description}</div>}
                                                        </div>
                                                        <span style={{ fontWeight: 600, color: '#1967d2' }}>
                                                          {sub.rubric_grades[criterion.title] !== undefined ? `${sub.rubric_grades[criterion.title]} / ${criterion.maxPoints}` : `-- / ${criterion.maxPoints}`}
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {sub.private_feedback && (
                                                <div style={{ fontSize: '13px', color: '#3c4043', borderTop: '1px solid #dadce0', paddingTop: '8px' }}>
                                                  <strong style={{ color: '#1a73e8' }}>Private feedback:</strong> {sub.private_feedback}
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Student Plagiarism display if scanned */}
                                          {sub.originality_report && (
                                            <div style={{ marginTop: '12px', padding: '12px', background: '#fcf8f2', borderRadius: '6px', border: '1px solid #ffeeba', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#b06000' }}>Originality Scan Summary</div>
                                              <div style={{ fontSize: '13px', color: '#3c4043' }}>
                                                Similarity index: <span style={{ fontWeight: 700, color: sub.originality_report.percent > 25 ? '#dc3545' : '#28a745' }}>{sub.originality_report.percent}%</span>
                                              </div>
                                              <div style={{ fontSize: '11px', color: '#5f6368' }}>
                                                Matched sources: {sub.originality_report.sources.map(s => `${s.source} (${s.match})`).join(', ')}
                                              </div>
                                            </div>
                                          )}

                                          {!isGraded && (
                                            <button
                                              onClick={async () => {
                                                if (confirm('Are you sure you want to unsubmit? This will remove your current work.')) {
                                                  await supabase.from('class_submissions').delete().eq('id', sub.id);
                                                  setRefreshKey(prev => prev + 1);
                                                }
                                              }}
                                              style={{ background: 'none', border: '1px solid #dc3545', color: '#dc3545', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                                            >
                                              Unsubmit
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        // Turn in form
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                          <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#3c4043' }}>Submit Your Work</h5>
                                          <textarea
                                            placeholder="Type your response here..."
                                            value={submissionText}
                                            onChange={(e) => setSubmissionText(e.target.value)}
                                            rows={4}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '14px', resize: 'vertical' }}
                                          />

                                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                              onClick={async () => {
                                                if (!submissionText.trim()) return;
                                                const studentName = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email || 'Student';
                                                const { error } = await supabase
                                                  .from('class_submissions')
                                                  .insert({
                                                    assignment_id: assign.id,
                                                    student_id: user.id,
                                                    student_name: studentName,
                                                    submission_text: submissionText,
                                                    attachments: []
                                                  });
                                                
                                                if (!error) {
                                                  alert('Work turned in successfully!');
                                                  setSubmissionText('');
                                                  setRefreshKey(prev => prev + 1);
                                                } else {
                                                  alert('Failed to submit work: ' + error.message);
                                                }
                                              }}
                                              style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                            >
                                              Turn In
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeNav === 'people' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px', paddingTop: '16px' }}>
              
              {/* Teachers Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #1a73e8', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 400, color: '#3c4043', margin: 0 }}>Teachers</h2>
                  {(isOwner || isTeacher) && (
                    <UserPlus 
                      size={24} 
                      color="#1a73e8" 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => {
                        setInviteModalRole('teacher');
                        setIsInviteModalOpen(true);
                      }}
                    />
                  )}
                </div>
                
                {teachers.map(teacher => (
                  <div key={teacher.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#a142f4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 500 }}>
                        {teacher.name ? teacher.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'T'}
                      </div>
                      <span style={{ fontSize: '14px', color: '#3c4043', fontWeight: 500 }}>{teacher.name || 'Teacher'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {(isOwner || isTeacher) && teacher.id !== currentRoom?.user_id && teacher.id !== user?.id && (
                        <select
                          value={teacher.role || 'teacher'}
                          onChange={(e) => handleSetRole(teacher.id, e.target.value)}
                          style={{
                            padding: '4px 8px', borderRadius: '4px', border: '1px solid #dadce0',
                            fontSize: '12px', color: '#3c4043', background: 'white', cursor: 'pointer'
                          }}
                        >
                          <option value="teacher">Teacher</option>
                          <option value="student">Student</option>
                        </select>
                      )}
                      {user?.id !== teacher.id && (
                        <button 
                          onClick={() => setActiveDmRecipient(teacher)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#1a73e8', fontSize: '13px', fontWeight: 500 }}
                        >
                          <ChatsTeardrop size={20} />
                          <span>Message</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Students Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #1a73e8', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 400, color: '#3c4043', margin: 0 }}>Students</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#1a73e8', fontWeight: 500 }}>{students.length} students</span>
                    {(isOwner || isTeacher) && (
                      <UserPlus 
                        size={24} 
                        color="#1a73e8" 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => {
                          setInviteModalRole('student');
                          setIsInviteModalOpen(true);
                        }}
                      />
                    )}
                  </div>
                </div>

                {students.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
                     <h2 style={{ fontSize: '28px', fontWeight: 400, color: '#1a73e8', margin: '0 0 16px 0' }}>Invite students to your class</h2>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ fontSize: '14px', color: '#3c4043' }}>Give them the class code:</span>
                       <span style={{ fontSize: '18px', color: '#1a73e8', fontWeight: 500, letterSpacing: '1px' }}>{classCode}</span>
                     </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {students.map(student => {
                      const isMutedStudent = mutedStudents.includes(student.id);
                      return (
                        <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #f1f3f4' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#17a2b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 500 }}>
                              {student.name ? student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'S'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '14px', color: '#3c4043', fontWeight: 500 }}>{student.name || 'Student'}</span>
                              {isMutedStudent && <span style={{ fontSize: '11px', color: '#dc3545' }}>Muted</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {(isOwner || isTeacher) && (
                              <select
                                value={student.role || 'student'}
                                onChange={(e) => handleSetRole(student.id, e.target.value)}
                                style={{
                                  padding: '4px 8px', borderRadius: '4px', border: '1px solid #dadce0',
                                  fontSize: '12px', color: '#3c4043', background: 'white', cursor: 'pointer'
                                }}
                              >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                              </select>
                            )}
                            {(isOwner || isTeacher) && (
                              <button 
                                onClick={() => setActiveDmRecipient(student)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#1a73e8', fontSize: '13px', fontWeight: 500 }}
                              >
                                <ChatsTeardrop size={20} />
                                <span>Message</span>
                              </button>
                            )}

                            {(isOwner || isTeacher) && (
                              <button 
                                onClick={async () => {
                                  if (isMutedStudent) {
                                    await supabase.from('class_muted_students').delete().eq('class_id', classId).eq('student_id', student.id);
                                    setMutedStudents(prev => prev.filter(id => id !== student.id));
                                  } else {
                                    await supabase.from('class_muted_students').insert({ class_id: classId, student_id: student.id, muted_by: user.id });
                                    setMutedStudents(prev => [...prev, student.id]);
                                  }
                                }}
                                style={{
                                  background: 'none', border: '1px solid ' + (isMutedStudent ? '#28a745' : '#dc3545'),
                                  color: isMutedStudent ? '#28a745' : '#dc3545',
                                  padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 500
                                }}
                              >
                                {isMutedStudent ? 'Unmute' : 'Mute'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {activeNav === 'chat' && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)',
              background: '#f8f9fa', position: 'relative', border: '1px solid #dadce0', borderRadius: '8px', overflow: 'hidden'
            }}>
              {/* Message List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {groupMessages.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: '#5f6368', padding: '40px 0' }}>
                    <ChatsTeardrop size={48} color="#dadce0" />
                    <span style={{ fontSize: '15px', fontWeight: 500 }}>Welcome to the Class Chat Room!</span>
                    <span style={{ fontSize: '13px' }}>Start a discussion, ask questions, and tag others using @.</span>
                  </div>
                ) : (
                  groupMessages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ 
                          width: '36px', height: '36px', borderRadius: '50%', 
                          background: isMe ? '#1a73e8' : '#37474f', color: 'white', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontSize: '14px', fontWeight: 500, flexShrink: 0
                        }}>
                          {msg.sender_initials || 'U'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#202124' }}>{msg.sender_name}</span>
                            <span style={{ fontSize: '10px', color: '#70757a' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p style={{ fontSize: '14px', color: '#3c4043', margin: '4px 0 0 0', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                            {renderMessageText(msg.message_text)}
                          </p>
                        </div>
                        {isOwner && (
                          <button 
                            onClick={async () => {
                              const { error } = await supabase.from('class_group_messages').delete().eq('id', msg.id);
                              if (!error) setGroupMessages(prev => prev.filter(m => m.id !== msg.id));
                            }}
                            style={{ background: 'none', border: 'none', color: '#d93025', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', padding: '0 8px' }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={groupMessagesEndRef} />
              </div>

              {/* Mention Dropdown */}
              {showMentionDropdown && filteredMentionMembers.length > 0 && (
                <div style={{
                  position: 'absolute', bottom: '80px', left: '24px', width: '220px',
                  background: 'white', border: '1px solid #dadce0', borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden'
                }}>
                  <div style={{ padding: '8px 12px', fontSize: '11px', color: '#70757a', borderBottom: '1px solid #f1f3f4', fontWeight: 600 }}>MENTION CLASS MEMBER</div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {filteredMentionMembers.map(member => (
                      <button 
                        key={member.id}
                        onClick={() => handleSelectMention(member)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 12px', background: 'none', border: 'none',
                          cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#202124'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1a73e8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{member.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input Bar */}
              <form onSubmit={async (e) => {
                e.preventDefault();
                const trimmed = groupInputText.trim();
                if (!trimmed) return;
                
                if (isMuted) {
                  alert("You are muted and cannot send messages.");
                  return;
                }

                setGroupInputText('');
                setShowMentionDropdown(false);

                try {
                  const { error } = await supabase.from('class_group_messages').insert({
                    class_id: classId,
                    sender_id: user?.id,
                    sender_name: userName,
                    sender_initials: userInitials,
                    message_text: trimmed
                  });
                  if (error) throw error;
                } catch (err) {
                  console.error('[GroupChat] Error sending message:', err);
                }
              }} style={{
                padding: '16px 24px', borderTop: '1px solid #dadce0', background: 'white',
                display: 'flex', gap: '12px', alignItems: 'center'
              }}>
                <input
                  type="text"
                  value={groupInputText}
                  onChange={handleGroupInputChange}
                  placeholder={isMuted ? "You are muted and cannot chat" : "Type a message... Use @ to tag others"}
                  disabled={isMuted}
                  style={{
                    flex: 1, padding: '12px 18px', borderRadius: '24px', border: '1px solid #dadce0',
                    fontSize: '14px', outline: 'none', background: '#f8f9fa'
                  }}
                  onFocus={e => e.target.style.border = '1px solid #1a73e8'}
                  onBlur={e => e.target.style.border = '1px solid #dadce0'}
                />
                <button type="submit" disabled={isMuted || !groupInputText.trim()} style={{
                  background: isMuted || !groupInputText.trim() ? '#f1f3f4' : '#1a73e8',
                  color: isMuted || !groupInputText.trim() ? '#70757a' : 'white',
                  border: 'none', cursor: 'pointer', width: '40px', height: '40px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <PaperPlaneRight size={18} weight="fill" />
                </button>
              </form>
            </div>
          )}

          {activeNav === 'timetable' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
              <ClassroomCalendar filterClassId={classId} isTeacher={isTeacher} />
            </div>
          )}

          {activeNav === 'workspace' && (
            <ClassroomWorkspace
              classId={classId}
              displayTitle={displayTitle}
              userName={userName}
              user={user}
              isTeacher={isTeacher}
              announcements={announcements}
              assignments={assignments}
            />
          )}

          {activeNav === 'analytics' && isTeacher && (
            <div style={{ flex: 1, padding: '32px', background: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Outfit, sans-serif', overflowY: 'auto' }}>
              
              {/* Analytics Header */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #dadce0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#202124', margin: 0 }}>Class Analytics Dashboard</h2>
                <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Real-time statistics on grades, submissions, and teacher operations.</p>
              </div>

              {/* Stats Cards */}
              <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
                <div style={{ flex: 1, background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#5f6368', textTransform: 'uppercase' }}>Average Assignment Grade</span>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a73e8' }}>
                    {(() => {
                      const graded = submissions.filter(s => s.grade !== null && s.grade !== '');
                      if (graded.length === 0) return 'N/A';
                      const avg = graded.reduce((sum, s) => sum + parseFloat(s.grade), 0) / graded.length;
                      return `${avg.toFixed(1)}%`;
                    })()}
                  </div>
                  <span style={{ fontSize: '11px', color: '#70757a' }}>Across all graded homework submissions</span>
                </div>

                <div style={{ flex: 1, background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#5f6368', textTransform: 'uppercase' }}>Turn-in Rate</span>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#137333' }}>
                    {(() => {
                      const totalStudents = students.length;
                      const totalAssignments = assignments.length;
                      if (totalStudents === 0 || totalAssignments === 0) return '0%';
                      const possibleSubmissions = totalStudents * totalAssignments;
                      const rate = (submissions.length / possibleSubmissions) * 100;
                      return `${Math.round(rate)}%`;
                    })()}
                  </div>
                  <span style={{ fontSize: '11px', color: '#70757a' }}>{submissions.length} submissions out of {students.length * assignments.length} expected</span>
                </div>

                <div style={{ flex: 1, background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#5f6368', textTransform: 'uppercase' }}>Muted Students</span>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#d93025' }}>
                    {mutedStudents.length}
                  </div>
                  <span style={{ fontSize: '11px', color: '#70757a' }}>Students restricted from posting comments/chat</span>
                </div>
              </div>

              {/* Audit Log Timeline */}
              <div style={{ background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#202124', margin: 0 }}>Class Activity Audit Logs</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                  {auditLogs.map((log, lIdx) => (
                    <div key={lIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '13px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ padding: '4px 8px', background: '#e8f0fe', color: '#1a73e8', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>{log.action}</span>
                        <span style={{ color: '#202124' }}>Performed by <strong>{log.user}</strong></span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#70757a' }}>{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {activeDmRecipient && (
        <DirectMessageChat
          classId={classId}
          currentUserId={user?.id}
          recipientId={activeDmRecipient.id}
          recipientName={activeDmRecipient.name}
          onClose={() => setActiveDmRecipient(null)}
        />
      )}

      {isInviteModalOpen && (
        <InviteMemberModal
          classId={classId}
          classCode={classCode}
          initialRole={inviteModalRole}
          onClose={() => setIsInviteModalOpen(false)}
          onInviteSuccess={() => {
            setRefreshKey(prev => prev + 1);
            setIsInviteModalOpen(false);
          }}
        />
      )}

      {isAssignmentModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
        }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', width: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#202124', fontWeight: 600 }}>Create Assignment</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, paddingRight: '4px', paddingBottom: '8px' }}>
              <label style={{ fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                Title
                <input 
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Quiz 1: Introduction to Physics"
                  style={{ padding: '10px 14px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '14px' }}
                />
              </label>

              <label style={{ fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                Instructions (Optional)
                <textarea 
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter assignment details and instructions..."
                  rows={3}
                  style={{ padding: '10px 14px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '14px', resize: 'vertical' }}
                />
              </label>

              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ flex: 1, fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  Points
                  <input 
                    type="number"
                    value={newAssignment.points}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, points: parseInt(e.target.value) || 100 }))}
                    style={{ padding: '10px 14px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '14px' }}
                  />
                </label>

                <label style={{ flex: 1, fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  Due Date
                  <input 
                    type="datetime-local"
                    value={newAssignment.due_date}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, due_date: e.target.value }))}
                    style={{ padding: '10px 14px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '14px' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ flex: 1, fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  Schedule Release (Optional)
                  <input 
                    type="datetime-local"
                    value={assignmentScheduledFor}
                    onChange={(e) => setAssignmentScheduledFor(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '14px' }}
                  />
                </label>
              </div>

              {/* Rubric Builder Section */}
              <div style={{ borderTop: '1px solid #dadce0', paddingTop: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#3c4043' }}>Rubric Criteria ({newRubricCriteria.length})</span>
                  <button 
                    onClick={() => setShowRubricBuilder(!showRubricBuilder)}
                    style={{ background: 'none', border: '1px solid #1a73e8', color: '#1a73e8', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {showRubricBuilder ? 'Close Builder' : '+ Add Criterion'}
                  </button>
                </div>

                {showRubricBuilder && (
                  <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dadce0', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                    <input 
                      type="text" 
                      placeholder="Criterion Title (e.g. Grammar, Content)" 
                      value={rubricCriteriaInput.title}
                      onChange={(e) => setRubricCriteriaInput(prev => ({ ...prev, title: e.target.value }))}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '13px', background: 'white' }}
                    />
                    <input 
                      type="text" 
                      placeholder="Criterion Description" 
                      value={rubricCriteriaInput.description}
                      onChange={(e) => setRubricCriteriaInput(prev => ({ ...prev, description: e.target.value }))}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '13px', background: 'white' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#5f6368' }}>Max Points:</span>
                      <input 
                        type="number" 
                        value={rubricCriteriaInput.maxPoints}
                        onChange={(e) => setRubricCriteriaInput(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 10 }))}
                        style={{ padding: '6px', width: '80px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '13px', background: 'white' }}
                      />
                      <button 
                        onClick={() => {
                          if (!rubricCriteriaInput.title.trim()) return;
                          setNewRubricCriteria(prev => [...prev, { ...rubricCriteriaInput }]);
                          setRubricCriteriaInput({ title: '', description: '', maxPoints: 10 });
                          setShowRubricBuilder(false);
                        }}
                        style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}
                      >
                        Add to Rubric
                      </button>
                    </div>
                  </div>
                )}

                {newRubricCriteria.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {newRubricCriteria.map((c, cIdx) => (
                      <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f1f3f4', borderRadius: '6px', fontSize: '13px' }}>
                        <div>
                          <strong style={{ color: '#202124' }}>{c.title}</strong> ({c.maxPoints} pts)
                          {c.description && <div style={{ fontSize: '11px', color: '#5f6368', marginTop: '2px' }}>{c.description}</div>}
                        </div>
                        <button 
                          onClick={() => setNewRubricCriteria(prev => prev.filter((_, i) => i !== cIdx))}
                          style={{ background: 'none', border: 'none', color: '#d93025', cursor: 'pointer', fontWeight: 700 }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #dadce0', paddingTop: '16px' }}>
              <button 
                onClick={() => {
                  setIsAssignmentModalOpen(false);
                  setNewRubricCriteria([]);
                  setAssignmentScheduledFor('');
                  setShowRubricBuilder(false);
                }}
                style={{ background: 'none', border: '1px solid #dadce0', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!newAssignment.title.trim()) return;
                  const insertPayload = {
                    class_id: classId,
                    title: newAssignment.title,
                    description: newAssignment.description,
                    points: newAssignment.points,
                    due_date: newAssignment.due_date ? newAssignment.due_date : null,
                    rubric: newRubricCriteria
                  };
                  if (assignmentScheduledFor) {
                    insertPayload.scheduled_for = new Date(assignmentScheduledFor).toISOString();
                  }

                  const { error } = await supabase
                    .from('class_assignments')
                    .insert(insertPayload);
                  
                  if (!error) {
                    // Update Audit Logs
                    setAuditLogs(prev => [
                      {
                        action: assignmentScheduledFor ? 'Assignment scheduled' : 'Assignment created',
                        user: userName,
                        time: new Date().toLocaleTimeString()
                      },
                      ...prev
                    ]);

                    setIsAssignmentModalOpen(false);
                    setNewAssignment({ title: '', description: '', points: 100, due_date: '' });
                    setNewRubricCriteria([]);
                    setAssignmentScheduledFor('');
                    setShowRubricBuilder(false);
                    setRefreshKey(prev => prev + 1);
                  } else {
                    alert('Error creating assignment: ' + error.message);
                  }
                }}
                style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
              >
                {assignmentScheduledFor ? 'Schedule' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeMaterialOverlay && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#ffffff', zIndex: 2000, display: 'flex', flexDirection: 'column'
        }}>
          {/* Overlay Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px', borderBottom: '1px solid #dadce0', background: '#f8f9fa', flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#202124' }}>
                {activeMaterialOverlay.title}
              </span>
            </div>
            <button
              onClick={() => {
                setActiveMaterialOverlay(null);
                setActiveWorkspaceTool(null);
                setDrawMode(null);
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368',
                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 500
              }}
            >
              <X size={20} />
              Close
            </button>
          </div>

          {/* Annotation Control Toolbar */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px',
            borderBottom: '1px solid #dadce0', background: '#ffffff', flexShrink: 0, alignItems: 'center'
          }}>
            {[
              { id: 'highlight', label: 'Highlight', icon: <Highlighter size={18} /> },
              { id: 'annotate', label: 'Draw', icon: <PencilLine size={18} /> },
              { id: 'pin', label: 'Pin Note', icon: <PushPin size={18} /> },
            ].map(t => {
              const isActive = activeWorkspaceTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (isActive) {
                      setActiveWorkspaceTool(null);
                      setDrawMode(null);
                    } else {
                      setActiveWorkspaceTool(t.id);
                      setDrawMode(t.id === 'annotate' ? 'pen' : t.id === 'highlight' ? 'highlighter' : null);
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '4px',
                    border: isActive ? '1px solid #1a73e8' : '1px solid #dadce0',
                    background: isActive ? '#E8F0FE' : '#ffffff',
                    color: isActive ? '#1967D2' : '#5f6368',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              );
            })}

            {activeWorkspaceTool === 'annotate' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '16px', borderLeft: '1px solid #dadce0', paddingLeft: '16px' }}>
                <button
                  onClick={() => setDrawMode('eraser')}
                  style={{
                    padding: '6px 12px', borderRadius: '4px', border: drawMode === 'eraser' ? '1px solid #1a73e8' : '1px solid #dadce0',
                    background: drawMode === 'eraser' ? '#E8F0FE' : '#ffffff', color: '#5f6368', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Eraser
                </button>
                <input 
                  type="color" 
                  value={strokeColor} 
                  onChange={(e) => setStrokeColor(e.target.value)} 
                  style={{ border: 'none', width: '32px', height: '24px', cursor: 'pointer', padding: 0 }}
                />
                <select 
                  value={strokeSize} 
                  onChange={(e) => setStrokeSize(parseInt(e.target.value))}
                  style={{ padding: '4px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '12px' }}
                >
                  <option value={2}>2px</option>
                  <option value={4}>4px</option>
                  <option value={6}>6px</option>
                  <option value={8}>8px</option>
                </select>
              </div>
            )}
          </div>

          {/* Main Renderer Content */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <RoomProvider
              id={`luter:classroom:material:${classId}-${activeMaterialOverlay.title.replace(/[^a-zA-Z0-9]/g, '-')}`}
              userInfo={{
                id: user?.id || 'guest',
                name: userName,
                avatar: user?.user_metadata?.avatar_url || null,
                color: '#7C3AED',
                role: 'editor'
              }}
              initialPresence={{}}
              initialStorage={{}}
            >
              <ClientSideSuspense fallback={<div style={{ padding: '24px', fontFamily: 'Outfit' }}>Connecting material session...</div>}>
                <CommentsProvider roomId={`luter:classroom:material:${classId}-${activeMaterialOverlay.title.replace(/[^a-zA-Z0-9]/g, '-')}`}>
                  <MaterialRenderer
                    material={{
                      id: `${classId}-${activeMaterialOverlay.title}`,
                      title: activeMaterialOverlay.title,
                      url: activeMaterialOverlay.url,
                      file_path: activeMaterialOverlay.url,
                      file_type: activeMaterialOverlay.type
                    }}
                    activeTab="source"
                    annotateMode={activeWorkspaceTool === 'annotate'}
                    highlightMode={activeWorkspaceTool === 'highlight'}
                    pinMode={activeWorkspaceTool === 'pin'}
                    annotationColor={strokeColor}
                    annotationStrokeSize={strokeSize}
                    isEraserMode={drawMode === 'eraser'}
                    annotationToolType={drawMode || 'pen'}
                    scrollContainerRef={{ current: null }}
                    isDark={false}
                  />
                </CommentsProvider>
              </ClientSideSuspense>
            </RoomProvider>
          </div>
        </div>
      )}

      {/* Floating Chat / Audio Widget */}
      {user?.id && user.id !== 'undefined' && (
        <>
          {/* ========================================== */}
          {/* GROK AI CHAT PANEL                         */}
          {/* ========================================== */}
          {isGrokOpen && (
            <div style={{
              position: 'fixed', bottom: '88px', right: '24px', width: '380px', height: '540px',
              background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '24px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', zIndex: 1000, fontFamily: 'Outfit, sans-serif'
            }}>
              {/* Grok Header */}
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid #F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                background: '#ffffff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/mascot.png" alt="Mascot" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                  <span style={{ fontWeight: 700, fontSize: '15.5px', color: '#0F172A' }}>Grok AI Tutor</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#64748B' }}>
                  <Clock size={19} style={{ cursor: 'pointer' }} title="History" />
                  <ArrowSquareOut size={19} style={{ cursor: 'pointer' }} title="Expand" />
                  <CaretDown size={20} style={{ cursor: 'pointer' }} onClick={() => setIsGrokOpen(false)} title="Minimize" />
                </div>
              </div>

              {/* Grok Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
                
                {grokMessages.length === 1 && grokMessages[0].role === 'assistant' && (
                  /* Welcome Screen when only the greeting is present */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: 'auto 0' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', textAlign: 'center', margin: '0 0 20px 0', letterSpacing: '-0.5px' }}>
                      How can I help you today?
                    </h2>

                    {/* Ask Anything Input Container */}
                    <div style={{
                      width: '100%', background: '#ffffff', border: '1.5px solid #E2E8F0',
                      borderRadius: '20px', padding: '12px 16px', display: 'flex', flexDirection: 'column',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'border-color 0.2s',
                      marginBottom: '16px'
                    }}>
                      <textarea
                        value={grokInputText}
                        onChange={(e) => setGrokInputText(e.target.value)}
                        placeholder="Ask anything"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendGrok();
                          }
                        }}
                        style={{
                          width: '100%', border: 'none', outline: 'none', background: 'transparent',
                          fontSize: '14.5px', color: '#0F172A', minHeight: '50px', resize: 'none',
                          fontFamily: 'Outfit, sans-serif'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748B' }}>
                          <Paperclip size={18} style={{ cursor: 'pointer' }} title="Attach file" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Model Picker */}
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => setShowGrokModelDropdown(!showGrokModelDropdown)}
                              type="button"
                              style={{
                                display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9',
                                color: '#475569', fontSize: '12px', fontWeight: 600, padding: '5px 10px',
                                borderRadius: '9999px', border: 'none', cursor: 'pointer'
                              }}
                            >
                              <Lightning size={12} weight="fill" color="#F59E0B" />
                              <span>{grokModel}</span>
                              <CaretDown size={10} />
                            </button>
                            {showGrokModelDropdown && (
                              <div style={{
                                position: 'absolute', bottom: '32px', right: 0, background: 'white',
                                border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 10, overflow: 'hidden', minWidth: '100px'
                              }}>
                                <div 
                                  onClick={() => { setGrokModel('Fast'); setShowGrokModelDropdown(false); }}
                                  style={{ padding: '8px 12px', fontSize: '12.5px', cursor: 'pointer', background: grokModel === 'Fast' ? '#F8FAFC' : 'transparent', color: '#0F172A' }}
                                  onMouseEnter={e => e.target.style.background = '#F1F5F9'}
                                  onMouseLeave={e => e.target.style.background = grokModel === 'Fast' ? '#F8FAFC' : 'transparent'}
                                >
                                  Fast
                                </div>
                                <div 
                                  onClick={() => { setGrokModel('Grok'); setShowGrokModelDropdown(false); }}
                                  style={{ padding: '8px 12px', fontSize: '12.5px', cursor: 'pointer', background: grokModel === 'Grok' ? '#F8FAFC' : 'transparent', color: '#0F172A' }}
                                  onMouseEnter={e => e.target.style.background = '#F1F5F9'}
                                  onMouseLeave={e => e.target.style.background = grokModel === 'Grok' ? '#F8FAFC' : 'transparent'}
                                >
                                  Grok
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Sound wave mic animation button */}
                          <button
                            onClick={() => {
                              // Simulated speech trigger
                              setGrokInputText("Tell me about the classroom assignments");
                            }}
                            type="button"
                            style={{
                              background: '#000000', color: '#ffffff', border: 'none',
                              borderRadius: '9999px', padding: '6px 12px', display: 'flex',
                              alignItems: 'center', justifySelf: 'center', gap: '6px', cursor: 'pointer'
                            }}
                            title="Mock Audio Input"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <line x1="6" y1="9" x2="6" y2="15" />
                              <line x1="10" y1="6" x2="10" y2="18" />
                              <line x1="14" y1="4" x2="14" y2="20" />
                              <line x1="18" y1="7" x2="18" y2="17" />
                              <line x1="22" y1="10" x2="22" y2="14" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions list */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleSendGrok("Create an image of a study space")}
                        style={{
                          background: '#ffffff', border: '1px solid #E2E8F0', padding: '8px 14px',
                          borderRadius: '9999px', fontSize: '13px', fontWeight: 600, color: '#334155',
                          display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                      >
                        <Sparkle size={14} color="#7C3AED" />
                        <span>Create Images</span>
                      </button>
                      <button 
                        onClick={() => handleSendGrok("Edit image to add classroom mascot")}
                        style={{
                          background: '#ffffff', border: '1px solid #E2E8F0', padding: '8px 14px',
                          borderRadius: '9999px', fontSize: '13px', fontWeight: 600, color: '#334155',
                          display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                      >
                        <PencilLine size={14} color="#059669" />
                        <span>Edit Image</span>
                      </button>
                      <button 
                        onClick={() => handleSendGrok("Show me the latest announcements news")}
                        style={{
                          background: '#ffffff', border: '1px solid #E2E8F0', padding: '8px 14px',
                          borderRadius: '9999px', fontSize: '13px', fontWeight: 600, color: '#334155',
                          display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                      >
                        <FileText size={14} color="#2563EB" />
                        <span>Latest News</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Conversational Stream */}
                {(grokMessages.length > 1 || (grokMessages.length === 1 && grokMessages[0].role !== 'assistant')) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                    {grokMessages.map((msg, idx) => {
                      const isAi = msg.role === 'assistant';
                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                          {isAi ? (
                            /* Assistant response: Plain text on canvas */
                            <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', width: '100%' }}>
                              <div style={{
                                color: '#0F172A', fontSize: '14.5px', lineHeight: '1.6',
                                whiteSpace: 'pre-wrap', fontFamily: 'Outfit, sans-serif'
                              }}>
                                {msg.content}
                              </div>

                              {/* Actions row */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#94A3B8', marginTop: '10px' }}>
                                <button
                                  onClick={() => handleSendGrok(grokMessages[idx - 1]?.content || "")}
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  title="Regenerate"
                                >
                                  <ArrowCounterClockwise size={15} />
                                </button>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.content);
                                    setCopiedMsgIdx(idx);
                                    setTimeout(() => setCopiedMsgIdx(null), 2000);
                                  }}
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  title="Copy response"
                                >
                                  {copiedMsgIdx === idx ? <Check size={15} color="#10B981" /> : <Copy size={15} />}
                                </button>
                                <button type="button" style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Share">
                                  <ArrowSquareOut size={15} />
                                </button>
                                <button type="button" style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Like">
                                  <ThumbsUp size={15} />
                                </button>
                                <button type="button" style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Dislike">
                                  <ThumbsDown size={15} />
                                </button>
                              </div>

                              {/* Suggestion pills below */}
                              {idx === grokMessages.length - 1 && !grokSending && msg.suggestions && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px', alignSelf: 'flex-start' }}>
                                  {msg.suggestions.map((sug, sugIdx) => (
                                    <div 
                                      key={sugIdx}
                                      onClick={() => handleSendGrok(sug)}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', color: '#475569',
                                        fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s'
                                      }}
                                    >
                                      <CaretRight size={13} color="#7C3AED" weight="bold" />
                                      <span>{sug}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* User response: bubble */
                            <div style={{
                              alignSelf: 'flex-end', background: '#F1F5F9', color: '#0F172A',
                              padding: '10px 16px', borderRadius: '20px', maxWidth: '75%',
                              fontSize: '14px', lineHeight: '1.5', fontFamily: 'Outfit, sans-serif',
                              wordBreak: 'break-word'
                            }}>
                              {msg.content}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {grokSending && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', alignSelf: 'flex-start', color: '#64748B', fontSize: '13.5px' }}>
                        <Sparkle size={14} style={{ animation: 'spin 1.5s linear infinite', color: '#7C3AED' }} />
                        <span>Grok is thinking...</span>
                      </div>
                    )}
                    <div ref={grokMessagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Pinned Input Box (only when chatting) */}
              {(grokMessages.length > 1 || (grokMessages.length === 1 && grokMessages[0].role !== 'assistant')) && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', background: '#ffffff', flexShrink: 0 }}>
                  <div style={{
                    width: '100%', background: '#ffffff', border: '1px solid #E2E8F0',
                    borderRadius: '20px', padding: '10px 14px', display: 'flex', flexDirection: 'column'
                  }}>
                    <textarea
                      value={grokInputText}
                      onChange={(e) => setGrokInputText(e.target.value)}
                      placeholder="Ask anything"
                      disabled={grokSending}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendGrok();
                        }
                      }}
                      style={{
                        width: '100%', border: 'none', outline: 'none', background: 'transparent',
                        fontSize: '14px', color: '#0F172A', minHeight: '36px', maxHeight: '100px', resize: 'none',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748B' }}>
                        <Paperclip size={16} style={{ cursor: 'pointer' }} title="Attach file" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Model Picker */}
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setShowGrokModelDropdown(!showGrokModelDropdown)}
                            type="button"
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9',
                              color: '#475569', fontSize: '11px', fontWeight: 600, padding: '4px 8px',
                              borderRadius: '9999px', border: 'none', cursor: 'pointer'
                            }}
                          >
                            <Lightning size={10} weight="fill" color="#F59E0B" />
                            <span>{grokModel}</span>
                            <CaretDown size={8} />
                          </button>
                          {showGrokModelDropdown && (
                            <div style={{
                              position: 'absolute', bottom: '28px', right: 0, background: 'white',
                              border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              zIndex: 10, overflow: 'hidden', minWidth: '100px'
                            }}>
                              <div 
                                onClick={() => { setGrokModel('Fast'); setShowGrokModelDropdown(false); }}
                                style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', background: grokModel === 'Fast' ? '#F8FAFC' : 'transparent', color: '#0F172A' }}
                                onMouseEnter={e => e.target.style.background = '#F1F5F9'}
                                onMouseLeave={e => e.target.style.background = grokModel === 'Fast' ? '#F8FAFC' : 'transparent'}
                              >
                                Fast
                              </div>
                              <div 
                                onClick={() => { setGrokModel('Grok'); setShowGrokModelDropdown(false); }}
                                style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', background: grokModel === 'Grok' ? '#F8FAFC' : 'transparent', color: '#0F172A' }}
                                onMouseEnter={e => e.target.style.background = '#F1F5F9'}
                                onMouseLeave={e => e.target.style.background = grokModel === 'Grok' ? '#F8FAFC' : 'transparent'}
                              >
                                Grok
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Soundwave Mic Button */}
                        <button
                          onClick={() => setGrokInputText("Summarize assignments")}
                          type="button"
                          style={{
                            background: '#000000', color: '#ffffff', border: 'none',
                            borderRadius: '9999px', padding: '5px 10px', display: 'flex',
                            alignItems: 'center', justifySelf: 'center', gap: '4px', cursor: 'pointer'
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="6" y1="9" x2="6" y2="15" />
                            <line x1="10" y1="6" x2="10" y2="18" />
                            <line x1="14" y1="4" x2="14" y2="20" />
                            <line x1="18" y1="7" x2="18" y2="17" />
                            <line x1="22" y1="10" x2="22" y2="14" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* MESSAGING CHAT PANEL                       */}
          {/* ========================================== */}
          {isMessagingOpen && (
            <div style={{
              position: 'fixed', bottom: '88px', right: '24px', width: '380px', height: '540px',
              background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '24px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', zIndex: 1000, fontFamily: 'Outfit, sans-serif'
            }}>
              {messagingActiveView === 'list' && (
                /* 1. Conversations List screen */
                <>
                  <div style={{
                    padding: '14px 20px', borderBottom: '1px solid #F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                    background: '#ffffff'
                  }}>
                    <span style={{ fontWeight: 800, fontSize: '19px', color: '#0F172A' }}>Chat</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                        <span>All</span>
                        <CaretDown size={12} />
                      </div>
                      <UserPlus size={19} style={{ cursor: 'pointer' }} onClick={() => setShowNewMessageModal(true)} title="New direct message" />
                      <ArrowSquareOut size={19} style={{ cursor: 'pointer' }} title="Expand view" />
                      <CaretDown size={20} style={{ cursor: 'pointer' }} onClick={() => setIsMessagingOpen(false)} title="Minimize" />
                    </div>
                  </div>

                  {/* Search box */}
                  <div style={{ padding: '10px 16px', background: '#ffffff', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px', background: '#F1F5F9',
                      borderRadius: '24px', padding: '8px 14px'
                    }}>
                      <MagnifyingGlass size={16} color="#64748B" />
                      <input 
                        type="text"
                        value={messagingSearchQuery}
                        onChange={(e) => setMessagingSearchQuery(e.target.value)}
                        placeholder="Search"
                        style={{
                          border: 'none', outline: 'none', background: 'transparent',
                          flex: 1, fontSize: '13.5px', color: '#0F172A', fontFamily: 'Outfit'
                        }}
                      />
                    </div>
                  </div>

                  {/* Conversations stream */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {/* Class Lounge entry (Group Chat) */}
                    <div 
                      onClick={() => setMessagingActiveView('lounge')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                        borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.2s',
                        background: '#ffffff'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                    >
                      {/* Purple Lounge Avatar */}
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ffffff', flexShrink: 0
                      }}>
                        <ChatsTeardrop size={20} weight="fill" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Class Lounge</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>Group</span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                          {groupMessages.length > 0 
                            ? `${groupMessages[groupMessages.length - 1].sender_name}: ${groupMessages[groupMessages.length - 1].message_text}`
                            : "Welcome to the class lounge!"
                          }
                        </div>
                      </div>
                    </div>

                    {/* Direct Messages list */}
                    {recentDms
                      .filter(dm => dm.name.toLowerCase().includes(messagingSearchQuery.toLowerCase()))
                      .map((dm) => {
                        const avatarBg = (() => {
                          const colors = ['#1d9bf0', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];
                          let hash = 0;
                          for (let i = 0; i < dm.name.length; i++) {
                            hash = dm.name.charCodeAt(i) + ((hash << 5) - hash);
                          }
                          const index = Math.abs(hash) % colors.length;
                          return colors[index];
                        })();
                        return (
                          <div
                            key={dm.id}
                            onClick={() => openDmChat(dm)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                              borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.2s',
                              background: '#ffffff'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                          >
                            <div style={{
                              width: '42px', height: '42px', borderRadius: '50%',
                              background: avatarBg, color: '#ffffff', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                              fontSize: '14px', flexShrink: 0
                            }}>
                              {dm.initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {dm.name}
                                  </span>
                                  {/* Authentic Wavy Twitter/X Verified Badge */}
                                  <svg viewBox="0 0 24 24" width="13" height="13" style={{ flexShrink: 0, marginLeft: '4px', verticalAlign: 'middle' }}>
                                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.94.1-1.348.27C14.825 2.515 13.512 1.5 12 1.5s-2.825 1.015-3.422 2.28c-.408-.17-.867-.27-1.348-.27-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .94-.1 1.348-.27.597 1.265 1.91 2.28 3.422 2.28s2.825-1.015 3.422-2.28c.408.17.867.27 1.348.27 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.72 4.16l-3.32-3.32L7.9 11.9l2.25 2.25 5.02-5.02 1.42 1.41-6.44 6.44z" fill="#1d9bf0" />
                                  </svg>
                                  <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    @{dm.handle}
                                  </span>
                                </div>
                                <span style={{ fontSize: '11px', color: '#94A3B8', flexShrink: 0 }}>
                                  {new Date(dm.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div style={{ fontSize: '12.5px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                {dm.lastMessage}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {recentDms.length === 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '8px', color: '#64748B' }}>
                        <ChatsTeardrop size={36} color="#CBD5E1" />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>No messages yet</span>
                        <span style={{ fontSize: '11.5px', opacity: 0.8, textAlign: 'center' }}>Click the compose button above to start DMs with class members.</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {messagingActiveView === 'lounge' && (
                /* 2. Group Lounge Chat Screen */
                <>
                  <div style={{
                    padding: '14px 20px', borderBottom: '1px solid #F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                    background: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button 
                        onClick={() => setMessagingActiveView('list')}
                        type="button"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0F172A', display: 'flex', alignItems: 'center', padding: 0 }}
                      >
                        <ArrowLeft size={18} weight="bold" />
                      </button>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                      }}>
                        <ChatsTeardrop size={16} weight="fill" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#0F172A' }}>Class Lounge</div>
                        <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '1px' }}>Classroom Lounge Group</div>
                      </div>
                    </div>
                    <CaretDown size={20} style={{ cursor: 'pointer', color: '#475569' }} onClick={() => setIsMessagingOpen(false)} />
                  </div>

                  {/* Lounge Messages List */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {groupMessages.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: '#64748B' }}>
                        <span>No messages yet</span>
                      </div>
                    ) : (
                      groupMessages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                          <div 
                            key={msg.id} 
                            style={{
                              display: 'flex', gap: '8px', alignItems: 'flex-start',
                              alignSelf: isMe ? 'flex-end' : 'flex-start',
                              maxWidth: '85%'
                            }}
                          >
                            {!isMe && (
                              <div style={{ 
                                width: '28px', height: '28px', borderRadius: '50%', 
                                background: '#64748B', color: 'white', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                fontSize: '11px', fontWeight: 600, flexShrink: 0, marginTop: '2px'
                              }}>
                                {msg.sender_initials || 'U'}
                              </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                              {!isMe && (
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '2px', marginLeft: '4px' }}>
                                  {msg.sender_name}
                                </span>
                              )}
                              <div style={{
                                background: isMe ? '#7C3AED' : '#F1F5F9',
                                color: isMe ? 'white' : '#1E293B',
                                padding: '8px 12px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                fontSize: '13px', lineHeight: '1.4', whiteSpace: 'pre-wrap'
                              }}>
                                {renderMessageText(msg.message_text)}
                              </div>
                              <span style={{ fontSize: '9px', color: '#94A3B8', marginTop: '2px', marginRight: '4px', marginLeft: '4px' }}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={floatingMessagesEndRef} />
                  </div>

                  {/* Lounge Input Box */}
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const trimmed = floatingInputText.trim();
                      if (!trimmed) return;
                      if (isMuted) {
                        alert("You are muted and cannot send messages.");
                        return;
                      }
                      setFloatingInputText('');
                      try {
                        const { error } = await supabase.from('class_group_messages').insert({
                          class_id: classId,
                          sender_id: user?.id,
                          sender_name: userName,
                          sender_initials: userInitials,
                          message_text: trimmed
                        });
                        if (error) throw error;
                      } catch (err) {
                        console.error('[Lounge] Error sending message:', err);
                      }
                    }}
                    style={{
                      padding: '12px', borderTop: '1px solid #F1F5F9', background: 'white',
                      display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0
                    }}
                  >
                    <input 
                      type="text"
                      value={floatingInputText}
                      onChange={(e) => setFloatingInputText(e.target.value)}
                      placeholder={isMuted ? "You are muted" : "Type a message..."}
                      disabled={isMuted}
                      style={{
                        flex: 1, padding: '8px 14px', borderRadius: '20px', border: '1px solid #E2E8F0',
                        fontSize: '13.5px', outline: 'none', background: '#F8FAFC', fontFamily: 'Outfit'
                      }}
                    />
                    <button 
                      type="submit" 
                      disabled={isMuted || !floatingInputText.trim()}
                      style={{
                        background: isMuted || !floatingInputText.trim() ? '#F1F5F9' : '#7C3AED',
                        color: isMuted || !floatingInputText.trim() ? '#94A3B8' : 'white',
                        border: 'none', cursor: 'pointer', width: '32px', height: '32px',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <PaperPlaneRight size={16} weight="fill" />
                    </button>
                  </form>
                </>
              )}

              {messagingActiveView === 'dm' && messagingActiveDmRecipient && (
                /* 3. Direct Message Chat Screen */
                <>
                  <div style={{
                    padding: '14px 20px', borderBottom: '1px solid #F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                    background: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          setMessagingActiveView('list');
                          setMessagingActiveDmRecipient(null);
                        }}
                        type="button"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0F172A', display: 'flex', alignItems: 'center', padding: 0 }}
                      >
                        <ArrowLeft size={18} weight="bold" />
                      </button>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: '#1D9BF0', color: '#ffffff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px'
                      }}>
                        {messagingActiveDmRecipient.initials}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '14.5px', color: '#0F172A' }}>
                            {messagingActiveDmRecipient.name}
                          </span>
                          <svg viewBox="0 0 24 24" width="13" height="13" style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.94.1-1.348.27C14.825 2.515 13.512 1.5 12 1.5s-2.825 1.015-3.422 2.28c-.408-.17-.867-.27-1.348-.27-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .94-.1 1.348-.27.597 1.265 1.91 2.28 3.422 2.28s2.825-1.015 3.422-2.28c.408.17.867.27 1.348.27 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.72 4.16l-3.32-3.32L7.9 11.9l2.25 2.25 5.02-5.02 1.42 1.41-6.44 6.44z" fill="#1d9bf0" />
                          </svg>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>@{messagingActiveDmRecipient.handle}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#475569' }}>
                      <Phone size={18} style={{ cursor: 'pointer' }} title="Call student" />
                      <CaretDown size={20} style={{ cursor: 'pointer' }} onClick={() => setIsMessagingOpen(false)} />
                    </div>
                  </div>

                  {/* DM Messages list */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dmLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0', fontSize: '13px', color: '#64748B' }}>Loading messages...</div>
                    ) : dmMessages.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: '#64748B', padding: '0 20px', textAlign: 'center' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 600 }}>No messages yet</span>
                        <span style={{ fontSize: '11.5px', opacity: 0.8 }}>Start a private conversation with {messagingActiveDmRecipient.name}.</span>
                      </div>
                    ) : (
                      dmMessages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                          <div 
                            key={msg.id}
                            style={{
                              alignSelf: isMe ? 'flex-end' : 'flex-start',
                              maxWidth: '75%', display: 'flex', flexDirection: 'column',
                              alignItems: isMe ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <div style={{
                              background: isMe ? '#1D9BF0' : '#F1F5F9',
                              color: isMe ? '#ffffff' : '#0F172A',
                              padding: '8px 12px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              fontSize: '13px', lineHeight: '1.4', wordBreak: 'break-word',
                              fontFamily: 'Outfit'
                            }}>
                              {msg.message_text}
                            </div>
                            <span style={{ fontSize: '9px', color: '#94A3B8', marginTop: '2px', padding: '0 4px' }}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={dmMessagesEndRef} />
                  </div>

                  {/* DM Input form */}
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const trimmed = dmInputText.trim();
                      if (!trimmed) return;
                      setDmInputText('');
                      // Instantly append local mock
                      const localMsg = {
                        id: 'temp-' + Date.now(),
                        class_id: classId,
                        sender_id: user?.id,
                        recipient_id: messagingActiveDmRecipient.id,
                        message_text: trimmed,
                        created_at: new Date().toISOString()
                      };
                      setDmMessages(prev => [...prev, localMsg]);
                      await sendDmMessage(trimmed);
                    }}
                    style={{
                      padding: '12px', borderTop: '1px solid #F1F5F9', background: 'white',
                      display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0
                    }}
                  >
                    <input 
                      type="text"
                      value={dmInputText}
                      onChange={(e) => setDmInputText(e.target.value)}
                      placeholder="Type a message..."
                      style={{
                        flex: 1, padding: '8px 14px', borderRadius: '20px', border: '1px solid #E2E8F0',
                        fontSize: '13.5px', outline: 'none', background: '#F8FAFC', fontFamily: 'Outfit'
                      }}
                    />
                    <button 
                      type="submit" 
                      disabled={!dmInputText.trim()}
                      style={{
                        background: !dmInputText.trim() ? '#F1F5F9' : '#1D9BF0',
                        color: !dmInputText.trim() ? '#94A3B8' : 'white',
                        border: 'none', cursor: 'pointer', width: '32px', height: '32px',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <PaperPlaneRight size={16} weight="fill" />
                    </button>
                  </form>
                </>
              )}

              {/* Compose New Message Contact Picker Modal Overlay */}
              {showNewMessageModal && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: '#ffffff', display: 'flex', flexDirection: 'column', zIndex: 10
                }}>
                  <div style={{
                    padding: '14px 20px', borderBottom: '1px solid #F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        onClick={() => setShowNewMessageModal(false)}
                        type="button"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0F172A', padding: 0 }}
                      >
                        <X size={18} weight="bold" />
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '17px', color: '#0F172A' }}>New message</span>
                    </div>
                  </div>

                  {/* Contact Search box */}
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px', background: '#F1F5F9',
                      borderRadius: '24px', padding: '8px 14px'
                    }}>
                      <MagnifyingGlass size={16} color="#64748B" />
                      <input 
                        type="text"
                        placeholder="Search name or username"
                        style={{
                          border: 'none', outline: 'none', background: 'transparent',
                          flex: 1, fontSize: '13.5px', color: '#0F172A', fontFamily: 'Outfit'
                        }}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase();
                          // Filter contacts locally in render
                          e.target.dataset.filter = val;
                          setRefreshKey(prev => prev + 1); // trigger state update to filter list
                        }}
                        id="contact-picker-input"
                      />
                    </div>
                  </div>

                  {/* Create Group Link */}
                  <div style={{
                    padding: '12px 20px', color: '#1D9BF0', fontSize: '13.5px',
                    fontWeight: 600, borderBottom: '1px solid #F1F5F9', cursor: 'pointer'
                  }} onClick={() => {
                    setMessagingActiveView('lounge');
                    setShowNewMessageModal(false);
                  }}>
                    Create a group
                  </div>

                  {/* Contacts Stream */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {[...teachers, ...students]
                      .filter(u => u.id !== user?.id)
                      .filter(u => {
                        const filterVal = document.getElementById('contact-picker-input')?.dataset?.filter || '';
                        return u.name.toLowerCase().includes(filterVal);
                      })
                      .map((contact) => {
                        const cleanHandle = contact.email 
                          ? contact.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') 
                          : contact.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

                        const initials = contact.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);

                        const avatarBg = (() => {
                          const colors = ['#1d9bf0', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];
                          let hash = 0;
                          for (let i = 0; i < contact.name.length; i++) {
                            hash = contact.name.charCodeAt(i) + ((hash << 5) - hash);
                          }
                          const index = Math.abs(hash) % colors.length;
                          return colors[index];
                        })();

                        return (
                          <div
                            key={contact.id}
                            onClick={() => {
                              openDmChat({
                                id: contact.id,
                                name: contact.name,
                                handle: cleanHandle,
                                initials: initials || 'CM'
                              });
                              setShowNewMessageModal(false);
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px',
                              borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.2s',
                              background: '#ffffff'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                          >
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '50%',
                              background: avatarBg, color: 'white', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                              fontSize: '13px'
                            }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>{contact.name}</span>
                                <svg viewBox="0 0 24 24" width="12" height="12" style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
                                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.94.1-1.348.27C14.825 2.515 13.512 1.5 12 1.5s-2.825 1.015-3.422 2.28c-.408-.17-.867-.27-1.348-.27-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .94-.1 1.348-.27.597 1.265 1.91 2.28 3.422 2.28s2.825-1.015 3.422-2.28c.408.17.867.27 1.348.27 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.72 4.16l-3.32-3.32L7.9 11.9l2.25 2.25 5.02-5.02 1.42 1.41-6.44 6.44z" fill="#1d9bf0" />
                                </svg>
                              </div>
                              <span style={{ fontSize: '11.5px', color: '#64748B' }}>@{cleanHandle}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Floating Controls Bar */}
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px'
          }}>
            {/* Audio Widget horizontally aligned */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'white', padding: '6px 12px', borderRadius: '30px',
                border: '1px solid #dadce0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#5f6368', marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Outfit' }}>
                  Voice
                </span>
                <VoiceChatWidget roomId={classId} user={user} isDark={false} />
              </div>
            </div>

            {/* Stacked White circular card Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Grok AI Button */}
              <button 
                onClick={() => { setIsGrokOpen(!isGrokOpen); setIsMessagingOpen(false); }}
                type="button"
                style={{
                  width: '50px', height: '50px', borderRadius: '16px',
                  background: '#ffffff',
                  border: isGrokOpen ? '1.5px solid #7C3AED' : '1px solid #E2E8F0',
                  color: '#000000', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s', outline: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Grok AI Assistant"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8" stroke="currentColor" />
                  <line x1="5.5" y1="18.5" x2="18.5" y2="5.5" stroke="currentColor" />
                </svg>
              </button>

              {/* Messaging Button */}
              <button 
                onClick={() => { setIsMessagingOpen(!isMessagingOpen); setIsGrokOpen(false); }}
                type="button"
                style={{
                  width: '50px', height: '50px', borderRadius: '16px',
                  background: '#ffffff',
                  border: isMessagingOpen ? '1.5px solid #7C3AED' : '1px solid #E2E8F0',
                  color: '#000000', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s', outline: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Class Messages"
              >
                <ChatCircle size={24} weight={isMessagingOpen ? "fill" : "regular"} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
