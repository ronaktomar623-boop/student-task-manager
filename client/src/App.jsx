import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDown, ArrowRight, Bell, BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown, Circle, Clock3, Command, Flame, GraduationCap, LayoutDashboard, ListTodo, LoaderCircle, Menu, MoreHorizontal, Plus, Search, Settings2, Sparkles, Target, Trash2, X } from 'lucide-react';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const API = `${API_ORIGIN}/api`;
const seed = [
  { id: 'a', title: 'Research paper: Climate & cities', description: 'Find sources and draft the first version.', subject: 'Environmental Science', due_date: '2026-11-20', priority: 'high', status: 'in_progress' },
  { id: 'b', title: 'Calculus problem set 08', description: 'Complete questions 1–12.', subject: 'Mathematics', due_date: '2026-11-19', priority: 'high', status: 'pending' },
  { id: 'c', title: 'Read chapter 6: The Great Gatsby', description: 'Read and make notes on key themes.', subject: 'Literature', due_date: '2026-11-22', priority: 'medium', status: 'pending' },
  { id: 'd', title: 'Chemistry lab report', description: 'Write up results and submit the report.', subject: 'Chemistry', due_date: '2026-11-24', priority: 'low', status: 'completed' },
];
const fmt = (date) => date ? new Date(`${String(date).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date';
const niceDay = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

function App() {
  const [tasks, setTasks] = useState([]);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState('All tasks');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState('');
  const [aiTask, setAiTask] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [form, setForm] = useState({ title: '', subject: 'Mathematics', due_date: '', priority: 'medium', description: '' });

  const load = async () => {
    try { const response = await fetch(`${API}/tasks`); if (!response.ok) throw new Error(); setTasks(await response.json()); setConnected(true); }
    catch { setTasks((current) => current.length ? current : seed); setConnected(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer); }, [toast]);

  const active = tasks.filter((task) => task.status !== 'completed');
  const completed = tasks.filter((task) => task.status === 'completed');
  const donePct = tasks.length ? Math.round(completed.length / tasks.length * 100) : 0;
  const visible = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === 'All tasks' || (filter === 'In progress' ? task.status === 'in_progress' : filter === 'Upcoming' ? task.status !== 'completed' : task.status === 'completed');
    return matchesFilter && `${task.title} ${task.subject}`.toLowerCase().includes(search.toLowerCase());
  }), [tasks, filter, search]);

  const addTask = async (event) => {
    event.preventDefault();
    const payload = { ...form, due_date: form.due_date || null };
    try {
      const response = await fetch(`${API}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error();
      const task = await response.json(); setTasks((items) => [task, ...items]); setConnected(true);
    } catch {
      setTasks((items) => [{ ...payload, id: crypto.randomUUID(), status: 'pending' }, ...items]);
      setToast('Saved in this preview. Connect the API to store it in MySQL.');
    }
    setModal(false); setForm({ title: '', subject: 'Mathematics', due_date: '', priority: 'medium', description: '' });
  };

  const toggleTask = async (task) => {
    const status = task.status === 'completed' ? 'pending' : 'completed';
    setTasks((items) => items.map((item) => item.id === task.id ? { ...item, status } : item));
    try { await fetch(`${API}/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); } catch { setToast('Preview updated. Connect the API to save changes.'); }
  };
  const removeTask = async (task) => {
    setTasks((items) => items.filter((item) => item.id !== task.id));
    try { await fetch(`${API}/tasks/${task.id}`, { method: 'DELETE' }); } catch { setToast('Task removed from this preview.'); }
  };
  const breakdown = async (task) => {
    setAiTask(task); setSteps([]); setLoadingAI(true);
    try {
      const response = await fetch(`${API}/ai/breakdown`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: task.title, description: task.description }) });
      const result = await response.json(); if (!response.ok) throw new Error(); setSteps(result.steps);
    } catch { setSteps(['Review the requirements and clarify what you need to deliver.', 'Gather your notes, references, and materials.', 'Work through the main task in a focused session.', 'Review your work and prepare it for submission.']); }
    finally { setLoadingAI(false); }
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><GraduationCap size={21}/></div><span>studyflow</span><button className="mobile-close icon-button" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE <button aria-label="Workspace options"><MoreHorizontal size={16}/></button></div>
      <button className="workspace-switch"><div className="workspace-avatar">RK</div><span><b>Ronak &amp; Kavish's workspace</b><small>Student plan</small></span><ChevronDown size={15}/></button>
      <div className="nav-label">MENU</div>
      <nav className="nav-list">
        <button className="nav-item selected"><LayoutDashboard size={18}/><span>Overview</span></button>
        <button className={`nav-item ${filter === 'All tasks' ? 'subtle-active' : ''}`} onClick={() => setFilter('All tasks')}><ListTodo size={18}/><span>My tasks</span><em>{active.length}</em></button>
        <button className={`nav-item ${filter === 'Upcoming' ? 'subtle-active' : ''}`} onClick={() => setFilter('Upcoming')}><CalendarDays size={18}/><span>Upcoming</span></button>
        <button className={`nav-item ${filter === 'Completed' ? 'subtle-active' : ''}`} onClick={() => setFilter('Completed')}><CheckCircle2 size={18}/><span>Completed</span></button>
      </nav>
      <div className="nav-label subject-label">YOUR SUBJECTS <button aria-label="Add subject"><Plus size={15}/></button></div>
      <div className="subject-list"><button><i className="subject-dot violet"/>Mathematics<span>4</span></button><button><i className="subject-dot blue"/>Environmental Sci.<span>2</span></button><button><i className="subject-dot orange"/>Literature<span>3</span></button><button><i className="subject-dot green"/>Chemistry<span>2</span></button><button className="add-subject"><Plus size={14}/> Add subject</button></div>
      <div className="sidebar-spacer"/>
      <div className="streak-card"><div className="streak-top"><span><Flame size={17} fill="currentColor"/> Your streak</span><b>5 days</b></div><div className="streak-dots">{['M','T','W','T','F','S','S'].map((d,i)=><div key={i} className={i<5?'streak-done':''}>{i<5?<Check size={12}/>:d}</div>)}</div><p>You're building a great habit. Keep it up!</p></div>
      <button className="nav-item settings"><Settings2 size={18}/><span>Settings</span></button>
      <div className="profile"><div className="profile-photo">RK</div><div><b>Ronak &amp; Kavish</b><small>Student team</small></div><MoreHorizontal size={17}/></div>
    </aside>
    {mobileNav && <button className="scrim" aria-label="Close menu" onClick={() => setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu/></button><span>Workspace</span><span className="crumb-slash">/</span><b>Overview</b></div><div className="top-actions"><div className={`connection ${connected?'is-connected':''}`}><span/>{connected?'Database connected':'Preview mode'}</div><button className="icon-button command-key" aria-label="Keyboard shortcuts"><Command size={16}/></button><button className="icon-button notification" aria-label="Notifications"><Bell size={18}/><i/></button></div></header>
      <div className="page-content">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/>{niceDay}</div><h1>Welcome, Ronak &amp; Kavish <span className="wave">✦</span></h1><p>Let's make today count. Here's your study overview.</p></div><button className="primary-button" onClick={() => setModal(true)}><Plus size={17}/> New task</button></section>
        <section className="stats-grid">
          <div className="stat-card"><div className="stat-head"><span>Tasks to do</span><div className="stat-icon lavender"><ListTodo size={18}/></div></div><div className="stat-value">{active.length}<span className="stat-change"><ArrowDown size={13}/> 2</span></div><div className="stat-foot">2 fewer than last week</div><div className="mini-bars"><i/><i/><i/><i/><i/><i/><i className="bar-today"/><i/><i/><i/><i/><i/></div></div>
          <div className="stat-card"><div className="stat-head"><span>Due this week</span><div className="stat-icon peach"><Clock3 size={18}/></div></div><div className="stat-value">{active.filter((t)=>!t.due_date||new Date(`${String(t.due_date).slice(0,10)}T12:00:00`)-new Date()<7*86400000).length}<span className="stat-note">tasks</span></div><div className="stat-foot">Stay ahead of your deadlines</div><div className="deadline-line"><span style={{width:`${Math.max(12, Math.min(100, active.length*16))}%`}}/></div></div>
          <div className="stat-card"><div className="stat-head"><span>Completed</span><div className="stat-icon mint"><CheckCircle2 size={18}/></div></div><div className="stat-value">{donePct}<small>%</small></div><div className="stat-foot">{completed.length} of {tasks.length} tasks finished</div><div className="progress-line"><span style={{width:`${donePct}%`}}/></div></div>
          <div className="stat-card focus-card"><div className="stat-head"><span>Focus time</span><div className="stat-icon blue-soft"><Target size={18}/></div></div><div className="stat-value">3.5<span className="stat-note">hrs</span></div><div className="stat-foot">You've got this, keep going</div><div className="focus-spark"><svg viewBox="0 0 260 35" preserveAspectRatio="none"><path d="M0 28 C15 27,15 13,30 19 S50 29,65 16 S83 21,96 10 S115 16,127 9 S145 20,160 13 S179 20,191 6 S211 12,223 9 S240 18,260 2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M0 28 C15 27,15 13,30 19 S50 29,65 16 S83 21,96 10 S115 16,127 9 S145 20,160 13 S179 20,191 6 S211 12,223 9 S240 18,260 2 L260 35 L0 35Z" fill="currentColor" opacity=".08"/></svg></div></div>
        </section>
        <section className="content-grid">
          <div className="tasks-panel panel"><div className="panel-header"><div><h2>My tasks <span className="count-pill">{active.length}</span></h2><p>Keep your assignments moving forward.</p></div><button className="filter-button"><span><Activity size={15}/>{filter}</span><ChevronDown size={15}/><select aria-label="Filter tasks" value={filter} onChange={(e)=>setFilter(e.target.value)}><option>All tasks</option><option>In progress</option><option>Upcoming</option><option>Completed</option></select></button></div>
            <div className="task-toolbar"><div className="task-tabs"><button className="tab-active" onClick={()=>setFilter('All tasks')}>All <span>{tasks.length}</span></button><button onClick={()=>setFilter('In progress')}>In progress</button><button onClick={()=>setFilter('Completed')}>Completed</button></div><label className="search-box"><Search size={15}/><input placeholder="Search tasks..." value={search} onChange={(e)=>setSearch(e.target.value)}/><kbd>⌘ K</kbd></label></div>
            <div className="task-list">{visible.length ? visible.map((task)=><article className={`task-row ${task.status==='completed'?'task-complete':''}`} key={task.id}><button className={`task-check ${task.status==='completed'?'checked':''}`} aria-label={task.status==='completed'?'Mark incomplete':'Mark complete'} onClick={()=>toggleTask(task)}>{task.status==='completed'&&<Check size={13}/>}</button><div className="task-info"><div className="task-titleline"><h3>{task.title}</h3>{task.priority==='high'&&<span className="priority priority-high"><i/>High</span>}</div><div className="task-meta"><span className="subject-chip"><i className={`subject-dot ${task.subject==='Mathematics'?'violet':task.subject==='Chemistry'?'green':task.subject==='Literature'?'orange':'blue'}`}/>{task.subject}</span><span className="task-date"><CalendarDays size={13}/>{fmt(task.due_date)}</span>{task.status==='in_progress'&&<span className="status-chip">In progress</span>}</div></div><div className="task-actions"><button title="Break into steps" onClick={()=>breakdown(task)}><Sparkles size={16}/></button><button title="Delete task" onClick={()=>removeTask(task)}><Trash2 size={15}/></button></div></article>):<div className="empty-state"><div><CheckCircle2 size={22}/></div><b>All caught up</b><p>No tasks match this view. Add a task to get started.</p><button onClick={()=>setModal(true)}><Plus size={15}/> Add a task</button></div>}</div>
            <div className="panel-footer"><span>Showing <b>{visible.length}</b> of <b>{tasks.length}</b> tasks</span><button onClick={()=>setFilter('All tasks')}>View all tasks <ArrowRight size={14}/></button></div>
          </div>
          <aside className="right-column"><div className="ai-card"><div className="ai-orb"><Sparkles size={18}/></div><div className="ai-tag">STUDYFLOW AI</div><h2>A little help<br/>goes a long way.</h2><p>Turn big assignments into small, doable steps with your AI study buddy.</p><button onClick={()=>breakdown(active[0]||seed[0])}>Break down a task <ArrowRight size={15}/></button><div className="ai-decoration deco-one"/><div className="ai-decoration deco-two"/></div>
            <div className="week-card panel"><div className="week-head"><div><h3>This week</h3><p>Nov 16 – Nov 22</p></div><button aria-label="Calendar options"><MoreHorizontal size={18}/></button></div><div className="week-days">{['M','T','W','T','F','S','S'].map((d,i)=><div className={i===2?'today':''} key={i}><span>{d}</span><b>{16+i}</b>{[0,2,3,5].includes(i)&&<i/>}</div>)}</div><div className="week-summary"><div className="summary-icon"><BookOpen size={15}/></div><span><b>{active.length} tasks</b><small>on your plate this week</small></span><ArrowRight size={15}/></div></div>
            <div className="tip-card"><div className="tip-icon"><Sparkles size={15}/></div><div><span>STUDY TIP</span><p>Try the <b>Pomodoro technique</b>: 25 minutes of focus, then a 5-minute break.</p></div></div>
          </aside>
        </section>
        <footer className="page-footer"><span>Made for your next big idea <span>✳</span></span><span><i/> All changes saved</span></footer>
      </div>
    </main>

    {modal&&<div className="modal-backdrop" onMouseDown={(e)=>e.target===e.currentTarget&&setModal(false)}><form className="task-modal" onSubmit={addTask}><div className="modal-heading"><div><span className="modal-kicker">NEW ASSIGNMENT</span><h2>Add a task</h2><p>Break down your workload, one task at a time.</p></div><button type="button" className="icon-button" onClick={()=>setModal(false)} aria-label="Close"><X size={19}/></button></div><label className="field-label">Task title<input autoFocus required maxLength="180" placeholder="e.g. Prepare biology presentation" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/></label><label className="field-label">Description <span>Optional</span><textarea rows="3" placeholder="Add a few details to help you get started..." value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/></label><div className="field-row"><label className="field-label">Subject<select value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})}><option>Mathematics</option><option>Environmental Science</option><option>Literature</option><option>Chemistry</option><option>General</option></select></label><label className="field-label">Due date<input type="date" value={form.due_date} onChange={(e)=>setForm({...form,due_date:e.target.value})}/></label></div><label className="field-label">Priority<select value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setModal(false)}>Cancel</button><button className="primary-button" type="submit"><Plus size={16}/> Create task</button></div></form></div>}
    {aiTask&&<div className="modal-backdrop" onMouseDown={(e)=>e.target===e.currentTarget&&setAiTask(null)}><div className="task-modal ai-modal"><div className="modal-heading"><div><span className="modal-kicker ai-kicker"><Sparkles size={13}/> STUDYFLOW AI</span><h2>Let's make it doable.</h2><p>{aiTask.title}</p></div><button className="icon-button" onClick={()=>setAiTask(null)} aria-label="Close"><X size={19}/></button></div>{loadingAI?<div className="ai-loading"><LoaderCircle className="spinner" size={24}/>Thinking of a good place to start...</div>:<div className="ai-steps">{steps.map((step,i)=><div className="ai-step" key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{step}</p><Circle size={17}/></div>)}</div>}<div className="modal-actions"><button className="secondary-button" onClick={()=>breakdown(aiTask)}><Sparkles size={15}/> Try again</button><button className="primary-button" onClick={()=>setAiTask(null)}>Got it <Check size={15}/></button></div></div></div>}
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}<button onClick={()=>setToast('')} aria-label="Dismiss"><X size={15}/></button></div>}
  </div>;
}

export default App;
