import { PriorityBadge, formatDate, isOverdue, getInitials } from './Badges';

export default function KanbanBoard({ tasks, onTaskClick, onStatusChange, draggable = true }) {
  const statuses = ['To Do', 'In Progress', 'Done'];

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== status) {
      onStatusChange(task, status);
    }
  };

  return (
    <div className="kanban-board">
      {statuses.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div
            key={status}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="kanban-column-header">
              <h3>
                {status}
                <span className="column-count">{columnTasks.length}</span>
              </h3>
            </div>
            <div className="kanban-tasks">
              {columnTasks.map((task) => (
                <div
                  key={task._id}
                  className={`task-card ${isOverdue(task) ? 'overdue' : ''} ${draggable ? 'draggable' : ''}`}
                  draggable={draggable}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onClick={() => onTaskClick(task)}
                >
                  <h4>{task.title}</h4>
                  <div className="task-card-meta">
                    <PriorityBadge priority={task.priority} />
                    {isOverdue(task) && <span className="badge badge-overdue">Overdue</span>}
                  </div>
                  <div className="task-card-footer">
                    <div className="task-assignee">
                      <span className="mini-avatar">{getInitials(task.assignedTo?.name)}</span>
                      {task.assignedTo?.name?.split(' ')[0]}
                    </div>
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                </div>
              ))}
              {columnTasks.length === 0 && (
                <div className="kanban-empty">Drop tasks here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
