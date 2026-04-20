import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, 
  Settings, 
  X,
  BellOff,
  Sparkles,
  Flame,
  Zap,
  Bell
} from 'lucide-react'

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'It only takes two minutes 🔥',
    description: 'Keep your streak going by tuning in for a quick study session. Turn that 5 days streak into 6 days!',
    time: '6 hours ago',
    unread: true,
    type: 'streak',
    icon: <Flame size={24} strokeWidth={2.5} fill="currentColor" />
  },
  {
    id: 2,
    title: 'New AI Summary Ready ✨',
    description: 'Your notes for "Modern Physics" have been summarized and are ready for review in your workstation.',
    time: 'Yesterday',
    unread: true,
    type: 'ai',
    icon: <Sparkles size={24} strokeWidth={2.5} fill="currentColor" />
  },
  {
    id: 3,
    title: 'Weekly Pulse Update ✅',
    description: 'You earned 1,250 XP this week! You are in the top 5% of scholars at your university.',
    time: '2 days ago',
    unread: false,
    type: 'stats',
    icon: <Zap size={24} strokeWidth={2.5} fill="currentColor" />
  }
]

const containerVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 15 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 400,
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.98, 
    y: 15,
    transition: { duration: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 }
}

const NotificationsOverlay = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle Studio Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-[4px] z-[3000]"
          />

          {/* Premium Notification Center */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              boxShadow: '0 40px 100px -20px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
            }}
            className="fixed top-12 right-12 w-[520px] bg-white rounded-[48px] z-[3001] flex flex-col border border-white max-h-[calc(100vh-100px)]"
          >
            {/* Glossy Header Highlight */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-slate-50/60 to-transparent pointer-events-none rounded-t-[48px]" />
            <div className="notifications-glow" />

            <div className="relative z-10 flex flex-col h-full overflow-hidden">
              {/* Header Section - Spaced & Bold */}
              <div className="px-10 pt-10 pb-8 flex justify-between items-center bg-white/40 backdrop-blur-[20px] rounded-t-[48px]">
                <div>
                  <h2 className="text-[32px] font-[900] text-slate-900 tracking-[-0.04em] leading-tight">Notifications</h2>
                  <p className="text-[14px] font-[700] text-slate-400 uppercase tracking-[0.08em] mt-1">
                    {notifications.filter(n => n.unread).length} Unread Updates
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.05, background: '#F4F4FF' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={markAllRead}
                    title="Mark all as read"
                    className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all border border-slate-100"
                  >
                    <Check size={24} strokeWidth={2.5} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, background: '#F4F4FF' }}
                    whileTap={{ scale: 0.95 }}
                    title="Settings"
                    className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
                  >
                    <Settings size={24} strokeWidth={2.5} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, background: '#FEF2F2' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-100"
                  >
                    <X size={24} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>

              {/* Scrollable Notification Stream */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pb-10 pt-2">
                <AnimatePresence mode="popLayout">
                  {notifications.length > 0 ? (
                    <div className="flex flex-col gap-10">
                      {notifications.map((notif) => (
                        <motion.div 
                          key={notif.id} 
                          variants={itemVariants}
                          layout
                          className="relative flex items-start gap-7 pr-2 group"
                        >
                          {/* Indicator Dot */}
                          {notif.unread && (
                            <motion.div 
                              layoutId={`unread-p-${notif.id}`}
                              className="absolute left-[-18px] top-[32px] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.7)] z-20" 
                            />
                          )}

                          {/* Dynamic Icon Wrapper */}
                          <div 
                            style={{ 
                              background: notif.type === 'streak' ? '#FEF2E2' : notif.type === 'ai' ? '#F5F3FF' : '#F0F9FF',
                              color: notif.type === 'streak' ? '#EA580C' : notif.type === 'ai' ? '#7C3AED' : '#0284C7'
                            }}
                            className="w-[72px] h-[72px] rounded-[24px] flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-[4deg] group-hover:shadow-md"
                          >
                            {notif.icon}
                          </div>

                          {/* Message Content */}
                          <div className="flex-1 min-w-0 pt-1">
                            <h4 className="text-[19px] font-[800] text-slate-900 leading-[1.2] mb-1.5 tracking-tight group-hover:text-indigo-600 transition-colors">
                              {notif.title}
                            </h4>
                            <p className="text-[15px] font-[500] text-slate-500 leading-relaxed mb-3">
                              {notif.description}
                            </p>
                            <div className="flex items-center gap-4">
                              <span className="text-[13px] font-[800] text-slate-300 uppercase tracking-widest">
                                {notif.time}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-slate-200" />
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                className="opacity-0 group-hover:opacity-100 text-[13px] font-[800] text-red-400 hover:text-red-600 transition-all uppercase tracking-widest"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="py-24 flex flex-col items-center justify-center text-center px-6"
                    >
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100 text-slate-200">
                        <Bell size={48} strokeWidth={1} />
                      </div>
                      <h3 className="text-[20px] font-bold text-slate-900 mb-3 tracking-tight">Clear Skies</h3>
                      <p className="text-slate-400 text-[15px] leading-relaxed max-w-[280px]">
                        No new updates identified. Your study studio is currently up to date.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sophisticated Footer Gradient */}
              <div className="h-10 bg-gradient-to-t from-white to-transparent shrink-0" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationsOverlay

