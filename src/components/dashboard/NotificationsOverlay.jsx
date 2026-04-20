import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, 
  Settings, 
  X,
  Sparkles,
  Flame,
  Zap,
  Bell,
  BookOpen,
  Trophy,
  Users,
  ChevronRight,
  Archive
} from 'lucide-react'

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Notification Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-h-[600px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
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

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="p-4 space-y-3">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={() => markAsRead(notif.id)}
                      className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                        notif.unread 
                          ? 'bg-white border-gray-200 shadow-sm hover:shadow-md' 
                          : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      {/* Unread indicator */}
                      {notif.unread && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
                      )}

                      <div className="flex gap-4">
                        {/* Icon */}
                        <div 
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            notif.type === 'streak' ? 'bg-orange-100 text-orange-600' :
                            notif.type === 'ai' ? 'bg-purple-100 text-purple-600' :
                            notif.type === 'social' ? 'bg-blue-100 text-blue-600' :
                            notif.type === 'achievement' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}
                        >
                          {notif.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className={`text-base font-semibold text-gray-900 leading-tight ${
                              notif.unread ? 'font-bold' : ''
                            }`}>
                              {notif.title}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notif.id)
                              }}
                              className="opacity-0 hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 -mt-1 -mr-1"
                            >
                              <X size={16} strokeWidth={2} />
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-600 leading-relaxed mb-3">
                            {notif.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-medium">
                              {notif.time}
                            </span>
                            
                            {notif.action && (
                              <button className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                {notif.action.label} →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Bell size={32} className="text-gray-400" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    All caught up!
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    No new notifications. Check back later for updates.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
              <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2">
                <Settings size={16} strokeWidth={2} />
                Settings
              </button>
              <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2">
                <Archive size={16} strokeWidth={2} />
                Archive
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationsOverlay

