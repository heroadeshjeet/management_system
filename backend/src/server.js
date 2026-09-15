import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDBStatus } from './config/db.js';
import { seedInitialUsers } from './controllers/authController.js';
import { auditLogger } from './middleware/auditLogger.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import blackboxRoutes from './routes/blackboxRoutes.js';
import classRoutes from './routes/classRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import testRoutes from './routes/testRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(cors());
app.use(express.json());

// Audit Logger Middleware for tracking modifying actions
app.use(auditLogger);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blackbox', blackboxRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tests', testRoutes);

// Health Check & System Status Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'online',
    system: 'Aryabhatta Group of Institutes Management System',
    block: 'Abdul Kalam Block',
    phase: 'Phase 5 Test Evaluation Engine & Dynamic Logos',
    author: 'Adeshjeet_Official',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Database status check
app.get('/api/db-status', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    success: true,
    block: 'Abdul Kalam Block',
    database: dbStatus,
  });
});

// Resolve frontend build directory if present (production / unified Render deployment)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDist)) {
  console.log(`📦 [Static Assets]: Serving frontend SPA from ${frontendDist}`);
  app.use(express.static(frontendDist));
  // Serve index.html for non-API GET routes (Single Page Application fallback)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
} else {
  // Root route fallback when frontend dist is not built
  app.get('/', (req, res) => {
    res.send({
      message: 'Aryabhatta Group of Institutes Management API - Abdul Kalam Block',
      phase: 'Phase 7 Production Lockdown',
      endpoints: {
        health: '/api/health',
        dbStatus: '/api/db-status',
        login: 'POST /api/auth/login',
        teachers: 'GET/POST/DELETE /api/admin/teachers',
        blackboxLogs: 'GET /api/blackbox/logs',
        classes: 'GET/POST /api/classes',
        studentBulkImport: 'POST /api/students/bulk-import',
        studentPoints: 'PATCH /api/students/:id/points',
        attendance: 'POST /api/attendance & GET /api/attendance/:classId/:date',
        notifications: 'POST /api/notifications/send & GET /api/notifications',
        tests: 'POST /api/tests/marks & GET /api/tests/marks/:notificationId',
      },
    });
  });
}

// Start server & initialize MongoDB connection
const startServer = async () => {
  // Connect to MongoDB Atlas
  const connected = await connectDB();
  if (connected) {
    // Seed initial users if database is empty
    await seedInitialUsers();
  }

  app.listen(PORT, () => {
    console.log(`🚀 [Server Running]: http://localhost:${PORT}`);
    console.log(`🏛️  [Block Association]: Abdul Kalam Block`);
    console.log(`📡 [API Surface]: Auth, Admin, Blackbox, Classes, Students, Attendance, Notifications, Tests`);
    console.log(`🩺 [Health Check]: http://localhost:${PORT}/api/health`);
  });
};

startServer();

// Handle graceful termination
process.on('SIGINT', () => {
  console.log('Stopping server gracefully...');
  process.exit(0);
});

export default app;
