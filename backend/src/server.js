import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDBStatus } from './config/db.js';
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health Check & System Status Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'online',
    system: 'Aryabhatta Group of Institutes Management System',
    block: 'Abdul Kalam Block',
    version: '1.0.0-phase1',
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
    phase: 'Phase 1 Core Architecture',
    endpoints: {
      health: '/api/health',
      dbStatus: '/api/db-status',
      login: 'POST /api/auth/login',
      demoAccounts: 'GET /api/auth/demo-accounts',
    },
  });
});

// Start server & initialize MongoDB connection
const startServer = async () => {
  // Connect to MongoDB Atlas
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 [Server Running]: http://localhost:${PORT}`);
    console.log(`🏛️  [Block Association]: Abdul Kalam Block`);
    console.log(`🩺 [Health Check]: http://localhost:${PORT}/api/health`);
  });
};

startServer();

// Handle graceful termination
process.on('SIGINT', () => {
  console.log('Stopping server gracefully...');
  process.exit(0);
});
