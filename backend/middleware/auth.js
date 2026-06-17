import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const getProjectMembership = async (projectId, userId) => {
  const Project = (await import('../models/Project.js')).default;
  const project = await Project.findById(projectId);
  if (!project) return { project: null, membership: null };

  const membership = project.members.find((m) => m.user.toString() === userId.toString());
  return { project, membership };
};

export const requireProjectAdmin = async (req, res, next) => {
  const { project, membership } = await getProjectMembership(req.params.projectId || req.body.project, req.user._id);

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  if (!membership || membership.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  req.project = project;
  req.membership = membership;
  next();
};

export const requireProjectMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id || req.body.project;
  const { project, membership } = await getProjectMembership(projectId, req.user._id);

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  if (!membership) {
    return res.status(403).json({ success: false, message: 'You are not a member of this project.' });
  }

  req.project = project;
  req.membership = membership;
  next();
};
