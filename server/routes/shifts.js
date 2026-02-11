import express from 'express';
import ShiftConfig from '../models/ShiftConfig.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Helper: Parse time string to Date object for today
 */
function parseTimeToday(timeStr) {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
}

/**
 * Helper: Format time for display (e.g., "10:30 AM")
 */
function formatTime(timeStr) {
    const date = parseTimeToday(timeStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// @desc    Get current user's shift configuration
// @route   GET /api/shifts/my-shift
// @access  Private
router.get('/my-shift', protect, async (req, res) => {
    try {
        const user = req.user;

        // Admin users don't have shifts
        if (user.role === 'admin') {
            return res.json({ message: 'Admins do not have shift configurations' });
        }

        // Build query based on role and batch
        const query = { role: user.role };
        if (user.role === 'intern') {
            query.batch = user.batch;
        } else {
            query.batch = null;
        }

        const shiftConfig = await ShiftConfig.findOne(query);

        if (!shiftConfig) {
            return res.status(404).json({
                message: 'Shift configuration not found for your role',
                role: user.role,
                batch: user.batch
            });
        }

        // Calculate current shift status
        const now = new Date();
        const shiftStart = parseTimeToday(shiftConfig.shift_start);
        const shiftEnd = parseTimeToday(shiftConfig.shift_end);

        // FIXED: Check-in allowed anytime during shift
        const canCheckIn = now >= shiftStart && now <= shiftEnd;
        const isBeforeCheckIn = now < shiftStart;
        const isAfterCheckIn = now > shiftEnd;

        // FIXED: Check-out allowed anytime
        const canCheckOut = true;

        res.json({
            ...shiftConfig.toObject(),
            formatted: {
                shift_start: formatTime(shiftConfig.shift_start),
                shift_end: formatTime(shiftConfig.shift_end),
                // Update display to show full shift window for check-in
                check_in_window: `${formatTime(shiftConfig.shift_start)} - ${formatTime(shiftConfig.shift_end)}`,
                min_hours: (shiftConfig.min_minutes / 60).toFixed(1),
            },
            status: {
                canCheckIn,
                canCheckOut,
                isBeforeCheckIn,
                isAfterCheckIn,
                currentTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            }
        });
    } catch (error) {
        console.error('Error fetching shift config:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all shift configurations (for admin)
// @route   GET /api/shifts/all
// @access  Private (Admin)
router.get('/all', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const shifts = await ShiftConfig.find({}).sort({ role: 1, batch: 1 });
        res.json(shifts);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
