import React, { useState, useEffect } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { 
  BookOpen, Calendar, Download, MessageSquare, 
  Clock, TrendingUp, Award, Brain, Zap,
  FileText, Video, Headphones, Image, File,
  ChevronLeft, ChevronRight, Plus, Search,
  Filter, Bell, Send, Star, Users, Target,
  Layers, Grid3x3, List, ArrowUpRight,
  AlertCircle, CheckCircle, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Luter purple theme palette
const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

export default function SemesterNotesPage() {
  const { courseId } = useParams()
  const { user, isMobile } = useOutletContext()
  const navigate = useNavigate()
  
  const [activeView, setActiveView] = useState('weeks')
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [course, setCourse] = useState(null)
  const [semesterWeeks, setSemesterWeeks] = useState([])
  const [materials, setMaterials] = useState([])
  const [userRequests, setUserRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  // Request form state
  const [requestForm, setRequestForm] = useState({
    week_number: 1,
    subject: '',
    topic: '',
    urgency: 'normal',
    description: ''
  })

  useEffect(() => {
    if (courseId && user?.id) {
      loadData()
    }
  }, [courseId, user?.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [courseRes, weeksRes, materialsRes, requestsRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).single(),
        supabase.from('semester_weeks').select('*').eq('course_id', courseId).order('week_number'),
        supabase.from('materials_with_context').select('*').eq('course_id', courseId).order('created_at', { ascending: false }),
        supabase.from('notes_requests').select('*').eq('user_id', user.id).eq('course_id', courseId).order('created_at', { ascending: false })
      ])

      setCourse(courseRes.data)
      setSemesterWeeks(weeksRes.data || [])
      setMaterials(materialsRes.data || [])
      setUserRequests(requestsRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitRequest = async () => {
    if (!requestForm.subject.trim()) return

    try {
      const { error } = await supabase.from('notes_requests').insert({
        user_id: user.id,
        course_id: courseId,
        ...requestForm,
        week_number: parseInt(requestForm.week_number)
      })

      if (error) throw error

      setShowRequestModal(false)
      setRequestForm({
        week_number: 1,
        subject: '',
        topic: '',
        urgency: 'normal',
        description: ''
      })
      loadData()
    } catch (error) {
      console.error('Failed to submit request:', error)
    }
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return FileText
      case 'video': return Video
      case 'audio': return Headphones
      case 'image': return Image
      default: return File
    }
  }

  const WeekCard = ({ week }) => {
    const weekMaterials = materials.filter(m => 
      (m.week_number || (m.metadata?.week_number)) === week.week_number
    )
    const hasAdminMaterials = weekMaterials.some(m => m.owner_role === 'admin')
    const isAccessible = week.is_published && hasAdminMaterials

    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: isAccessible 
            ? 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)' 
            : 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
          border: `2px solid ${isAccessible ? PALETTE[0] : '#e9ecef'}`,
          borderRadius: '20px',
          padding: '24px',
          boxShadow: isAccessible 
            ? `0 8px 32px ${PALETTE[0]}20` 
            : '0 4px 20px rgba(0,0,0,0.06)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '180px'
        }}
        onClick={() => isAccessible && setSelectedWeek(week)}
      >
        {/* Background decoration */}
        {isAccessible && (
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `${PALETTE[0]}20`
          }} />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: 800, 
                color: isAccessible ? PALETTE[0] : '#6c757d', 
                fontFamily: 'Outfit' 
              }}>
                {week.title}
              </h3>
              <p style={{ 
                margin: '4px 0 0', 
                fontSize: '14px', 
                color: isAccessible ? '#495057' : '#adb5bd', 
                fontFamily: 'Varela Round' 
              }}>
                {week.description}
              </p>
            </div>
            
            {isAccessible ? (
              <div style={{
                background: PALETTE[0],
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'Varela Round'
              }}>
                <CheckCircle size={12} />
                Available
              </div>
            ) : (
              <div style={{
                background: PALETTE[2],
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'Varela Round'
              }}>
                <AlertCircle size={12} />
                Coming Soon
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} color={isAccessible ? PALETTE[0] : '#adb5bd'} />
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                fontFamily: 'Varela Round', 
                color: isAccessible ? PALETTE[0] : '#adb5bd' 
              }}>
                {weekMaterials.length} materials
              </span>
            </div>
            
            {week.learning_objectives && week.learning_objectives.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={16} color={isAccessible ? PALETTE[2] : '#adb5bd'} />
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  fontFamily: 'Varela Round', 
                  color: isAccessible ? PALETTE[2] : '#adb5bd' 
                }}>
                  {week.learning_objectives.length} objectives
                </span>
              </div>
            )}
          </div>

          {isAccessible ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedWeek(week)
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: `linear-gradient(135deg, ${PALETTE[0]} 0%, ${PALETTE[1]} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'Varela Round'
              }}
            >
              Open Week
              <ArrowUpRight size={16} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowRequestModal(true)
                setRequestForm(prev => ({ ...prev, week_number: week.week_number }))
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: `linear-gradient(135deg, ${PALETTE[2]} 0%, ${PALETTE[3]} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'Varela Round'
              }}
            >
              Request Notes
              <Send size={16} />
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  const MaterialCard = ({ material }) => {
    const Icon = getFileIcon(material.type)
    const isAdmin = material.owner_role === 'admin'
    
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        style={{
          background: isAdmin 
            ? 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)' 
            : '#ffffff',
          border: `2px solid ${isAdmin ? PALETTE[0] : '#e9ecef'}`,
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          cursor: 'pointer'
        }}
        onClick={() => window.open(material.source_url, '_blank')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isAdmin ? `${PALETTE[0]}20` : '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={20} color={isAdmin ? PALETTE[0] : '#6c757d'} />
            </div>
            <div>
              <h4 style={{ 
                margin: 0, 
                fontSize: '15px', 
                fontWeight: 700, 
                color: '#1A102D',
                fontFamily: 'Outfit'
              }}>
                {material.title}
              </h4>
              <p style={{ 
                margin: '2px 0 0', 
                fontSize: '12px', 
                color: '#6c757d',
                fontFamily: 'Varela Round'
              }}>
                {material.type.toUpperCase()} • {new Date(material.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div style={{
            background: isAdmin ? PALETTE[0] : PALETTE[2],
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontFamily: 'Varela Round'
          }}>
            {isAdmin ? 'Lutes' : 'My Upload'}
          </div>
        </div>
        
        <button style={{
          width: '100%',
          padding: '8px',
          background: isAdmin ? PALETTE[0] : PALETTE[1],
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontFamily: 'Varela Round'
        }}>
          <Download size={14} />
          Download
        </button>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Loader2 className="animate-spin" size={32} color={PALETTE[0]} />
      </div>
    )
  }

  if (selectedWeek) {
    const weekMaterials = materials.filter(m => 
      (m.week_number || (m.metadata?.week_number)) === selectedWeek.week_number
    )

    return (
      <div style={{ padding: '24px', background: '#fafbfc', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={() => setSelectedWeek(null)}
            style={{
              padding: '8px 16px',
              background: 'white',
              border: `2px solid ${PALETTE[0]}`,
              borderRadius: '8px',
              color: PALETTE[0],
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'Varela Round'
            }}
          >
            <ChevronLeft size={16} />
            Back to Weeks
          </button>
          
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: 800, 
              color: PALETTE[0],
              fontFamily: 'Varela Round'
            }}>
              {selectedWeek.title}
            </h2>
            <p style={{ 
              margin: '4px 0 0', 
              fontSize: '14px', 
              color: '#6c757d',
              fontFamily: 'Varela Round'
            }}>
              {selectedWeek.description}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {weekMaterials.map(material => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>

        {weekMaterials.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            background: 'white',
            borderRadius: '16px',
            border: `2px dashed ${PALETTE[0]}30`
          }}>
            <BookOpen size={48} color={PALETTE[0]} style={{ marginBottom: '16px' }} />
            <h3 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#1A102D',
              fontFamily: 'Outfit'
            }}>
              No materials yet
            </h3>
            <p style={{ 
              margin: '8px 0 0', 
              fontSize: '14px', 
              color: '#6c757d', 
              textAlign: 'center',
              fontFamily: 'Varela Round'
            }}>
              Materials for this week will be available soon.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', background: '#fafbfc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '32px', 
              fontWeight: 900, 
              color: '#1A102D', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontFamily: 'Outfit'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${PALETTE[0]} 0%, ${PALETTE[1]} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen size={24} color="white" />
              </div>
              Semester Notes
            </h1>
            <p style={{ 
              margin: '8px 0 0', 
              fontSize: '16px', 
              color: '#6c757d',
              fontFamily: 'Varela Round'
            }}>
              {course?.code} - {course?.name}
            </p>
          </div>
          
          <button
            onClick={() => setShowRequestModal(true)}
            style={{
              padding: '12px 24px',
              background: `linear-gradient(135deg, ${PALETTE[2]} 0%, ${PALETTE[3]} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: `0 4px 20px ${PALETTE[2]}30`,
              fontFamily: 'Varela Round'
            }}
          >
            <Send size={20} />
            Request Notes
          </button>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['weeks', 'materials', 'requests'].map(view => (
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
                fontFamily: 'Varela Round'
              }}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Weeks View */}
      {activeView === 'weeks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {semesterWeeks.map(week => (
            <WeekCard key={week.id} week={week} />
          ))}
        </div>
      )}

      {/* Materials View */}
      {activeView === 'materials' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {materials.map(material => (
            <MaterialCard key={material.id} material={material} />
          ))}
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
            <h3 style={{ 
              margin: '0 0 20px', 
              fontSize: '20px', 
              fontWeight: 800, 
              color: '#1A102D',
              fontFamily: 'Outfit'
            }}>
              My Notes Requests
            </h3>
            {userRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <MessageSquare size={48} color={PALETTE[0]} style={{ margin: '0 auto 16px' }} />
                <p style={{ 
                  fontSize: '16px', 
                  color: '#6c757d',
                  fontFamily: 'Varela Round'
                }}>No requests yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {userRequests.map(request => (
                  <div key={request.id} style={{
                    background: '#f8f9fa',
                    border: `2px solid ${PALETTE[0]}20`,
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '16px', 
                        fontWeight: 700, 
                        color: '#1A102D',
                        fontFamily: 'Outfit'
                      }}>
                        {request.subject}
                      </h4>
                      <div style={{
                        background: request.status === 'completed' ? PALETTE[1] : PALETTE[2],
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontFamily: 'Varela Round'
                      }}>
                        {request.status}
                      </div>
                    </div>
                    <p style={{ 
                      margin: '0', 
                      fontSize: '14px', 
                      color: '#6c757d',
                      fontFamily: 'Varela Round'
                    }}>
                      Week {request.week_number} • {request.topic}
                    </p>
                    {request.description && (
                      <p style={{ 
                        margin: '8px 0 0', 
                        fontSize: '13px', 
                        color: '#495057',
                        fontFamily: 'Varela Round'
                      }}>
                        {request.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000
            }}
            onClick={() => setShowRequestModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '32px',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
            >
              <h3 style={{ 
                margin: '0 0 24px', 
                fontSize: '20px', 
                fontWeight: 800, 
                color: '#1A102D',
                fontFamily: 'Outfit'
              }}>
                Request Notes
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6c757d', marginBottom: '6px', fontFamily: 'Varela Round' }}>
                    Week
                  </label>
                  <select
                    value={requestForm.week_number}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, week_number: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${PALETTE[0]}30`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'Varela Round'
                    }}
                  >
                    {semesterWeeks.map(week => (
                      <option key={week.id} value={week.week_number}>
                        {week.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6c757d', marginBottom: '6px', fontFamily: 'Varela Round' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={requestForm.subject}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Calculus, Physics, Chemistry"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${PALETTE[0]}30`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'Varela Round'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6c757d', marginBottom: '6px', fontFamily: 'Varela Round' }}>
                    Topic
                  </label>
                  <input
                    type="text"
                    value={requestForm.topic}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="Specific topic or concept"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${PALETTE[0]}30`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'Varela Round'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6c757d', marginBottom: '6px', fontFamily: 'Varela Round' }}>
                    Urgency
                  </label>
                  <select
                    value={requestForm.urgency}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, urgency: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${PALETTE[0]}30`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'Varela Round'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6c757d', marginBottom: '6px', fontFamily: 'Varela Round' }}>
                    Description
                  </label>
                  <textarea
                    value={requestForm.description}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details about your request..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${PALETTE[0]}30`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      resize: 'vertical',
                      fontFamily: 'Varela Round'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowRequestModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f8f9fa',
                    color: PALETTE[0],
                    border: `2px solid ${PALETTE[0]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Varela Round'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitRequest}
                  disabled={!requestForm.subject.trim()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: requestForm.subject.trim() 
                      ? `linear-gradient(135deg, ${PALETTE[0]} 0%, ${PALETTE[1]} 100%)`
                      : '#e9ecef',
                    color: requestForm.subject.trim() ? 'white' : '#6c757d',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: requestForm.subject.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'Varela Round'
                  }}
                >
                  Submit Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
