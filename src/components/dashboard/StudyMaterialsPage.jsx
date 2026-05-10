import React, { useState, useEffect } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { RiBookOpenFill as BookOpen, RiFileTextFill as FileText, RiVideoFill as Video, RiUploadCloudFill as UploadCloud, RiArrowRightSLine as ChevronRight, RiFolderFill as Folder, RiTimeFill as Clock, RiLoader4Line as Loader2, RiHome4Fill as Home, RiBookFill as Book, RiUserFill as User, RiNotification3Fill as Notification, RiSettings4Fill as Settings, RiLogoutBoxLine as SignOut } from 'react-icons/ri'
import { motion } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { fetchCourseMaterials } from '../../services/materialsService'
import { preloadingService } from '../../services/preloadingService'
import LuterLogo from '../shared/LuterLogo'

// Cache for materials data to prevent reloading
const materialsCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Export function to clear cache (called after upload)
export function clearMaterialsCache(courseId) {
  if (courseId) {
    // Clear specific course cache
    const keysToDelete = []
    materialsCache.forEach((value, key) => {
      if (key.startsWith(`${courseId}-`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => materialsCache.delete(key))
  } else {
    // Clear all cache
    materialsCache.clear()
  }
}

export default function StudyMaterialsPage() {
  const { courseId } = useParams()
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const [materialsByWeek, setMaterialsByWeek] = useState({})
  const [loading, setLoading] = useState(true)
  const [courseName, setCourseName] = useState('Course Materials')
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    if (courseId && user?.id) {
      // Clear all caches to ensure fresh data after uploads
      clearMaterialsCache(courseId)
      preloadingService.clearCache()
      loadMaterials()
      fetchCourseName()
    }
  }, [courseId, user?.id])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function fetchCourseName() {
    const { data } = await supabase.from('courses').select('name, code').eq('id', courseId).single()
    if (data) setCourseName(`${data.code} - ${data.name}`)
  }

  async function loadMaterials() {
    const cacheKey = `${courseId}-${user.id}`
    const cached = materialsCache.get(cacheKey)
    
    // Return cached data if still valid
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setMaterialsByWeek(cached.data)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const mats = await fetchCourseMaterials(courseId, user.id)
      const grouped = mats.reduce((acc, m) => {
        // Use week field if available, otherwise calculate from created_at
        const week = m.week || getWeekNumber(new Date(m.created_at))
        if (!acc[week]) acc[week] = []
        acc[week].push(m)
        return acc
      }, {})
      
      // Cache the results
      materialsCache.set(cacheKey, {
        data: grouped,
        timestamp: Date.now()
      })
      
      setMaterialsByWeek(grouped)
    } catch (err) {
      console.error('Failed to load materials:', err)
    } finally {
      setLoading(false)
    }
  }

  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7))
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1))
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7)
    return weekNo
  }

  return (
    <div style={{ fontFamily: 'Outfit', position: 'relative', minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Slide-in Sidebar */}
      {!isMobile && (
        <motion.div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 150,
            width: '280px',
            background: 'white',
            borderRight: '1px solid #eef2f7',
            overflow: 'hidden'
          }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: sidebarHovered ? 0 : '-100%', opacity: sidebarHovered ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#7a12cc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuterLogo size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A102D' }}>Luter</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Study Platform</p>
              </div>
            </div>
          </div>
          
          <nav style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: '#64748B',
                  fontSize: '14px',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1A102D'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
              >
                <Home size={20} weight="bold" />
                Dashboard
              </button>
              
              <button
                onClick={() => navigate('/dashboard/sessions')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: '#64748B',
                  fontSize: '14px',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1A102D'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
              >
                <Clock size={20} weight="bold" />
                Sessions
              </button>
              
              <button
                onClick={() => navigate('/dashboard/library')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#7a12cc',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                <Book size={20} weight="bold" />
                Library
              </button>
              
              <button
                onClick={() => navigate('/dashboard/study-groups')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: '#64748B',
                  fontSize: '14px',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1A102D'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
              >
                <User size={20} weight="bold" />
                Study Groups
              </button>
              
              <button
                onClick={() => navigate('/dashboard/notifications')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: '#64748B',
                  fontSize: '14px',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1A102D'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
              >
                <Notification size={20} weight="bold" />
                Notifications
              </button>
            </div>
          </nav>
          
          <div style={{ position: 'absolute', bottom: '24px', left: '16px', right: '16px' }}>
            <button
              onClick={() => navigate('/dashboard/settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#64748B',
                fontSize: '14px',
                fontWeight: 600,
                width: '100%'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1A102D'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
            >
              <Settings size={20} weight="bold" />
              Settings
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div style={{ 
        padding: isMobile ? '20px' : '40px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        marginLeft: isMobile ? 'auto' : (sidebarHovered ? '280px' : '0'),
        transition: 'margin-left 0.3s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a12cc', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              <Folder size={16} /> Study Materials
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1A102D' }}>{courseName}</h1>
          </div>
          <button 
            onClick={() => navigate(`/admin/upload?courseId=${courseId}`)}
            style={{ background: '#7a12cc', color: 'white', padding: '14px 28px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(122, 18, 204, 0.2)' }}
          >
            <UploadCloud size={20} />
            Add Content
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <Loader2 className="animate-spin" color="#7a12cc" size={48} />
          </div>
        ) : Object.keys(materialsByWeek).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px', background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
            <BookOpen size={64} color="#CBD5E0" style={{ marginBottom: '24px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#4A5568' }}>No materials yet</h3>
            <p style={{ color: '#94A3B8' }}>Start by uploading your first study material or assignment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
            {Object.entries(materialsByWeek).sort(([a], [b]) => b - a).map(([week, materials]) => (
              <div 
                key={week} 
                onClick={() => navigate(`/dashboard/courses/${courseId}/materials/${week}`)}
                style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1.5px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = '#7a12cc'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div style={{ background: '#F5F3FF', color: '#7a12cc', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 800 }}>WEEK {week}</div>
                  <ChevronRight size={20} color="#CBD5E0" />
                </div>
                
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A3A32', marginBottom: '16px' }}>Curriculum Topic Name</h3>
                
                <div style={{ display: 'flex', gap: '16px', color: '#718096', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} /> {materials.length} Materials
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} /> Updated {new Date(materials[0].created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
