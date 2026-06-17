import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { RoleBadge } from '../components/Badges';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api.createProject(name, description);
      setProjects([data.project, ...projects]);
      setShowModal(false);
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-inline">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Manage your team projects and collaborations</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create a project and invite your team members</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((project) => (
            <Link key={project._id} to={`/projects/${project._id}`} className="card project-card">
              <div className="project-card-header">
                <h3>{project.name}</h3>
                <RoleBadge role={project.userRole} />
              </div>
              <p>{project.description || 'No description provided'}</p>
              <div className="project-meta">
                <span>👥 {project.members?.length || 0} members</span>
                <span>By {project.createdBy?.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Project"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </>
        }
      >
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Project Name</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marketing Campaign"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
