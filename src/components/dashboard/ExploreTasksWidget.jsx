import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Compass, Lightning, ArrowRight, CheckCircle, Circle } from '@phosphor-icons/react';
import { ScrollArea } from '../ui/scroll-area';

export default function ExploreTasksWidget({ isDark = false }) {
  const [tasks, setTasks] = useState(() => {
    try {
      const cached = localStorage.getItem('explore_tasks_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.map(t => ({
          ...t,
          title: <span dangerouslySetInnerHTML={{ __html: t.titleRaw }} />
        }));
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(tasks.length === 0);

  useEffect(() => {
    async function loadTasks() {
      try {
        const { data, error } = await supabase
          .from('explore_tasks')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (!error && data && data.length > 0) {
          const formattedTasks = data.map((t, index) => ({
            id: t.id,
            titleRaw: t.title,
            title: <span dangerouslySetInnerHTML={{ __html: t.title }} />,
            completed: index === 0, // Make the first one completed by default for demo
            isClaimed: false, // For local tracking
            coins: t.coins_reward || t.xp_reward || 0
          }));
          setTasks(formattedTasks);
          try {
            localStorage.setItem('explore_tasks_cache', JSON.stringify(formattedTasks.map(t => ({...t, title: undefined}))));
          } catch(e) {}
        } else {
          // Fallback if none found
          setTasks([
            { id: 1, title: <>Complete your <strong>profile</strong></>, completed: true, coins: 5 },
            { id: 2, title: <>Set a <strong>Daily Study Goal</strong></>, completed: false, coins: 10 },
          ]);
        }
      } catch (err) {
        console.error("Failed to load tasks", err);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        if (!t.completed) return { ...t, completed: true };
        if (t.completed && !t.isClaimed) return { ...t, isClaimed: true }; // Slide out
      }
      return t;
    }));
  };

    const unclaimedTasks = tasks.filter(t => !t.isClaimed);
  const visibleTasks = unclaimedTasks.slice(0, 10);
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  
  // SVG Circle calculations
  const radius = 7;
  const circumference = 2 * Math.PI * radius; // ~43.98
  const offset = circumference - (progressPercent / 100) * circumference;

  // Colors
  const bgOuter = isDark ? '#1F2937' : '#F3F4F6'; // secondary-100
  const bgInner = isDark ? '#111827' : '#FFFFFF'; // secondary-50
  const textTitle = isDark ? '#D1D5DB' : '#6B7280'; // secondary-500
  const textBody = isDark ? '#F3F4F6' : '#4B5563'; // body-600
  const borderColor = isDark ? '#374151' : '#E5E7EB'; // secondary-200
  const hoverBg = isDark ? '#374151' : '#F9FAFB'; // hover:bg-background
  
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '24px',
        backgroundColor: bgOuter, padding: '16px 4px 4px 4px', minWidth: '220px', width: '100%',
        maxWidth: '480px', height: '400px', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif', color: textTitle
      }}>
        Loading tasks...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      borderRadius: '24px',
      backgroundColor: bgOuter,
      padding: '16px 4px 4px 4px',
      minWidth: '220px',
      width: '100%',
      maxWidth: '480px', // slightly wider than 350 for text
      height: '400px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        height: '30px',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={20} weight="regular" color={textTitle} />
          <span style={{ fontSize: '16px', fontWeight: 700, color: textTitle }}>Explore Luter</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: textTitle }}>{progressPercent}%</span>
          <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
            <circle cx="10" cy="10" r="7" fill="none" stroke={isDark ? '#374151' : '#D1D5DB'} strokeWidth="2.5" />
            <circle 
              cx="10" 
              cy="10" 
              r="7" 
              fill="none" 
              stroke="#98FF98" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeDasharray={circumference} 
              strokeDashoffset={offset} 
              transform="rotate(-90 10 10)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
        </div>
      </div>

      {/* List Container */}
      <div style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '24px',
        backgroundColor: bgInner,
        padding: '16px',
        position: 'relative'
      }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          
          <ScrollArea scrollFade={false} className="h-full w-full absolute inset-0" style={{ flex: 1 }}>
            <style>{`
              .etw-item {
                position: relative;
                display: flex;
                alignItems: center;
                gap: 12px;
                borderRadius: 16px;
                padding: 10px 6px;
                cursor: pointer;
                transition: background-color 0.2s;
              }
              .etw-item:hover {
                background-color: ${hoverBg};
              }
              .etw-item .etw-hover-action {
                opacity: 0;
                transition: opacity 0.2s;
                position: absolute;
                bottom: 0;
                right: 4px;
                top: 0;
                display: flex;
                align-items: center;
              }
              .etw-item:hover .etw-hover-action {
                opacity: 1;
              }
            `}</style>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {visibleTasks.map((task, index) => (
              <React.Fragment key={task.id}>
                <div 
                  className="etw-item" 
                  onClick={() => toggleTask(task.id)}
                  style={{ opacity: task.completed ? 0.6 : 1 }}
                >
                  {/* Hover Action (XP Pill + Arrow) */}
                  {!task.completed && (
                    <div className="etw-hover-action">
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: hoverBg,
                        paddingRight: '6px',
                        paddingLeft: '12px',
                      }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#98FF98',
                          color: '#064E3B',
                          height: '28px',
                          borderRadius: '8px',
                          padding: '0 8px',
                          fontWeight: 700,
                          fontSize: '13px',
                        }}>
                          <Lightning size={16} weight="fill" />
                          <span>{task.coins}</span>
                        </div>
                        <ArrowRight size={16} color={isDark ? '#D1D5DB' : '#9CA3AF'} />
                      </div>
                    </div>
                  )}

                  {/* Icon */}
                  {task.completed ? (
                    <CheckCircle size={24} weight="fill" color="#98FF98" style={{ flexShrink: 0 }} />
                  ) : (
                    <Circle size={24} color={isDark ? '#4B5563' : '#D1D5DB'} weight="regular" style={{ flexShrink: 0 }} />
                  )}

                  {/* Text */}
                  <span style={{
                    marginTop: '4px',
                    flex: 1,
                    alignSelf: 'flex-start',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: textBody,
                    textDecoration: task.completed ? 'line-through' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {task.title}
                  </span>
                </div>
                
                {/* Divider */}
                {index < visibleTasks.length - 1 && (
                  <div style={{ margin: '0 10px', height: '1px', backgroundColor: borderColor, flexShrink: 0 }} />
                )}
              </React.Fragment>
            ))}
            </div>
          </ScrollArea>

          {/* Fade overlays */}
          <div style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '32px',
            background: `linear-gradient(to bottom, ${isDark ? 'rgba(17,24,39,1)' : 'rgba(255,255,255,1)'}, ${isDark ? 'rgba(17,24,39,0)' : 'rgba(255,255,255,0)'})`
          }} />
          <div style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '32px',
            background: `linear-gradient(to top, ${isDark ? 'rgba(17,24,39,1)' : 'rgba(255,255,255,1)'}, ${isDark ? 'rgba(17,24,39,0)' : 'rgba(255,255,255,0)'})`
          }} />
        </div>
      </div>
    </div>
  );
}
