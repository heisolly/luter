import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const StreakHeatmap = ({ 
  isDark = false,
  targetStreak = 3
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    let mounted = true;
    supabase.rpc('get_user_heatmap_data').then(({ data, error }) => {
      if (!mounted) return;
      if (!error && data) setHeatmapData(data);
    });
    return () => { mounted = false };
  }, []);

  const sortedGoalDates = heatmapData
    .filter(r => r.goal_met)
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

  const history = heatmapData
    .filter(r => r.goal_met)
    .map(r => ({ date: r.study_date, completed: true }));

  const colors = {
    bgOuter: isDark ? '#1F2937' : '#F3F4F6',
    bgInner: isDark ? '#111827' : '#FFFFFF',
    textTitle: isDark ? '#D1D5DB' : '#6B7280',
    textBody: isDark ? '#F3F4F6' : '#4B5563',
    borderColor: isDark ? '#374151' : '#E5E7EB',
    streakIconFill: currentStreak > 0 ? '#FFD2A6' : (isDark ? '#4B5563' : '#E5E7EB'),
    streakIconStroke: currentStreak > 0 ? 'none' : (isDark ? '#374151' : '#E5E7EB'),
  };

  const generateDays = () => {
    const dayNames = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isCompleted = history.some(h => h.date === dateStr && h.completed);
      
      result.push({
        name: dayNames[d.getDay()],
        active: isCompleted,
        date: dateStr
      });
    }
    return result;
  };

  const days = generateDays();

  return (
    <div style={{
      width: '100%',
      maxWidth: '420px',
      backgroundColor: colors.bgOuter,
      borderRadius: '24px',
      padding: '24px',
      boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.4)' : '0 24px 64px rgba(15,23,42,0.1)',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Streak Info - Modernized */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 19 25" fill="none" style={{ opacity: currentStreak > 0 ? 1 : 0.3, filter: currentStreak === 0 ? 'grayscale(100%)' : 'none' }}>
              <path d="M1.27498 12.516L10.1761 1.31828C10.7098 0.646883 11.7966 1.11739 11.6606 1.96094L10.3758 9.92921H15.8888C16.9368 9.92921 17.5236 11.1248 16.8757 11.94L7.97457 23.1377C7.44087 23.8091 6.35401 23.3386 6.49003 22.495L7.7748 14.5268H2.26186C1.21381 14.5268 0.62701 13.3312 1.27498 12.516Z" fill={colors.streakIconFill} stroke={colors.streakIconStroke} strokeWidth="2"></path>
            </svg>
            <p style={{ fontSize: '36px', fontWeight: 800, margin: 0, color: colors.textBody, lineHeight: 1, letterSpacing: '-1px' }}>
              {currentStreak} <span style={{ fontSize: '18px', fontWeight: 600, color: colors.textTitle, letterSpacing: '0' }}>Days</span>
            </p>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: colors.textTitle, fontWeight: 500 }}>
            {currentStreak > 0 ? (
              <>You're on a <strong style={{ fontWeight: 700, color: colors.textBody }}>streak</strong>!</>
            ) : (
              <>Hit your daily study goal to start a streak!</>
            )}
          </p>
        </div>
        
        {/* Popover Logic */}
        <div style={{ position: 'relative', alignSelf: 'flex-start' }}>
          <button 
            type="button" 
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: colors.textTitle,
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="4.8" y="2.4" width="14.4" height="19.2" rx="1.08" stroke="currentColor" strokeWidth="3.76"></rect>
              <path d="M9.08 0.94L14.92 0.94C15 0.94 15.06 1 15.06 1.08L15.06 1.46L8.94 1.46L8.94 1.08C8.94 1 9 0.94 9.08 0.94Z" stroke="currentColor" strokeWidth="1.88"></path>
              <path d="M9.08 23.06L14.92 23.06C15 23.06 15.06 23 15.06 22.92L15.06 22.54L8.94 22.54L8.94 22.92C8.94 23 9 23.06 9.08 23.06Z" stroke="currentColor" strokeWidth="1.88"></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="4.8" y="2.4" width="14.4" height="19.2" rx="1.08" stroke="currentColor" strokeWidth="3.76"></rect>
              <path d="M9.08 0.94L14.92 0.94C15 0.94 15.06 1 15.06 1.08L15.06 1.46L8.94 1.46L8.94 1.08C8.94 1 9 0.94 9.08 0.94Z" stroke="currentColor" strokeWidth="1.88"></path>
              <path d="M9.08 23.06L14.92 23.06C15 23.06 15.06 23 15.06 22.92L15.06 22.54L8.94 22.54L8.94 22.92C8.94 23 9 23.06 9.08 23.06Z" stroke="currentColor" strokeWidth="1.88"></path>
            </svg>
          </button>

          {isPopoverOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: colors.bgOuter,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              zIndex: 50,
              width: 'max-content',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: colors.textTitle }}>
                <span style={{ fontWeight: 700, color: colors.textBody }}>0 of 2</span> Streak Charges
              </p>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: colors.textTitle }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8ZM16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM7 6V4H9V6H7ZM9 12V9V7H7H6V9H7V12H9Z" fill="currentColor"></path>
              </svg>
            </div>
          )}
        </div>
      </div>
      
      {/* Heatmap Box */}
      <div style={{
        backgroundColor: colors.bgInner,
        borderRadius: '24px',
        padding: '20px',
        boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : '0 2px 8px rgba(0,0,0,0.02), inset 0 0 0 1px rgba(0,0,0,0.02)',
        display: 'flex', 
        justifyContent: 'space-between', 
        width: '100%', 
        boxSizing: 'border-box'
      }}>
        {days.map((day, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: day.active ? (isDark ? 'rgba(255, 210, 166, 0.15)' : 'rgba(255, 210, 166, 0.3)') : 'transparent',
                border: day.active ? `2px solid #FFD2A6` : `2px solid ${colors.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: day.active ? '0 4px 12px rgba(255, 210, 166, 0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {day.active ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 19 25" fill="none">
                  <path d="M1.27498 12.516L10.1761 1.31828C10.7098 0.646883 11.7966 1.11739 11.6606 1.96094L10.3758 9.92921H15.8888C16.9368 9.92921 17.5236 11.1248 16.8757 11.94L7.97457 23.1377C7.44087 23.8091 6.35401 23.3386 6.49003 22.495L7.7748 14.5268H2.26186C1.21381 14.5268 0.62701 13.3312 1.27498 12.516Z" fill="#FFD2A6"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 19 25" fill="none">
                  <path d="M1.27498 12.516L10.1761 1.31828C10.7098 0.646883 11.7966 1.11739 11.6606 1.96094L10.3758 9.92921H15.8888C16.9368 9.92921 17.5236 11.1248 16.8757 11.94L7.97457 23.1377C7.44087 23.8091 6.35401 23.3386 6.49003 22.495L7.7748 14.5268H2.26186C1.21381 14.5268 0.62701 13.3312 1.27498 12.516Z" fill={isDark ? '#4B5563' : '#D1D5DB'}></path>
                </svg>
              )}
            </div>
            <span style={{ fontSize: '13px', fontWeight: day.active ? 700 : 600, color: day.active ? colors.textBody : colors.textTitle, textAlign: 'center', lineHeight: 1.2 }}>
              {day.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StreakHeatmap;
