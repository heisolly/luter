import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const FireIcon = ({ width = 24, height = 24, style = {} }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" fill="#C4B5FD" fillOpacity="0.2"/>
    <path d="M13.25 13.75C13.25 14.8546 12.3546 15.75 11.25 15.75C10.1454 15.75 9.25 14.8546 9.25 13.75C9.25 12.6454 10.1454 11.75 11.25 11.75C12.3546 11.75 13.25 12.6454 13.25 13.75Z" fill="#C4B5FD"/>
    <path d="M12 5C12 5 15.5 8 15.5 12C15.5 13.33 14.9 14.51 14 15.33C14.6 14.25 15 13.02 15 11.71C15.93 12.77 16.5 14.2 16.5 15.75C16.5 19.2 14.48 22 12 22C9.52 22 7.5 19.2 7.5 15.75C7.5 12 12 5 12 5Z" fill="#C4B5FD"/>
  </svg>
);

const CalendarHeatmap = ({ isDark = false }) => {
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  useEffect(() => {
    let mounted = true;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false);
      return () => { mounted = false };
    }

    supabase.rpc('get_user_heatmap_data')
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data) setHeatmapData(data);
        setLoading(false);
      });

    return () => { mounted = false };
  }, []);

  const history = heatmapData
    .filter(r => r.goal_met || r.minutes_spent > 0)
    .map(r => ({ date: r.study_date, completed: true }));

  const sortedGoalDates = heatmapData
    .filter(r => r.goal_met || r.minutes_spent > 0)
    .map(r => r.study_date)
    .sort()
    .reverse();

  let currentStreak = 0;
  
  // Use exact string matching to prevent timezone bugs
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;

  let checkStr = sortedGoalDates.includes(todayStr) ? todayStr : yestStr;

  for (const dateStr of sortedGoalDates) {
    if (dateStr === checkStr) {
      currentStreak++;
      const d = new Date(dateStr);
      d.setDate(d.getDate() - 1);
      checkStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (dateStr > checkStr) {
      continue;
    } else {
      break;
    }
  }

  const generateCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const currentMonthLabel = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase() + ' ' + year;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    
    // Shift to Mon = 0, Sun = 6
    let startPadding = firstDay === 0 ? 6 : firstDay - 1;

    let calendarDays = [];
    for (let i = 0; i < startPadding; i++) {
      calendarDays.push({ type: 'empty' });
    }

    const isCompleted = (dateStr) => history.some(h => h.date === dateStr);

    for (let i = 1; i <= daysInMonth; i++) {
      // Use local timezone formatting to avoid timezone offset issues
      const d = new Date(year, month, i);
      const yearStr = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

      const active = isCompleted(dateStr);
      
      calendarDays.push({
        type: active ? 'active' : 'inactive',
        date: dateStr,
        dayNumber: i
      });
    }

    const getLocalStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Now compute streaks using global history to handle cross-month streaks
    for (let i = 0; i < calendarDays.length; i++) {
      if (calendarDays[i].type === 'empty') continue;

      if (calendarDays[i].type === 'active') {
         const currentD = new Date(calendarDays[i].date);
         
         const prevD = new Date(currentD);
         prevD.setDate(prevD.getDate() - 1);
         const prevDateStr = getLocalStr(prevD);
         
         const nextD = new Date(currentD);
         nextD.setDate(nextD.getDate() + 1);
         const nextDateStr = getLocalStr(nextD);

         const prevCompleted = isCompleted(prevDateStr);
         const nextCompleted = isCompleted(nextDateStr);

         if (prevCompleted || nextCompleted) {
            calendarDays[i].type = 'streak';
            
            let startD = new Date(currentD);
            while (true) {
               let testD = new Date(startD);
               testD.setDate(testD.getDate() - 1);
               if (isCompleted(getLocalStr(testD))) {
                  startD = testD;
               } else {
                  break;
               }
            }
            calendarDays[i].group = getLocalStr(startD);
         }
      }
    }

    return { currentMonthLabel, calendarDays };
  };

  const { currentMonthLabel, calendarDays: data } = generateCalendarData();

  const bgOuter = isDark ? '#1a2234' : '#F3F4F6';
  const bgInner = isDark ? '#111827' : '#FFFFFF';
  const textTitle = isDark ? '#9CA3AF' : '#6B7280';
  const textBody = isDark ? '#F9FAFB' : '#111827';
  const borderColor = isDark ? '#2d3a50' : '#EFEFEF';
  const font = "'Quicksand', system-ui, sans-serif";

  return (
    <div style={{
      width: '100%',
      maxWidth: '420px',
      backgroundColor: bgOuter,
      borderRadius: '24px',
      padding: '0',
      boxShadow: 'none',
      fontFamily: font,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <style>{`
        .calendar-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          color: ${textTitle};
          transition: all 0.2s ease;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .calendar-btn:hover {
          background-color: ${borderColor};
          color: ${textBody};
          transform: scale(1.05);
        }
        .calendar-day-circle {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: default;
        }
        .calendar-day-circle:hover {
          transform: scale(1.1);
        }
      `}</style>

      {/* Streak Info - Header Area */}
      <div style={{ padding: '18px 18px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
            <FireIcon width={24} height={24} style={{ opacity: currentStreak > 0 ? 1 : 0.3, filter: currentStreak === 0 ? 'grayscale(100%)' : 'none' }} />
            <p style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: textBody, lineHeight: 1, letterSpacing: '-0.5px', fontFamily: font }}>
              {currentStreak} <span style={{ fontSize: '16px', fontWeight: 700, color: textTitle, letterSpacing: '0' }}>Days</span>
            </p>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: textTitle, fontWeight: 600, fontFamily: font }}>
            {currentStreak > 0 ? (
              <>Come back tomorrow to keep it going!</>
            ) : (
              <>Hit your goal to start a streak!</>
            )}
          </p>
        </div>
      </div>

      {/* Calendar Box */}
      <div style={{
        backgroundColor: bgInner,
        borderRadius: '20px',
        padding: '16px 20px 20px',
        margin: '0 4px 4px',
        boxShadow: 'none'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button className="calendar-btn" onClick={handlePrevMonth}>
            <svg width="14" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2L2 10L10 18" />
            </svg>
          </button>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: textBody, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: font }}>
            {currentMonthLabel}
          </h3>
          <button className="calendar-btn" onClick={handleNextMonth}>
            <svg width="14" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 2L10 10L2 18" />
            </svg>
          </button>
        </div>

        <div style={{ height: '1px', background: borderColor, marginBottom: '24px', width: '100%' }}></div>

        {/* Days of week */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {daysOfWeek.map(day => (
            <div key={day} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: textTitle, letterSpacing: '0.5px' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Grid of days */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gridAutoRows: '40px',
          rowGap: '20px', 
          columnGap: '8px',
          position: 'relative' 
        }}>
          {/* Render streak background pills first so they sit behind the circles */}
          {data.map((day, i) => {
            const isPillStart = day && day.type === 'streak' && 
              (i % 7 === 0 || i === 0 || !data[i-1] || data[i-1].group !== day.group);

            if (isPillStart) {
              let len = 1;
              while(i + len < data.length && data[i + len] && data[i + len].group === day.group && ((i + len) % 7 !== 0)) {
                len++;
              }
              return (
                <div key={`bg-${i}`} style={{
                  position: 'absolute',
                  top: `${Math.floor(i / 7) * 60}px`,
                  left: `calc(${i % 7} * ((100% - 48px) / 7 + 8px) + (100% - 48px) / 14 - 20px)`,
                  width: `calc(${(len - 1)} * ((100% - 48px) / 7 + 8px) + 40px)`,
                  height: '40px',
                  background: isDark ? 'rgba(196, 181, 253, 0.15)' : '#F5F3FF',
                  borderRadius: '20px',
                  zIndex: 0,
                  pointerEvents: 'none'
                }}></div>
              );
            }
            return null;
          })}

          {/* Render circles */}
          {data.map((day, i) => {
            if (day.type === 'empty') {
              return <div key={i}></div>;
            }

            const isStreak = day.type === 'streak';
            const isActive = day.type === 'active';
            
            let bgColor = 'transparent';
            if (isStreak || isActive) {
              bgColor = bgInner;
            }
            
            let circleBorderColor = borderColor;
            if (isStreak || isActive) circleBorderColor = '#C4B5FD';

            return (
              <div key={i} className="calendar-day-circle" style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: bgColor,
                border: `2px solid ${circleBorderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                zIndex: 1,
                boxSizing: 'border-box',
                boxShadow: 'none'
              }}>
                {(isStreak || isActive) ? (
                  <FireIcon width={22} height={22} style={{ opacity: 1 }} />
                ) : (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: textTitle }}>{day.dayNumber}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
