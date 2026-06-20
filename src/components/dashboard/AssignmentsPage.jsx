import React, { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { RiClipboardFill as ClipboardList, RiCheckboxCircleFill as CheckCircle, RiAddLine as Plus, RiLoader4Line as Loader2, RiCalendarFill as Calendar, RiBookOpenFill as BookOpen, RiExternalLinkFill as ExternalLink } from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { useDeckStore } from '../../store/useDeckStore'
import LuterLogo from '../shared/LuterLogo'

export default function AssignmentsPage() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState([])
  const { addToDeck, activeDeckItems } = useDeckStore()

  useEffect(() => {
    if (user) {
      fetchAssignments()
    }
  }, [user])

  async function fetchAssignments() {
    setLoading(true)
    try {
      // 1. Fetch from assignments table
      const { data: directAssignments } = await supabase
        .from('assignments')
        .select('*, courses(name, code)')
        .eq('user_id', user.id)

      // 2. Fetch from materials table marked as assignments
      const { data: materialAssignments } = await supabase
        .from('materials')
        .select('*, courses(name, code)')
        .eq('type', 'assignment')

      const combined = [
        ...(directAssignments || []).map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          due_date: a.due_date,
          course: a.courses,
          type: 'task',
          status: a.status
        })),
        ...(materialAssignments || []).map(m => ({
          id: m.id,
          title: m.title,
          description: `Course material assignment for ${m.courses?.name}`,
          due_date: m.created_at, // Placeholder if no due date
          course: m.courses,
          type: 'material',
          material_id: m.id
        }))
      ]

      setAssignments(combined)
    } catch (err) {
      console.error("Error fetching assignments:", err)
    } finally {
      setLoading(false)
    }
  }

  const isAdded = (id) => activeDeckItems.some(item => item.content_id === id)

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'var(--font-outfit)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A102D', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClipboardList color="#7a12cc" size={32} /> Assignments & Tasks
          </h1>
          <p style={{ color: '#4A5568' }}>Keep track of your academic responsibilities and add them to your study decks.</p>
        </div>
        <LuterLogo size={40} showText={false} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <Loader2 size={40} className="animate-spin" color="#7a12cc" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <div 
                key={assignment.id} 
                className="assignment-card"
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1.5px solid #F1F5F9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '52px', 
                    height: '52px', 
                    borderRadius: '14px', 
                    background: assignment.type === 'task' ? '#F5F3FF' : '#FFF7ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {assignment.type === 'task' ? <Calendar color="#7a12cc" size={24} /> : <BookOpen color="#EA580C" size={24} />}
                  </div>
                  
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A202C', margin: '0 0 4px 0' }}>{assignment.title}</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#7a12cc', background: '#F5F3FF', padding: '2px 8px', borderRadius: '4px' }}>
                        {assignment.course?.code || 'GEN101'}
                      </span>
                      <span style={{ fontSize: '13px', color: '#718096' }}>{assignment.course?.name}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    onClick={() => {
                      addToDeck({
                        content_id: assignment.id,
                        content_type: 'assignment',
                        metadata: {
                          title: assignment.title,
                          icon: 'clipboard-list',
                          course_code: assignment.course?.code
                        }
                      })
                    }}
                    disabled={isAdded(assignment.id)}
                    style={{ 
                      padding: '10px 20px',
                      borderRadius: '12px',
                      background: isAdded(assignment.id) ? 'var(--accent-gold)' : '#F1F5F9',
                      color: isAdded(assignment.id) ? 'white' : '#1A202C',
                      fontSize: '13px', 
                      fontWeight: 800, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      border: 'none',
                      cursor: isAdded(assignment.id) ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase'
                    }}
                  >
                    {isAdded(assignment.id) ? <CheckCircle size={16} /> : <Plus size={16} />}
                    {isAdded(assignment.id) ? 'Curated' : 'Add to Deck'}
                  </button>
                  
                  <button 
                    style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '12px', 
                      background: '#F8FAFC', 
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#64748B'
                    }}
                  >
                    <ExternalLink size={20} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '100px 20px', opacity: 0.5 }}>
              <ClipboardList size={64} style={{ margin: '0 auto 24px', color: '#CBD5E1' }} />
              <p style={{ fontSize: '18px', fontWeight: 600 }}>No assignments found.</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .assignment-card:hover {
          border-color: #7a12cc40 !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(122, 18, 204, 0.1);
        }
      `}</style>
    </div>
  )
}
