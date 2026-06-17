export default function TaskFilters({ filters, onChange, members = [] }) {
  return (
    <div className="task-filters">
      <input
        type="text"
        className="form-input filter-search"
        placeholder="Search tasks..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      <select
        className="form-input filter-select"
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value })}
      >
        <option value="">All Priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <select
        className="form-input filter-select"
        value={filters.assignee}
        onChange={(e) => onChange({ ...filters, assignee: e.target.value })}
      >
        <option value="">All Assignees</option>
        {members.map((m) => (
          <option key={m.user._id} value={m.user._id}>
            {m.user.name}
          </option>
        ))}
      </select>
      <label className="filter-checkbox">
        <input
          type="checkbox"
          checked={filters.overdueOnly}
          onChange={(e) => onChange({ ...filters, overdueOnly: e.target.checked })}
        />
        Overdue only
      </label>
    </div>
  );
}

export function filterTasks(tasks, filters) {
  return tasks.filter((task) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        task.title.toLowerCase().includes(q) ||
        (task.description || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignee && task.assignedTo?._id !== filters.assignee) return false;
    if (filters.overdueOnly && !isOverdue(task)) return false;
    return true;
  });
}

function isOverdue(task) {
  return task.status !== 'Done' && new Date(task.dueDate) < new Date();
}
