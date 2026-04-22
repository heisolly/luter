import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, 
  Settings, 
  X,
  Sparkles,
  Flame,
  Bell,
  BookOpen,
  Trophy,
  Users,
  Archive
} from 'lucide-react'

const PRIMARY_COLOR = '#9718fb'
const PRIMARY_BG = '#F3E8FF'

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: '🔥 Keep Your Streak Alive!',
    description: 'You\'re on a 5-day streak! Just 2 minutes of study today to make it 6 days straight.',
    time: '2 hours ago',
    unread: true,
    type: 'streak',
    icon: <Flame size={20} strokeWidth={2.5} />,
    priority: 'high',
    action: { label: 'Continue Streak', path: '/dashboard/workstation' }
  },
  {
    id: 2,
    title: '✨ AI Summary Complete',
    description: 'Your "Modern Physics" notes have been processed. Smart summary and flashcards are ready.',
    time: '4 hours ago',
    unread: true,
    type: 'ai',
    icon: <Sparkles size={20} strokeWidth={2.5} />,
    priority: 'medium',
    action: { label: 'View Summary', path: '/dashboard/courses/physics' }
  },
  {
    id: 3,
    title: '📚 Study Group Invitation',
    description: 'Sarah invited you to join "CS101 Study Squad" for exam prep.',
    time: 'Yesterday',
    unread: true,
    type: 'social',
    icon: <Users size={20} strokeWidth={2.5} />,
    priority: 'medium',
    action: { label: 'Join Group', path: '/dashboard/study-groups/123' }
  },
  {
    id: 4,
    title: '🏆 Weekly Achievement',
    description: 'You earned 1,250 XP this week! Top 5% at your university. Keep it up!',
    time: '2 days ago',
    unread: false,
    type: 'achievement',
    icon: <Trophy size={20} strokeWidth={2.5} />,
    priority: 'low'
  },
  {
    id: 5,
    title: '📖 New Course Material',
    description: 'Week 8 materials for "Data Structures" are now available.',
    time: '3 days ago',
    unread: false,
    type: 'course',
    icon: <BookOpen size={20} strokeWidth={2.5} />,
    priority: 'low',
    action: { label: 'View Materials', path: '/dashboard/courses/ds/materials/week8' }
  }
]

const NotificationsOverlay = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, unread: false } : n
    ))
  }

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Settings-Style Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] bg-white z-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header - Settings Style */}
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: PRIMARY_COLOR,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer'
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Settings Style */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {notifications.length > 0 ? (
                <div className="space-y-1">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="py-4 border-b border-gray-100 last:border-b-0 relative"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon - Settings Style */}
                        <div 
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            notif.type === 'streak' ? 'bg-orange-100 text-orange-600' :
                            notif.type === 'ai' ? 'bg-purple-100 text-purple-600' :
                            notif.type === 'social' ? 'bg-blue-100 text-blue-600' :
                            notif.type === 'achievement' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}
                        >
                          {notif.icon}
                        </div>

                        {/* Content - Settings Style */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className={`text-base font-semibold text-gray-900 leading-tight mb-1 ${
                                notif.unread ? 'font-bold' : ''
                              }`}>
                                {notif.title}
                              </h3>
                              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                {notif.description}
                              </p>
                              <div className="flex items-center gap-4">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  {notif.time}
                                </span>
                                {notif.action && (
                                  <button 
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: PRIMARY_COLOR,
                                      fontWeight: 700,
                                      fontSize: 12,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {notif.action.label}
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notif.id)
                              }}
                              className="opacity-0 hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                            >
                              <X size={16} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Unread Indicator */}
                      {notif.unread && (
                        <div className="absolute left-8 top-6 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Bell size={24} className="text-gray-400" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    All caught up!
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    No new notifications. Check back later for updates.
                  </p>
                </div>
              )}
            </div>

            {/* Footer - Settings Style */}
            <div className="px-8 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <button 
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 10,
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: '#111'
                  }}
                >
                  <Settings size={14} strokeWidth={2} />
                  Notification Settings
                </button>
                <button 
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 10,
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: '#111'
                  }}
                >
                  <Archive size={14} strokeWidth={2} />
                  View Archive
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationsOverlay

