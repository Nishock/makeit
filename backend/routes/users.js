import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, users: [] });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('name email')
      .limit(10);

    res.json({ success: true, users });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name email')
      .sort({ name: 1 });
    res.json({ success: true, users });
  })
);

export default router;
