import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Modal from '../components/Modal';
import KanbanBoard from '../components/KanbanBoard';
import TaskFilters, { filterTasks } from '../components/TaskFilters';
import ActivityFeed from '../components/ActivityFeed';
import { RoleBadge } from '../components/Badges';

const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    assignee: '',
    overdueOnly: false,
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    assignedTo: '',
    status: 'To Do',
  });
  const [memberEmail, setMemberEmail] = useState('');
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });

  // Registered users state for search and selection
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [addedMemberIds, setAddedMemberIds] = useState(new Set());
  const [showFallbackInvite, setShowFallbackInvite] = useState(false);

  const isAdmin = project?.userRole === 'Admin';
  const filteredTasks = filterTasks(tasks, filters);

  // Filter out registered users who are already project members
  const nonMembers = allUsers.filter((u) => {
    return !project?.members?.some((m) => {
      const memberId = m.user && typeof m.user === 'object' ? m.user._id : m.user;
      return memberId === u._id;
    });
  });

  const filteredUsers = nonMembers.filter(
    (u) =>
      u.name?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  const refreshDashboard = async () => {
    const [dashboardData, activityData] = await Promise.all([
      api.getDashboard(projectId),
      api.getProjectActivity(projectId),
    ]);
    setDashboard(dashboardData.dashboard);
    setActivities(activityData.activities);
  };

  const loadData = async () => {
    try {
      const [projectData, tasksData] = await Promise.all([
        api.getProject(projectId),
        api.getTasks(projectId),
      ]);
      setProject(projectData.project);
      setTasks(tasksData.tasks);
      setProjectForm({
        name: projectData.project.name,
        description: projectData.project.description || '',
      });
      await refreshDashboard();
    } catch (err) {
      console.error(err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  useEffect(() => {
    if (showMemberModal) {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        setError('');
        try {
          const data = await api.getUsers();
          setAllUsers(data.users || []);
        } catch (err) {
          setError(err.message || 'Failed to load registered users');
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
      setMemberSearchTerm('');
      setAddedMemberIds(new Set());
      setShowFallbackInvite(false);
    }
  }, [showMemberModal]);

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'Medium',
      assignedTo: project?.members?.[0]?.user?._id || '',
      status: 'To Do',
    });
    setError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
      priority: task.priority,
      assignedTo: task.assignedTo?._id,
      status: task.status,
    });
    setError('');
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingTask) {
        const updates = isAdmin ? taskForm : { status: taskForm.status };
        const data = await api.updateTask(editingTask._id, updates);
        setTasks(tasks.map((t) => (t._id === editingTask._id ? data.task : t)));
      } else {
        const data = await api.createTask({ ...taskForm, project: projectId });
        setTasks([...tasks, data.task]);
      }
      setShowTaskModal(false);
      await refreshDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!editingTask || !confirm('Delete this task?')) return;
    setSubmitting(true);
    try {
      await api.deleteTask(editingTask._id);
      setTasks(tasks.filter((t) => t._id !== editingTask._id));
      setShowTaskModal(false);
      await refreshDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSelectedMember = async (user) => {
    setError('');
    try {
      const data = await api.addMember(projectId, user.email);
      setAddedMemberIds((prev) => {
        const next = new Set(prev);
        next.add(user._id);
        return next;
      });
      setProject({ ...project, members: data.project.members, userRole: project.userRole });
      await refreshDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api.addMember(projectId, memberEmail);
      setProject({ ...project, members: data.project.members, userRole: project.userRole });
      setMemberEmail('');
      setShowMemberModal(false);
      await refreshDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.removeMember(projectId, userId);
      const projectData = await api.getProject(projectId);
      setProject(projectData.project);
      await refreshDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return;
    try {
      const data = await api.updateTask(task._id, { status: newStatus });
      setTasks(tasks.map((t) => (t._id === task._id ? data.task : t)));
      await refreshDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api.updateProject(projectId, projectForm);
      setProject(data.project);
      setShowSettingsModal(false);
      await refreshDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProject(projectId);
      navigate('/projects');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-inline">
        <div className="spinner" />
      </div>
    );
  }

  const maxStatus = Math.max(...Object.values(dashboard?.tasksByStatus || {}), 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1>{project.name}</h1>
            <RoleBadge role={project.userRole} />
          </div>
          <p>{project.description || 'No description'}</p>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={() => { setError(''); setShowSettingsModal(true); }}>
                Settings
              </button>
              <button className="btn btn-secondary" onClick={() => { setError(''); setShowMemberModal(true); }}>
                + Add Member
              </button>
              <button className="btn btn-primary" onClick={openCreateTask}>
                + New Task
              </button>
            </>
          )}
        </div>
      </div>

      <div className="tabs">
        {['board', 'dashboard', 'members', 'activity'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'board' && (
        <>
          <TaskFilters filters={filters} onChange={setFilters} members={project.members} />
          {filteredTasks.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon">📋</div>
              <h3>{tasks.length === 0 ? 'No tasks yet' : 'No tasks match filters'}</h3>
              <p>{isAdmin && tasks.length === 0 ? 'Create your first task to get started' : 'Try adjusting your filters'}</p>
              {isAdmin && tasks.length === 0 && (
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreateTask}>
                  Create Task
                </button>
              )}
            </div>
          ) : (
            <KanbanBoard
              tasks={filteredTasks}
              onTaskClick={openEditTask}
              onStatusChange={handleStatusChange}
              draggable
            />
          )}
        </>
      )}

      {activeTab === 'dashboard' && dashboard && (
        <>
          <div className="stat-grid">
            <div className="stat-card accent-blue">
              <div className="stat-label">Total Tasks</div>
              <div className="stat-value">{dashboard.totalTasks}</div>
            </div>
            <div className="stat-card accent-green">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{dashboard.tasksByStatus.Done}</div>
              <div className="stat-sub">{dashboard.completionRate}% completion</div>
            </div>
            <div className="stat-card accent-red">
              <div className="stat-label">Overdue</div>
              <div className="stat-value">{dashboard.overdueTasks}</div>
            </div>
          </div>

          <div className="card chart-section">
            <h3>Tasks by Status</h3>
            <div className="status-bars">
              {[
                { key: 'To Do', class: 'todo' },
                { key: 'In Progress', class: 'progress' },
                { key: 'Done', class: 'done' },
              ].map(({ key, class: cls }) => (
                <div key={key} className="status-bar-row">
                  <span className="status-bar-label">{key}</span>
                  <div className="status-bar-track">
                    <div
                      className={`status-bar-fill ${cls}`}
                      style={{ width: `${((dashboard.tasksByStatus[key] || 0) / maxStatus) * 100}%` }}
                    />
                  </div>
                  <span className="status-bar-value">{dashboard.tasksByStatus[key] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <h3 style={{ marginBottom: '1rem' }}>Tasks per User</h3>
            {dashboard.tasksPerUser.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No task data available</p>
            ) : (
              <div className="user-stats-grid">
                {dashboard.tasksPerUser.map((user) => (
                  <div key={user.userId} className="user-stat-card">
                    <h4>{user.name}</h4>
                    <div className="user-stat-row">
                      <span>Total</span>
                      <span>{user.total}</span>
                    </div>
                    <div className="user-stat-row">
                      <span>Completed</span>
                      <span style={{ color: 'var(--success)' }}>{user.done}</span>
                    </div>
                    <div className="user-stat-row">
                      <span>Overdue</span>
                      <span style={{ color: user.overdue > 0 ? 'var(--danger)' : 'inherit' }}>
                        {user.overdue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'members' && (
        <div className="members-list">
          {project.members.map((member) => (
            <div key={member.user._id} className="member-item">
              <div className="member-info">
                <span className="user-avatar">{member.user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
                <div>
                  <div className="user-name">{member.user.name}</div>
                  <div className="user-email">{member.user.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <RoleBadge role={member.role} />
                {isAdmin && member.role !== 'Admin' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(member.user._id)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'activity' && (
        <ActivityFeed activities={activities} title="Project Activity" />
      )}

      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        footer={
          <>
            {editingTask && isAdmin && (
              <button className="btn btn-danger" onClick={handleDeleteTask} disabled={submitting}>
                Delete
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveTask} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Task'}
            </button>
          </>
        }
      >
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSaveTask}>
          {isAdmin && (
            <>
              <div className="form-group">
                <label>Title</label>
                <input className="form-input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" className="form-input" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-input" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select className="form-input" value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })} required>
                  {project.members.map((m) => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="form-group">
            <label>Status</label>
            <select className="form-input" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title="Add Team Member"
        footer={
          <>
            <button className="btn btn-3d-secondary" onClick={() => setShowMemberModal(false)}>
              Cancel
            </button>
          </>
        }
      >
        {error && <div className="form-error">{error}</div>}

        <div className="member-search-container">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            Search registered users on MakeIT to add them to this project.
          </p>

          <div className="member-search-input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="member-search-input"
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
            />
          </div>

          {loadingUsers ? (
            <div className="loading-inline" style={{ padding: '2rem' }}>
              <div className="spinner" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="member-search-empty">
              {nonMembers.length === 0 
                ? "All registered users are already members of this project." 
                : "No matching registered users found."}
            </div>
          ) : (
            <div className="member-search-list">
              {filteredUsers.map((user) => {
                const isAdded = addedMemberIds.has(user._id);
                return (
                  <div key={user._id} className="member-search-item">
                    <div className="member-search-info">
                      <div className="member-search-avatar">
                        {user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="member-search-details">
                        <span className="member-search-name">{user.name}</span>
                        <span className="member-search-email">{user.email}</span>
                      </div>
                    </div>
                    <button
                      className={`btn-3d-add ${isAdded ? 'added' : ''}`}
                      onClick={() => !isAdded && handleAddSelectedMember(user)}
                      disabled={isAdded}
                    >
                      {isAdded ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="member-fallback-invite">
            <button 
              type="button"
              className="member-fallback-toggle"
              onClick={() => setShowFallbackInvite(!showFallbackInvite)}
            >
              {showFallbackInvite ? '▼ Hide manual invite' : '▶ Or invite by email manually'}
            </button>

            {showFallbackInvite && (
              <form onSubmit={handleAddMember} style={{ marginTop: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label>Member Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={memberEmail} 
                    onChange={(e) => setMemberEmail(e.target.value)} 
                    placeholder="teammate@example.com" 
                    required 
                  />
                  <p className="form-hint">User must already have a MakeIT account</p>
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Member by Email'}
                </button>
              </form>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Project Settings"
        footer={
          <>
            <button className="btn btn-danger" onClick={handleDeleteProject}>Delete Project</button>
            <button className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdateProject} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleUpdateProject}>
          <div className="form-group">
            <label>Project Name</label>
            <input className="form-input" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
