import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { Coins } from '@phosphor-icons/react';

const LuterMascot = () => (
  <div style={{
    width: '28px', height: '28px', 
    backgroundColor: '#FCD34D', 
    borderRadius: '6px', 
    border: '2px solid #000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '2px 2px 0px #000',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0
  }}>
    <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '8px', backgroundColor: '#8B5CF6' }}></div>
    <div style={{ position: 'absolute', top: '8px', left: '6px', width: '4px', height: '4px', backgroundColor: '#000', borderRadius: '50%' }}></div>
    <div style={{ position: 'absolute', top: '8px', right: '6px', width: '4px', height: '4px', backgroundColor: '#000', borderRadius: '50%' }}></div>
    <div style={{ position: 'absolute', top: '5px', left: '4px', width: '6px', height: '2px', backgroundColor: '#000', transform: 'rotate(15deg)' }}></div>
    <div style={{ position: 'absolute', top: '5px', right: '4px', width: '6px', height: '2px', backgroundColor: '#000', transform: 'rotate(-15deg)' }}></div>
    <div style={{ position: 'absolute', bottom: '-1px', right: '-2px', width: '12px', height: '8px', backgroundColor: '#FFF', border: '2px solid #000', borderBottom: 'none', transform: 'rotate(-10deg)' }}></div>
  </div>
);

export function useTaskManager(userId) {
  useEffect(() => {
    if (!userId) return;

    const handleTaskComplete = async (e) => {
      const { taskId, xp, title, isDynamic } = e.detail;

      let claimedTasks = [];
      try {
        claimedTasks = JSON.parse(localStorage.getItem('luter_claimed_tasks') || '[]');
      } catch {}

      if (claimedTasks.includes(taskId)) return;

      // Show toast immediately for UX
      toast.custom((t) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          padding: '8px 12px',
          borderRadius: '999px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.3s ease-in-out'
        }}>
          <LuterMascot />
          <span style={{ color: '#4B5563', fontWeight: '500', fontSize: '14px' }}>
            {title}
          </span>
          <div style={{
            background: '#FDE047',
            padding: '4px 10px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 'bold',
            color: '#451A03'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: '#854D0E'}}>
              <circle cx="8" cy="8" r="6" />
              <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
              <path d="M7 6h1v4" />
              <path d="M16.71 13.88.49.27" />
            </svg>
            {xp}
          </div>
        </div>
      ), { duration: 4000 });

      // Save locally to prevent duplicate toasts
      const newClaimed = [...claimedTasks, taskId];
      localStorage.setItem('luter_claimed_tasks', JSON.stringify(newClaimed));
      
      // Update DB
      try {
        if (isDynamic) {
          await supabase.from('user_task_progress').insert([{
            user_id: userId,
            task_id: taskId,
            status: 'claimed'
          }]);
        } else {
          await supabase.rpc('claim_explore_task', { 
            p_task_id: taskId, 
            p_xp_amount: xp 
          });
        }
      } catch (err) {
        console.error('Auto claim failed:', err);
      }
    };

    window.addEventListener('luter-task-complete', handleTaskComplete);
    return () => window.removeEventListener('luter-task-complete', handleTaskComplete);
  }, [userId]);
}
