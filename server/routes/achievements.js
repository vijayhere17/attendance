import express from 'express';
import Achievement from '../models/Achievement.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get user achievements
// @route   GET /api/achievements
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // For now, return all achievements. 
        // In a real app, you'd have a UserAchievement model to track unlocked ones.
        // We'll simulate unlocked status based on logic or return all as unlocked/locked.

        const achievements = await Achievement.find({});

        // Mocking unlocked status for demo purposes since we don't have UserAchievement model yet
        // In production, you would join with UserAchievement
        const achievementsWithStatus = achievements.map(ach => ({
            ...ach.toObject(),
            unlocked_at: Math.random() > 0.5 ? new Date() : null // Randomly unlock half
        }));

        res.json(achievementsWithStatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
