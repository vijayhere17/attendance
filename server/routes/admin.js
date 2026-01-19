import express from 'express';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get Dashboard Stats
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
router.get('/dashboard/stats', protect, admin, async (req, res) => {
    try {
        const totalEmployees = await User.countDocuments({ role: 'employee' });

        const today = new Date().toISOString().split('T')[0];
        const attendanceToday = await Attendance.find({ date: today });

        const present = attendanceToday.filter(a => a.status === 'present').length;
        const late = attendanceToday.filter(a => a.status === 'late').length;
        const earlyExit = attendanceToday.filter(a => a.status === 'early_exit').length;

        // Absent is total employees minus those who have checked in (present + late + early_exit)
        // Note: This is a simplification. Real logic might need to check shift days etc.
        const checkedInCount = attendanceToday.length;
        const absent = totalEmployees - checkedInCount;

        res.json({
            total: totalEmployees,
            present,
            late,
            absent: absent < 0 ? 0 : absent, // Safety check
            earlyExit
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get Weekly Attendance Data
// @route   GET /api/admin/dashboard/weekly
// @access  Private/Admin
router.get('/dashboard/weekly', protect, admin, async (req, res) => {
    try {
        // Get last 7 days
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            const attendance = await Attendance.find({ date: dateStr });

            weeklyData.push({
                day: dayName,
                present: attendance.filter(a => a.status === 'present').length,
                late: attendance.filter(a => a.status === 'late' || a.status === 'early_exit').length,
                absent: 0 // Calculating absent for past days is complex without shift schedules, leaving as 0 or TODO
            });
        }
        res.json(weeklyData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get All Employees
// @route   GET /api/admin/employees
// @access  Private/Admin
router.get('/employees', protect, admin, async (req, res) => {
    try {
        const employees = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
