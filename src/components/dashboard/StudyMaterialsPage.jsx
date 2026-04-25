import React, { useState, useEffect } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { RiBookOpenFill as BookOpen, RiFileTextFill as FileText, RiVideoFill as Video, RiUploadCloudFill as UploadCloud, RiArrowRightSLine as ChevronRight, RiFolderFill as Folder, RiTimeFill as Clock, RiLoader4Line as Loader2 } from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { fetchCourseMaterials } from '../../services/materialsService'
import LuterLogo from '../shared/LuterLogo'

export default function StudyMaterialsPage() {
  const { courseId } = useParams()
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const [materialsByWeek, setMaterialsByWeek] = useState({})
  const [loading, setLoading] = useState(true)
  const [courseName, setCourseName] = useState('Course Materials')

  useEffect(() => {
    if (courseId && user?.id) {
      loadMaterials()
      fetchCourseName()
    }
  }, [courseId, user?.id])

  async function fetchCourseName() {
    const { data } = await supabase.from('courses').select('name, code').eq('id', courseId).single()
    if (data) setCourseName(`${data.code} - ${data.name}`)
  }

  async function loadMaterials() {
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
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Outfit' }}>
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
  )
}
