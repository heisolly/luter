import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  GlobeHemisphereWest,

  CreditCard, 
  BookOpen,
  Download,
  Trash,
  Eye,
  EyeSlash,
  Moon,
  Sun,
  DeviceMobile,
  Monitor,
  Question,
  Envelope,
  Lock,
  Key,
  SignOut,
  Check,
  X,
  ArrowRight,
  Sparkle,
  Gear,
  GearSix,
  UserCircle,
  Notification,
  Books,
  ChartBar,
  GraduationCap,
  Backpack
} from '@phosphor-icons/react';
import { RiCameraLine } from 'react-icons/ri';
import { supabase } from '../../supabaseClient';
import { ContentSkeleton } from '../shared/LuterPageLoader';
import AvatarCropModal from '../shared/AvatarCropModal';
import { useUniversalWorkspaceStore } from '../../store/useUniversalWorkspaceStore';
import { useSessionStore } from '../../store/useSessionStore';
import { LANDING_URL } from '../../utils/urlUtils';
import { getCreditBalance } from '../../services/creditService';


export default function SettingsPage({ onClose }) {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-mode'));
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    study: true,
    updates: false
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [creditsBalance, setCreditsBalance] = useState(Infinity);
  const fileInputRef = useRef(null);

  // Watch body class for dark mode changes
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-mode'));
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Inject global styles
  useEffect(() => {
    if (document.getElementById('stp-styles')) return;
    const el = document.createElement('style');
    el.id = 'stp-styles';
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
      @keyframes stp-spin { to { transform: rotate(360deg); } }
      .stp-input { width:100%;padding:12px 16px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:Outfit,Inter,sans-serif;color:#333;background:#fff;outline:none;transition:border-color 0.2s,box-shadow 0.2s;box-sizing:border-box; }
      body.dark-mode .stp-input { background:#111827;border-color:#374151;color:#F9FAFB; }
      .stp-input:focus { border-color:#C4B5FD;box-shadow:0 0 0 3px rgba(196,181,253,0.2); }
      .stp-select { width:100%;padding:12px 16px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:Outfit,Inter,sans-serif;color:#333;background:#fff;outline:none;transition:border-color 0.2s;box-sizing:border-box; }
      body.dark-mode .stp-select { background:#111827;border-color:#374151;color:#F9FAFB; }
      .stp-label { display:block;font-size:13px;font-weight:700;color:#333;margin-bottom:8px;font-family:Outfit,Inter,sans-serif; }
      body.dark-mode .stp-label { color:#F9FAFB; }
      .stp-save-btn { padding:13px 28px;background:#7a12cc;color:white;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:Outfit,Inter,sans-serif;display:inline-flex;align-items:center;gap:8px;transition:all 0.2s; }
      .stp-save-btn:hover { opacity:0.88;transform:translateY(-1px);box-shadow:0 8px 24px rgba(122,18,204,0.35); }
      .stp-save-btn:disabled { opacity:0.5;cursor:not-allowed;transform:none; }
      .stp-section-title { font-size:17px;font-weight:800;color:#333;margin:0 0 20px;padding-bottom:12px;border-bottom:2px solid #C4B5FD;display:inline-block; }
      body.dark-mode .stp-section-title { color:#F9FAFB; }
      .stp-toggle-track { width:44px;height:24px;border-radius:99px;background:#E5E7EB;position:relative;cursor:pointer;transition:background 0.2s;flex-shrink:0; }
      .stp-toggle-track.on { background:#C4B5FD; }
      .stp-toggle-thumb { position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:white;transition:left 0.2s;box-shadow:0 1px 4px rgba(0,0,0,0.2); }
      .stp-toggle-track.on .stp-toggle-thumb { left:23px; }
    `;
    document.head.appendChild(el);
  }, []);


  // Determine user type
  const isUniversityStudent = profile?.is_university_user !== false && profile?.role !== 'solo_learner';
  const isSoloLearner = !isUniversityStudent;

  // Form states
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    university: '',
    faculty: '',
    level: '',
    bio: '',
    interests: [],
    institution: '',
    program_name: '',
    education_level: ''
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Fetch real credit balance whenever user is available
  useEffect(() => {
    if (!user?.id) return;
    getCreditBalance(user.id).then(b => {
      if (typeof b === 'number') setCreditsBalance(b);
    }).catch(() => {});
  }, [user?.id]);


  const loadAvatar = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()
      
      if (!error && data?.avatar_url) {
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      console.error('Error loading avatar:', error)
    }
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('Image size must be less than 20MB')
      return
    }

    // Read file as data URL and show crop modal
    setPendingFile(file)
    const reader = new FileReader()
    reader.onload = () => setCropImageSrc(reader.result)
    reader.readAsDataURL(file)
  }

  const handleCropConfirm = async (blob) => {
    setCropImageSrc(null)
    setUploading(true)
    try {
      const filePath = `${user.id}/avatar.jpg`
      const cropFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, cropFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(`${publicUrl}?v=${Date.now()}`)
      fetchUserProfile()
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert(`Failed to upload image: ${error.message}. Please try again.`)
    } finally {
      setUploading(false)
      setPendingFile(null)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setProfile(profile);
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
          setProfileData({
            fullName: profile.full_name || '',
            email: user.email || '',
            university: profile.university || '',
            faculty: profile.faculty || '',
            level: profile.level || '',
            bio: profile.bio || '',
            interests: profile.interests || [],
            institution: profile.institution || '',
            program_name: profile.program_name || '',
            education_level: profile.education_level || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName,
          university: profileData.university,
          faculty: profileData.faculty,
          level: profileData.level,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      showMessage('error', 'Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.new !== passwordData.confirm) {
      showMessage('error', 'Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });
      
      if (error) throw error;
      showMessage('success', 'Password updated successfully!');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      showMessage('error', 'Failed to update password');
      console.error('Error updating password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // 1. Clear Supabase session
      await supabase.auth.signOut();
      
      // 2. Clear stores (using state directly to avoid hook constraints if needed, but here we can just call them)
      useUniversalWorkspaceStore.getState().resetStore();
      useSessionStore.getState().resetStore();
      
      // 3. Clear all local storage as a scorched-earth fix for any other cached bundles
      localStorage.clear();
      
      window.location.href = LANDING_URL;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Grouped nav sections (matching reference design)
  const navGroups = [
    {
      label: 'Profile',
      items: [
        { id: 'profile',  label: 'Account',           icon: UserCircle, desc: 'Manage your name, avatar and personal info.' },
        { id: 'billing',  label: 'AI Credits & Plans', icon: Sparkle,    desc: 'Check your AI credits balance and manage your plan.' },
      ]
    },
    {
      label: 'Preferences',
      items: [
        { id: 'appearance',    label: 'Appearance',   icon: Palette,  desc: 'Set your aesthetic preferences.' },
        { id: 'notifications', label: 'Notifications', icon: Bell,     desc: 'Control how and when you receive alerts.' },
      ]
    },
    {
      label: 'Studyspace',
      items: [
        { id: 'privacy',  label: 'Study Settings', icon: BookOpen, desc: 'Configure your study and session preferences.' },
        { id: 'account',  label: 'Security',       icon: Lock,     desc: 'Password, authentication and account security.' },
      ]
    },
    {
      label: 'Others',
      items: [
        { id: 'about', label: 'Support & Contact', icon: Envelope, desc: 'Get help or reach out to the Luter team.' },
      ]
    },
  ];

  const allNavItems = navGroups.flatMap(g => g.items);
  const activeNavItem = allNavItems.find(item => item.id === activeTab) || allNavItems[0];

  // shorthand colors
  const bg = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#ffffff';
  const border = isDark ? '#374151' : '#E5E7EB';
  const textPrimary = isDark ? '#F9FAFB' : '#333333';
  const textSec = isDark ? '#9CA3AF' : '#6B7280';

  if (loading && !profile) {
    const inner = (
      <div style={{ fontFamily: 'var(--font-outfit)', background: bg, flex: 1, minHeight: onClose ? 0 : '100vh' }}>
        <div style={{ padding: '24px 36px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(196,181,253,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GearSix size={22} color="#7a12cc" weight="fill" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: textPrimary, margin: 0, letterSpacing: '-0.03em' }}>Settings</h1>
            <p style={{ fontSize: 13, color: textSec, margin: '2px 0 0', fontWeight: 500 }}>Manage your account and preferences</p>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSec, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <X size={22} weight="bold" />
            </button>
          )}
        </div>
        <div style={{ padding: '40px' }}>
          <ContentSkeleton rows={6} height={60} />
        </div>
      </div>
    );
    if (onClose) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' }}>
          <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', background: bg, borderRadius: 20, width: '100%', maxWidth: 900, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', border: `1px solid ${border}` }}>
            {inner}
          </div>
        </div>
      );
    }
    return inner;
  }

  const panelBg   = isDark ? '#0F172A' : '#F5F5F7';
  const sidebarBg  = isDark ? '#1F2937' : '#FFFFFF';
  const dividerCol = isDark ? '#2D3748' : '#EBEBEB';

  const settingsContent = (
    <div style={{
      fontFamily: 'var(--font-outfit)',
      background: sidebarBg,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: onClose ? 0 : '100vh',
      transition: 'background 0.3s',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: `1px solid ${dividerCol}`,
        flexShrink: 0,
        gap: 10,
      }}>
        <GearSix size={18} color={textPrimary} weight="regular" />
        <span style={{ fontWeight: 600, fontSize: 15, color: textPrimary, flex: 1 }}>Settings</span>
        {onClose && (
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: textSec, padding: 6, borderRadius: 8,
              display: 'flex', alignItems: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <X size={18} weight="bold" />
          </button>
        )}
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 1300,
              padding: '12px 20px', borderRadius: 12,
              background: message.type === 'success' ? '#98FF98' : '#EF4444',
              color: message.type === 'success' ? '#166534' : 'white',
              fontWeight: 700, fontSize: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--font-outfit)',
            }}
          >
            {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Body: Left sidebar + Right panel ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left Sidebar ── */}
        <div style={{
          width: 188,
          flexShrink: 0,
          borderRight: `1px solid ${dividerCol}`,
          padding: '12px 10px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          background: sidebarBg,
        }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: 8 }}>
              {/* Group label */}
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: textSec,
                letterSpacing: '0.04em',
                padding: '10px 10px 5px',
                textTransform: 'none',
              }}>
                {group.label}
              </div>
              {/* Group items */}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.isExternal) {
                        window.location.href = item.isExternal;
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: isActive
                        ? (isDark ? 'rgba(196,181,253,0.15)' : 'rgba(0,0,0,0.07)')
                        : 'transparent',
                      color: isActive ? textPrimary : textSec,
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
                        e.currentTarget.style.color = textPrimary;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = textSec;
                      }
                    }}
                  >
                    <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Sign out — at bottom */}
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${dividerCol}` }}>
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 8,
                border: 'none', background: 'transparent',
                color: '#EF4444', fontSize: 13.5, fontWeight: 400,
                cursor: 'pointer', fontFamily: 'inherit',
                width: '100%', textAlign: 'left',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <SignOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div style={{
          flex: 1,
          background: panelBg,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {/* Section title + description */}
          {activeNavItem && (
            <div style={{ paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                {(() => { const Icon = activeNavItem.icon; return <Icon size={18} weight="regular" color={textPrimary} />; })()}
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: textPrimary, letterSpacing: '-0.01em' }}>
                  {activeNavItem.label}
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: textSec, lineHeight: 1.4 }}>
                {activeNavItem.desc}
              </p>
            </div>
          )}

          {/* Content card */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              background: cardBg,
              borderRadius: 12,
              border: `1px solid ${dividerCol}`,
              padding: '28px 28px',
              boxShadow: isDark
                ? '0 1px 4px rgba(0,0,0,0.3)'
                : '0 1px 3px rgba(0,0,0,0.04)',
              flex: 1,
            }}
          >
            {/* ─── Profile / Account tab ─── */}
            {activeTab === 'profile' && (
              <div>
                {/* Profile picture row */}
                <div style={{ fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', marginBottom: 10 }}>Profile Picture</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1px solid ${dividerCol}`, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      onClick={triggerFileInput}
                      style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #9718fb 0%, #7c3aed 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 700, color: 'white',
                        cursor: 'pointer', position: 'relative', overflow: 'hidden',
                        border: `2px solid ${dividerCol}`, flexShrink: 0,
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#9718fb'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = dividerCol}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                      {uploading && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: textPrimary }}>{profileData.fullName || user?.email}</div>
                      <div style={{ fontSize: 12, color: textSec, marginTop: 2 }}>{user?.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={triggerFileInput}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: `1px solid ${dividerCol}`,
                      background: cardBg, color: textPrimary, fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#9718fb'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = dividerCol}
                  >Change photo</button>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
                </div>

                {/* Profile form */}
                <div style={{ fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', marginBottom: 14 }}>Personal Info</div>
                <form onSubmit={handleProfileUpdate}>
                  {/* Name row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Full Name</div>
                    </div>
                    <input
                      type="text" value={profileData.fullName}
                      onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
                      style={{
                        width: 200, padding: '7px 11px', border: `1px solid ${dividerCol}`, borderRadius: 8,
                        fontSize: 13, fontFamily: 'inherit', outline: 'none', background: cardBg, color: textPrimary,
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => e.target.style.borderColor = '#9718fb'}
                      onBlur={e => e.target.style.borderColor = dividerCol}
                    />
                  </div>
                  {/* Email row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Email</div>
                      <div style={{ fontSize: 12, color: textSec }}>Your email cannot be changed</div>
                    </div>
                    <div style={{ fontSize: 13, color: textSec }}>{profileData.email}</div>
                  </div>
                  {/* Bio row */}
                  <div style={{ padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ paddingTop: 2 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Bio</div>
                        <div style={{ fontSize: 12, color: textSec }}>A short bio about yourself</div>
                      </div>
                      <textarea
                        value={profileData.bio}
                        onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                        rows={2}
                        placeholder="Tell us about yourself..."
                        style={{
                          width: 260, padding: '7px 11px', border: `1px solid ${dividerCol}`, borderRadius: 8,
                          fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                          background: cardBg, color: textPrimary, lineHeight: 1.5, transition: 'border-color 0.15s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#9718fb'}
                        onBlur={e => e.target.style.borderColor = dividerCol}
                      />
                    </div>
                  </div>

                  {/* University fields */}
                  {isUniversityStudent && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>University</div>
                        <input type="text" value={profileData.university}
                          onChange={e => setProfileData({ ...profileData, university: e.target.value })}
                          style={{ width: 200, padding: '7px 11px', border: `1px solid ${dividerCol}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: cardBg, color: textPrimary, transition: 'border-color 0.15s' }}
                          onFocus={e => e.target.style.borderColor = '#9718fb'} onBlur={e => e.target.style.borderColor = dividerCol} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Faculty</div>
                        <input type="text" value={profileData.faculty}
                          onChange={e => setProfileData({ ...profileData, faculty: e.target.value })}
                          style={{ width: 200, padding: '7px 11px', border: `1px solid ${dividerCol}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: cardBg, color: textPrimary, transition: 'border-color 0.15s' }}
                          onFocus={e => e.target.style.borderColor = '#9718fb'} onBlur={e => e.target.style.borderColor = dividerCol} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Level</div>
                        <input type="text" value={profileData.level} placeholder="e.g. 200 Level"
                          onChange={e => setProfileData({ ...profileData, level: e.target.value })}
                          style={{ width: 200, padding: '7px 11px', border: `1px solid ${dividerCol}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: cardBg, color: textPrimary, transition: 'border-color 0.15s' }}
                          onFocus={e => e.target.style.borderColor = '#9718fb'} onBlur={e => e.target.style.borderColor = dividerCol} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Program</div>
                        <input type="text" value={profileData.program_name} placeholder="e.g. Computer Science"
                          onChange={e => setProfileData({ ...profileData, program_name: e.target.value })}
                          style={{ width: 200, padding: '7px 11px', border: `1px solid ${dividerCol}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: cardBg, color: textPrimary, transition: 'border-color 0.15s' }}
                          onFocus={e => e.target.style.borderColor = '#9718fb'} onBlur={e => e.target.style.borderColor = dividerCol} />
                      </div>
                    </>
                  )}

                  {/* Solo learner fields */}
                  {isSoloLearner && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Institution</div>
                        <input type="text" value={profileData.institution} placeholder="e.g. Self-taught"
                          onChange={e => setProfileData({ ...profileData, institution: e.target.value })}
                          style={{ width: 200, padding: '7px 11px', border: `1px solid ${dividerCol}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: cardBg, color: textPrimary, transition: 'border-color 0.15s' }}
                          onFocus={e => e.target.style.borderColor = '#9718fb'} onBlur={e => e.target.style.borderColor = dividerCol} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Education Level</div>
                        <select value={profileData.education_level}
                          onChange={e => setProfileData({ ...profileData, education_level: e.target.value })}
                          style={{ width: 200, padding: '7px 11px', border: `1px solid ${dividerCol}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: cardBg, color: textPrimary }}>
                          <option value="">Select Level</option>
                          <option value="Primary">Primary</option>
                          <option value="Secondary">Secondary</option>
                          <option value="Tertiary">Tertiary</option>
                          <option value="Professional">Professional</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Save button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                    <button
                      type="submit" disabled={loading}
                      style={{
                        padding: '8px 20px', borderRadius: 8, border: 'none',
                        background: '#9718fb', color: 'white', fontSize: 13.5, fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 7,
                        opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
                      }}
                    >
                      {loading ? 'Saving…' : <><Check size={15} /> Save changes</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ─── AI Credits & Plans tab ─── */}
            {activeTab === 'billing' && (
              <div>
                {/* Credits section */}
                <div style={{ fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', marginBottom: 10 }}>Credits</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${dividerCol}` }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: textPrimary }}>AI Credits</div>
                    <div style={{ fontSize: 12, color: textSec, marginTop: 2 }}>50/day · Resets at midnight</div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '7px 14px', borderRadius: 8, border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    background: isDark ? '#1F2937' : '#FEFCE8', color: isDark ? '#FDE68A' : '#92400E',
                    fontWeight: 700, fontSize: 14,
                  }}>
                    <Sparkle size={16} />
                    {creditsBalance === Infinity ? '∞' : creditsBalance}
                  </div>
                </div>

                {/* Plan section */}
                <div style={{ fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', margin: '20px 0 10px' }}>Your Plan</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${dividerCol}` }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: textPrimary }}>Free Plan</div>
                    <div style={{ fontSize: 12, color: textSec, marginTop: 3, lineHeight: 1.5 }}>
                      With this plan you have <strong>50 AI credits</strong> and <strong>3 transcriptions</strong> per day.
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/upgrade'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8,
                      border: `1px solid ${dividerCol}`, background: cardBg,
                      color: textPrimary, fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#9718fb'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = dividerCol}
                  >
                    <Sparkle size={14} />  Upgrade
                  </button>
                </div>
              </div>
            )}

            {/* ─── Security tab ─── */}
            {activeTab === 'account' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', marginBottom: 14 }}>Change Password</div>
                <form onSubmit={handlePasswordUpdate}>
                  {/* Current password */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Current Password</div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.current}
                        onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                        style={{ width: 200, padding: '7px 11px', border: `1px solid ${dividerCol}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: cardBg, color: textPrimary, transition: 'border-color 0.15s' }}
                        onFocus={e => e.target.style.borderColor = '#9718fb'}
                        onBlur={e => e.target.style.borderColor = dividerCol}
                      />
                    </div>
                  </div>
                  {/* New password */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>New Password</div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.new}
                      onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                      style={{ width: 200, padding: '7px 11px', border: `1px solid ${dividerCol}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: cardBg, color: textPrimary, transition: 'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor = '#9718fb'}
                      onBlur={e => e.target.style.borderColor = dividerCol}
                    />
                  </div>
                  {/* Confirm password */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${dividerCol}` }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Confirm New Password</div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.confirm}
                      onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      style={{ width: 200, padding: '7px 11px', border: `1px solid ${dividerCol}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: cardBg, color: textPrimary, transition: 'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor = '#9718fb'}
                      onBlur={e => e.target.style.borderColor = dividerCol}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                    <button
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', color: textSec, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}
                    >
                      {showPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                      {showPassword ? 'Hide' : 'Show'} passwords
                    </button>
                    <button
                      type="submit" disabled={loading}
                      style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#9718fb', color: 'white', fontSize: 13.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 7 }}
                    >
                      {loading ? 'Updating…' : <><Lock size={14} /> Update Password</>}
                    </button>
                  </div>
                </form>

                {/* 2FA notice */}
                <div style={{ marginTop: 28, fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', marginBottom: 12 }}>Two-Factor Authentication</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Authenticator app</div>
                    <div style={{ fontSize: 12, color: textSec, marginTop: 2 }}>Add an extra layer of security to your account</div>
                  </div>
                  <button
                    style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${dividerCol}`, background: cardBg, color: textSec, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  >Coming soon</button>
                </div>
              </div>
            )}

            {/* ─── Notifications tab ─── */}
            {activeTab === 'notifications' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', marginBottom: 10 }}>Alerts</div>
                {[
                  { key: 'email',   label: 'Email Notifications',  desc: 'Receive updates and alerts via email' },
                  { key: 'push',    label: 'Push Notifications',    desc: 'Get instant notifications in your browser' },
                  { key: 'study',   label: 'Study Reminders',       desc: 'Remind me about study sessions and deadlines' },
                  { key: 'updates', label: 'Product Updates',       desc: 'Stay informed about new features and improvements' },
                ].map((item, idx, arr) => (
                  <div
                    key={item.key}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: idx < arr.length - 1 ? `1px solid ${dividerCol}` : 'none' }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: textSec, marginTop: 2 }}>{item.desc}</div>
                    </div>
                    {/* Toggle */}
                    <div
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      style={{
                        width: 42, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
                        background: notifications[item.key] ? '#9718fb' : (isDark ? '#374151' : '#D1D5DB'),
                        position: 'relative', transition: 'background 0.18s',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 3, left: notifications[item.key] ? 21 : 3,
                        width: 18, height: 18, borderRadius: '50%',
                        background: 'white', transition: 'left 0.18s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Appearance tab ─── */}
            {activeTab === 'appearance' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', marginBottom: 10 }}>Interface</div>
                {/* Theme row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${dividerCol}` }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Theme</div>
                    <div style={{ fontSize: 12, color: textSec }}>Choose a theme for Luter on this device</div>
                  </div>
                  <select
                    value={isDark ? 'dark' : 'light'}
                    onChange={e => setDarkMode(e.target.value === 'dark')}
                    style={{
                      padding: '7px 32px 7px 12px', border: `1px solid ${dividerCol}`, borderRadius: 8,
                      fontSize: 13, fontFamily: 'inherit', outline: 'none',
                      background: cardBg, color: textPrimary,
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%236B7280' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                    }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                {/* Accent color row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${dividerCol}` }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Accent Color</div>
                    <div style={{ fontSize: 12, color: textSec }}>Active across the entire Luter interface</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['#9718fb', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                      <div
                        key={color}
                        style={{
                          width: 22, height: 22, borderRadius: '50%', background: color,
                          cursor: 'pointer', border: color === '#9718fb' ? '3px solid' : '2px solid transparent',
                          borderColor: color === '#9718fb' ? textPrimary : 'transparent',
                          boxSizing: 'border-box', transition: 'transform 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Study Settings (privacy) tab ─── */}
            {activeTab === 'privacy' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', marginBottom: 10 }}>Data & Privacy</div>
                {/* Profile visibility */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${dividerCol}` }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Profile Visibility</div>
                    <div style={{ fontSize: 12, color: textSec }}>Control who can see your profile information</div>
                  </div>
                  <select
                    style={{
                      padding: '7px 12px', border: `1px solid ${dividerCol}`, borderRadius: 8,
                      fontSize: 13, fontFamily: 'inherit', outline: 'none',
                      background: cardBg, color: textPrimary,
                    }}
                  >
                    <option>Everyone</option>
                    <option>Only Friends</option>
                    <option>Private</option>
                  </select>
                </div>
                {/* Export data */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${dividerCol}` }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Export Data</div>
                    <div style={{ fontSize: 12, color: textSec }}>Download all your data in JSON format</div>
                  </div>
                  <button
                    style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${dividerCol}`, background: cardBg, color: textPrimary, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#9718fb'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = dividerCol}
                  >
                    <Download size={14} /> Export
                  </button>
                </div>
                {/* Delete account */}
                <div style={{ marginTop: 20, fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', marginBottom: 10 }}>Danger Zone</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: '#EF4444' }}>Delete Account</div>
                    <div style={{ fontSize: 12, color: textSec }}>Permanently delete your account and all data. This cannot be undone.</div>
                  </div>
                  <button
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #FCA5A5', background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', color: '#EF4444', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2'}
                    onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2'}
                  >
                    Delete account
                  </button>
                </div>
              </div>
            )}

            {/* ─── Support & Contact (about) tab ─── */}
            {activeTab === 'about' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', marginBottom: 10 }}>Contact</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${dividerCol}` }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Email Support</div>
                    <div style={{ fontSize: 12, color: textSec }}>support@luter.app</div>
                  </div>
                  <a
                    href="mailto:support@luter.app"
                    style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${dividerCol}`, background: cardBg, color: textPrimary, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#9718fb'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = dividerCol}
                  >
                    <Envelope size={14} /> Send email
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${dividerCol}` }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Website</div>
                    <div style={{ fontSize: 12, color: textSec }}>www.luter.app</div>
                  </div>
                  <a
                    href="https://luter.app" target="_blank" rel="noreferrer"
                    style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${dividerCol}`, background: cardBg, color: textPrimary, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#9718fb'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = dividerCol}
                  >
                    <GlobeHemisphereWest size={14} /> Visit
                  </a>
                </div>

                <div style={{ marginTop: 20, fontSize: 11, fontWeight: 600, color: textSec, letterSpacing: '0.04em', marginBottom: 10 }}>About</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${dividerCol}` }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>Version</div>
                  <div style={{ fontSize: 13, color: textSec }}>1.0.0</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: textPrimary }}>© 2024 Luter</div>
                  <div style={{ fontSize: 13, color: textSec }}>All rights reserved</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onCancel={() => { setCropImageSrc(null); setPendingFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );

  // ── Overlay mode (triggered from sidebar) ──
  if (onClose) {
    return (
      <AnimatePresence>
        <motion.div
          key="settings-overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '32px', boxSizing: 'border-box',
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />
          {/* Dialog panel — matches reference: clean rounded card */}
          <motion.div
            key="settings-overlay-panel"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              borderRadius: 16,
              width: '100%',
              maxWidth: 880,
              height: 'min(86vh, 660px)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isDark
                ? '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)'
                : '0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* settingsContent fills the panel fully */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {settingsContent}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return settingsContent;
}