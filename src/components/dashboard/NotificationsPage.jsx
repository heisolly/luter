import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// This page is now deprecated in favor of the NotificationsOverlay.
// It redirects users back to the dashboard if they land here manually.
export default function NotificationsPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/dashboard', { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
