import React, { useState, useEffect } from 'react';
import { CaretLeft, CaretRight, CaretDown, Plus, X } from '@phosphor-icons/react';
import { supabase } from '../supabaseClient';
import { format, addDays, startOfWeek, subWeeks, addWeeks, isSameDay } from 'date-fns';

export default function ClassroomCalendar({ filterClassId, isTeacher }) {
  const [user, setUser] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Start on Monday
  const [selectedClass, setSelectedClass] = useState('All classes');
  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Timetable Add Slot State
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [newTimetableEntry, setNewTimetableEntry] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:30',
    subject: '',
    room: ''
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user));
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        let roomsData = [];
        if (filterClassId) {
          const { data, error } = await supabase
            .from('deck_sessions')
            .select('*')
            .eq('id', filterClassId)
            .single();
          if (!error && data) roomsData = [data];
        } else {
          const { data: memberSessions } = await supabase
            .from('deck_session_members')
            .select('session_id')
            .eq('user_id', user.id);
          const sessionIds = (memberSessions || []).map(m => m.session_id);

          const { data, error } = await supabase
            .from('deck_sessions')
            .select('*')
            .eq('session_type', 'classroom')
            .or(`user_id.eq.${user.id},id.in.(${sessionIds.join(',') || '00000000-0000-0000-0000-000000000000'})`);
          if (!error && data) roomsData = data;
        }
        setRooms(roomsData);

        const roomIds = roomsData.map(r => r.id);
        if (roomIds.length > 0) {
          // Fetch timetable
          const { data: timetableData } = await supabase
            .from('class_timetable')
            .select('*')
            .in('class_id', roomIds);

          // Fetch assignments
          const { data: assignData } = await supabase
            .from('class_assignments')
            .select('*')
            .in('class_id', roomIds);

          const mappedEvents = [];
          
          // 1. Add timetable entries (weekly recurring)
          (timetableData || []).forEach(slot => {
            const classObj = roomsData.find(r => r.id === slot.class_id);
            mappedEvents.push({
              id: `timetable-${slot.id}`,
              slotId: slot.id,
              classId: slot.class_id,
              className: classObj?.session_name || 'Class',
              type: 'timetable',
              dayOfWeek: slot.day_of_week, // 1 = Monday, etc.
              title: slot.subject,
              time: `${slot.start_time} - ${slot.end_time}`,
              room: slot.room
            });
          });

          // 2. Add assignments (due dates)
          (assignData || []).forEach(assign => {
            const classObj = roomsData.find(r => r.id === assign.class_id);
            mappedEvents.push({
              id: `assignment-${assign.id}`,
              classId: assign.class_id,
              className: classObj?.session_name || 'Class',
              type: 'assignment',
              dueDate: assign.due_date ? new Date(assign.due_date) : null,
              title: assign.title,
              points: assign.points
            });
          });

          setEvents(mappedEvents);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error('[Calendar] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, filterClassId, refreshTrigger]);

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  const handleDeleteSlot = async (slotId) => {
    if (confirm('Are you sure you want to remove this schedule slot?')) {
      const { error } = await supabase.from('class_timetable').delete().eq('id', slotId);
      if (!error) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert('Failed to delete slot: ' + error.message);
      }
    }
  };

  const handleAddSlotSubmit = async () => {
    if (!newTimetableEntry.subject.trim()) return;
    const { error } = await supabase
      .from('class_timetable')
      .insert({
        class_id: filterClassId,
        ...newTimetableEntry
      });
    
    if (!error) {
      setIsTimetableOpen(false);
      setNewTimetableEntry({ day_of_week: 1, start_time: '09:00', end_time: '10:30', subject: '', room: '' });
      setRefreshTrigger(prev => prev + 1);
    } else {
      alert('Failed to save slot: ' + error.message);
    }
  };

  const weekEnd = addDays(currentWeekStart, 6);
  const dateRangeStr = `${format(currentWeekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  const today = new Date();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* Header Area */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {/* Title or Class Selector */}
            {filterClassId ? (
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#3c4043' }}>
                Class Schedule & Tasks
              </h3>
            ) : (
              <div style={{ position: 'relative', width: '220px' }}>
                <button 
                  style={{ 
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    background: '#fff', border: '1px solid #1a73e8', borderRadius: '4px', 
                    padding: '8px 16px', color: '#1a73e8', fontSize: '14px', fontWeight: 500,
                    cursor: 'default', outline: 'none'
                  }}
                >
                  <span>{selectedClass}</span>
                </button>
              </div>
            )}

            {/* Week Navigator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button onClick={handlePrevWeek} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f6368', padding: '8px', borderRadius: '50%' }}>
                <CaretLeft size={20} weight="bold" />
              </button>
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#3c4043', minWidth: '150px', textAlign: 'center' }}>
                {dateRangeStr}
              </span>
              <button onClick={handleNextWeek} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f6368', padding: '8px', borderRadius: '50%' }}>
                <CaretRight size={20} weight="bold" />
              </button>
            </div>
          </div>

          {/* Add Timetable Slot Button (for Teachers inside a class) */}
          {filterClassId && isTeacher && (
            <button 
              onClick={() => setIsTimetableOpen(true)}
              style={{
                background: '#1a73e8', color: 'white', border: 'none', padding: '8px 16px',
                borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Plus size={18} /> Add Slot
            </button>
          )}
        </div>

        {/* Calendar Grid */}
        <div style={{ flex: 1, display: 'flex', padding: '24px 32px 32px 32px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', width: '100%', height: '100%', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', background: '#f8f9fa' }}>
            {days.map((day, idx) => {
              const isToday = isSameDay(day, today);
              const dayOfWeek = day.getDay(); 
              // Convert day.getDay() (0=Sun, 1=Mon, ..., 6=Sat) to match timetable (1=Mon, ..., 5=Fri, 6=Sat, 7=Sun)
              const mappedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

              // Filter events for this day
              const dayEvents = events.filter(evt => {
                if (evt.type === 'timetable') {
                  return evt.dayOfWeek === mappedDayOfWeek;
                } else if (evt.type === 'assignment') {
                  return evt.dueDate && isSameDay(evt.dueDate, day);
                }
                return false;
              });
              
              return (
                <div key={idx} style={{ flex: 1, borderRight: idx !== 6 ? '1px solid #e0e0e0' : 'none', display: 'flex', flexDirection: 'column', background: 'white' }}>
                  
                  {/* Day Header */}
                  <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderBottom: '1px solid #f1f3f4', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: isToday ? '#1a73e8' : '#70757a' }}>
                      {format(day, 'EEE')}
                    </span>
                    <div style={{ 
                      width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%', background: isToday ? '#1a73e8' : 'transparent',
                      color: isToday ? '#fff' : '#3c4043', fontSize: '18px', fontWeight: isToday ? 600 : 400
                    }}>
                      {format(day, 'd')}
                    </div>
                  </div>

                  {/* Day Body (Events) */}
                  <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loading ? (
                      idx === 3 && <div style={{ fontSize: '12px', color: '#70757a', textAlign: 'center', marginTop: '20px' }}>Loading...</div>
                    ) : dayEvents.length === 0 ? (
                      <span style={{ fontSize: '11px', color: '#bdc1c6', textAlign: 'center', display: 'block', padding: '10px 0' }}>No events</span>
                    ) : (
                      dayEvents.map(evt => {
                        const isTimetable = evt.type === 'timetable';
                        return (
                          <div 
                            key={evt.id} 
                            style={{
                              background: isTimetable ? '#e6f4ea' : '#e8f0fe',
                              border: '1px solid ' + (isTimetable ? '#ceead6' : '#d2e3fc'),
                              borderRadius: '6px',
                              padding: '8px 10px',
                              fontSize: '11px',
                              color: isTimetable ? '#137333' : '#1a73e8',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '3px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              position: 'relative'
                            }}
                          >
                            {/* Delete Timetable entry button */}
                            {isTimetable && filterClassId && isTeacher && (
                              <button 
                                onClick={() => handleDeleteSlot(evt.slotId)}
                                style={{
                                  position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none',
                                  color: '#dc3545', cursor: 'pointer', fontSize: '11px', padding: 0
                                }}
                              >
                                <X size={10} weight="bold" />
                              </button>
                            )}

                            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: isTimetable && isTeacher ? '12px' : 0 }}>
                              {evt.title}
                            </div>
                            <div style={{ fontSize: '10px', opacity: 0.8 }}>
                              {isTimetable ? evt.time : `Due: ${evt.dueDate ? format(evt.dueDate, 'h:mm a') : ''}`}
                            </div>
                            {!filterClassId && (
                              <div style={{ fontSize: '9px', fontWeight: 500, opacity: 0.7, marginTop: '2px', borderTop: '1px solid ' + (isTimetable ? '#ceead6' : '#d2e3fc'), paddingTop: '2px' }}>
                                {evt.className}
                              </div>
                            )}
                            {isTimetable && evt.room && (
                              <div style={{ fontSize: '9px', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                📍 {evt.room}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Add Slot Modal */}
        {isTimetableOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
          }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', width: '400px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#202124', fontWeight: 600 }}>Add Timetable Slot</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Day of Week
                  <select 
                    value={newTimetableEntry.day_of_week}
                    onChange={(e) => setNewTimetableEntry(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dadce0' }}
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                  </select>
                </label>

                <label style={{ fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Subject / Class Name
                  <input 
                    type="text"
                    value={newTimetableEntry.subject}
                    onChange={(e) => setNewTimetableEntry(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g. CS101 Lecture"
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dadce0' }}
                  />
                </label>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ flex: 1, fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    Start Time
                    <input 
                      type="time"
                      value={newTimetableEntry.start_time}
                      onChange={(e) => setNewTimetableEntry(prev => ({ ...prev, start_time: e.target.value }))}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dadce0' }}
                    />
                  </label>

                  <label style={{ flex: 1, fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    End Time
                    <input 
                      type="time"
                      value={newTimetableEntry.end_time}
                      onChange={(e) => setNewTimetableEntry(prev => ({ ...prev, end_time: e.target.value }))}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dadce0' }}
                    />
                  </label>
                </div>

                <label style={{ fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Room / Link
                  <input 
                    type="text"
                    value={newTimetableEntry.room}
                    onChange={(e) => setNewTimetableEntry(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="e.g. Room 302 or Zoom Link"
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dadce0' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  onClick={() => setIsTimetableOpen(false)}
                  style={{ background: 'none', border: '1px solid #dadce0', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddSlotSubmit}
                  style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
