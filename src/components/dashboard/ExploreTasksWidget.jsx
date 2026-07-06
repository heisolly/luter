import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Compass, Lightning, ArrowRight, CheckCircle, Circle } from '@phosphor-icons/react';
import { ScrollArea } from '../ui/scroll-area';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useStreakSync } from '../../hooks/useStreakSync';

export default function ExploreTasksWidget({ isDark = false, bundle }) {
  const { user, profile } = useOutletContext() || {};
  const navigate = useNavigate();
  const { triggerStreakUpdate } = useStreakSync(user?.id);

  const stats = bundle?.stats?.data || {};
  const materials = bundle?.materials?.data || [];
  const dbClaimed = stats?.claimed_tasks || [];

  const [claimedTasks, setClaimedTasks] = useState(() => {
    try {
      const local = JSON.parse(localStorage.getItem('luter_claimed_tasks') || '[]');
      return Array.from(new Set([...dbClaimed, ...local]));
    } catch { return dbClaimed; }
  });

  useEffect(() => {
    if (dbClaimed.length > 0) {
      setClaimedTasks(prev => Array.from(new Set([...dbClaimed, ...prev])));
    }
  }, [stats?.claimed_tasks]);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bonusXp, setBonusXp] = useState(0);

  useEffect(() => {
    async function loadTasks() {
      const hasDeck = materials.some(m => m.type?.toLowerCase().includes('deck') || m.type?.toLowerCase().includes('flashcard'));
      const hasPdf = materials.some(m => m.type?.toLowerCase().includes('pdf') || m.type?.toLowerCase().includes('doc'));
      const hasNote = materials.some(m => m.type?.toLowerCase().includes('note'));

      const baseTasks = [
        { id: 1, title: <>Complete your <strong>profile</strong></>, completed: !!profile?.username, coins: 5, path: '/profile' },
        { id: 2, title: <>Set a <strong>Daily Study Goal</strong></>, completed: !!stats.daily_goal_minutes, coins: 10, path: null, isGoal: true },
        { id: 3, title: <>Create your first <strong>Deck</strong></>, completed: hasDeck, coins: 10, path: '/decks?new=1' },
        { id: 4, title: <>Upload a <strong>PDF</strong> to Backpack</>, completed: hasPdf, coins: 15, path: '/backpack?new=1' },
        { id: 5, title: <>Write your first <strong>Note</strong></>, completed: hasNote, coins: 12, path: '/notes?new=1' },
        { id: 6, title: <>Earn your first <strong>XP</strong></>, completed: (stats.total_xp || 0) > 0, coins: 3, path: '/playground' },
        { id: 7, title: <>Reach a <strong>3-day streak</strong></>, completed: (stats.streak_days || 0) >= 3, coins: 20, path: '/home' },
        { id: 8, title: <>Reach <strong>Level 2</strong></>, completed: (stats.total_xp || 0) >= 500, coins: 25, path: '/playground' },
      ];

      try {
        const { data, error } = await supabase
          .from('explore_tasks')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        let dbUserProgress = [];
        if (profile?.id) {
          const { data: progressData } = await supabase
            .from('user_task_progress')
            .select('*')
            .eq('user_id', profile.id);
          if (progressData) {
            dbUserProgress = progressData.map(p => p.task_id);
          }
        }

        if (!error && data && data.length > 0) {
          const formattedTasks = data.map((t) => ({
            id: t.id,
            title: <span dangerouslySetInnerHTML={{ __html: t.title }} />,
            completed: dbUserProgress.includes(t.id) || claimedTasks.includes(t.id),
            isClaimed: claimedTasks.includes(t.id),
            coins: t.coins_reward || t.xp_reward || 0,
            path: t.action_url,
            isDynamic: true
          }));
          setTasks(formattedTasks);
        } else {
          setTasks(baseTasks.map(t => ({ ...t, isClaimed: claimedTasks.includes(t.id) })));
        }
      } catch (err) {
        console.error("Failed to load tasks", err);
        setTasks(baseTasks.map(t => ({ ...t, isClaimed: claimedTasks.includes(t.id) })));
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [profile?.id, materials.length, stats.total_xp, stats.streak_days]);

  useEffect(() => {
    if (bonusXp > 0) {
      const xpEl = document.getElementById('header-xp-display');
      if (xpEl) xpEl.innerText = `${(stats.total_xp || 0) + bonusXp} XP`;
    }
  }, [bonusXp, stats.total_xp]);

  const toggleTask = async (task) => {
    if (!task.completed) {
      if (task.isGoal) {
        localStorage.removeItem('luter_skip_goal');
        window.dispatchEvent(new Event('show-daily-goal'));
      } else if (task.path && navigate) {
        navigate(task.path);
      }
      return;
    }

    if (task.completed && !task.isClaimed) {
      // Optimistic UI update to claim the task
      setTasks(tasks.map(t => t.id === task.id ? { ...t, isClaimed: true } : t));
      
      const newClaimed = [...claimedTasks, task.id];
      setClaimedTasks(newClaimed);
      localStorage.setItem('luter_claimed_tasks', JSON.stringify(newClaimed));
      setBonusXp(prev => prev + task.coins);

      try {
        if (task.isDynamic) {
          await supabase.from('user_task_progress').insert([{
            user_id: profile.id,
            task_id: task.id,
            status: 'claimed'
          }]);
        } else {
          await supabase.rpc('claim_explore_task', { 
            p_task_id: task.id, 
            p_xp_amount: task.coins 
          });
        }
        triggerStreakUpdate();
      } catch (e) {
        console.error("Failed to claim task:", e);
      }
    }
  };

  const unclaimedTasks = tasks.filter(t => !t.isClaimed);
  const visibleTasks = unclaimedTasks.slice(0, 10);
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  
  // SVG Circle calculations
  const radius = 7;
  const circumference = 2 * Math.PI * radius; // ~43.98
  const offset = circumference - (progressPercent / 100) * circumference;

  // Colors matching TodoListWidget
  const font = "'Quicksand', system-ui, sans-serif";
  const bgOuter = isDark ? '#1a2234' : '#F3F4F6'; 
  const bgInner = isDark ? '#111827' : '#FFFFFF'; 
  const textTitle = isDark ? '#9CA3AF' : '#6B7280'; 
  const textBody = isDark ? '#F9FAFB' : '#111827'; 
  const borderColor = isDark ? '#2d3a50' : '#EFEFEF'; 
  const hoverBg = isDark ? '#1e2d45' : '#F7F5FF'; 
  
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '24px',
        backgroundColor: bgOuter, padding: '0', minWidth: '220px', width: '100%',
        maxWidth: '480px', height: '400px', alignItems: 'center', justifyContent: 'center',
        fontFamily: font, color: textTitle
      }}>
        Loading tasks...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '24px',
      backgroundColor: bgOuter,
      padding: '0',
      minWidth: '220px',
      width: '100%',
      maxWidth: '480px', // slightly wider than 350 for text
      height: '400px',
      fontFamily: font,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 18px 14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={22} weight="regular" color={isDark ? '#D1D5DB' : '#6B7280'} />
          <span style={{ fontSize: '18px', fontWeight: 800, color: textBody, letterSpacing: '-0.2px', fontFamily: font }}>Explore Luter</span>
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
        borderRadius: '20px',
        backgroundColor: bgInner,
        padding: '12px',
        margin: '0 4px 4px',
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
                  onClick={() => toggleTask(task)}
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

                  {/* Claim Action for Completed */}
                  {task.completed && !task.isClaimed && (
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
                          <span>Claim {task.coins}</span>
                        </div>
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
                    fontWeight: 700,
                    fontFamily: font,
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
