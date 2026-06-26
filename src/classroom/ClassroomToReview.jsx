import React, { useState, useEffect } from 'react';
import { CaretDown, CheckCircle, Checks, Clock, FileText, BookmarkSimple, ArrowRight, Notebook } from '@phosphor-icons/react';
import { supabase } from '../supabaseClient';

export default function ClassroomToReview({ rooms = [], user = null }) {
  const [activeTab, setActiveTab] = useState('todo_or_review'); // 'todo_or_review' (To Do / To Review) | 'done_or_reviewed' (Done / Reviewed)
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [memberships, setMemberships] = useState({});
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  useEffect(() => {
    if (!user || rooms.length === 0) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [user, rooms]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const classIds = rooms.map(r => r.id);
      
      // 1. Fetch user roles in these classes
      const { data: memberData } = await supabase
        .from('deck_session_members')
        .select('session_id, role')
        .eq('user_id', user.id);

      const rolesMap = {};
      rooms.forEach(r => {
        // Owner is always teacher
        if (r.user_id === user.id) {
          rolesMap[r.id] = 'teacher';
        } else {
          rolesMap[r.id] = 'student';
        }
      });
      if (memberData) {
        memberData.forEach(m => {
          if (m.role === 'teacher' || m.role === 'owner') {
            rolesMap[m.session_id] = 'teacher';
          }
        });
      }
      setMemberships(rolesMap);

      // 2. Fetch assignments
      const { data: assignData } = await supabase
        .from('class_assignments')
        .select('*')
        .in('class_id', classIds)
        .order('due_date', { ascending: true });

      setAssignments(assignData || []);

      // 3. Fetch submissions
      const { data: subData } = await supabase
        .from('class_submissions')
        .select('*')
        .in('assignment_id', (assignData || []).map(a => a.id));

      setSubmissions(subData || []);
    } catch (e) {
      console.error("Error fetching review data:", e);
    } finally {
      setLoading(false);
    }
  };

  const getClassName = (classId) => {
    const room = rooms.find(r => r.id === classId);
    return room ? room.session_name : 'Classroom';
  };

  // Group items by role:
  // For classes where user is TEACHER: we care about reviewing submissions
  // For classes where user is STUDENT: we care about submitting assignments
  const getCategorizedLists = () => {
    const todoList = []; // student pending
    const doneList = []; // student completed
    const toReviewList = []; // teacher pending review
    const reviewedList = []; // teacher graded

    assignments.forEach(assign => {
      // Filter by class filter
      if (selectedClassId !== 'all' && assign.class_id !== selectedClassId) return;

      const userRole = memberships[assign.class_id] || 'student';
      const class_name = getClassName(assign.class_id);

      if (userRole === 'teacher') {
        const assignSubs = submissions.filter(s => s.assignment_id === assign.id);
        
        assignSubs.forEach(sub => {
          const item = { ...assign, submission: sub, class_name };
          if (sub.grade) {
            reviewedList.push(item);
          } else {
            toReviewList.push(item);
          }
        });

        // Also if no submissions, list the assignment as "no submissions yet" under to-review if needed
        if (assignSubs.length === 0) {
          toReviewList.push({ ...assign, submission: null, class_name });
        }
      } else {
        // Student
        const mySub = submissions.find(s => s.assignment_id === assign.id && s.student_id === user.id);
        const item = { ...assign, submission: mySub, class_name };
        if (mySub) {
          doneList.push(item);
        } else {
          todoList.push(item);
        }
      }
    });

    return { todoList, doneList, toReviewList, reviewedList };
  };

  const { todoList, doneList, toReviewList, reviewedList } = getCategorizedLists();

  // Determine if the user is a teacher in at least one class
  const isAnyTeacher = Object.values(memberships).some(role => role === 'teacher');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'Outfit', color: '#5f6368' }}>
        Loading assignments and tasks...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Sub-header with Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', padding: '0 24px', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex' }}>
          <button 
            onClick={() => setActiveTab('todo_or_review')}
            style={{
              padding: '16px 24px', background: 'transparent', border: 'none',
              borderBottom: activeTab === 'todo_or_review' ? '3px solid #1a73e8' : '3px solid transparent',
              color: activeTab === 'todo_or_review' ? '#1a73e8' : '#5f6368',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {isAnyTeacher ? 'To Review / To Do' : 'To Do'}
            {(isAnyTeacher ? (toReviewList.length + todoList.length) : todoList.length) > 0 && (
              <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '10px', background: '#dc3545', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                {isAnyTeacher ? (toReviewList.length + todoList.length) : todoList.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('done_or_reviewed')}
            style={{
              padding: '16px 24px', background: 'transparent', border: 'none',
              borderBottom: activeTab === 'done_or_reviewed' ? '3px solid #1a73e8' : '3px solid transparent',
              color: activeTab === 'done_or_reviewed' ? '#1a73e8' : '#5f6368',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {isAnyTeacher ? 'Graded / Done' : 'Done'}
          </button>
        </div>

        {/* Class Filter */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowClassDropdown(!showClassDropdown)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
              border: '1px solid #dadce0', borderRadius: '20px', background: '#ffffff',
              fontSize: '13px', fontWeight: 600, color: '#3c4043', cursor: 'pointer'
            }}
          >
            <span>{selectedClassId === 'all' ? 'All classes' : getClassName(selectedClassId)}</span>
            <CaretDown weight="bold" size={12} color="#5f6368" />
          </button>

          {showClassDropdown && (
            <div style={{
              position: 'absolute', right: 0, top: '40px', background: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid #dadce0',
              zIndex: 100, width: '220px', overflow: 'hidden'
            }}>
              <button 
                onClick={() => { setSelectedClassId('all'); setShowClassDropdown(false); }}
                style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: '#3c4043', borderBottom: '1px solid #dadce0', fontWeight: selectedClassId === 'all' ? 700 : 400 }}
              >
                All classes
              </button>
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => { setSelectedClassId(room.id); setShowClassDropdown(false); }}
                  style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: '#3c4043', fontWeight: selectedClassId === room.id ? 700 : 400 }}
                >
                  {room.session_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', background: '#f8f9fa' }}>
        
        {/* Render Lists */}
        {activeTab === 'todo_or_review' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
            
            {/* Teacher section */}
            {isAnyTeacher && toReviewList.length > 0 && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
                  To Review (As Teacher)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {toReviewList.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Notebook size={22} weight="fill" />
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: '#202124' }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#1a73e8' }}>{item.class_name}</span>
                            {item.due_date && ` • Due ${new Date(item.due_date).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                          {item.submission ? (
                            <span style={{ fontSize: '13px', color: '#b06000', background: '#fff3cd', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                              Submitted by {item.submission.student_name}
                            </span>
                          ) : (
                            <span style={{ fontSize: '13px', color: '#5f6368', background: '#f1f3f4', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>
                              No Submissions Yet
                            </span>
                          )}
                        </div>
                        <a 
                          href={`/classrooms/c/${item.class_id}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1a73e8',
                            fontWeight: 600, textDecoration: 'none', border: '1px solid #1a73e8', padding: '8px 14px', borderRadius: '6px'
                          }}
                        >
                          <span>Go to Class</span>
                          <ArrowRight size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student section */}
            {todoList.length > 0 && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
                  To Do (As Student)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {todoList.map((item, idx) => {
                    const isOverdue = item.due_date && new Date(item.due_date) < new Date();
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '20px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                      >
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E8F0FE', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={22} weight="fill" />
                          </div>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#202124' }}>{item.title}</div>
                            <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>
                              <span style={{ fontWeight: 600, color: '#1a73e8' }}>{item.class_name}</span>
                              {item.due_date && ` • Due ${new Date(item.due_date).toLocaleString()}`}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {isOverdue && (
                            <span style={{ fontSize: '11px', color: '#dc3545', fontWeight: 700, textTransform: 'uppercase' }}>Overdue</span>
                          )}
                          <a 
                            href={`/classrooms/c/${item.class_id}`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1a73e8',
                              fontWeight: 600, textDecoration: 'none', border: '1px solid #1a73e8', padding: '8px 14px', borderRadius: '6px'
                            }}
                          >
                            <span>Open Assignment</span>
                            <ArrowRight size={14} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {toReviewList.length === 0 && todoList.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', background: 'white', border: '1px solid #dadce0', borderRadius: '12px' }}>
                <div style={{ padding: '20px', background: '#E6F4EA', color: '#137333', borderRadius: '50%', marginBottom: '16px' }}>
                  <CheckCircle size={44} weight="fill" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#202124', margin: '0 0 6px 0' }}>All Caught Up!</h3>
                <p style={{ fontSize: '13px', color: '#5f6368', margin: 0, textAlign: 'center', maxWidth: '340px', lineHeight: '1.5' }}>
                  No pending assignments to submit, and no submissions awaiting grading. Excellent job!
                </p>
              </div>
            )}

          </div>
        ) : (
          /* Done / Reviewed Tab */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
            
            {/* Graded Teacher Section */}
            {isAnyTeacher && reviewedList.length > 0 && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
                  Graded Submissions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reviewedList.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E6F4EA', color: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle size={22} weight="fill" />
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: '#202124' }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#1a73e8' }}>{item.class_name}</span>
                            {` • Graded: ${item.submission.grade} points`}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#5f6368', fontStyle: 'italic' }}>
                        Student: {item.submission.student_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Student Section */}
            {doneList.length > 0 && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
                  Done (As Student)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {doneList.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', padding: '20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E6F4EA', color: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle size={22} weight="fill" />
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: '#202124' }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#1a73e8' }}>{item.class_name}</span>
                            {item.submission.grade ? ` • Grade: ${item.submission.grade}/${item.points}` : ' • Turned in'}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#137333', background: '#E6F4EA', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviewedList.length === 0 && doneList.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', background: 'white', border: '1px solid #dadce0', borderRadius: '12px' }}>
                <div style={{ padding: '20px', background: '#f1f3f4', color: '#5f6368', borderRadius: '50%', marginBottom: '16px' }}>
                  <FileText size={44} weight="fill" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#3c4043', margin: '0' }}>No completed work yet</h3>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
