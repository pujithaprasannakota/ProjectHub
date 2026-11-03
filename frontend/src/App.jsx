import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Plus, Search, Trash2, Pencil, X, Users, CalendarDays, ListTodo } from "lucide-react";
import api from "./api";

const emptyProject = { title: "", description: "", dueDate: "" };
const emptyTask = { title: "", description: "", project: "", priority: "Medium", dueDate: "" };

function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setError("");
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      localStorage.setItem("projecthub_token", data.token);
      onAuth(data.user);
    } catch (err) { setError(err.response?.data?.message || "Unable to connect. Is the backend running?"); }
  };
  return <div className="auth-wrap"><form className="auth-card" onSubmit={submit}>
    <div className="brand-mark">P</div><p className="eyebrow">STUDENT WORKSPACE</p>
    <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
    <p className="muted">Plan projects. Organize tasks. Work better together.</p>
    {mode === "register" && <label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}
    <label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@college.edu"/></label>
    <label>Password<input type="password" minLength="6" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 6 characters"/></label>
    {error && <p className="error">{error}</p>}
    <button className="primary full">{mode === "login" ? "Sign in" : "Create account"}</button>
    <p className="switch">{mode === "login" ? "New to ProjectHub?" : "Already have an account?"} <button type="button" className="link" onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}}>{mode==="login"?"Create account":"Sign in"}</button></p>
  </form></div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState("Overview");
  const [query, setQuery] = useState("");
  const [projectModal, setProjectModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("projecthub_token");
    if (!token) { setReady(true); return; }
    api.get("/auth/me").then(({data})=>setUser(data.user)).catch(()=>localStorage.removeItem("projecthub_token")).finally(()=>setReady(true));
  }, []);

  const load = async () => {
    const [p, t] = await Promise.all([api.get("/projects"), api.get("/tasks")]);
    setProjects(p.data); setTasks(t.data);
  };
  useEffect(() => { if (user) load().catch(()=>setNotice("Could not load data. Check your backend connection.")); }, [user]);

  const filteredProjects = useMemo(() => projects.filter(p => p.title.toLowerCase().includes(query.toLowerCase())), [projects, query]);
  const completed = tasks.filter(t=>t.status==="Completed").length;
  const inProgress = tasks.filter(t=>t.status==="In Progress").length;
  const todo = tasks.filter(t=>t.status==="Todo").length;
  const progress = tasks.length ? Math.round(completed/tasks.length*100) : 0;

  const logout = () => { localStorage.removeItem("projecthub_token"); setUser(null); setProjects([]); setTasks([]); };
  const saveProject = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) await api.put(`/projects/${editingProject}`, projectForm);
      else await api.post("/projects", projectForm);
      setProjectModal(false); setProjectForm(emptyProject); setEditingProject(null); await load(); setNotice("Project saved successfully.");
    } catch (err) { setNotice(err.response?.data?.message || "Could not save project."); }
  };
  const saveTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) await api.patch(`/tasks/${editingTask}`, taskForm);
      else await api.post("/tasks", taskForm);
      setTaskModal(false); setTaskForm(emptyTask); setEditingTask(null); await load(); setNotice("Task saved successfully.");
    } catch (err) { setNotice(err.response?.data?.message || "Could not save task."); }
  };
  const editProject = (p) => { setProjectForm({title:p.title,description:p.description||"",dueDate:p.dueDate?p.dueDate.slice(0,10):""}); setEditingProject(p._id); setProjectModal(true); };
  const editTask = (t) => { setTaskForm({title:t.title,description:t.description||"",project:t.project?._id||t.project,priority:t.priority,dueDate:t.dueDate?t.dueDate.slice(0,10):""}); setEditingTask(t._id); setTaskModal(true); };
  const deleteProject = async (id) => { if (!confirm("Delete this project and its tasks?")) return; await api.delete(`/projects/${id}`); await load(); };
  const deleteTask = async (id) => { if (!confirm("Delete this task?")) return; await api.delete(`/tasks/${id}`); await load(); };
  const moveTask = async (t, status) => { await api.patch(`/tasks/${t._id}`, {status}); await load(); };
  const toggleProject = async (p) => { await api.put(`/projects/${p._id}`, {status: p.status==="Completed"?"Active":"Completed"}); await load(); };

  if (!ready) return <div className="loading">Loading ProjectHub…</div>;
  if (!user) return <Auth onAuth={setUser}/>;

  const nav = [{name:"Overview",icon:LayoutDashboard},{name:"Projects",icon:FolderKanban},{name:"My Tasks",icon:CheckSquare}];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="logo"><span className="brand-mark small">P</span><span>Project<span className="logo-light">Hub</span></span></div>
      <p className="nav-label">WORKSPACE</p>
      {nav.map(n=><button key={n.name} className={`nav-item ${page===n.name?"active":""}`} onClick={()=>setPage(n.name)}><n.icon size={18}/>{n.name}</button>)}
      <div className="sidebar-bottom"><div className="avatar">{user.name?.[0]?.toUpperCase()}</div><div className="user-meta"><b>{user.name}</b><span>Student account</span></div><button className="icon-btn logout" title="Sign out" onClick={logout}><LogOut size={17}/></button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><p className="eyebrow">STUDENT WORKSPACE</p><h2>{page}</h2></div><div className="top-actions"><div className="search"><Search size={17}/><input placeholder="Search projects..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="avatar">{user.name?.[0]?.toUpperCase()}</div></div></header>
      {notice && <div className="notice" onClick={()=>setNotice("")}>{notice} <X size={15}/></div>}
      {page==="Overview" && <section>
        <div className="welcome"><div><p className="eyebrow">YOUR PRODUCTIVITY SPACE</p><h1>Good work starts with a plan, {user.name.split(" ")[0]}.</h1><p>Keep your academic projects moving forward.</p></div><button className="primary" onClick={()=>{setProjectForm(emptyProject);setEditingProject(null);setProjectModal(true)}}><Plus size={17}/> New project</button></div>
        <div className="stats">
          <Stat icon={FolderKanban} label="Total projects" value={projects.length} tone="purple"/>
          <Stat icon={ListTodo} label="Tasks to do" value={todo} tone="orange"/>
          <Stat icon={CheckSquare} label="In progress" value={inProgress} tone="blue"/>
          <Stat icon={CheckSquare} label="Completed" value={completed} tone="green"/>
        </div>
        <div className="content-grid"><div className="panel"><div className="panel-head"><div><h3>Recent projects</h3><p className="muted">Your latest workspace activity</p></div><button className="text-btn" onClick={()=>setPage("Projects")}>View all</button></div>
          {filteredProjects.slice(0,4).length===0?<Empty text="No projects yet. Create your first project to get started."/>:filteredProjects.slice(0,4).map(p=><ProjectRow key={p._id} project={p} onEdit={()=>editProject(p)} onDelete={()=>deleteProject(p._id)} onStatus={()=>toggleProject(p)}/>)}
        </div><div className="panel progress-panel"><h3>Task progress</h3><p className="muted">Overall completion</p><div className="donut" style={{"--progress":`${progress}%`}}><div><strong>{progress}%</strong><span>completed</span></div></div><div className="legend"><span><i className="dot green-dot"/>Completed <b>{completed}</b></span><span><i className="dot blue-dot"/>In progress <b>{inProgress}</b></span><span><i className="dot orange-dot"/>To do <b>{todo}</b></span></div></div></div>
      </section>}
      {page==="Projects" && <section><div className="section-heading"><div><h1>Your projects</h1><p className="muted">Create and manage your academic work.</p></div><button className="primary" onClick={()=>{setProjectForm(emptyProject);setEditingProject(null);setProjectModal(true)}}><Plus size={17}/> New project</button></div><div className="project-grid">{filteredProjects.map(p=><ProjectCard key={p._id} project={p} count={tasks.filter(t=>(t.project?._id||t.project)===p._id).length} onEdit={()=>editProject(p)} onDelete={()=>deleteProject(p._id)} onStatus={()=>toggleProject(p)}/>)}</div>{filteredProjects.length===0&&<Empty text="No matching projects found. Create a project to begin."/ >}</section>}
      {page==="My Tasks" && <section><div className="section-heading"><div><h1>Task board</h1><p className="muted">Move work forward, one task at a time.</p></div><button className="primary" disabled={!projects.length} onClick={()=>{setTaskForm({...emptyTask,project:projects[0]._id});setEditingTask(null);setTaskModal(true)}}><Plus size={17}/> Add task</button></div><div className="kanban">{[{status:"Todo",label:"To do",color:"orange"},{status:"In Progress",label:"In progress",color:"blue"},{status:"Completed",label:"Completed",color:"green"}].map(col=><div className="kanban-col" key={col.status}><div className="kanban-title"><span><i className={`dot ${col.color}-dot`}/>{col.label}</span><b>{tasks.filter(t=>t.status===col.status).length}</b></div>{tasks.filter(t=>t.status===col.status).map(t=><div className="task-card" key={t._id}><div className="task-top"><span className={`priority ${t.priority.toLowerCase()}`}>{t.priority}</span><button className="icon-btn" onClick={()=>editTask(t)}><Pencil size={14}/></button></div><h4>{t.title}</h4><p>{t.project?.title||"Project"}</p>{t.dueDate&&<small><CalendarDays size={13}/> {new Date(t.dueDate).toLocaleDateString()}</small>}<div className="task-actions"><select value={t.status} onChange={e=>moveTask(t,e.target.value)} aria-label="Change task status"><option value="Todo">To do</option><option value="In Progress">In progress</option><option value="Completed">Completed</option></select><button className="text-btn" onClick={()=>moveTask(t,t.status==="Completed"?"Todo":"Completed")}>{t.status==="Completed"?"Mark active":"Mark completed"}</button><button className="icon-btn danger" onClick={()=>deleteTask(t._id)}><Trash2 size={14}/></button></div></div>)}</div>)}</div></section>}
    </main>
    {projectModal&&<Modal title={editingProject?"Edit project":"Create a project"} onClose={()=>setProjectModal(false)}><form onSubmit={saveProject}><label>Project title<input required autoFocus value={projectForm.title} onChange={e=>setProjectForm({...projectForm,title:e.target.value})} placeholder="e.g. Final year project"/></label><label>Description<textarea value={projectForm.description} onChange={e=>setProjectForm({...projectForm,description:e.target.value})} placeholder="What is this project about?"/></label><label>Due date<input type="date" value={projectForm.dueDate} onChange={e=>setProjectForm({...projectForm,dueDate:e.target.value})}/></label><button className="primary full">Save project</button></form></Modal>}
    {taskModal&&<Modal title={editingTask?"Edit task":"Create a task"} onClose={()=>setTaskModal(false)}><form onSubmit={saveTask}><label>Task title<input required autoFocus value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})} placeholder="e.g. Design the login page"/></label><label>Project<select required value={taskForm.project} onChange={e=>setTaskForm({...taskForm,project:e.target.value})}><option value="">Choose a project</option>{projects.map(p=><option key={p._id} value={p._id}>{p.title}</option>)}</select></label><label>Description<textarea value={taskForm.description} onChange={e=>setTaskForm({...taskForm,description:e.target.value})}/></label><div className="form-row"><label>Priority<select value={taskForm.priority} onChange={e=>setTaskForm({...taskForm,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Due date<input type="date" value={taskForm.dueDate} onChange={e=>setTaskForm({...taskForm,dueDate:e.target.value})}/></label></div><button className="primary full">Save task</button></form></Modal>}
  </div>;
}

function Stat({icon:Icon,label,value,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function ProjectRow({project,onEdit,onDelete,onStatus}) { return <div className="project-row"><div className="project-symbol"><FolderKanban size={18}/></div><div className="row-info"><b>{project.title}</b><span>{project.description||"No description added"}</span><span className={`priority ${project.status==="Completed"?"low":"medium"}`}>{project.status||"Active"}</span></div><button className="text-btn" onClick={onStatus}>{project.status==="Completed"?"Mark active":"Mark completed"}</button><button className="icon-btn" onClick={onEdit}><Pencil size={15}/></button><button className="icon-btn danger" onClick={onDelete}><Trash2 size={15}/></button></div>; }
function ProjectCard({project,count,onEdit,onDelete,onStatus}) { return <div className="project-card"><div className="card-top"><div className="project-symbol"><FolderKanban size={19}/></div><div><button className="icon-btn" onClick={onEdit}><Pencil size={15}/></button><button className="icon-btn danger" onClick={onDelete}><Trash2 size={15}/></button></div></div><h3>{project.title}</h3><p>{project.description||"A new project workspace."}</p><span className={`priority ${project.status==="Completed"?"low":"medium"}`}>{project.status||"Active"}</span><div className="card-foot"><span><CheckSquare size={14}/>{count} tasks</span><span><Users size={14}/>{project.members?.length||1} members</span><button className="text-btn" onClick={onStatus}>{project.status==="Completed"?"Mark active":"Mark completed"}</button></div></div>; }
function Empty({text}) { return <div className="empty"><FolderKanban size={28}/><p>{text}</p></div>; }
function Modal({title,onClose,children}) { return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>{children}</div></div>; }

export default App;
