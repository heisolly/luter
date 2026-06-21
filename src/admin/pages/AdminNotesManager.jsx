import React, { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { 
  Books, Calendar, CloudArrowUp, Users, ChatCircleDots, 
  ChartLineUp, Clock, CheckCircle, Warning, 
  Plus, MagnifyingGlass, Funnel, DownloadSimple, ArrowsClockwise,
  Brain, Lightning, Target, Medal, ChartBar,
  FileText, VideoCamera, Headphones, Image, File,
  CaretRight, CaretDown, Eye, PencilSimple, Trash,
  PaperPlaneTilt, Bell, GearSix, Stack, SquaresFour,
  CircleNotch, DotsThree, X
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

// Luter purple theme palette
const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

export default function AdminNotesManager() {
  const { user } = useOutletContext()
  const [activeView, setActiveView] = useState('overview')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [courses, setCourses] = useState([])
  const [semesterWeeks, setSemesterWeeks] = useState([])
  const [materials, setMaterials] = useState([])
  const [requests, setRequests] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [courseSearch, setCourseSearch] = useState('')
  const [materialSearch, setMaterialSearch] = useState('')

  const filteredCoursesDropdown = useMemo(() => {
    return courses.filter(c => 
      c.code?.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.name?.toLowerCase().includes(courseSearch.toLowerCase())
    )
  }, [courses, courseSearch])

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const term = searchTerm.toLowerCase().trim()
      const matchSearch = !term || (
        r.subject?.toLowerCase().includes(term) ||
        r.topic?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        String(r.week_number).includes(term)
      )
      
      const matchStatus = filterStatus === 'all' || r.status === filterStatus
      const matchCourse = selectedCourse ? r.course_id === selectedCourse : true
      
      return matchSearch && matchStatus && matchCourse
    })
  }, [requests, searchTerm, filterStatus, selectedCourse])

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const term = materialSearch.toLowerCase().trim()
      const matchSearch = !term || (
        m.name?.toLowerCase().includes(term) ||
        String(m.week_number).includes(term)
      )
      const matchCourse = selectedCourse ? m.course_id === selectedCourse : true
      return matchSearch && matchCourse
    })
  }, [materials, materialSearch, selectedCourse])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [coursesRes, weeksRes, materialsRes, requestsRes] = await Promise.all([
        supabase.from('courses').select('*').order('code'),
        supabase.from('semester_weeks').select('*').order('course_id, week_number'),
        supabase.from('materials_with_context').select('*').order('created_at', { ascending: false }),
        supabase.from('notes_requests').select('*').order('created_at', { ascending: false })
      ])

      setCourses(coursesRes.data || [])
      setSemesterWeeks(weeksRes.data || [])
      setMaterials(materialsRes.data || [])
      setRequests(requestsRes.data || [])

      if (coursesRes.data?.length > 0) {
        setSelectedCourse(coursesRes.data[0].id)
        await loadCourseStats(coursesRes.data[0].id)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCourseStats = async (courseId) => {
    try {
      const { data } = await supabase.rpc('get_course_statistics', { course_uuid: courseId })
      setStats(data || {})
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const StatCard = ({ icon: Icon, title, value, color, trend, subtitle }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      style={{
        background: 'white',
        border: `1.5px solid ${color}20`,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={24} color={color} />
        </div>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Outfit' }}>
          {title}
        </div>
      </div>
      
      <div style={{ fontSize: '32px', fontWeight: 800, color: '#1A102D', marginBottom: '4px', fontFamily: 'Outfit' }}>
        {value}
      </div>
      
      {subtitle && (
        <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'Outfit' }}>
          {subtitle}
        </div>
      )}
      
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
          <ChartLineUp size={16} color={trend > 0 ? PALETTE[1] : '#ef4444'} />
          <span style={{ fontSize: '12px', color: trend > 0 ? PALETTE[1] : '#ef4444', fontWeight: 600, fontFamily: 'Outfit' }}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
      )}
    </motion.div>
  )

  const WeekCard = ({ week, materials, onEdit, onPublish }) => {
    const weekMaterials = materials.filter(m => 
      (m.week_number || (m.metadata?.week_number)) === week.week_number
    )
    
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        style={{
          background: week.is_published ? 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)' : '#ffffff',
          border: `2px solid ${week.is_published ? PALETTE[0] : '#e2e8f0'}`,
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          cursor: 'pointer'
        }}
        onClick={() => setSelectedWeek(week)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: PALETTE[0], fontFamily: 'Outfit' }}>
              {week.title}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b', fontFamily: 'Outfit' }}>
              {week.description}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {week.is_published && (
              <div style={{
                background: PALETTE[0],
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                fontFamily: 'Outfit'
              }}>
                Published
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} color={PALETTE[0]} />
            <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Outfit' }}>
              {weekMaterials.length} materials
            </span>
          </div>
          {week.learning_objectives && week.learning_objectives.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={16} color={PALETTE[2]} />
              <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Outfit' }}>
                {week.learning_objectives.length} objectives
              </span>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(week)
            }}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: PALETTE[0],
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Outfit'
            }}
          >
            Edit Week
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPublish(week)
            }}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: week.is_published ? '#64748b' : PALETTE[1],
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Outfit'
            }}
          >
            {week.is_published ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </motion.div>
    )
  }

  const RequestCard = ({ request }) => {
    const statusColors = {
      pending: PALETTE[2],
      in_progress: '#3b82f6',
      completed: PALETTE[1],
      rejected: '#ef4444'
    }

    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        style={{
          background: '#ffffff',
          border: `2px solid ${statusColors[request.status]}20`,
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A102D', fontFamily: 'Outfit' }}>
              {request.subject}
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b', fontFamily: 'Outfit' }}>
              Week {request.week_number} • {request.topic}
            </p>
          </div>
          <div style={{
            background: statusColors[request.status],
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontFamily: 'Outfit'
          }}>
            {request.status.replace('_', ' ')}
          </div>
        </div>
        
        {request.description && (
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569', lineHeight: '1.4', fontFamily: 'Outfit' }}>
            {request.description}
          </p>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} color="#64748b" />
            <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'Outfit' }}>
              {new Date(request.created_at).toLocaleDateString()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{
              padding: '4px 8px',
              background: PALETTE[0],
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Outfit'
            }}>
              View Details
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircleNotch className="animate-spin" size={32} color={PALETTE[0]} />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', background: '#fafbfc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#1A102D', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Outfit' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${PALETTE[0]} 0%, ${PALETTE[1]} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Books size={24} color="white" />
              </div>
              Notes Manager
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '16px', color: '#64748b', fontFamily: 'Outfit' }}>
              Manage semester notes, materials, and student requests
            </p>
          </div>
          <button style={{
            padding: '12px 24px',
            background: `linear-gradient(135deg, ${PALETTE[0]} 0%, ${PALETTE[1]} 100%)`,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: `0 4px 20px ${PALETTE[0]}30`,
            fontFamily: 'Outfit'
          }}>
            <Plus size={20} />
            Upload Notes
          </button>
        </div>

        {/* Course Selector */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <MagnifyingGlass size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Filter course select..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              style={{
                padding: '8px 12px 8px 32px',
                border: `2px solid ${PALETTE[0]}20`,
                borderRadius: '8px',
                fontSize: '13px',
                background: 'white',
                width: '180px',
                fontFamily: 'Outfit',
                height: '42px'
              }}
            />
          </div>
          <select
            value={selectedCourse || ''}
            onChange={(e) => {
              setSelectedCourse(e.target.value)
              loadCourseStats(e.target.value)
            }}
            style={{
              padding: '0 16px',
              border: `2px solid ${PALETTE[0]}30`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              background: 'white',
              minWidth: '200px',
              fontFamily: 'Outfit',
              height: '42px'
            }}
          >
            {filteredCoursesDropdown.map(course => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
            {filteredCoursesDropdown.length === 0 && (
              <option disabled>No courses match filter</option>
            )}
          </select>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {['overview', 'weeks', 'materials', 'requests'].map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                style={{
                  padding: '8px 16px',
                  background: activeView === view ? PALETTE[0] : 'white',
                  color: activeView === view ? 'white' : PALETTE[0],
                  border: `2px solid ${PALETTE[0]}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontFamily: 'Outfit'
                }}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <StatCard
              icon={Books}
              title="Total Materials"
              value={stats.total_materials || 0}
              color={PALETTE[0]}
              subtitle="Across all weeks"
            />
            <StatCard
              icon={Users}
              title="Enrolled Students"
              value={stats.enrolled_students || 0}
              color={PALETTE[1]}
              subtitle="Active learners"
            />
            <StatCard
              icon={Calendar}
              title="Published Weeks"
              value={`${stats.published_weeks || 0}/16`}
              color={PALETTE[2]}
              subtitle="Semester progress"
            />
            <StatCard
              icon={ChatCircleDots}
              title="Pending Requests"
              value={stats.pending_requests || 0}
              color={PALETTE[3]}
              subtitle="Need attention"
            />
          </div>

          {/* Recent Activity */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 800, color: '#1A102D', fontFamily: 'Outfit' }}>
              Recent Activity
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {requests.slice(0, 4).map(request => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weeks View */}
      {activeView === 'weeks' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {semesterWeeks
              .filter(week => selectedCourse ? week.course_id === selectedCourse : true)
              .map(week => (
                <WeekCard
                  key={week.id}
                  week={week}
                  materials={materials}
                  onEdit={(week) => console.log('Edit week:', week)}
                  onPublish={(week) => console.log('Publish week:', week)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Materials View */}
      {activeView === 'materials' && (
        <div>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1A102D', fontFamily: 'Outfit' }}>
                Course Materials ({filteredMaterials.length} total)
              </h3>
              
              <div style={{ position: 'relative' }}>
                <MagnifyingGlass size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 32px',
                    border: `2px solid ${PALETTE[0]}30`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    width: '240px',
                    fontFamily: 'Outfit'
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontFamily: 'Outfit' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Week</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Added</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: 500 }}>{m.name}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>Week {m.week_number || m.metadata?.week_number || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {m.url && (
                          <a 
                            href={m.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ 
                              color: PALETTE[0], 
                              textDecoration: 'none', 
                              fontWeight: 600,
                              fontSize: '13px'
                            }}
                          >
                            Open Link
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredMaterials.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No study materials found for this course matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Requests View */}
      {activeView === 'requests' && (
        <div>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1A102D', fontFamily: 'Outfit' }}>
                Student Notes Requests ({filteredRequests.length} matching)
              </h3>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <MagnifyingGlass size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '8px 12px 8px 32px',
                      border: `2px solid ${PALETTE[0]}30`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      width: '200px',
                      fontFamily: 'Outfit'
                    }}
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `2px solid ${PALETTE[0]}30`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: 'Outfit'
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
              {filteredRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))}
              {filteredRequests.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#64748b', fontFamily: 'Outfit' }}>
                  No note requests match your query.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
