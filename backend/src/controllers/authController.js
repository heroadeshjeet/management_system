import { User } from '../models/User.js';
import { recordAuditLog } from '../middleware/auditLogger.js';

/**
 * Seed initial baseline users if missing
 * Guarantees master Admin (ID: Admin, Pass: Aryabhatta@2000), default teacher, and student exist
 */
export const seedInitialUsers = async () => {
  try {
    const adminExists = await User.findOne({
      fileNumber: { $regex: /^admin$/i },
    });

    if (!adminExists) {
      console.log('🌱 [Database Seed]: Admin account missing. Initializing master Admin account...');
      await User.create({
        fileNumber: 'Admin',
        name: 'Dr. Suresh Chandra',
        password: 'Aryabhatta@2000',
        role: 'admin',
        points: 500,
        block: 'Abdul Kalam Block',
        department: 'Central Academic Directorate',
      });
      console.log('✅ [Database Seed]: Master Admin (ID: Admin / Pass: Aryabhatta@2000) initialized in MongoDB.');

      await recordAuditLog({
        actorName: 'System Seeder',
        role: 'system',
        action: 'ADMIN_BOOTSTRAP',
        details: 'Master Admin account initialized.',
      });
    }

    const teacherExists = await User.findOne({
      fileNumber: { $regex: /^T101$/i },
    });

    if (!teacherExists) {
      await User.create({
        fileNumber: 'T101',
        name: 'Prof. Rajesh Sharma',
        password: '123',
        role: 'teacher',
        points: 500,
        block: 'Abdul Kalam Block',
        department: 'Department of Computer Science & Engineering',
      });
    }

    const studentExists = await User.findOne({
      fileNumber: { $regex: /^241342$/i },
    });

    if (!studentExists) {
      await User.create({
        fileNumber: '241342',
        name: 'Aman Kumar Verma',
        password: '123',
        role: 'student',
        points: 500,
        block: 'Abdul Kalam Block',
        department: 'B.Tech - Computer Science (Section A)',
      });
    }
  } catch (err) {
    console.error('⚠️ [Seed Error]: Failed to ensure baseline users:', err.message);
  }
};

/**
 * Database-backed login controller
 * Validates credentials against MongoDB User collection
 */
export const login = async (req, res) => {
  try {
    const { identifier, fileNumber, password } = req.body;
    const loginId = (fileNumber || identifier || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'File Number / Identifier and password are required.',
      });
    }

    // Query database for user with matching fileNumber (case-insensitive regex or exact)
    let user = await User.findOne({
      fileNumber: { $regex: new RegExp(`^${loginId}$`, 'i') },
    });

    // If no user found and database might be empty, attempt seeder
    if (!user) {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        await seedInitialUsers();
        user = await User.findOne({
          fileNumber: { $regex: new RegExp(`^${loginId}$`, 'i') },
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User ID not found in institutional registry.',
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Access denied.',
      });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Log successful LOGIN into Blackbox audit log
    req.auditLogged = true; // prevent duplicate middleware log
    await recordAuditLog({
      actorName: user.name,
      role: user.role,
      action: 'LOGIN',
      details: `${user.role.toUpperCase()} session authenticated for ${user.name} (${user.fileNumber}) at Abdul Kalam Block.`,
    });

    // Generate session token
    const token = `aryabhatta-auth-${user.role}-${user.fileNumber}-${Date.now()}`;

    return res.status(200).json({
      success: true,
      message: `Welcome to Abdul Kalam Block, ${user.name}!`,
      user: {
        _id: user._id,
        fileNumber: user.fileNumber,
        identifier: user.fileNumber,
        name: user.name,
        role: user.role,
        points: user.points,
        block: user.block,
        department: user.department,
        route: `/${user.role}`,
      },
      token,
    });
  } catch (error) {
    console.error('❌ [Login Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication. Check database connectivity.',
      error: error.message,
    });
  }
};

/**
 * Returns available demo accounts for the frontend helper buttons
 */
export const getDemoAccounts = async (req, res) => {
  try {
    const users = await User.find({
      fileNumber: { $in: ['Admin', 'T101', '241342'] },
    }).select('name role fileNumber department block');

    if (users.length > 0) {
      return res.status(200).json({
        success: true,
        block: 'Abdul Kalam Block',
        accounts: users.map((u) => ({
          role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
          identifier: u.fileNumber,
          name: u.name,
          description: u.department,
        })),
      });
    }

    // Fallback static list if DB users haven't loaded yet
    res.status(200).json({
      success: true,
      block: 'Abdul Kalam Block',
      accounts: [
        { role: 'Admin', identifier: 'Admin', name: 'Dr. Suresh Chandra', description: 'Central Administration' },
        { role: 'Teacher', identifier: 'T101', name: 'Prof. Rajesh Sharma', description: 'Faculty Member' },
        { role: 'Student', identifier: '241342', name: 'Aman Kumar Verma', description: 'Enrolled Student' },
      ],
    });
  } catch {
    res.status(200).json({
      success: true,
      block: 'Abdul Kalam Block',
      accounts: [
        { role: 'Admin', identifier: 'Admin', name: 'Dr. Suresh Chandra', description: 'Central Administration' },
        { role: 'Teacher', identifier: 'T101', name: 'Prof. Rajesh Sharma', description: 'Faculty Member' },
        { role: 'Student', identifier: '241342', name: 'Aman Kumar Verma', description: 'Enrolled Student' },
      ],
    });
  }
};

export default { login, getDemoAccounts, seedInitialUsers };
