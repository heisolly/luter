import React, { useState, useEffect } from 'react';
import { CaretLeft, CaretRight, CaretDown } from '@phosphor-icons/react';
import ClassroomSidebar from './ClassroomSidebar';
import { supabase } from '../supabaseClient';
import { format, addDays, startOfWeek, subWeeks, addWeeks, isSameDay } from 'date-fns';

export default function ClassroomCalendar() {
  const [user, setUser] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [selectedClass, setSelectedClass] = useState('All classes');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user));
  }, []);

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  const weekEnd = addDays(currentWeekStart, 6);
  const dateRangeStr = `${format(currentWeekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  const today = new Date();

  return (
    <div className="rv-root" style={{ display: 'flex', height: '100vh', width: '100%', background: '#fff' }}>
      <ClassroomSidebar user={user} activeNav="calendar" />

      <div className="rv-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header Area */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '24px 32px', gap: '40px' }}>
          
          {/* Class Selector Dropdown */}
          <div style={{ position: 'relative', width: '220px' }}>
            <button 
              style={{ 
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                background: '#fff', border: '1px solid #1a73e8', borderRadius: '4px', 
                padding: '10px 16px', color: '#1a73e8', fontSize: '14px', fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {selectedClass}
              <CaretDown weight="bold" />
            </button>
          </div>

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

        {/* Calendar Grid */}
        <div style={{ flex: 1, display: 'flex', padding: '0 32px 32px 32px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', width: '100%', height: '100%', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            {days.map((day, idx) => {
              const isToday = isSameDay(day, today);
              
              return (
                <div key={idx} style={{ flex: 1, borderRight: idx !== 6 ? '1px solid #e0e0e0' : 'none', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Day Header */}
                  <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: isToday ? '#1a73e8' : '#70757a' }}>
                      {format(day, 'EEE')}
                    </span>
                    <div style={{ 
                      width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%', background: isToday ? '#1a73e8' : 'transparent',
                      color: isToday ? '#fff' : '#3c4043', fontSize: '24px', fontWeight: isToday ? 500 : 400
                    }}>
                      {format(day, 'd')}
                    </div>
                  </div>

                  {/* Day Body (Events would go here) */}
                  <div style={{ flex: 1, padding: '8px' }}>
                    {/* Event cards would be rendered here */}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
