import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  House, CalendarBlank, Chalkboard, CaretDown, GearSix,
  ChatTeardropDots, Megaphone, Question, Coin, CaretUp,
  User, Sun, Moon, SignOut, List
} from '@phosphor-icons/react';
import '../components/dashboard/SidebarRedesign.css';

export default function ClassroomSidebar({ user, activeNav, setActiveNav }) {
  const navigate = useNavigate();
  const [teachingOpen, setTeachingOpen] = useState(true);
  const [showPersonal, setShowPersonal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('luter-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [creditsBalance, setCreditsBalance] = useState(Infinity);
  const personalRef = useRef(null);
  const profileBtnRef = useRef(null);

  // Dark mode toggle effect
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('luter-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('luter-theme', 'light');
    }
  }, [isDark]);

  // Fetch credits
  useEffect(() => {
    if (!user?.id) return;
    import('../services/creditService').then(({ getCreditBalance }) => {
      getCreditBalance(user.id).then(b => {
        if (typeof b === 'number') setCreditsBalance(b);
      }).catch(() => {});
    }).catch(() => {});
  }, [user?.id]);

  // Close personal dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        personalRef.current && !personalRef.current.contains(e.target) &&
        profileBtnRef.current && !profileBtnRef.current.contains(e.target)
      ) setShowPersonal(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    const { supabase } = await import('../supabaseClient');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const userInitials = (() => {
    const name = user?.raw_user_meta_data?.name || user?.email || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  })();

  const handleNavClick = (nav) => {
    if (setActiveNav) {
      setActiveNav(nav);
    } else {
      if (nav === 'home') navigate('/classrooms');
      else if (nav === 'calendar') navigate('/classrooms/calendar');
    }
  };

  return (
    <aside className={`dsb-redesign ${collapsed ? 'collapsed' : ''}`}>

      {/* ── Logo & Toggle ── */}
      <div className="dsb-logo-area" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sb-muted)' }}
          title="Toggle sidebar"
        >
          <List size={22} weight="bold" />
        </button>
        {!collapsed && (
          <img
            src="/Header logo.png"
            alt="Luter"
            className="dsb-logo-img"
            style={{ height: 34 }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
            }}
          />
        )}
      </div>

      {/* ── Main Nav ── */}
      <nav className="dsb-nav-list" aria-label="Classroom navigation">

        {/* Home / Stream */}
        <button
          className={`dsb-nav-pill${activeNav === 'stream' || activeNav === 'home' ? ' active' : ''}`}
          onClick={() => handleNavClick('home')}
        >
          <div className="dsb-icon"><House size={21} weight="regular" /></div>
          <span className="dsb-nav-label">Home</span>
        </button>

        {/* Calendar */}
        <button
          className={`dsb-nav-pill${activeNav === 'calendar' ? ' active' : ''}`}
          onClick={() => handleNavClick('calendar')}
        >
          <div className="dsb-icon"><CalendarBlank size={21} weight="regular" /></div>
          <span className="dsb-nav-label">Calendar</span>
        </button>

        {/* Teaching — with dropdown (mirrors Backpack) */}
        <div>
          <div className="dsb-backpack-row">
            <button
              className={`dsb-nav-pill dsb-backpack-pill${activeNav === 'teaching' ? ' active' : ''}`}
              onClick={() => handleNavClick('teaching')}
            >
              <div className="dsb-icon"><Chalkboard size={21} weight="regular" /></div>
              <span className="dsb-nav-label">Teaching</span>
            </button>
            <button
              className="dsb-backpack-caret-btn"
              onClick={() => setTeachingOpen(o => !o)}
              title={teachingOpen ? 'Collapse' : 'Show'}
            >
              <CaretDown
                size={14}
                weight="bold"
                className={`dsb-caret-icon${teachingOpen ? ' open' : ''}`}
              />
            </button>
          </div>

          <div className={`dsb-subnav${teachingOpen ? ' open' : ''}`}>
            <div className="dsb-subnav-inner">
              <button
                className={`dsb-subnav-item${activeNav === 'review' ? ' active' : ''}`}
                onClick={() => handleNavClick('review')}
              >
                <span className="dsb-subnav-dot" style={{ background: activeNav === 'review' ? '#7a12cc' : '#C4B5FD' }} />
                <span className="dsb-subnav-label">To review</span>
              </button>
            </div>
          </div>
        </div>

        {/* Settings */}
        <button
          className={`dsb-nav-pill${activeNav === 'settings' ? ' active' : ''}`}
          onClick={() => handleNavClick('settings')}
        >
          <div className="dsb-icon"><GearSix size={21} weight="regular" /></div>
          <span className="dsb-nav-label">Settings</span>
        </button>

      </nav>

      {/* ── Helper Icons ── */}
      <div className="dsb-helper-row">
        <button className="dsb-helper-btn" data-tooltip="Send Feedback">
          <ChatTeardropDots size={21} weight="regular" />
        </button>
        <button className="dsb-helper-btn" data-tooltip="What's New">
          <Megaphone size={21} weight="regular" />
        </button>
        <button className="dsb-helper-btn" data-tooltip="Help & Support">
          <Question size={21} weight="regular" />
        </button>
      </div>

      {/* ── Personal Section ── */}
      <div className="dsb-personal-section">

        {/* Credits */}
        <div className="dsb-credits-row">
          <div className="dsb-credits-info">
            <span className="dsb-credits-label">AI Credits</span>
            <span className="dsb-credits-sub">Resets daily</span>
          </div>
          <div className="dsb-credits-badge">
            <Coin size={16} weight="fill" />
            {creditsBalance !== Infinity ? creditsBalance.toLocaleString() : '50'}
          </div>
        </div>

        {/* Profile Card */}
        <button
          ref={profileBtnRef}
          className="dsb-profile-card"
          onClick={() => setShowPersonal(p => !p)}
          aria-expanded={showPersonal}
        >
          <div className="dsb-avatar-circle">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : userInitials}
          </div>
          <div className="dsb-profile-info">
            <span className="dsb-profile-name">
              {user?.raw_user_meta_data?.name ? `@${user.raw_user_meta_data.name.split(' ').join('').toLowerCase()}` : (user?.email ? `@${user.email.split('@')[0]}` : '@scholar')}
            </span>
            <span className="dsb-profile-handle">
              Executive Plan
            </span>
          </div>
          <CaretUp
            size={14}
            weight="bold"
            className={`dsb-profile-caret${showPersonal ? ' open' : ''}`}
          />
        </button>

        {/* Personal Dropdown */}
        {showPersonal && (
          <div className="dsb-personal-dropdown" ref={personalRef}>
            <div className="dsb-dropdown-body">
              <button className="dsb-dropdown-item" onClick={() => { navigate('/profile'); setShowPersonal(false); }}>
                <span className="dsb-dropdown-item-icon"><User size={16} /></span>
                Profile
              </button>
              <div className="dsb-dropdown-divider" />
              <div className="dsb-toggle-row" onClick={() => setIsDark(d => !d)}>
                <span className="dsb-dropdown-item-icon" style={{ color: 'var(--sb-text-muted)' }}>
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </span>
                <span className="dsb-toggle-label">Dark Mode</span>
                <label className="dsb-toggle-switch" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={e => setIsDark(e.target.checked)}
                  />
                  <span className="dsb-toggle-track" />
                </label>
              </div>
              <div className="dsb-dropdown-divider" />
              <button className="dsb-dropdown-item danger" onClick={handleSignOut}>
                <span className="dsb-dropdown-item-icon"><SignOut size={16} /></span>
                Sign Out
              </button>
            </div>
          </div>
        )}

      </div>

    </aside>
  );
}
