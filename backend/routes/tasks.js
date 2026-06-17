import express from 'express';
import { body } from 'express-validator';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { protect, requireProjectMember } from '../middleware/auth.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

router.use(protect);

const canAccessTask = (task, user, membership) => {
  if (membership.role === 'Admin') return true;
  return task.assignedTo.toString() === user._id.toString();
};

router.get(
  '/project/:projectId',
  requireProjectMember,
  asyncHandler(async (req, res) => {
    let query = { project: req.project._id };

    if (req.membership.role === 'Member') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });

    res.json({ success: true, tasks });
  })
);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('project').notEmpty().withMessage('Project is required'),
    body('assignedTo').notEmpty().withMessage('Assignee is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { title, description, dueDate, priority, project, assignedTo } = req.body;

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const membership = projectDoc.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project.' });
    }

    if (membership.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create tasks.' });
    }

    const assigneeIsMember = projectDoc.members.some((m) => m.user.toString() === assignedTo);
    if (!assigneeIsMember) {
      return res.status(400).json({ success: false, message: 'Assignee must be a project member.' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      dueDate,
      priority: priority || 'Medium',
      project,
      assignedTo,
      createdBy: req.user._id,
    });

    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);

    await logActivity({
      type: 'task_created',
      message: `Created task "${title}"`,
      user: req.user._id,
      project,
      task: task._id,
    });

    res.status(201).json({ success: true, task });
  })
);

router.patch(
  '/:taskId',
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601(),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('status').optional().isIn(['To Do', 'In Progress', 'Done']),
    body('assignedTo').optional().notEmpty(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const project = await Project.findById(task.project);
    const membership = project.members.find((m) => m.user.toString() === req.user._id.toString());

    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project.' });
    }

    if (!canAccessTask(task, req.user, membership)) {
      return res.status(403).json({ success: false, message: 'You can only update tasks assigned to you.' });
    }

    const { title, description, dueDate, priority, status, assignedTo } = req.body;
    const previousStatus = task.status;

    if (membership.role === 'Member') {
      if (title || description || dueDate || priority || assignedTo) {
        return res.status(403).json({
          success: false,
          message: 'Members can only update task status.',
        });
      }
      if (status) task.status = status;
    } else {
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate) task.dueDate = dueDate;
      if (priority) task.priority = priority;
      if (status) task.status = status;
      if (assignedTo) {
        const assigneeIsMember = project.members.some((m) => m.user.toString() === assignedTo);
        if (!assigneeIsMember) {
          return res.status(400).json({ success: false, message: 'Assignee must be a project member.' });
        }
        task.assignedTo = assignedTo;
      }
    }

    await task.save();
    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);

    if (status && status !== previousStatus) {
      await logActivity({
        type: 'status_changed',
        message: `Moved "${task.title}" from ${previousStatus} to ${status}`,
        user: req.user._id,
        project: task.project,
        task: task._id,
        metadata: { from: previousStatus, to: status },
      });
    } else {
      await logActivity({
        type: 'task_updated',
        message: `Updated task "${task.title}"`,
        user: req.user._id,
        project: task.project,
        task: task._id,
      });
    }

    res.json({ success: true, task });
  })
);

router.delete(
  '/:taskId',
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const project = await Project.findById(task.project);
    const membership = project.members.find((m) => m.user.toString() === req.user._id.toString());

    if (!membership || membership.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete tasks.' });
    }

    await logActivity({
      type: 'task_deleted',
      message: `Deleted task "${task.title}"`,
      user: req.user._id,
      project: task.project,
    });

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted successfully.' });
  })
);

export default router;
