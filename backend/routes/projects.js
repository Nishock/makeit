import express from 'express';
import { body } from 'express-validator';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { protect, requireProjectAdmin, requireProjectMember } from '../middleware/auth.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .sort({ updatedAt: -1 });

    const projectsWithRole = projects.map((project) => {
      const membership = project.members.find((m) => m.user._id.toString() === req.user._id.toString());
      return {
        ...project.toObject(),
        userRole: membership?.role || 'Member',
      };
    });

    res.json({ success: true, projects: projectsWithRole });
  })
);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }],
    });

    await project.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'members.user', select: 'name email' },
    ]);

    await logActivity({
      type: 'project_created',
      message: `Created project "${name}"`,
      user: req.user._id,
      project: project._id,
    });

    res.status(201).json({ success: true, project: { ...project.toObject(), userRole: 'Admin' } });
  })
);

router.get(
  '/:projectId',
  requireProjectMember,
  asyncHandler(async (req, res) => {
    await req.project.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'members.user', select: 'name email' },
    ]);

    res.json({
      success: true,
      project: { ...req.project.toObject(), userRole: req.membership.role },
    });
  })
);

router.patch(
  '/:projectId',
  requireProjectAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (name) req.project.name = name;
    if (description !== undefined) req.project.description = description;
    await req.project.save();
    await req.project.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'members.user', select: 'name email' },
    ]);

    await logActivity({
      type: 'project_updated',
      message: `Updated project "${req.project.name}"`,
      user: req.user._id,
      project: req.project._id,
    });

    res.json({
      success: true,
      project: { ...req.project.toObject(), userRole: req.membership.role },
    });
  })
);

router.post(
  '/:projectId/members',
  requireProjectAdmin,
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with that email.' });
    }

    const alreadyMember = req.project.members.some((m) => m.user.toString() === user._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a project member.' });
    }

    req.project.members.push({ user: user._id, role: 'Member' });
    await req.project.save();
    await req.project.populate('members.user', 'name email');

    await logActivity({
      type: 'member_added',
      message: `Added ${user.name} to the project`,
      user: req.user._id,
      project: req.project._id,
      metadata: { memberName: user.name },
    });

    res.json({ success: true, project: req.project });
  })
);

router.delete(
  '/:projectId/members/:userId',
  requireProjectAdmin,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Admin cannot remove themselves.' });
    }

    const memberIndex = req.project.members.findIndex((m) => m.user.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: 'Member not found in project.' });
    }

    const removedMember = req.project.members[memberIndex];
    req.project.members.splice(memberIndex, 1);
    await req.project.save();

    await Task.updateMany(
      { project: req.project._id, assignedTo: userId },
      { $set: { assignedTo: req.user._id } }
    );

    await logActivity({
      type: 'member_removed',
      message: `Removed a member from the project`,
      user: req.user._id,
      project: req.project._id,
      metadata: { removedUserId: userId },
    });

    res.json({ success: true, message: 'Member removed successfully.' });
  })
);

router.delete(
  '/:projectId',
  requireProjectAdmin,
  asyncHandler(async (req, res) => {
    const projectName = req.project.name;
    await Task.deleteMany({ project: req.project._id });
    await Activity.deleteMany({ project: req.project._id });
    await req.project.deleteOne();
    res.json({ success: true, message: `Project "${projectName}" deleted successfully.` });
  })
);

export default router;
