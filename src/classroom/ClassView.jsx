import React, { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import {
  Plus, ArrowCounterClockwise, ChatsTeardrop,
  Clock, BookOpen, CheckSquareOffset,
  Sparkle, Users, Copy, Check, PaperPlaneRight, X
} from '@phosphor-icons/react';
import '../components/dashboard/SidebarRedesign.css';
import ClassroomSidebar from './ClassroomSidebar';

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

export default function ClassView() {
  const { classId } = useParams();
  const { user } = useOutletContext() || {};
  const navigate = useNavigate();

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

  useEffect(() => {
    try {
      localStorage.setItem(`luter_announcements_${classId}`, JSON.stringify(announcements));
    } catch {}
  }, [announcements, classId]);

  const handlePost = () => {
    const text = composerText.trim();
    if (!text) return;
    const post = {
      id: Date.now().toString(),
      author: userName,
      initials: userInitials,
      content: text,
      createdAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    setAnnouncements(prev => [post, ...prev]);
    setComposerText('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1500);
    });
  };

  const displayTitle = meta?.title || classId || 'Classroom';

  const displayName = user?.raw_user_meta_data?.name?.split(' ')[0] || 'Scholar';

  const handleSignOut = async () => {
    const { supabase } = await import('../supabaseClient');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Class title initial for the pill avatar
  const classInitial = displayTitle.charAt(0).toUpperCase();

  return (
    <div className="rv-root">

      {/* ── Left Sidebar ── */}
      <ClassroomSidebar user={user} activeNav={activeNav} setActiveNav={setActiveNav} />

      {/* ── Main ── */}
      <div className="rv-main">
        {/* blank — content coming soon */}
      </div>
    </div>
  );
}
