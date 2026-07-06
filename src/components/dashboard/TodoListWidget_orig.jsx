import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListChecks,
  Plus,
  Database,
  Folder,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Repeat,
  CheckCircle,
  Circle,
  X,
  Spinner,
  Trash,
} from '@phosphor-icons/react';
import { supabase } from '../../supabaseClient';

const RECURRING_OPTIONS = ['None', 'Daily', 'Weekly', 'Every two weeks', 'Monthly'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function TodoListWidget({ isDark = false }) {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const bgOuter    = isDark ? '#1F2937' : '#F3F4F6';
  const bgInner    = isDark ? '#111827' : '#FFFFFF';
  const textTitle  = isDark ? '#F9FAFB' : '#111827';
  const textSec    = isDark ? '#9CA3AF' : '#6B7280';
  const border     = isDark ? '#374151' : '#E5E7EB';
  const hoverBg    = isDark ? '#374151' : '#F9FAFB';
  const purple     = '#8B5CF6';
  const purpleLight = isDark ? 'rgba(139,92,246,0.2)' : '#EDE9FE';

  // ── Data ───────────────────────────────────────────────────────────────────
  const [todos,        setTodos]        = useState([]);
  const [tags,         setTags]         = useState([]);
  const [loadingTodos, setLoadingTodos] = useState(true);
  const [loadingTags,  setLoadingTags]  = useState(false);
  const [saving,       setSaving]       = useState(false);

  // ── Add-task form ──────────────────────────────────────────────────────────
  const [isAdding,     setIsAdding]     = useState(false);
  const [taskText,     setTaskText]     = useState('');
  const [dueDate,      setDueDate]      = useState(null);   // JS Date | null
  const [recurring,    setRecurring]    = useState('None');
  const [selectedMat,  setSelectedMat]  = useState(null);  // { id, rawId, type }
  const [selectedCrs,  setSelectedCrs]  = useState(null);

  // ── Popovers ───────────────────────────────────────────────────────────────
  const [showTagMenu,    setShowTagMenu]    = useState(false);
  const [showDateMenu,   setShowDateMenu]   = useState(false);
  const [showRecurring,  setShowRecurring]  = useState(false);
  const [calYear,        setCalYear]        = useState(new Date().getFullYear());
  const [calMonth,       setCalMonth]       = useState(new Date().getMonth());

  const widgetRef = useRef(null);
  const inputRef  = useRef(null);

  // ── Fetch todos ────────────────────────────────────────────────────────────
  const fetchTodos = useCallback(async () => {
    setLoadingTodos(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoadingTodos(false); return; }
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', session.user.id)
      .is('deleted_at', null)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    setTodos(data || []);
    setLoadingTodos(false);
  }, []);

  // ── Fetch tags (materials + courses) ──────────────────────────────────────
  const fetchTags = useCallback(async () => {
    setLoadingTags(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoadingTags(false); return; }

    const [{ data: mats }, { data: courses }] = await Promise.all([
      supabase.from('materials').select('id, title').eq('user_id', session.user.id).limit(20),
      supabase.from('courses').select('id, code, name').limit(20),
    ]);

    const combined = [];
    (mats || []).forEach(m => combined.push({
      id: `mat_${m.id}`, rawId: m.id, type: 'material',
      label: m.title || 'Untitled Material',
    }));
    (courses || []).forEach(c => combined.push({
      id: `crs_${c.id}`, rawId: c.id, type: 'folder',
      label: c.name || c.code || 'Untitled Folder',
    }));
    setTags(combined);
    setLoadingTags(false);
  }, []);

  useEffect(() => { fetchTodos(); fetchTags(); }, [fetchTodos, fetchTags]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('todos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => {
        fetchTodos();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchTodos]);

  // ── Click outside ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setShowTagMenu(false);
        setShowDateMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Input change – detect @ ────────────────────────────────────────────────
  const handleInput = (e) => {
    const val = e.target.value;
    setTaskText(val);
    setShowTagMenu(val.includes('@'));
    if (val.includes('@')) setShowDateMenu(false);
  };

  // ── Select a tag from popover ──────────────────────────────────────────────
  const selectTag = (tag) => {
    setTaskText(prev => prev.replace(/@\S*$/, '').trimEnd() + ' ');
    if (tag.type === 'material') setSelectedMat(tag);
    else setSelectedCrs(tag);
    setShowTagMenu(false);
    inputRef.current?.focus();
  };

  // ── Add Task ───────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    const text = taskText.trim();
    if (!text || saving) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    await supabase.from('todos').insert({
      user_id:     session.user.id,
      text,
      due_date:    dueDate ? dueDate.toISOString().split('T')[0] : null,
      recurring:   recurring !== 'None' ? recurring : null,
      material_id: selectedMat?.rawId || null,
      course_id:   selectedCrs?.rawId || null,
      position:    todos.length,
    });

    // reset form
    setTaskText('');
    setDueDate(null);
    setRecurring('None');
    setSelectedMat(null);
    setSelectedCrs(null);
    setIsAdding(false);
    setSaving(false);
  };

  // ── Toggle complete ────────────────────────────────────────────────────────
  const toggleTodo = async (todo) => {
    await supabase.from('todos').update({ completed: !todo.completed }).eq('id', todo.id);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteTodo = async (id) => {
    await supabase.from('todos').delete().eq('id', id);
  };

  // ── Calendar helpers ───────────────────────────────────────────────────────
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay    = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Mon = 0
  const prevMonth   = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth   = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };
  const selectDay   = (day) => {
    const d = new Date(calYear, calMonth, day);
    setDueDate(d);
    setShowDateMenu(false);
  };
  const formatDate  = (d) => d ? `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0,3)}` : '';

  // ── Open add panel ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setTaskText('');
    setDueDate(null);
    setRecurring('None');
    setSelectedMat(null);
    setSelectedCrs(null);
    setShowTagMenu(false);
    setShowDateMenu(false);
  };

  const hasTodos = todos.length > 0;

  return (
    <div
      ref={widgetRef}
      style={{
        display: 'flex', flexDirection: 'column', gap: '12px',
        borderRadius: '24px', backgroundColor: bgOuter,
        padding: '16px 4px 4px 4px', width: '100%',
        minHeight: hasTodos || isAdding ? 'auto' : '320px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', height: '30px', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListChecks size={20} weight="regular" color={textTitle} />
          <span style={{ fontSize: '16px', fontWeight: 700, color: textTitle }}>To-Do</span>
        </div>
        {!isAdding && (
          <button onClick={openAdd} style={iconBtnStyle}>
            <Plus size={20} weight="bold" color={textTitle} />
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{
        display: 'flex', flex: 1, flexDirection: 'column',
        borderRadius: '24px', backgroundColor: bgInner,
        padding: '16px', position: 'relative', overflow: 'visible',
      }}>
        <AnimatePresence mode="wait">

          {/* ── Todo list ── */}
          {!isAdding && hasTodos && (
            <motion.div
              key="todo-list"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              {loadingTodos ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                  <Spinner size={24} style={{ animation: 'spin 1s linear infinite' }} color={textSec} />
                </div>
              ) : (
                todos.map(todo => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '10px 8px', borderRadius: '12px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.querySelector('.del-btn').style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.querySelector('.del-btn').style.opacity = '0'; }}
                  >
                    <button onClick={() => toggleTodo(todo)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: '1px' }}>
                      {todo.completed
                        ? <CheckCircle size={20} weight="fill" color={purple} />
                        : <Circle size={20} weight="regular" color={textSec} />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: '14px', fontWeight: 500, color: textTitle,
                        textDecoration: todo.completed ? 'line-through' : 'none',
                        opacity: todo.completed ? 0.5 : 1,
                        wordBreak: 'break-word',
                      }}>
                        {todo.text}
                      </span>
                      {todo.due_date && (
                        <span style={{ fontSize: '12px', color: purple, display: 'block', marginTop: '2px' }}>
                          <CalendarBlank size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
                          {new Date(todo.due_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {todo.recurring && todo.recurring !== 'None' && ` · ${todo.recurring}`}
                        </span>
                      )}
                    </div>
                    <button
                      className="del-btn"
                      onClick={() => deleteTodo(todo.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}
                    >
                      <Trash size={16} color={textSec} />
                    </button>
                  </motion.div>
                ))
              )}
              {/* Add more button */}
              <button
                onClick={openAdd}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: textSec, fontSize: '13px', fontWeight: 500,
                  padding: '10px 8px', borderRadius: '8px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = purple}
                onMouseLeave={e => e.currentTarget.style.color = textSec}
              >
                <Plus size={14} /> Add task
              </button>
            </motion.div>
          )}

          {/* ── Empty state ── */}
          {!isAdding && !hasTodos && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={openAdd}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '16px',
                cursor: 'pointer', borderRadius: '16px', padding: '24px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* Illustration */}
              <div style={{ position: 'relative', width: '120px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ position: 'absolute', bottom: 10, width: '100px', height: '20px', backgroundColor: isDark ? '#1F2937' : '#E5E7EB', borderRadius: '50%' }} />
                <div style={{
                  position: 'absolute', bottom: 25, width: '90px', height: '60px',
                  backgroundColor: isDark ? '#374151' : '#F3F4F6',
                  borderRadius: '8px', display: 'flex', flexDirection: 'column',
                  padding: '10px 8px', gap: '8px',
                  border: `1px solid ${isDark ? '#4B5563' : '#E5E7EB'}`,
                }}>
                  {[45, 30, 38].map((w, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: `1px solid ${isDark ? '#9CA3AF' : '#D1D5DB'}` }} />
                      <div style={{ height: '4px', width: `${w}px`, backgroundColor: isDark ? '#6B7280' : '#D1D5DB', borderRadius: '2px' }} />
                    </div>
                  ))}
                </div>
                <div style={{
                  position: 'absolute', top: 5, right: 5,
                  width: '28px', height: '28px',
                  backgroundColor: isDark ? '#4B5563' : '#D1D5DB',
                  borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isDark ? '#F9FAFB' : '#4B5563', fontWeight: 'bold', fontSize: '14px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}>?</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: textTitle }}>No Tasks yet</h3>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: textSec }}>Tap to add your first task</p>
              </div>
            </motion.div>
          )}

          {/* ── Add task panel ── */}
          {isAdding && (
            <motion.div
              key="add-task"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
            >
              {/* Input */}
              <input
                ref={inputRef}
                value={taskText}
                onChange={handleInput}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') cancelAdd(); }}
                placeholder="Use @ to tag materials & folders"
                style={{
                  width: '100%', border: 'none', background: 'transparent',
                  fontSize: '16px', color: textTitle, outline: 'none',
                  fontStyle: taskText.length === 0 ? 'italic' : 'normal',
                  padding: '8px 0', fontFamily: 'inherit',
                }}
              />

              {/* Selected tags pills */}
              {(selectedMat || selectedCrs || dueDate) && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {selectedMat && (
                    <span style={tagPillStyle(purple, purpleLight)}>
                      <Database size={12} /> {selectedMat.label}
                      <button onClick={() => setSelectedMat(null)} style={pillXStyle}><X size={10} /></button>
                    </span>
                  )}
                  {selectedCrs && (
                    <span style={tagPillStyle('#3B82F6', isDark ? 'rgba(59,130,246,0.2)' : '#DBEAFE')}>
                      <Folder size={12} /> {selectedCrs.label}
                      <button onClick={() => setSelectedCrs(null)} style={pillXStyle}><X size={10} /></button>
                    </span>
                  )}
                  {dueDate && (
                    <span style={tagPillStyle('#10B981', isDark ? 'rgba(16,185,129,0.2)' : '#D1FAE5')}>
                      <CalendarBlank size={12} /> {formatDate(dueDate)}
                      {recurring !== 'None' && ` · ${recurring}`}
                      <button onClick={() => { setDueDate(null); setRecurring('None'); }} style={pillXStyle}><X size={10} /></button>
                    </span>
                  )}
                </div>
              )}

              {/* @ Tag Popover */}
              <AnimatePresence>
                {showTagMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', top: '44px', left: 0,
                      width: '100%', maxWidth: '300px',
                      backgroundColor: bgInner, border: `1px solid ${border}`,
                      borderRadius: '14px',
                      boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)',
                      zIndex: 50, maxHeight: '220px', overflowY: 'auto', padding: '6px 0',
                    }}
                  >
                    {loadingTags ? (
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <Spinner size={20} style={{ animation: 'spin 1s linear infinite' }} color={textSec} />
                      </div>
                    ) : tags.length === 0 ? (
                      <div style={{ padding: '14px 16px', color: textSec, fontSize: '13px' }}>No materials or folders found.</div>
                    ) : (
                      tags.map(tag => (
                        <div
                          key={tag.id}
                          onClick={() => selectTag(tag)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', cursor: 'pointer', transition: 'background-color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {tag.type === 'material'
                            ? <Database size={15} color="#E85D04" />
                            : <Folder size={15} color="#3B82F6" />}
                          <span style={{ fontSize: '13px', fontWeight: 500, color: textTitle, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tag.label}
                          </span>
                          <span style={{ fontSize: '10px', color: textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {tag.type}
                          </span>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', margin: '14px 0', flexWrap: 'wrap' }}>
                {/* Materials */}
                <button
                  style={actionBtnStyle(border, textTitle)}
                  onClick={() => { setTaskText(p => p.trimEnd() + ' @'); setShowTagMenu(true); setShowDateMenu(false); setTimeout(() => inputRef.current?.focus(), 50); }}
                >
                  <Database size={14} /> Materials
                </button>
                {/* Folders */}
                <button
                  style={actionBtnStyle(border, textTitle)}
                  onClick={() => { setTaskText(p => p.trimEnd() + ' @'); setShowTagMenu(true); setShowDateMenu(false); setTimeout(() => inputRef.current?.focus(), 50); }}
                >
                  <Folder size={14} /> Folders
                </button>
                {/* Date */}
                <div style={{ position: 'relative' }}>
                  <button
                    style={{ ...actionBtnStyle(border, dueDate ? purple : textTitle), borderColor: dueDate ? purple : border }}
                    onClick={() => { setShowDateMenu(p => !p); setShowTagMenu(false); }}
                  >
                    <CalendarBlank size={14} /> {dueDate ? formatDate(dueDate) : 'Date'}
                  </button>

                  {/* Date Popover */}
                  <AnimatePresence>
                    {showDateMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                          width: '268px', backgroundColor: bgInner,
                          border: `1px solid ${border}`, borderRadius: '16px',
                          boxShadow: '0 20px 40px -8px rgba(0,0,0,0.15)',
                          zIndex: 60, padding: '16px', cursor: 'default',
                        }}
                      >
                        {/* Month nav */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <button onClick={prevMonth} style={calNavBtn(border, textTitle)}><CaretLeft size={14} /></button>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: textTitle }}>{MONTH_NAMES[calMonth]} {calYear}</span>
                          <button onClick={nextMonth} style={calNavBtn(border, textTitle)}><CaretRight size={14} /></button>
                        </div>

                        {/* Day grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', textAlign: 'center', marginBottom: '10px' }}>
                          {['M','T','W','T','F','S','S'].map((d, i) => (
                            <span key={i} style={{ fontSize: '11px', fontWeight: 600, color: textSec, paddingBottom: '6px' }}>{d}</span>
                          ))}
                          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const isSelected = dueDate &&
                              dueDate.getFullYear() === calYear &&
                              dueDate.getMonth() === calMonth &&
                              dueDate.getDate() === day;
                            const isToday = new Date().getFullYear() === calYear &&
                              new Date().getMonth() === calMonth &&
                              new Date().getDate() === day;
                            return (
                              <button
                                key={day}
                                onClick={() => selectDay(day)}
                                style={{
                                  width: '30px', height: '30px', borderRadius: '50%',
                                  margin: '0 auto', background: isSelected ? purple : 'transparent',
                                  border: isToday && !isSelected ? `1px solid ${purple}` : 'none',
                                  cursor: 'pointer', fontSize: '13px',
                                  color: isSelected ? '#fff' : (isToday ? purple : textTitle),
                                  fontWeight: isSelected || isToday ? 700 : 400,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'background-color 0.12s',
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = hoverBg; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>

                        <div style={{ height: '1px', backgroundColor: border, margin: '0 -16px 12px' }} />

                        {/* No date */}
                        <button
                          onClick={() => { setDueDate(null); setRecurring('None'); setShowDateMenu(false); }}
                          style={calActionBtn(textSec, hoverBg)}
                        >
                          <CalendarBlank size={15} style={{ opacity: 0.6 }} /> No date
                        </button>

                        {/* Recurring */}
                        <button
                          onClick={() => setShowRecurring(p => !p)}
                          style={{ ...calActionBtn(textSec, hoverBg), justifyContent: 'space-between', width: '100%', backgroundColor: showRecurring ? hoverBg : 'transparent' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Repeat size={15} /> Recurring task
                            {recurring !== 'None' && <span style={{ fontSize: '11px', color: purple, fontWeight: 600 }}>{recurring}</span>}
                          </div>
                          <CaretRight size={12} style={{ transform: showRecurring ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </button>

                        <AnimatePresence>
                          {showRecurring && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}
                            >
                              {RECURRING_OPTIONS.map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => { setRecurring(opt); setShowRecurring(false); }}
                                  style={{
                                    width: '100%', textAlign: 'left',
                                    padding: '8px 12px 8px 32px',
                                    background: recurring === opt ? (isDark ? '#374151' : '#F3F4F6') : 'transparent',
                                    border: 'none', color: recurring === opt ? purple : textTitle,
                                    fontSize: '13px', cursor: 'pointer', borderRadius: '8px',
                                    fontWeight: recurring === opt ? 600 : 400,
                                  }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Save / Cancel */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                marginTop: 'auto', borderTop: `1px solid ${border}`, paddingTop: '16px',
              }}>
                <button onClick={cancelAdd} style={cancelBtnStyle(border, textTitle)}>Cancel</button>
                <button
                  onClick={handleAdd}
                  disabled={!taskText.trim() || saving}
                  style={{
                    padding: '10px 0', borderRadius: '12px', border: 'none',
                    backgroundColor: !taskText.trim() ? (isDark ? '#374151' : '#E5E7EB') : purpleLight,
                    color: !taskText.trim() ? textSec : purple,
                    fontSize: '14px', fontWeight: 600,
                    cursor: !taskText.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  {saving ? <Spinner size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} weight="bold" />}
                  {saving ? 'Saving…' : 'Add task'}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Shared style helpers ─────────────────────────────────────────────────────
const iconBtnStyle = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '4px', borderRadius: '50%',
};

const actionBtnStyle = (border, color) => ({
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '6px 12px', borderRadius: '8px', border: `1px solid ${border}`,
  background: 'transparent', color, fontSize: '13px', fontWeight: 500, cursor: 'pointer',
});

const cancelBtnStyle = (border, color) => ({
  padding: '10px 0', borderRadius: '12px', border: `1px solid ${border}`,
  background: 'transparent', color, fontSize: '14px', fontWeight: 600, cursor: 'pointer',
});

const calNavBtn = (border, color) => ({
  width: '28px', height: '28px', borderRadius: '8px',
  border: `1px solid ${border}`, background: 'transparent',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color,
});

const calActionBtn = (color, hoverBg) => ({
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '8px', borderRadius: '8px', border: 'none',
  background: 'transparent', color, fontSize: '14px',
  fontWeight: 500, cursor: 'pointer', width: '100%',
});

const tagPillStyle = (color, bg) => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '3px 8px 3px 6px', borderRadius: '20px',
  backgroundColor: bg, color, fontSize: '12px', fontWeight: 600,
});

const pillXStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', padding: 0, marginLeft: '2px',
  color: 'inherit', opacity: 0.7,
};
