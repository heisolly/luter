import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Bell, Check, Trash, WarningCircle, CaretLeft, Circle, Sparkle, Clock, CheckCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsPage() {
  const { user, isMobile } = useOutletContext();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread
  
  const isDark = document.body.classList.contains('dark-mode');

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();
    
    const channel = supabase
      .channel(`page-notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          loadNotifications(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadNotifications = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const markAsRead = async (id) => {
    const notif = notifications.find(n => n.id === id);
    if (notif?.is_read) return;

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications?")) return;
    setNotifications([]);
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredNotifications = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  const bgRoot = isDark ? '#111827' : '#F9FAFB';
  const bgCard = isDark ? '#1F2937' : '#FFFFFF';
  const borderCard = isDark ? '#374151' : '#E5E7EB';
  const textTitle = isDark ? '#F9FAFB' : '#111827';
  const textBody = isDark ? '#9CA3AF' : '#6B7280';
  const bgPill = isDark ? '#374151' : '#F3F4F6';
  const bgHover = isDark ? '#374151' : '#F9FAFB';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgRoot, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px 100px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isMobile && (
              <button onClick={() => navigate(-1)} style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: textTitle, marginBottom: '16px' }}>
                <CaretLeft size={20} weight="bold" />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: isDark ? '#374151' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={28} color={textTitle} weight="fill" />
              </div>
              <h1 style={{ fontSize: '42px', fontWeight: 800, color: textTitle, margin: 0, letterSpacing: '-0.03em' }}>Inbox</h1>
              {unreadCount > 0 && (
                <span style={{ background: isDark ? '#F9FAFB' : '#111827', color: isDark ? '#111827' : '#F9FAFB', fontSize: '14px', fontWeight: 800, padding: '6px 16px', borderRadius: '9999px' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '17px', color: textBody, fontWeight: 500, marginTop: '8px' }}>
              Stay on top of your study journey. Catch up on alerts, mentions, and updates.
            </p>
          </div>

          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <button onClick={markAllAsRead} disabled={unreadCount === 0} style={{ padding: '12px 24px', borderRadius: '100px', border: 'none', background: isDark ? '#374151' : '#E5E7EB', color: textTitle, fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: unreadCount === 0 ? 'not-allowed' : 'pointer', opacity: unreadCount === 0 ? 0.5 : 1, transition: 'background 0.2s' }}>
                <CheckCircle size={20} weight="fill" /> Mark all read
              </button>
              <button onClick={clearAll} disabled={notifications.length === 0} style={{ padding: '12px 24px', borderRadius: '100px', border: 'none', background: 'transparent', color: textBody, fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: notifications.length === 0 ? 'not-allowed' : 'pointer', opacity: notifications.length === 0 ? 0.5 : 1, transition: 'color 0.2s' }}>
                <Trash size={20} weight="fill" /> Clear inbox
              </button>
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main List Container */}
          <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '32px', overflow: 'hidden', boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.2)' : '0 20px 40px rgba(0,0,0,0.03)' }}>
            
            {/* Inline Tabs */}
            <div style={{ display: 'flex', gap: '16px', padding: '16px 24px 0', borderBottom: `1px solid ${borderCard}`, background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
              <button onClick={() => setFilter('all')} style={{ padding: '12px 16px', border: 'none', background: 'transparent', color: filter === 'all' ? textTitle : textBody, fontWeight: 800, fontSize: '16px', cursor: 'pointer', borderBottom: filter === 'all' ? `3px solid ${textTitle}` : '3px solid transparent', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                All Updates <span style={{ background: filter === 'all' ? (isDark ? '#374151' : '#E5E7EB') : 'transparent', color: filter === 'all' ? textTitle : textBody, padding: '2px 8px', borderRadius: '8px', fontSize: '13px' }}>{notifications.length}</span>
              </button>
              <button onClick={() => setFilter('unread')} style={{ padding: '12px 16px', border: 'none', background: 'transparent', color: filter === 'unread' ? textTitle : textBody, fontWeight: 800, fontSize: '16px', cursor: 'pointer', borderBottom: filter === 'unread' ? `3px solid ${textTitle}` : '3px solid transparent', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Unread {unreadCount > 0 && <span style={{ background: filter === 'unread' ? (isDark ? '#374151' : '#E5E7EB') : 'transparent', color: filter === 'unread' ? textTitle : textBody, padding: '2px 8px', borderRadius: '8px', fontSize: '13px' }}>{unreadCount}</span>}
              </button>
            </div>

            {/* Feed List */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0', color: textBody, fontWeight: 700 }}>Syncing inbox...</div>
              ) : filteredNotifications.length === 0 ? (
                <div style={{ padding: '100px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: bgPill, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <CheckCircle size={40} color={textBody} weight="fill" />
                  </div>
                  <h3 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 800, color: textTitle }}>You're all caught up!</h3>
                  <p style={{ margin: 0, fontSize: '16px', color: textBody, fontWeight: 500, maxWidth: '300px' }}>
                    {filter === 'unread' ? "You don't have any unread notifications right now." : "Your inbox is completely empty. Go crush some study goals!"}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredNotifications.map((notif, i) => {
                    const isModal = notif.type === 'popup_modal';
                    const isUnread = !notif.is_read;
                    const meta = notif.metadata || {};
                    const emoji = meta.emoji || (isModal ? '🚨' : '💬');
                    const isLast = i === filteredNotifications.length - 1;

                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        onClick={() => { markAsRead(notif.id); if (meta.action_url) navigate(meta.action_url); }}
                        style={{
                          position: 'relative', background: isUnread ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)') : 'transparent', borderBottom: isLast ? 'none' : `1px solid ${borderCard}`, padding: '24px 32px', display: 'flex', gap: '24px', cursor: 'pointer', transition: 'background 0.2s', overflow: 'hidden'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? '#374151' : '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = isUnread ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)') : 'transparent'}
                      >
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: isDark ? '#374151' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                          {emoji}
                        </div>
                        
                        <div style={{ flex: 1, paddingTop: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: isUnread ? 800 : 600, color: textTitle }}>{notif.title}</h4>
                              {isUnread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFD2A6', flexShrink: 0 }} />}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: textBody, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Clock size={14} weight="bold" /> {new Date(notif.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 16px', fontSize: '15px', color: isUnread ? textTitle : textBody, lineHeight: 1.6, opacity: isUnread ? 1 : 0.9 }}>
                            {notif.message || notif.body}
                          </p>
                          
                          {meta.action_url && (
                            <button onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); navigate(meta.action_url); }} style={{ padding: '10px 20px', borderRadius: '100px', border: 'none', background: isDark ? '#F9FAFB' : '#111827', color: isDark ? '#111827' : '#F9FAFB', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                              {meta.action_label || 'View Details'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

      </div>
      
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', background: bgCard, borderTop: `1px solid ${borderCard}`, display: 'flex', gap: '12px', zIndex: 50 }}>
          <button onClick={markAllAsRead} disabled={unreadCount === 0} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: `1px solid ${borderCard}`, background: bgCard, color: textTitle, fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: unreadCount === 0 ? 0.5 : 1 }}>
            <CheckCircle size={20} weight="fill" /> Mark Read
          </button>
          <button onClick={clearAll} disabled={notifications.length === 0} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', color: '#EF4444', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: notifications.length === 0 ? 0.5 : 1 }}>
            <Trash size={20} weight="fill" /> Clear
          </button>
        </div>
      )}
    </div>
  );
}
