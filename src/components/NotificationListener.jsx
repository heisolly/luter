import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { X, WarningCircle, Bell } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * A global listener for Supabase Realtime notifications.
 * Handles both subtle toasts and forced UI modals.
 */
export default function NotificationListener({ children, userId, onUnreadCountChange }) {
  const [activeModal, setActiveModal] = useState(null);
  const location = useLocation();

  // Initial fetch for unread count
  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error && count !== null && onUnreadCountChange) {
        onUnreadCountChange(count);
      }
    };

    fetchUnreadCount();
  }, [userId, onUnreadCountChange]);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to INSERT events specifically for this logged-in user
    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotif = payload.new;
          
          // Increment unread count globally if provided
          if (onUnreadCountChange) {
            onUnreadCountChange(prev => (prev || 0) + 1);
          }

          if (newNotif.type === 'popup_modal') {
            // Trigger the forced disruptive UI Pop-up Modal
            setActiveModal(newNotif);
          } else {
            // If they are not already on the notifications page, show a toast
            if (location.pathname !== '/notifications') {
              toast.custom((t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                >
                  <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Bell size={20} className="text-purple-600" weight="fill" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-bold text-gray-900">
                          {newNotif.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {newNotif.message || newNotif.body}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-gray-200">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              ), { duration: 5000 });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, location.pathname, onUnreadCountChange]);

  const markModalAsRead = async () => {
    if (!activeModal) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', activeModal.id);
        
      if (onUnreadCountChange) {
        onUnreadCountChange(prev => Math.max(0, (prev || 1) - 1));
      }
    } catch (e) {
      console.error('Failed to mark modal as read', e);
    }
    setActiveModal(null);
  };

  return (
    <>
      {children}

      {/* Forced UI Pop-Up Modal Overlay */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={markModalAsRead}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-900 p-8 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              {/* Decorative top bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
              
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <WarningCircle size={28} className="text-red-600 dark:text-red-400" weight="fill" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {activeModal.title}
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                {activeModal.message || activeModal.body}
              </p>
              
              <div className="flex justify-end">
                <button 
                  onClick={markModalAsRead}
                  className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
