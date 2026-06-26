import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ClassroomSidebar from './ClassroomSidebar';
import ClassroomCalendar from './ClassroomCalendar';
import ClassroomToReview from './ClassroomToReview';
import ClassroomSettings from './ClassroomSettings';
import { useSessionStore } from '../store/useSessionStore';
import { SpinnerGap, List, Plus, DotsNine, TrendUp, Folder, DotsThreeVertical } from '@phosphor-icons/react';

const LEVELS = [
  { val: '100', label: '100 Level', desc: 'Introductory course materials' },
  { val: '200', label: '200 Level', desc: 'Intermediate concepts & topics' },
  { val: '300', label: '300 Level', desc: 'Advanced studies & analytics' },
  { val: '400', label: '400 Level', desc: 'Specialized electives & projects' },
  { val: '500', label: '500 Level', desc: 'Graduate-level research & papers' }
];

const DEPARTMENTS = [
  "Computer Science", "Mathematics", "Physics", "Chemistry", "Biology", 
  "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", 
  "Chemical Engineering", "Business Administration", "Economics", 
  "Psychology", "Sociology", "History", "English Literature", "Political Science"
];

// Scheduler Time Slots
const SCHED_TIME_SLOTS = [
  '09:00 AM', '10:30 AM', '12:00 PM', '01:30 PM', '03:00 PM', '04:30 PM'
];

