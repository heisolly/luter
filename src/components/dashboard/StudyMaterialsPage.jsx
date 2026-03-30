import React, { useState, useEffect } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { BookOpen, FileText, Video, UploadCloud } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { fetchCourseMaterials } from '../../services/materialsService'

export default function StudyMaterialsPage() {
  const { courseId } = useParams()
  const { user } = useOutletContext()
  const [materialsByWeek, setMaterialsByWeek] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (courseId && user?.id) {
      loadMaterials()
    }
  }, [courseId, user?.id])

  async function loadMaterials() {
    setLoading(true)
    try {
      const mats = await fetchCourseMaterials(courseId, user.id)
      const grouped = mats.reduce((acc, m) => {
        const week = getWeekNumber(new Date(m.created_at))
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

  const ICONS = {
    pdf: <FileText />,
    note: <BookOpen />,
    youtube: <Video />
  }

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'Varela Round', fontSize: '32px' }}>Study Materials</h1>
        <button style={{ background: '#7a12cc', color: 'white', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UploadCloud size={20} />
          Upload Material
        </button>
      </div>

      {loading ? (
        <p>Loading materials...</p>
      ) : Object.keys(materialsByWeek).length === 0 ? (
        <p>No materials uploaded yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {Object.entries(materialsByWeek).sort(([a], [b]) => b - a).map(([week, materials]) => (
            <div key={week}>
              <h2 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '14px', color: '#94a3b8', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '24px' }}>Week {week}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {materials.map(m => (
                  <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ color: '#7a12cc' }}>{ICONS[m.type] || <FileText />}</div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 700 }}>{m.title}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>{new Date(m.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
