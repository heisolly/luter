import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  GameController, 
  Cards, 
  ChartBar, 
  GearSix, 
  Question, 
  SignOut,
  CaretRight,
  MonitorPlay,
  ChalkboardTeacher,
  ChatTeardropDots
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function MobileMoreMenu({ isOpen, onClose, user, profile, isDark = false }) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const bg = isDark ? '#111827' : '#FFFFFF';
  const text = isDark ? '#F9FAFB' : '#111827';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const border = isDark ? '#374151' : '#F3F4F6';
  const hoverBg = isDark ? '#1F2937' : '#F9FAFB';
  const purpleBg = isDark ? 'rgba(124, 92, 237, 0.15)' : '#F5F0FF';
  const purpleText = isDark ? '#C4B5FD' : '#7C3AED';

  const menuGroups = [
    {
      title: 'FEATURES',
      items: [
        { label: 'AI Chat', icon: ChatTeardropDots, path: '/ai-chat', color: '#8B5CF6' },
        { label: 'Arcade', icon: GameController, path: '/playground', color: '#10B981' },
      ]
    },
    {
      title: 'ACCOUNT & SETTINGS',
      items: [
        { label: 'Profile', icon: User, path: '/profile', color: subText },
        { label: 'Analytics', icon: ChartBar, path: '/analytics', color: subText },
        { label: 'Settings', icon: GearSix, path: '/settings', color: subText },
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 99999,
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: bg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: '24px 20px',
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 20px))',
              zIndex: 100000,
              boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                backgroundColor: profile?.avatar_url ? 'transparent' : purpleBg,
                color: purpleText, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, overflow: 'hidden'
              }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (profile?.full_name || profile?.username || user?.email || 'S').charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: text }}>
                  {profile?.full_name || profile?.username || 'Scholar'}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: subText, fontWeight: 500 }}>
                  {profile?.subscription_tier?.toLowerCase() === 'premium' ? 'Executive Plan' : 'Free Plan'}
                </p>
              </div>
              <button 
                onClick={() => handleNavigate('/profile')}
                style={{
                  background: 'none', border: `1px solid ${border}`, borderRadius: 999,
                  padding: '8px 16px', fontSize: 13, fontWeight: 700, color: text, cursor: 'pointer'
                }}
              >
                View
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {menuGroups.map((group, i) => (
                <div key={i}>
                  <p style={{ margin: '0 0 12px 12px', fontSize: 12, fontWeight: 800, color: subText, letterSpacing: 0.5 }}>
                    {group.title}
                  </p>
                  <div style={{ backgroundColor: hoverBg, borderRadius: 16, padding: '4px 0' }}>
                    {group.items.map((item, j) => (
                      <button
                        key={j}
                        onClick={() => handleNavigate(item.path)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color,
                            boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)'
                          }}>
                            <item.icon size={20} weight="fill" />
                          </div>
                          <span style={{ fontSize: 16, fontWeight: 600, color: text }}>{item.label}</span>
                        </div>
                        <CaretRight size={16} color={subText} weight="bold" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <div style={{ backgroundColor: hoverBg, borderRadius: 16, padding: '4px 0', marginTop: 8 }}>
                  <button
                    onClick={() => handleNavigate('/help')}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: subText }}>
                        <Question size={22} weight="bold" />
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 600, color: text }}>Help & Support</span>
                    </div>
                  </button>
                  <button
                    onClick={handleSignOut}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                        <SignOut size={22} weight="bold" />
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#EF4444' }}>Sign Out</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: subText, fontWeight: 500 }}>Luter App v1.0</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
