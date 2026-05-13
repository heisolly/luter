import { create } from 'zustand'
import { supabase } from '../supabaseClient'

// Notification types
export const NotificationTypes = {
  LEVEL_UP: 'level_up',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
  GAME_INVITE: 'game_invite',
  STREAK_LOST: 'streak_lost',
  STREAK_MILESTONE: 'streak_milestone',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  SESSION_SHARED: 'session_shared',
  MATERIAL_COMPLETED: 'material_completed',
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
  WELCOME: 'welcome',
  SYSTEM_UPDATE: 'system_update'
}

export const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}

export const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  settings: {
    email_notifications: true,
    push_notifications: true,
    in_app_notifications: true,
    notification_types: {}
  },
  isLoading: false,
  isConnected: false,

  // Actions
  setNotifications: (notifications) => {
    set({ notifications })
    const unreadCount = notifications.filter(n => !n.is_read).length
    set({ unreadCount })
  },

  addNotification: (notification) => {
    const { notifications } = get()
    set({ notifications: [notification, ...notifications] })
    if (!notification.is_read) {
      set({ unreadCount: get().unreadCount + 1 })
    }
  },

  markAsRead: async (notificationId) => {
    const { notifications, unreadCount } = get()
    
    try {
      const { error } = await supabase
        .rpc('mark_notification_read', {
          p_notification_id: notificationId,
          p_user_id: (await supabase.auth.getUser()).data.user?.id
        })

      if (!error) {
        const updatedNotifications = notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
        set({ notifications: updatedNotifications })
        set({ unreadCount: Math.max(0, unreadCount - 1) })
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get()
    const unreadNotifications = notifications.filter(n => !n.is_read)
    
    if (unreadNotifications.length === 0) return

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (!error) {
        const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }))
        set({ notifications: updatedNotifications })
        set({ unreadCount: 0 })
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  },

  removeNotification: (notificationId) => {
    const { notifications, unreadCount } = get()
    const notification = notifications.find(n => n.id === notificationId)
    
    const updatedNotifications = notifications.filter(n => n.id !== notificationId)
    set({ notifications: updatedNotifications })
    
    if (notification && !notification.is_read) {
      set({ unreadCount: Math.max(0, unreadCount - 1) })
    }
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 })
  },

  loadNotifications: async () => {
    set({ isLoading: true })
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        set({ notifications: data })
        const unreadCount = data.filter(n => !n.is_read).length
        set({ unreadCount })
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  loadSettings: async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!error && data) {
        set({ settings: data })
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          ...newSettings,
          updated_at: new Date().toISOString()
        })

      if (!error) {
        set({ settings: { ...get().settings, ...newSettings } })
      }
    } catch (error) {
      console.error('Error updating notification settings:', error)
    }
  },

  connectRealtime: () => {
    const userId = supabase.auth.user()?.id
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotification = payload.new
          if (newNotification.user_id === userId) {
            get().addNotification(newNotification)
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          const updatedNotification = payload.new
          if (updatedNotification.user_id === userId) {
            const { notifications } = get()
            const updatedNotifications = notifications.map(n =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
            set({ notifications: updatedNotifications })
            
            // Update unread count
            const wasUnread = !payload.old.is_read
            const isNowRead = updatedNotification.is_read
            if (wasUnread && isNowRead) {
              set({ unreadCount: Math.max(0, get().unreadCount - 1) })
            }
          }
        }
      )
      .subscribe((status) => {
        set({ isConnected: status === 'SUBSCRIBED' })
      })

    return () => {
      channel.unsubscribe()
    }
  },

  disconnectRealtime: () => {
    set({ isConnected: false })
  }
}))

// Helper functions for creating notifications
export const NotificationHelpers = {
  createLevelUpNotification: async (userId, newLevel, oldLevel) => {
    try {
      const { data, error } = await supabase
        .rpc('create_level_up_notification', {
          p_user_id: userId,
          p_new_level: newLevel,
          p_old_level: oldLevel
        })
      return { data, error }
    } catch (err) {
      return { error: err }
    }
  },

  createStreakNotification: async (userId, streakType, streakCount = null) => {
    try {
      const { data, error } = await supabase
        .rpc('create_streak_notification', {
          p_user_id: userId,
          p_streak_type: streakType,
          p_streak_count: streakCount
        })
      return { data, error }
    } catch (err) {
      return { error: err }
    }
  },

  createFriendRequestNotification: async (userId, friendId, friendName) => {
    try {
      const { data, error } = await supabase
        .rpc('create_friend_request_notification', {
          p_user_id: userId,
          p_friend_id: friendId,
          p_friend_name: friendName
        })
      return { data, error }
    } catch (err) {
      return { error: err }
    }
  },

  createWelcomeNotification: async (userId, userName) => {
    try {
      const { data, error } = await supabase
        .rpc('create_welcome_notification', {
          p_user_id: userId,
          p_user_name: userName
        })
      return { data, error }
    } catch (err) {
      return { error: err }
    }
  },

  createAdminNotification: async (adminData) => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .insert(adminData)
        .select()
        .single()
      return { data, error }
    } catch (err) {
      return { error: err }
    }
  }
}
