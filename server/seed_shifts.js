import mongoose from 'mongoose';
import ShiftConfig from './models/ShiftConfig.js';

/**
 * Seed script to populate default shift configurations
 * Run once after creating the ShiftConfig model
 * 
 * Usage: node seed_shifts.js
 */

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/radius-check';

const shiftConfigs = [
    {
        role: 'employee',
        batch: null,
        shift_start: '10:30',
        shift_end: '18:30',
        check_in_window_start: '10:00',
        check_in_window_end: '11:00',
        min_minutes: 480, // 8 hours
        description: 'Full-time Employee (10:30 AM - 6:30 PM)',
    },
    {
        role: 'intern',
        batch: 'batch1',
        shift_start: '10:30',
        shift_end: '13:30',
        check_in_window_start: '10:15',
        check_in_window_end: '10:45',
        min_minutes: 180, // 3 hours
        description: 'Intern Batch 1 (10:30 AM - 1:30 PM)',
    },
    {
        role: 'intern',
        batch: 'batch2',
        shift_start: '15:00',
        shift_end: '18:00',
        check_in_window_start: '14:45',
        check_in_window_end: '15:15',
        min_minutes: 180, // 3 hours
        description: 'Intern Batch 2 (3:00 PM - 6:00 PM)',
    },
];

async function seedShifts() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected:', mongoose.connection.host);

        // Clear existing configs
        await ShiftConfig.deleteMany({});
        console.log('Cleared existing shift configs');

        // Insert new configs
        const result = await ShiftConfig.insertMany(shiftConfigs);
        console.log(`Inserted ${result.length} shift configurations:`);

        result.forEach(config => {
            console.log(`  - ${config.description}`);
        });

        console.log('\nShift seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding shifts:', error);
        process.exit(1);
    }
}

seedShifts();
