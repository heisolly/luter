import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Plus, Trash, CheckCircle, XCircle, Compass } from '@phosphor-icons/react'

export default function AdminTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [newTask, setNewTask] = useState({
    title: '',
    coins_reward: 10,
    xp_reward: 10,
    action_url: '',
    order_index: 0,
    is_active: true
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    const { data, error: fetchErr } = await supabase
      .from('explore_tasks')
      .select('*')
      .order('order_index', { ascending: true })

    if (fetchErr) {
      if (fetchErr.code === '42P01') {
        setError('Table "explore_tasks" does not exist yet. Please run the provided SQL in Supabase.')
      } else {
        setError(fetchErr.message)
      }
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }

    const handleSeedTasks = async () => {
    if (!confirm('This will insert 100 premade tasks into the database. Proceed?')) return;
    setSaving(true);
    
    const templates = [
      { title: "Complete your <strong>Profile</strong> setup", url: "/profile" },
      { title: "Set a <strong>Daily Study Goal</strong>", url: "/settings" },
      { title: "Explore the <strong>Backpack</strong>", url: "/backpack" },
      { title: "Create your first <strong>Folder</strong>", url: "/backpack" },
      { title: "Upload a <strong>PDF Document</strong>", url: "/upload" },
      { title: "Read a document in the <strong>Workstation</strong>", url: "/workstation" },
      { title: "Create your first <strong>Flashcard Deck</strong>", url: "/decks?new=1" },
      { title: "Study 10 <strong>Flashcards</strong>", url: "/decks" },
      { title: "Take a <strong>Mock Exam</strong>", url: "/mock-exam" },
      { title: "Write a <strong>Study Note</strong>", url: "/notes?new=1" },
      { title: "Use <strong>AI Chat</strong> to understand a topic", url: "/ai-chat" },
      { title: "Check your <strong>Analytics</strong>", url: "/analytics" },
      { title: "Visit the <strong>Coin Store</strong>", url: "/store" },
      { title: "Equip a new <strong>Avatar</strong>", url: "/profile" },
      { title: "Join a <strong>Study Group</strong>", url: "/study-groups" },
      { title: "Send a message in a <strong>Group Chat</strong>", url: "/study-groups" },
      { title: "Play a match of <strong>Knowledge Heist</strong>", url: "/heist" },
      { title: "Compete in the <strong>Playground</strong>", url: "/compete" },
      { title: "Refer a <strong>Friend</strong> to Luter", url: "/refer" },
      { title: "Read the <strong>Wall of Love</strong>", url: "/wall-of-love" },
    ];
    const generatedTasks = [];
    let orderIndex = tasks.length > 0 ? tasks[tasks.length - 1].order_index + 1 : 1;

    templates.forEach(t => {
      generatedTasks.push({ title: t.title, action_url: t.url, coins_reward: Math.floor(Math.random() * 15) + 5, xp_reward: Math.floor(Math.random() * 20) + 10, order_index: orderIndex++, is_active: true });
    });
    [3, 7, 14, 21, 30, 50, 100, 150, 200, 365].forEach(days => {
      generatedTasks.push({ title: "Reach a <strong>" + days + "-Day Streak</strong>", action_url: "/streak", coins_reward: days * 2, xp_reward: days * 5, order_index: orderIndex++, is_active: true });
    });
    for (let lvl = 2; lvl <= 20; lvl++) {
      generatedTasks.push({ title: "Reach <strong>Level " + lvl + "</strong>", action_url: "/profile", coins_reward: lvl * 5, xp_reward: lvl * 10, order_index: orderIndex++, is_active: true });
    }
    [50, 100, 250, 500, 1000].forEach(amount => {
      generatedTasks.push({ title: "Study <strong>" + amount + " Flashcards</strong>", action_url: "/decks", coins_reward: Math.floor(amount / 5), xp_reward: Math.floor(amount / 2), order_index: orderIndex++, is_active: true });
    });
    [5, 10, 25, 50].forEach(amount => {
      generatedTasks.push({ title: "Complete <strong>" + amount + " Mock Exams</strong>", action_url: "/mock-exam", coins_reward: amount * 5, xp_reward: amount * 10, order_index: orderIndex++, is_active: true });
    });
    let fillerCount = 100 - generatedTasks.length;
    for (let i = 1; i <= fillerCount; i++) {
      generatedTasks.push({ title: "Complete <strong>Daily Study Challenge #" + i + "</strong>", action_url: "/home", coins_reward: 10, xp_reward: 20, order_index: orderIndex++, is_active: true });
    }

    const { error: insertErr } = await supabase.from('explore_tasks').insert(generatedTasks);
    if (insertErr) {
      alert('Error seeding tasks: ' + insertErr.message);
    } else {
      alert('Successfully seeded 100 tasks!');
      fetchTasks();
    }
    setSaving(false);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { data, error: insertErr } = await supabase
      .from('explore_tasks')
      .insert([newTask])
      .select()

    if (insertErr) {
      alert('Error creating task: ' + insertErr.message)
    } else {
      setTasks([...tasks, data[0]].sort((a, b) => a.order_index - b.order_index))
      setNewTask({
        title: '',
        coins_reward: 10,
        xp_reward: 10,
        action_url: '',
        order_index: tasks.length > 0 ? tasks[tasks.length - 1].order_index + 1 : 0,
        is_active: true
      })
    }
    setSaving(false)
  }

  const toggleTaskActive = async (id, currentStatus) => {
    const { error: updateErr } = await supabase
      .from('explore_tasks')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (!updateErr) {
      setTasks(tasks.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t))
    }
  }

  const deleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    const { error: delErr } = await supabase
      .from('explore_tasks')
      .delete()
      .eq('id', id)

    if (!delErr) {
      setTasks(tasks.filter(t => t.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="adm-main-inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="adm-muted">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="adm-main-inner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Compass size={32} weight="fill" className="text-emerald-500" />
        <h1 className="adm-page-title">Explore Tasks Manager</h1>
        <button onClick={handleSeedTasks} disabled={saving} className="adm-btn adm-btn--secondary" style={{ marginLeft: 'auto', background: '#3b82f6', color: 'white', border: 'none' }}>
          Seed 100 Tasks
        </button>
      </div>

      {error && (
        <div className="adm-error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="adm-card" style={{ marginBottom: '32px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: 'var(--adm-text)' }}>Create New Task</h2>
        <form onSubmit={handleCreateTask} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-secondary)', marginBottom: '8px' }}>Task Title (HTML allowed, e.g. &lt;strong&gt;text&lt;/strong&gt;)</label>
            <input 
              required
              type="text" 
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
              className="adm-input"
              style={{ width: '100%' }}
              placeholder="e.g. Upload a <strong>PDF</strong>"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-secondary)', marginBottom: '8px' }}>Coins Reward</label>
            <input 
              type="number" 
              value={newTask.coins_reward}
              onChange={e => setNewTask({...newTask, coins_reward: parseInt(e.target.value)})}
              className="adm-input"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-secondary)', marginBottom: '8px' }}>XP Reward</label>
            <input 
              type="number" 
              value={newTask.xp_reward}
              onChange={e => setNewTask({...newTask, xp_reward: parseInt(e.target.value)})}
              className="adm-input"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-secondary)', marginBottom: '8px' }}>Action URL (Optional, e.g. /decks?new=1)</label>
            <input 
              type="text" 
              value={newTask.action_url}
              onChange={e => setNewTask({...newTask, action_url: e.target.value})}
              className="adm-input"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-secondary)', marginBottom: '8px' }}>Display Order Index</label>
            <input 
              type="number" 
              value={newTask.order_index}
              onChange={e => setNewTask({...newTask, order_index: parseInt(e.target.value)})}
              className="adm-input"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'end', marginBottom: '10px' }}>
            <input 
              type="checkbox" 
              id="is_active"
              checked={newTask.is_active}
              onChange={e => setNewTask({...newTask, is_active: e.target.checked})}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="is_active" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--adm-text)' }}>Active (Visible to users)</label>
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
            <button 
              type="submit" 
              disabled={saving}
              className="adm-btn adm-btn--primary"
            >
              <Plus weight="bold" /> {saving ? 'Saving...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Task Title</th>
                <th>Rewards</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td className="adm-mono">{task.order_index}</td>
                  <td>
                    <div dangerouslySetInnerHTML={{ __html: task.title }} style={{ fontWeight: 600, color: 'var(--adm-text)' }} />
                    {task.action_url && <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '4px' }}>{task.action_url}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#d97706', marginBottom: '2px' }}>{task.coins_reward} Coins</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>{task.xp_reward} XP</div>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleTaskActive(task.id, task.is_active)}
                      className={task.is_active ? 'adm-pill adm-pill--ok' : 'adm-pill adm-pill--warn'}
                      style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {task.is_active ? <CheckCircle weight="fill" /> : <XCircle weight="fill" />}
                      {task.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="adm-btn adm-btn--ghost"
                      title="Delete Task"
                      style={{ color: '#ef4444', borderColor: '#fee2e2' }}
                    >
                      <Trash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && !error && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--adm-text-muted)' }}>No tasks found. Create one above!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
