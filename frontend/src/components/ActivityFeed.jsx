import { formatDate } from './Badges';

const typeIcons = {
  project_created: '📁',
  project_updated: '✏️',
  member_added: '👤',
  member_removed: '👋',
  task_created: '✅',
  task_updated: '📝',
  task_deleted: '🗑️',
  status_changed: '🔄',
};

export default function ActivityFeed({ activities, title = 'Recent Activity' }) {
  if (!activities?.length) {
    return (
      <div className="card activity-feed">
        <h3>{title}</h3>
        <p className="activity-empty">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="card activity-feed">
      <h3>{title}</h3>
      <div className="activity-list">
        {activities.map((item) => (
          <div key={item._id} className="activity-item">
            <span className="activity-icon">{typeIcons[item.type] || '📌'}</span>
            <div className="activity-content">
              <p>{item.message}</p>
              <span className="activity-meta">
                {item.user?.name}
                {item.project?.name && ` · ${item.project.name}`}
                {' · '}
                {formatDate(item.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
