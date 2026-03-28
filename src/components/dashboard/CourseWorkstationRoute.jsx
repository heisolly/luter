import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import CourseWorkstation from './CourseWorkstation'

const PALETTE = ['#7a12cc', '#9718fb', '#b04dfc', '#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#6366f1']

function colorForId(id) {
  if (!id) return PALETTE[0]
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 997
  return PALETTE[Math.abs(h) % PALETTE.length]
}

export default function CourseWorkstationRoute() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!user || !courseId) {
      setLoading(false)
      return
    }
    if (!ready) return

    const applyRow = (fallback) => {
      const c = fallback.course
      setCourse({
        id: c.id,
        code: c.code,
        name: c.name,
        faculty: c.faculty,
        lecturer: 'Assigned Lecturer',
        progress: fallback.progress ?? 0,
        color: colorForId(c.id),
      })
      setMissing(false)
      setLoading(false)
    }

    if (bundle?.uc?.data && Array.isArray(bundle.uc.data) && !bundle.uc.error) {
      const fallback = bundle.uc.data.find((r) => r.course?.id === courseId)
      if (fallback?.course) {
        applyRow(fallback)
        return
      }
    }

    const load = async () => {
      setMissing(false)
      const { data: row, error } = await supabase
        .from('user_courses')
        .select('id, progress, course:courses(id, code, name, faculty)')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()

      if (error || !row?.course) {
        const { data: rows } = await supabase
          .from('user_courses')
          .select('id, progress, course:courses(id, code, name, faculty)')
          .eq('user_id', user.id)

        const fallback = rows?.find((r) => r.course?.id === courseId)
        if (!fallback?.course) {
          setMissing(true)
          setLoading(false)
          return
        }
        applyRow(fallback)
        return
      }

      applyRow(row)
    }

    load()
  }, [user, courseId, ready, bundle])

  if (!user) return null

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: '#fafafa' }}>
        <Loader2 size={28} className="animate-spin" color="var(--primary)" />
      </div>
    )
  }

  if (missing || !course) {
    return <Navigate to="/dashboard/courses" replace />
  }

  return (
    <CourseWorkstation
      course={course}
      user={user}
      onBack={() => navigate('/dashboard/courses')}
    />
  )
}
