import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDBStatus } from './config/db.js';
import { seedInitialUsers } from './controllers/authController.js';
import { auditLogger } from './middleware/auditLogger.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import blackboxRoutes from './routes/blackboxRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-actor-name', 'x-actor-role'],
  })
);
app.use(express.json());

// Audit Logger Middleware for tracking modifying actions
app.use(auditLogger);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blackbox', blackboxRoutes);

// Health Check & System Status Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'online',
    system: 'Aryabhatta Group of Institutes Management System',
    block: 'Abdul Kalam Block',
    phase: 'Phase 2 Database & Admin Command Center',
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

// Root route
app.get('/', (req, res) => {
  res.send({
    message: 'Aryabhatta Group of Institutes Management API - Abdul Kalam Block',
    phase: 'Phase 2 Database & Admin Command Center',
    endpoints: {
      health: '/api/health',
      dbStatus: '/api/db-status',
      login: 'POST /api/auth/login',
      demoAccounts: 'GET /api/auth/demo-accounts',
      teachers: 'GET/POST/DELETE /api/admin/teachers',
      blackboxLogs: 'GET /api/blackbox/logs',
    },
  });
});

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
    console.log(`📡 [API Surface]: Auth, Admin (/api/admin/teachers), Blackbox (/api/blackbox/logs)`);
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
