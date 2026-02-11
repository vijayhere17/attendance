import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            batch: user.batch,
            must_change_password: user.must_change_password, // NEW: First-login flag
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// @desc    Register a new user (DISABLED - Admin only)
// @route   POST /api/auth/register
// @access  DISABLED - Use admin panel to create users
router.post('/register', async (req, res) => {
    // PUBLIC REGISTRATION DISABLED
    // Only admins can create users via /api/admin/users
    res.status(403).json({
        message: 'Public registration is disabled. Please contact your administrator.'
    });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            batch: user.batch,
            must_change_password: user.must_change_password, // NEW: Include first-login flag
            shift_start: user.shift_start,
            shift_end: user.shift_end,
            current_streak: user.current_streak,
            best_streak: user.best_streak,
            total_attendance: user.total_attendance,
            notification_preferences: user.notification_preferences,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Change password (for first-login or user-initiated)
// @route   POST /api/auth/change-password
// @access  Private
router.post('/change-password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate new password
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // For first-login, currentPassword is the temp password
        // For regular password change, verify current password
        if (!user.must_change_password && currentPassword) {
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
        }

        // Update password and clear must_change_password flag
        user.password = newPassword;
        user.must_change_password = false;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully',
            must_change_password: false,
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
