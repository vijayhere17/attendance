import cron from 'node-cron';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import ShiftConfig from '../models/ShiftConfig.js';
import { sendCheckInReminder, sendBreakEndingReminder, sendCheckOutReminder } from './emailService.js';

const initScheduler = () => {
    console.log('Initializing Attendance Schedulers...');

    cron.schedule('25 10 * * *', async () => {
        console.log('Running 10:25 AM Check-in Reminders...');
        try {
            const users = await User.find({
                role: { $in: ['employee', 'intern'] },
                $or: [
                    { role: 'employee' },
                    { role: 'intern', batch: 'batch1' }
                ]
            });

            for (const user of users) {
                await sendCheckInReminder(user);
            }
        } catch (error) {
            console.error('Error in 10:25 AM reminder:', error);
        }
    });

    cron.schedule('0 14 * * *', async () => {
        console.log('Running 2:00 PM Automatic Break Pause...');
        try {
            const today = new Date().toISOString().split('T')[0];
            const employees = await User.find({ role: 'employee' });
            const employeeIds = employees.map(e => e._id);

            const result = await Attendance.updateMany(
                {
                    user: { $in: employeeIds },
                    date: today,
                    check_in: { $exists: true },
                    check_out: { $exists: false },
                    is_on_break: false
                },
                {
                    $set: {
                        is_on_break: true,
                        break_start: new Date()
                    }
                }
            );
            console.log(`Paused ${result.modifiedCount} sessions for mandatory break.`);
        } catch (error) {
            console.error('Error in 2:00 PM break pause:', error);
        }
    });

    cron.schedule('45 14 * * *', async () => {
        console.log('Running 2:45 PM Break Ending Reminders...');
        try {
            const employees = await User.find({ role: 'employee' });
            for (const employee of employees) {
                await sendBreakEndingReminder(employee);
            }
        } catch (error) {
            console.error('Error in 2:45 PM reminder:', error);
        }
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();
            const today = new Date().toISOString().split('T')[0];
            const shiftConfigs = await ShiftConfig.find({});

            for (const config of shiftConfigs) {
                const [endH, endM] = config.shift_end.split(':').map(Number);
                const shiftEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);
                const reminderTime = new Date(shiftEnd.getTime() + 5 * 60000);

                if (now >= reminderTime && now < new Date(reminderTime.getTime() + 6 * 60000)) {
                    console.log(`Running Check-out Reminder Check for ${config.role} ${config.batch || ''}...`);
                    const query = { role: config.role };
                    if (config.batch) query.batch = config.batch;

                    const users = await User.find(query);
                    const userIds = users.map(u => u._id);

                    const forgetfulUsers = await Attendance.find({
                        user: { $in: userIds },
                        date: today,
                        check_in: { $exists: true },
                        check_out: { $exists: false },
                        checkout_reminder_sent: false
                    }).populate('user');

                    for (const record of forgetfulUsers) {
                        try {
                            await sendCheckOutReminder(record.user);
                            record.checkout_reminder_sent = true;
                            await record.save();
                            console.log(`Check-out reminder sent to ${record.user.full_name}`);
                        } catch (emailError) {
                            console.error(`Failed to send check-out reminder to ${record.user.full_name}:`, emailError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in check-out reminder check:', error);
        }
    });
};

export default initScheduler;