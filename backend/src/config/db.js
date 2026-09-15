import mongoose from 'mongoose';

/**
 * MongoDB connection utility for Aryabhatta Group of Institutes Management System
 * Connects to MongoDB Atlas cluster for Abdul Kalam Block database
 */
export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ [Database Error]: MONGO_URI is not defined in environment variables.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ [MongoDB Atlas Connected]: ${conn.connection.host}`);
    console.log(`📦 [Active Database]: ${conn.connection.name}`);
    console.log(`🏛️  [Active Block]: Abdul Kalam Block`);

    return true;
  } catch (error) {
    console.error(`❌ [MongoDB Connection Error]: ${error.message}`);
    return false;
  }
};

// Listen for runtime connection lifecycle events
mongoose.connection.on('connected', () => {
  console.log('📡 [MongoDB Connection State]: Established');
});

mongoose.connection.on('error', (err) => {
  console.error(`⚠️ [MongoDB Runtime Error]: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('🔌 [MongoDB Connection State]: Disconnected');
});

/**
 * Returns human-readable connection status
 */
export const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };

  const stateCode = mongoose.connection.readyState;
  return {
    stateCode,
    status: states[stateCode] || 'unknown',
    database: mongoose.connection.name || 'aryabhatta_db',
    host: mongoose.connection.host || null,
  };
};
