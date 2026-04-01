import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import attendanceRoutes from './routes/attendance.js';
import officeRoutes from './routes/office.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import achievementRoutes from './routes/achievements.js';
import shiftRoutes from './routes/shifts.js';
import initScheduler from './services/scheduler.js'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

connectDB();
initScheduler();

const app = express();

const allowedOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/office', officeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/shifts', shiftRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});