const CSS_STRING = `
.cls-layout-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: #ffffff;
}
.cls-header {
  height: 64px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #ffffff;
  flex-shrink: 0;
}
.cls-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.cls-header-left, .cls-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.cls-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #5f6368;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  transition: background 0.2s;
}
.cls-icon-btn:hover {
  background: #f1f3f4;
}
.cls-logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}
.cls-logo-img {
  height: 24px;
}
.cls-logo-text {
  font-size: 22px;
  font-weight: 500;
  color: #5f6368;
  letter-spacing: -0.5px;
}
.cls-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #7a12cc;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.cls-gc-card {
  border: 1px solid #dadce0;
  border-radius: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  min-height: 280px;
}
.cls-gc-card:hover {
  box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
}
.cls-gc-banner {
  height: 100px;
  padding: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  overflow: hidden;
}
.cls-gc-title {
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  z-index: 2;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.cls-gc-subtitle {
  color: #ffffff;
  font-size: 14px;
  margin-top: 4px;
  z-index: 2;
  position: relative;
}
.cls-gc-content {
  flex: 1;
  padding: 0;
  position: relative;
  background: #ffffff;
}
.cls-gc-avatar-overlap {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  position: absolute;
  top: -38px;
  right: 16px;
  background: #15803d;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  z-index: 5;
}
.cls-gc-footer {
  border: 1px solid #d1d5db;
  border-top: none;
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  background: #ffffff;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
.cls-gc-footer svg {
  color: #5f6368;
  cursor: pointer;
}
.cls-gc-footer svg:hover {
  color: #333333;
}

.cls-sidebar {
  width: 280px;
  border-right: 1px solid #E5E7EB;
  background: #ffffff;
  transition: width 0.2s;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.cls-sidebar.collapsed {
  width: 72px;
}
.cls-sidebar.hover-expanded {
  width: 280px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 50;
  height: 100%;
  box-shadow: 4px 0 16px rgba(0,0,0,0.1);
}
.cls-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
}
.cls-nav-item {
  display: flex;
  align-items: center;
  height: 52px;
  border-radius: 9999px;
  cursor: pointer;
  color: #1f2937;
  font-weight: 500;
  font-size: 15px;
  margin: 0 12px;
  transition: background 0.1s;
}
.cls-nav-item:hover {
  background: #F1F3F4;
}
.cls-nav-item.active {
  background: #E8F0FE;
  color: #1967D2;
}
.cls-nav-icon {
  width: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.rv-root {
  display: flex;
  height: 100vh;
  width: 100%;
  background: var(--sb-bg, #F9FAFB);
  color: var(--sb-text, #111827);
  overflow: hidden;
}
.rv-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.cls-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  background-color: var(--sb-bg, #F9FAFB);
  color: var(--sb-text, #111827);
  font-family: 'Outfit', 'Outfit', 'Outfit', sans-serif;
}
body.dark-mode .cls-container {
  background-color: #333333; 
}
.cls-card {
  background: var(--sb-surface, #ffffff);
  border: 1px solid var(--sb-border, #E5E7EB);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  width: 100%;
  max-width: 440px;
}
body.dark-mode .cls-card {
  background: var(--sb-surface, #1F2937);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.cls-title {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 30px;
  letter-spacing: -0.02em;
}
.cls-inputs-container {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}
.cls-input {
  width: 48px;
  height: 56px;
  border-radius: 12px;
  border: 1px solid var(--sb-border, #E5E7EB);
  background: var(--sb-bg, #F9FAFB);
  color: var(--sb-text, #111827);
  font-size: 24px;
  font-weight: 800;
  text-align: center;
  outline: none;
  transition: all 0.2s;
  text-transform: uppercase;
}
body.dark-mode .cls-input {
  background: #333333;
  border-color: rgba(255,255,255,0.1);
  color: #ffffff;
}
.cls-input:focus {
  border-color: #98FF98;
  box-shadow: 0 0 0 3px rgba(152, 255, 152, 0.2);
}
.cls-btn-next {
  padding: 14px 28px;
  border-radius: 999px;
  background: #98FF98;
  color: #111827;
  font-weight: 800;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.cls-btn-next:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(152, 255, 152, 0.3);
}
.cls-btn-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.cls-create-btn {
  margin-top: 24px;
  background: none;
  border: none;
  color: var(--sb-text-secondary, #6B7280);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
  z-index: 10;
}
.cls-create-btn:hover {
  color: var(--sb-text, #111827);
}
.cls-bottom-mascots {
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  padding: 0 10%;
  pointer-events: none;
}
.cls-bemoji {
  width: 72px;
  height: 72px;
  object-fit: contain;
  pointer-events: auto;
}
.cls-mascot-img {
  width: 90px;
  height: auto;
  pointer-events: auto;
}
@media (max-width: 600px) {
  .cls-input {
    width: 40px;
    height: 48px;
    font-size: 20px;
  }
  .cls-inputs-container {
    gap: 8px;
  }
  .cls-card {
    padding: 30px 20px;
    width: 90%;
  }
  .cls-bottom-mascots {
    padding: 0 5%;
  }
  .cls-bemoji {
    width: 50px;
    height: 50px;
  }
  .cls-mascot-img {
    width: 65px;
  }
  .cls-onboard-card {
    padding: 20px;
    border-radius: 16px;
  }
  .cls-calendar-widget {
    flex-direction: column;
    height: auto;
    overflow-y: visible;
  }
  .cls-cal-right {
    border-left: none;
    border-top: 2px solid var(--sb-border, #E5E7EB);
  }
}

/* Brilliant-inspired Card Onboarding Flow */
.cls-onboard-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--sb-bg, #F9FAFB);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  font-family: 'Outfit', 'Outfit', 'Outfit', sans-serif;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
}
body.dark-mode .cls-onboard-overlay {
  background-color: #333333;
}
.cls-onboard-card {
  background: var(--sb-surface, #ffffff);
  border: 1px solid var(--sb-border, #E5E7EB);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 660px;
  box-sizing: border-box;
  position: relative;
}
body.dark-mode .cls-onboard-card {
  background: #1F2937;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}
.cls-card-top-bar {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}
.cls-btn-back {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--sb-text, #111827);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}
body.dark-mode .cls-btn-back {
  color: #ffffff;
}
.cls-btn-back:hover {
  background: rgba(0, 0, 0, 0.05);
}
body.dark-mode .cls-btn-back:hover {
  background: rgba(255, 255, 255, 0.05);
}
.cls-progress-bar-container {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 99px;
  overflow: hidden;
}
body.dark-mode .cls-progress-bar-container {
  background: rgba(255, 255, 255, 0.1);
}
.cls-progress-bar-fill {
  height: 100%;
  background: #98FF98;
  border-radius: 99px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cls-onboard-form-inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

/* Mascot + text inline header */
.cls-mascot-header-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.cls-mascot-logo-small {
  height: 28px;
  width: auto;
  object-fit: contain;
}
.cls-mascot-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--sb-text, #111827);
}
body.dark-mode .cls-mascot-label {
  color: #ffffff;
}

/* Question Styling: Left aligned */
.cls-question-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 6px 0;
  text-align: left;
}
.cls-question-desc {
  font-size: 14px;
  color: var(--sb-text-secondary, #6B7280);
  margin: 0 0 24px 0;
  text-align: left;
}

/* Big Input Styling */
.cls-huge-input {
  width: 100%;
  box-sizing: border-box;
  padding: 16px 24px;
  font-size: 20px;
  border: 2px solid var(--sb-border, #E5E7EB);
  border-radius: 16px;
  outline: none;
  text-align: left;
  background: var(--sb-surface, #ffffff);
  color: inherit;
  font-family: inherit;
  transition: all 0.2s;
}
body.dark-mode .cls-huge-input {
  background: #1F2937;
  border-color: rgba(255,255,255,0.08);
}
.cls-huge-input:focus {
  border-color: #98FF98;
  box-shadow: 0 0 0 4px rgba(152, 255, 152, 0.15);
}
.cls-uppercase {
  text-transform: uppercase;
}

/* Redesigned Grid Option Cards for Levels */
.cls-level-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
  margin-bottom: 24px;
}
@media (max-width: 600px) {
  .cls-level-cards {
    grid-template-columns: 1fr;
  }
}
.cls-level-card {
  background: var(--sb-surface, #ffffff);
  border: 1.5px solid var(--sb-border, #E5E7EB);
  border-radius: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  box-sizing: border-box;
}
body.dark-mode .cls-level-card {
  background: #1F2937;
  border-color: rgba(255, 255, 255, 0.08);
}
.cls-level-card:hover {
  border-color: #C4B5FD;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
.cls-level-card.active {
  border-color: #98FF98;
  background: rgba(152, 255, 152, 0.04);
  box-shadow: 0 4px 12px rgba(152, 255, 152, 0.1);
}
.cls-level-card:last-child {
  grid-column: span 2;
}
@media (max-width: 600px) {
  .cls-level-card:last-child {
    grid-column: span 1;
  }
}

.cls-level-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 4px;
}
.cls-level-card-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--sb-border, #E5E7EB);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-sizing: border-box;
}
body.dark-mode .cls-level-card-radio {
  border-color: rgba(255,255,255,0.15);
}
.cls-level-card.active .cls-level-card-radio {
  border-color: #98FF98;
  background: #98FF98;
}
.cls-level-card-radio-inner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  transition: all 0.2s;
}
.cls-level-card.active .cls-level-card-radio-inner {
  background: #111827;
}

.cls-level-num {
  font-size: 16px;
  font-weight: 800;
  color: var(--sb-text, #111827);
}
body.dark-mode .cls-level-num {
  color: #ffffff;
}
.cls-level-card.active .cls-level-num {
  color: #15803d;
}
body.dark-mode .cls-level-card.active .cls-level-num {
  color: #98FF98;
}
.cls-level-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--sb-text-secondary, #6B7280);
  text-align: left;
}
body.dark-mode .cls-level-label {
  color: #9CA3AF;
}
.cls-level-card.active .cls-level-label {
  color: #166534;
}
body.dark-mode .cls-level-card.active .cls-level-label {
  color: #A7F3D0;
}

/* Searchable level/dept list */
.cls-level-list {
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  border: 2px solid var(--sb-border, #E5E7EB);
  border-radius: 16px;
  background: var(--sb-surface, #ffffff);
  display: flex;
  flex-direction: column;
  margin-top: 16px;
}
body.dark-mode .cls-level-list {
  background: #1F2937;
  border-color: rgba(255,255,255,0.08);
}
.cls-level-item {
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 700;
  text-align: left;
  font-size: 15px;
  border-bottom: 1px solid var(--sb-border, #E5E7EB);
  color: var(--sb-text, #111827);
}
body.dark-mode .cls-level-item {
  border-color: rgba(255,255,255,0.04);
  color: #ffffff;
}
.cls-level-item:last-child {
  border-bottom: none;
}
.cls-level-item:hover {
  background: rgba(0, 0, 0, 0.03);
}
body.dark-mode .cls-level-item:hover {
  background: rgba(255, 255, 255, 0.03);
}
.cls-level-item.active {
  background: rgba(152, 255, 152, 0.12);
  color: #15803d;
}
body.dark-mode .cls-level-item.active {
  background: rgba(152, 255, 152, 0.08);
  color: #98FF98;
}

/* Dynamic Pill Scheduler */
.cls-sched-section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--sb-text-secondary, #6B7280);
  margin: 16px 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
body.dark-mode .cls-sched-section-title {
  color: #9CA3AF;
}
.cls-sched-days-row {
  display: flex;
  gap: 12px;
  width: 100%;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 16px;
}
.cls-sched-day-card {
  flex: 1;
  min-width: 90px;
  background: var(--sb-surface, #ffffff);
  border: 1.5px solid var(--sb-border, #E5E7EB);
  border-radius: 14px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}
body.dark-mode .cls-sched-day-card {
  background: #1F2937;
  border-color: rgba(255, 255, 255, 0.08);
}
.cls-sched-day-card:hover {
  border-color: #C4B5FD;
}
.cls-sched-day-card.active {
  border-color: #98FF98;
  background: rgba(152, 255, 152, 0.05);
  box-shadow: 0 4px 12px rgba(152, 255, 152, 0.1);
}
.cls-sched-day-wk {
  font-size: 12px;
  font-weight: 700;
  color: var(--sb-text-secondary, #6B7280);
}
body.dark-mode .cls-sched-day-wk {
  color: #9CA3AF;
}
.cls-sched-day-card.active .cls-sched-day-wk {
  color: #166534;
}
body.dark-mode .cls-sched-day-card.active .cls-sched-day-wk {
  color: #A7F3D0;
}
.cls-sched-day-num {
  font-size: 20px;
  font-weight: 800;
  color: var(--sb-text, #111827);
}
body.dark-mode .cls-sched-day-num {
  color: #ffffff;
}
.cls-sched-day-card.active .cls-sched-day-num {
  color: #15803d;
}
body.dark-mode .cls-sched-day-card.active .cls-sched-day-num {
  color: #98FF98;
}
.cls-sched-day-mo {
  font-size: 10px;
  font-weight: 600;
  color: var(--sb-text-secondary, #9CA3AF);
  text-transform: uppercase;
}

/* Time Grid */
.cls-sched-time-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  margin-bottom: 8px;
}
@media (max-width: 500px) {
  .cls-sched-time-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.cls-sched-time-card {
  background: var(--sb-surface, #ffffff);
  border: 1.5px solid var(--sb-border, #E5E7EB);
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--sb-text, #111827);
  box-sizing: border-box;
}
body.dark-mode .cls-sched-time-card {
  background: #1F2937;
  border-color: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}
.cls-sched-time-card:hover {
  border-color: #C4B5FD;
}
.cls-sched-time-card.active {
  border-color: #98FF98;
  background: rgba(152, 255, 152, 0.05);
  color: #15803d;
  box-shadow: 0 4px 12px rgba(152, 255, 152, 0.1);
}
body.dark-mode .cls-sched-time-card.active {
  color: #98FF98;
  background: rgba(152, 255, 152, 0.1);
}

.cls-continue-btn-centered {
  width: 260px;
  padding: 16px;
  border-radius: 999px;
  background: #98FF98;
  color: #111827;
  font-weight: 800;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center; /* keep button centered */
}
.cls-continue-btn-centered:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(152, 255, 152, 0.3);
}
.cls-continue-btn-centered:disabled {
  background: var(--sb-border, #E5E7EB);
  color: var(--sb-text-secondary, #6B7280);
  cursor: not-allowed;
}
body.dark-mode .cls-continue-btn-centered:disabled {
  background: #1F2937;
}

.cls-skip-btn {
  background: transparent;
  border: none;
  color: var(--sb-text-secondary, #6B7280);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  transition: color 0.2s;
  align-self: center;
  text-decoration: underline;
}
.cls-skip-btn:hover {
  color: var(--sb-text, #111827);
}
body.dark-mode .cls-skip-btn:hover {
  color: #ffffff;
}
`;

