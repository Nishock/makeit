import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';
import { protect, requireProjectMember } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get(
  '/project/:projectId',
  requireProjectMember,
  asyncHandler(async (req, res) => {
    let taskFilter = { project: req.project._id };

    if (req.membership.role === 'Member') {
      taskFilter.assignedTo = req.user._id;
    }

    const tasks = await Task.find(taskFilter).populate('assignedTo', 'name email');

    const totalTasks = tasks.length;
    const tasksByStatus = {
      'To Do': tasks.filter((t) => t.status === 'To Do').length,
      'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
      Done: tasks.filter((t) => t.status === 'Done').length,
    };

    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'Done' && new Date(t.dueDate) < now
    ).length;

    const tasksPerUserMap = {};
    tasks.forEach((task) => {
      const userId = task.assignedTo._id.toString();
      const userName = task.assignedTo.name;
      if (!tasksPerUserMap[userId]) {
        tasksPerUserMap[userId] = { userId, name: userName, total: 0, done: 0, overdue: 0 };
      }
      tasksPerUserMap[userId].total += 1;
      if (task.status === 'Done') tasksPerUserMap[userId].done += 1;
      if (task.status !== 'Done' && new Date(task.dueDate) < now) {
        tasksPerUserMap[userId].overdue += 1;
      }
    });

    const tasksPerUser = Object.values(tasksPerUserMap);

    res.json({
      success: true,
      dashboard: {
        totalTasks,
        tasksByStatus,
        tasksPerUser,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((tasksByStatus.Done / totalTasks) * 100) : 0,
      },
    });
  })
);

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const projects = await Project.find({ 'members.user': req.user._id });
    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({ project: { $in: projectIds } }).populate('assignedTo', 'name email');

    const userTasks = tasks.filter((task) => {
      const project = projects.find((p) => p._id.toString() === task.project.toString());
      const membership = project.members.find((m) => m.user.toString() === req.user._id.toString());
      if (membership?.role === 'Admin') return true;
      return task.assignedTo._id.toString() === req.user._id.toString();
    });

    const totalTasks = userTasks.length;
    const tasksByStatus = {
      'To Do': userTasks.filter((t) => t.status === 'To Do').length,
      'In Progress': userTasks.filter((t) => t.status === 'In Progress').length,
      Done: userTasks.filter((t) => t.status === 'Done').length,
    };

    const now = new Date();
    const overdueTasks = userTasks.filter(
      (t) => t.status !== 'Done' && new Date(t.dueDate) < now
    ).length;

    res.json({
      success: true,
      dashboard: {
        totalProjects: projects.length,
        totalTasks,
        tasksByStatus,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((tasksByStatus.Done / totalTasks) * 100) : 0,
      },
    });
  })
);

router.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const projects = await Project.find({ 'members.user': req.user._id }).select('_id');
    const projectIds = projects.map((p) => p._id);

    const activities = await Activity.find({ project: { $in: projectIds } })
      .populate('user', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, activities });
  })
);

router.get(
  '/activity/project/:projectId',
  requireProjectMember,
  asyncHandler(async (req, res) => {
    const activities = await Activity.find({ project: req.project._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ success: true, activities });
  })
);

export default router;
