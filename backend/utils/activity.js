import Activity from '../models/Activity.js';

export async function logActivity({ type, message, user, project, task, metadata = {} }) {
  try {
    await Activity.create({ type, message, user, project, task, metadata });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}