function injectStyles() {
  const existing = document.getElementById('cls-dashboard-styles');
  if (existing) {
    existing.textContent = CSS_STRING;
    return;
  }
  const tag = document.createElement('style');
  tag.id = 'cls-dashboard-styles';
  tag.textContent = CSS_STRING;
  document.head.appendChild(tag);
}

export default function ClassroomDashboard() {
  const location = useLocation();
  const [activeNav, setActiveNav] = useState(location.state?.nav || 'home');

  useEffect(() => {
    if (location.state?.nav) {
      setActiveNav(location.state.nav);
    }
  }, [location.state?.nav]);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 to 4 steps
  
  // Room Creation States
  const [roomName, setRoomName] = useState('');
  const [educationLevel, setEducationLevel] = useState('100');
  const [department, setDepartment] = useState('Computer Science');
  
  // Scheduler States
  const [selectedDateStr, setSelectedDateStr] = useState('2026-06-19'); 
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:30 AM');

  // Search filter for departments
  const [deptSearch, setDeptSearch] = useState('');

  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    injectStyles();
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (!pastedData) return;
    
    const newCode = [...code];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setCode(newCode);
    
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex].focus();
  };
  const handleNext = async () => {
    const joinCode = code.join('');
    if (joinCode.length === 6) {
      const result = await useSessionStore.getState().joinSharedSession(joinCode);
      if (result.success && result.session) {
        navigate(`/workstation?sessionId=${result.session.id}&type=classroom`);
      } else {
        alert(result.error || 'Failed to join room');
      }
    }
  };

  const handleSelectDept = (deptName) => {
    setDepartment(deptName);
    setDeptSearch(deptName);
  };

  const handleStartOnboard = () => {
    setStep(1);
    setRoomName('');
    setEducationLevel('100');
    setDepartment('Computer Science');
    setDeptSearch('');
    setSelectedDateStr('2026-06-19');
    setSelectedTimeSlot('10:30 AM');
    setIsCreateOpen(true);
  };

  const handleSkipLevel = () => {
    setEducationLevel('None');
    setStep(3);
  };

  const handleSkipSchedule = async () => {
    if (!roomName.trim()) return;
    setIsCreateOpen(false);
    await useSessionStore.getState().createSession(roomName, [], { sessionType: 'classroom', isShared: true });
    // Don't navigate, just drop back to dashboard
  };

  const handleCreateRoomSubmit = async (e) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    if (!roomName.trim()) return;
    setIsCreateOpen(false);
    await useSessionStore.getState().createSession(roomName, [], { sessionType: 'classroom', isShared: true });
    // Don't navigate, just drop back to dashboard
  };

  const getNext5Days = () => {
    const days = [];
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseDate = new Date(2026, 5, 19); 
    for (let i = 0; i < 5; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push({
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        dayNum: d.getDate(),
        weekday: i === 0 ? 'Today' : weekdayNames[d.getDay()],
        month: monthNames[d.getMonth()]
      });
    }
    return days;
  };

  const scheduleDays = getNext5Days();

  const filteredDepts = DEPARTMENTS.filter(dept => 
    dept.toLowerCase().includes(deptSearch.toLowerCase())
  );

  // -- newly added logic for grid --
  const [user, setUser] = useState(null);
  const { sessions, loadSessions, isCreating } = useSessionStore();
  const rooms = sessions.filter(s => s.session_type === 'classroom');
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const userInitials = (() => {
    const name = user?.raw_user_meta_data?.name || user?.email || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  })();

  const GC_COLORS = ['#37474f', '#00796b', '#1976d2', '#d32f2f', '#f57c00', '#7b1fa2'];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user));
    loadSessions();
  }, [isCreateOpen, loadSessions]);

  const handleJoinOpen = () => {
    setCode(['', '', '', '', '', '']);
    setIsJoinOpen(true);
  };

  const PASTEL_COLORS = ['#F3E8FF', '#D8B4FE', '#86EFAC', '#FDE047', '#93C5FD', '#FCA5A5'];
  const SEEDS = ['Felix', 'Jasper', 'Luna', 'Milo', 'Abby', 'Buster'];

  return (
    <div className="cls-layout-root">
      {/* Top Navbar */}
      <header className="cls-header">
        <div className="cls-header-left">
          <button className="cls-icon-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <List size={24} weight="regular" />
          </button>
          <div className="cls-logo-area">
            <img src="/Header logo.png" alt="Logo" className="cls-logo-img" />
            <span className="cls-logo-text">
              Classroom 
              {activeNav === 'review' && (
                <span style={{ fontWeight: 400, color: '#5f6368', marginLeft: '4px' }}>
                  <span style={{ margin: '0 4px' }}>›</span> To review
                </span>
              )}
              {activeNav === 'settings' && (
                <span style={{ fontWeight: 400, color: '#5f6368', marginLeft: '4px' }}>
                  <span style={{ margin: '0 4px' }}>›</span> Settings
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="cls-header-right">
          <button className="cls-icon-btn" onClick={handleStartOnboard} title="Create or join a class">
            <Plus size={24} weight="regular" />
          </button>
          <div className="cls-avatar">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
            ) : userInitials}
          </div>
        </div>
      </header>

      <div className="cls-body" style={{ position: 'relative' }}>
        <div style={{ width: sidebarCollapsed ? '72px' : '280px', flexShrink: 0, transition: 'width 0.2s' }}>
          <ClassroomSidebar collapsed={sidebarCollapsed} activeNav={activeNav} setActiveNav={setActiveNav} rooms={rooms} />
        </div>

        {activeNav === 'calendar' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff' }}>
             <ClassroomCalendar />
          </div>
        ) : activeNav === 'review' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff' }}>
             <ClassroomToReview rooms={rooms} user={user} />
          </div>
        ) : activeNav === 'settings' ? (
          <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#ffffff' }}>
             <ClassroomSettings user={user} />
          </div>
        ) : (
          <main style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#ffffff' }}>
            {rooms.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div className="cls-card">
                <h2 className="cls-title">Enter your join code</h2>
                <div className="cls-inputs-container">
                  {code.map((char, idx) => (
                    <input
                      key={idx}
                      ref={el => inputRefs.current[idx] = el}
                      type="text"
                      maxLength={1}
                      value={char}
                      onChange={(e) => handleChange(e, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      onPaste={handlePaste}
                      className="cls-input"
                      placeholder="-"
                    />
                  ))}
                </div>
                <button 
                  className="cls-btn-next"
                  onClick={handleNext}
                  disabled={code.join('').length !== 6}
                >
                  Join Room
                </button>
                <button className="cls-create-btn" onClick={handleStartOnboard}>
                  Create a new classroom instead
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {rooms.map((room, idx) => {
                const bg = GC_COLORS[idx % GC_COLORS.length];
                const seed = SEEDS[idx % SEEDS.length];
                return (
                  <div 
                    key={room.id} 
                    onClick={() => navigate(`/classrooms/c/${room.id}`)}
                    className="cls-gc-card"
                  >
                    <div className="cls-gc-banner" style={{ backgroundColor: bg }}>
                      <h3 className="cls-gc-title">{room.session_name}</h3>
                      <p className="cls-gc-subtitle">Luter Classroom</p>
                    </div>
                    <div className="cls-gc-content">
                      <div className="cls-gc-avatar-overlap">
                        {room.session_name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                    </div>
                    <div className="cls-gc-footer">
                      <TrendUp size={24} className="cls-footer-icon" />
                      <Folder size={24} className="cls-footer-icon" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
        )}
      </div>

      {/* Modals for Create and Join */}
      {isJoinOpen && (
        <div className="cls-onboard-overlay">
          <div className="cls-card" style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsJoinOpen(false)} 
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sb-text)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h2 className="cls-title">Enter your join code</h2>
            
            <div className="cls-inputs-container">
              {code.map((char, idx) => (
                <input
                  key={idx}
                  ref={el => inputRefs.current[idx] = el}
                  type="text"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onPaste={handlePaste}
                  className="cls-input"
                  placeholder="-"
                />
              ))}
            </div>

            <button 
              className="cls-btn-next"
              onClick={handleNext}
              disabled={code.join('').length !== 6}
            >
              Join Room
            </button>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="cls-onboard-overlay">
          <div className="cls-onboard-card">
            
            {/* Top Bar with Back Button & Progress Bar */}
            <div className="cls-card-top-bar">
              <button 
                type="button" 
                className="cls-btn-back" 
                onClick={() => {
                  if (step > 1) {
                    setStep(step - 1);
                  } else {
                    setIsCreateOpen(false);
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>

              <div className="cls-progress-bar-container">
                <div className="cls-progress-bar-fill" style={{ width: `${(step / 4) * 100}%` }} />
              </div>
            </div>

            <form className="cls-onboard-form-inner" onSubmit={handleCreateRoomSubmit}>
              
              {/* Minimal Mascot Logo Inline (Gizmo style) */}
              <div className="cls-mascot-header-inline">
                <img src="/mascot.png" alt="Luter Mascot Logo" className="cls-mascot-logo-small" />
                <span className="cls-mascot-label">Gizmo</span>
              </div>

              {/* STEP 1: Room Name (Jane-PHY102, Forced Caps) */}
              {step === 1 && (
                <>
                  <h3 className="cls-question-title">Name Your Classroom</h3>
                  <p className="cls-question-desc">Give your study room a clear title (e.g. Jane-PHY102).</p>
                  <input 
                    type="text" 
                    className="cls-huge-input cls-uppercase"
                    placeholder="E.G. JANE-PHY102"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value.toUpperCase())}
                    autoFocus
                    required
                  />
                </>
              )}

              {/* STEP 2: Level (100, 200, 300, 400, 500) */}
              {step === 2 && (
                <>
                  <h3 className="cls-question-title">Choose The Level Of This Class</h3>
                  <p className="cls-question-desc">Select the academic degree or course level.</p>
                  
                  <div className="cls-level-cards">
                    {LEVELS.map((lvl) => (
                      <div 
                        key={lvl.val}
                        className={`cls-level-card ${educationLevel === lvl.val ? 'active' : ''}`}
                        onClick={() => setEducationLevel(lvl.val)}
                      >
                        <div className="cls-level-card-header">
                          <span className="cls-level-num">{lvl.label}</span>
                          <div className="cls-level-card-radio">
                            <div className="cls-level-card-radio-inner" />
                          </div>
                        </div>
                        <span className="cls-level-label">{lvl.desc}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* STEP 3: Department */}
              {step === 3 && (
                <>
                  <h3 className="cls-question-title">Which Department Is This Class In?</h3>
                  <p className="cls-question-desc">Choose from your university's academic programmes.</p>
                  
                  <input 
                    type="text"
                    className="cls-huge-input"
                    placeholder="Search department (e.g. Computer Science, Physics...)"
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    autoFocus
                  />

                  <div className="cls-level-list">
                    {filteredDepts.map((deptName) => (
                      <div 
                        key={deptName}
                        className={`cls-level-item ${department === deptName ? 'active' : ''}`}
                        onClick={() => handleSelectDept(deptName)}
                      >
                        {deptName}
                      </div>
                    ))}
                    {filteredDepts.length === 0 && (
                      <div style={{ padding: '16px', fontSize: '13px', color: 'var(--sb-text-secondary)', textAlign: 'center' }}>
                        No matching departments found.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* STEP 4: Scheduler Widget */}
              {step === 4 && (
                <>
                  <h3 className="cls-question-title">Schedule Your Sessions</h3>
                  <p className="cls-question-desc">Select an upcoming day and time slot for your sessions.</p>
                  
                  <span className="cls-sched-section-title">Select Day</span>
                  <div className="cls-sched-days-row">
                    {scheduleDays.map((day) => (
                      <div
                        key={day.dateStr}
                        className={`cls-sched-day-card ${selectedDateStr === day.dateStr ? 'active' : ''}`}
                        onClick={() => setSelectedDateStr(day.dateStr)}
                      >
                        <span className="cls-sched-day-wk">{day.weekday}</span>
                        <span className="cls-sched-day-num">{day.dayNum}</span>
                        <span className="cls-sched-day-mo">{day.month}</span>
                      </div>
                    ))}
                  </div>

                  <span className="cls-sched-section-title">Select Time</span>
                  <div className="cls-sched-time-grid">
                    {SCHED_TIME_SLOTS.map((slot) => (
                      <div
                        key={slot}
                        className={`cls-sched-time-card ${selectedTimeSlot === slot ? 'active' : ''}`}
                        onClick={() => setSelectedTimeSlot(slot)}
                      >
                        {slot}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Centering Area for Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                {/* Centered Continue Button */}
                <button 
                  type="submit" 
                  className="cls-continue-btn-centered" 
                  disabled={(step === 1 && !roomName.trim()) || isCreating}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {isCreating && step === 4 && <SpinnerGap weight="bold" className="animate-spin" size={20} />}
                  {step === 4 ? (isCreating ? 'Creating...' : 'Create Classroom') : 'Continue'}
                </button>

                {/* Skip Step Button */}
                {step === 2 && (
                  <button 
                    type="button" 
                    className="cls-skip-btn"
                    onClick={handleSkipLevel}
                  >
                    Skip this step
                  </button>
                )}

                {step === 4 && (
                  <button 
                    type="button" 
                    className="cls-skip-btn"
                    disabled={isCreating}
                    onClick={handleSkipSchedule}
                  >
                    {isCreating ? 'Creating...' : 'Skip schedule & create'}
                  </button>
                )}
              </div>

            </form>
          </div>

          <div className="cls-bottom-mascots">
            <img src="https://api.dicebear.com/7.x/micah/svg?seed=Felix&backgroundColor=transparent" alt="Bemoji" className="cls-bemoji" />
            <img src="https://api.dicebear.com/7.x/micah/svg?seed=Jasper&backgroundColor=transparent" alt="Bemoji" className="cls-bemoji" />
            <img src="/mascot.png" alt="Luter Mascot" className="cls-mascot-img" />
            <img src="https://api.dicebear.com/7.x/micah/svg?seed=Luna&backgroundColor=transparent" alt="Bemoji" className="cls-bemoji" />
            <img src="https://api.dicebear.com/7.x/micah/svg?seed=Milo&backgroundColor=transparent" alt="Bemoji" className="cls-bemoji" />
          </div>
        </div>
      )}
    </div>
  );
}
