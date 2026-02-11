import mongoose from 'mongoose';

/**
 * ShiftConfig Model
 * Stores shift configuration rules for different roles and batches.
 * 
 * Employee: Full-time, 10:30 AM - 6:30 PM, min 8 hours (480 mins)
 * Intern Batch1: Part-time, 10:30 AM - 1:30 PM, min 3 hours (180 mins)
 * Intern Batch2: Part-time, 3:00 PM - 6:00 PM, min 3 hours (180 mins)
 */
const shiftConfigSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['employee', 'intern'],
        required: true,
    },
    // Only applicable for interns
    batch: {
        type: String,
        enum: ['batch1', 'batch2', null],
        default: null,
    },
    // Shift timing
    shift_start: {
        type: String,
        required: true,
    },
    shift_end: {
        type: String,
        required: true,
    },
    // Check-in window (when users are allowed to check in)
    check_in_window_start: {
        type: String,
        required: true,
    },
    check_in_window_end: {
        type: String,
        required: true,
    },
    // Minimum required working time in minutes
    min_minutes: {
        type: Number,
        required: true,
    },
    // Description for display purposes
    description: {
        type: String,
    },
}, {
    timestamps: true,
});

// Ensure unique combination of role and batch
shiftConfigSchema.index({ role: 1, batch: 1 }, { unique: true });

const ShiftConfig = mongoose.model('ShiftConfig', shiftConfigSchema);

export default ShiftConfig;
