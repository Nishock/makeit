const priorityClass = {
  Low: 'badge-low',
  Medium: 'badge-medium',
  High: 'badge-high',
};

const statusClass = {
  'To Do': 'badge-todo',
  'In Progress': 'badge-progress',
  Done: 'badge-done',
};

export function PriorityBadge({ priority }) {
  return <span className={`badge ${priorityClass[priority]}`}>{priority}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`badge ${statusClass[status]}`}>{status}</span>;
}

export function RoleBadge({ role }) {
  return <span className={`badge ${role === 'Admin' ? 'badge-admin' : 'badge-member'}`}>{role}</span>;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isOverdue(task) {
  return task.status !== 'Done' && new Date(task.dueDate) < new Date();
}

export function getInitials(name) {
  return name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
