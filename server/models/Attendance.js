import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    office: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Office',
    },
    date: {
        type: String,
        required: true,
    },
    check_in: {
        type: Date,
    },
    check_out: {
        type: Date,
    },
    check_in_lat: {
        type: Number,
    },
    check_in_lng: {
        type: Number,
    },
    check_out_lat: {
        type: Number,
    },
    check_out_lng: {
        type: Number,
    },
    distance_at_check_in: {
        type: Number,
    },
    distance_at_check_out: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['present', 'late', 'early_exit', 'absent', 'incomplete', 'halfday'],
        default: 'absent',
    },
    is_policy_violation: {
        type: Boolean,
        default: false,
    },
    work_mode: {
        type: String,
        enum: ['office', 'wfh'],
        default: 'office',
    },
    worked_minutes: {
        type: Number,
        default: 0,
    },
    is_late: {
        type: Boolean,
        default: false,
    },
    is_early_checkout: {
        type: Boolean,
        default: false,
    },
    final_status: {
        type: String,
        enum: ['present', 'halfday', 'absent', null],
        default: null,
    },
    break_start: {
        type: Date,
    },
    break_end: {
        type: Date,
    },
    break_minutes: {
        type: Number,
        default: 0,
    },
    is_on_break: {
        type: Boolean,
        default: false,
    },
    checkout_reminder_sent: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;