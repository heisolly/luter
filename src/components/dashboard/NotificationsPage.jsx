import { useState } from 'react'
import { Bell, Check, Trash2, Clock, AlertCircle } from 'lucide-react'

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'New Quiz material available',
    description: 'CSC121: Introduction to Computing has new quiz content ready for you.',
    time: '2 hours ago',
    type: 'system',
    unread: true
  },
  {
    id: 2,
    title: 'Battle Challenge',
    description: 'Michae Oluwayan has challenged you to a Battle in Data Structures.',
    time: '5 hours ago',
    type: 'battle',
    unread: true
  },
  {
    id: 3,
    title: 'Note Request Fulfilled',
    description: 'Your request for "Machine Learning Midterm Prep" has been fulfilled by an admin.',
    time: '1 day ago',
    type: 'request',
    unread: false
  }
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...prev, unread: false })))
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="dh-root">
      <div className="dh-topbar">
        <div className="dh-topbar-left">
          <h1>Notifications</h1>
          <p>Stay updated with your study progress and community activities</p>
        </div>
        <div className="dh-topbar-right">
          <button 
            onClick={markAllRead}
            className="dh-upload-btn" 
            style={{ background: 'white', color: '#111', border: '1px solid #e1e1e1', boxShadow: 'none' }}
          >
            <Check size={16} /> Mark all as read
          </button>
        </div>
      </div>

      <div className="notifications-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px' }}>
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className="notification-item"
              style={{
                display: 'flex',
                gap: '16px',
                padding: '20px',
                background: 'white',
                borderRadius: '16px',
                border: `1.5px solid ${notif.unread ? 'var(--primary-bg)' : '#f0f0f0'}`,
                position: 'relative',
                transition: 'all 0.2s',
                boxShadow: notif.unread ? '0 4px 12px rgba(122, 18, 204, 0.05)' : 'none'
              }}
            >
              <div 
                className="notif-icon-wrap"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: notif.unread ? 'var(--primary-bg)' : '#f8f8f8',
                  color: notif.unread ? 'var(--primary)' : '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Bell size={20} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>{notif.title}</h3>
                  <span style={{ fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {notif.time}
                  </span>
                </div>
                <p style={{ fontSize: '13.5px', color: '#555', lineHeight: '1.5' }}>{notif.description}</p>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                   {notif.unread && (
                     <button style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', background: 'none', padding: 0 }}>
                       Mark as read
                     </button>
                   )}
                   <button 
                    onClick={() => deleteNotification(notif.id)}
                    style={{ fontSize: '12px', fontWeight: '600', color: '#ef4444', background: 'none', padding: 0 }}
                   >
                     Delete
                   </button>
                </div>
              </div>

              {notif.unread && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--primary)'
                  }}
                />
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Bell size={32} color="#ccc" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111' }}>No notifications</h2>
            <p style={{ color: '#666', marginTop: '4px' }}>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  )
}
