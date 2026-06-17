import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ActivityFeed from '../components/ActivityFeed';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewData, projectsData, activityData] = await Promise.all([
          api.getOverview(),
          api.getProjects(),
          api.getActivity(),
        ]);
        setOverview(overviewData.dashboard);
        setProjects(projectsData.projects.slice(0, 4));
        setActivities(activityData.activities);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 12; // tilt angle limits
    const angleY = (x - xc) / 12;
    card.style.setProperty('--tilt-x', `${angleX}`);
    card.style.setProperty('--tilt-y', `${angleY}`);
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty('--tilt-x', '0');
    card.style.setProperty('--tilt-y', '0');
  };

  if (loading) {
    return (
      <div className="loading-inline">
        <div className="spinner" />
      </div>
    );
  }

  const { totalProjects, totalTasks, tasksByStatus, overdueTasks, completionRate } = overview || {};
  const maxStatus = Math.max(...Object.values(tasksByStatus || {}), 1);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Workspace Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Welcome back! Here is a summary of your workspace activities and project timelines.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/projects" className="btn btn-3d">
            <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Link>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '2.5rem' }}>
        {/* Total Projects Card */}
        <div 
          className="stat-card-3d card-3d-interactive"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-3d-inner">
            <div className="stat-card-header-3d" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div className="stat-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Projects
              </div>
              <div className="stat-icon-wrapper">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
            <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {totalProjects}
            </div>
            <div className="stat-sub" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <span className="status-dot projects" /> Active workspaces
            </div>
          </div>
        </div>

        {/* Total Tasks Card */}
        <div 
          className="stat-card-3d card-3d-interactive accent-blue"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-3d-inner">
            <div className="stat-card-header-3d" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div className="stat-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Tasks
              </div>
              <div className="stat-icon-wrapper">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {totalTasks}
            </div>
            <div className="stat-sub" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <span className="status-dot tasks" /> Assigned items
            </div>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div 
          className="stat-card-3d card-3d-interactive accent-green"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-3d-inner">
            <div className="stat-card-header-3d" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div className="stat-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Completion Rate
              </div>
              <div className="stat-icon-wrapper">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
            </div>
            <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {completionRate}%
            </div>
            <div className="stat-sub" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <span className="status-dot completion" /> {tasksByStatus?.Done || 0} tasks completed
            </div>
          </div>
        </div>

        {/* Overdue Tasks Card */}
        <div 
          className="stat-card-3d card-3d-interactive accent-red"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-3d-inner">
            <div className="stat-card-header-3d" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div className="stat-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Overdue Tasks
              </div>
              <div className="stat-icon-wrapper">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {overdueTasks}
            </div>
            <div className="stat-sub" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <span className="status-dot overdue" /> Needs immediate attention
            </div>
          </div>
        </div>
      </div>

      <div 
        className="chart-section card-3d-interactive" 
        style={{ marginBottom: '2.5rem', padding: '2rem' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="card-3d-inner">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Tasks Progress Graph
          </h3>
          <div className="status-bars">
            {[
              { key: 'To Do', class: 'todo' },
              { key: 'In Progress', class: 'progress' },
              { key: 'Done', class: 'done' },
            ].map(({ key, class: cls }) => (
              <div key={key} className="status-bar-row">
                <span className="status-bar-label" style={{ fontWeight: 600 }}>{key}</span>
                <div className="status-bar-track" style={{ height: '12px', background: 'rgba(0,0,0,0.05)' }}>
                  <div
                    className={`status-bar-fill ${cls}`}
                    style={{ 
                      width: `${((tasksByStatus?.[key] || 0) / maxStatus) * 100}%`,
                      background: cls === 'todo' ? 'var(--text-muted)' : cls === 'progress' ? 'var(--info)' : 'var(--success)'
                    }}
                  />
                </div>
                <span className="status-bar-value" style={{ fontSize: '0.95rem', fontWeight: 700 }}>{tasksByStatus?.[key] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-split" style={{ gap: '2rem' }}>
        {/* Left pane: activity feed */}
        <div 
          className="card-3d-interactive"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ padding: '2rem' }}
        >
          <div className="card-3d-inner">
            <ActivityFeed activities={activities} />
          </div>
        </div>

        {/* Right pane: recent projects */}
        <div className="chart-section">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Recent Projects
          </h3>
          {projects.length === 0 ? (
            <div 
              className="empty-state card-3d-interactive"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div className="card-3d-inner">
                <div className="empty-state-icon" style={{ fontSize: '3.5rem' }}>📁</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>No projects yet</h3>
                <p style={{ color: 'var(--text-muted)' }}>Create your first project to get started</p>
                <Link to="/projects" className="btn btn-3d" style={{ marginTop: '1.5rem' }}>
                  Create Project
                </Link>
              </div>
            </div>
          ) : (
            <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
              {projects.map((project) => (
                <Link 
                  key={project._id} 
                  to={`/projects/${project._id}`} 
                  className="card-3d-interactive project-card glow-hover"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div className="card-3d-inner">
                    <div className="project-card-header">
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{project.name}</h3>
                      <span className={`badge ${project.userRole === 'Admin' ? 'badge-admin' : 'badge-member'}`}>
                        {project.userRole}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0 1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.7em' }}>
                      {project.description || 'No description provided.'}
                    </p>
                    <div className="project-meta" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {project.members?.length || 0} members
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
