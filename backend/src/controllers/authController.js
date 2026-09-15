/**
 * Phase 1 Mock Auth Credentials Database
 */
const PHASE_1_MOCKS = {
  Admin: {
    password: 'Aryabhatta@2000',
    role: 'admin',
    name: 'Dr. System Administrator',
    identifier: 'Admin',
    department: 'Central Administration',
    block: 'Abdul Kalam Block (HQ)',
    route: '/admin',
  },
  T101: {
    password: '123',
    role: 'teacher',
    name: 'Prof. Rajesh Sharma',
    identifier: 'T101',
    department: 'Department of Computer Science',
    block: 'Abdul Kalam Block',
    route: '/teacher',
  },
  '241342': {
    password: '123',
    role: 'student',
    name: 'Aman Kumar Verma',
    identifier: '241342',
    department: 'B.Tech CSE - 4th Semester',
    block: 'Abdul Kalam Block',
    route: '/student',
  },
};

/**
 * Single-door login controller
 * Handles Admin, Teacher, and Student credentials
 */
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and password are required.',
      });
    }

    const trimmedId = identifier.trim();
    const mockUser = PHASE_1_MOCKS[trimmedId];

    if (mockUser && mockUser.password === password) {
      return res.status(200).json({
        success: true,
        message: `Welcome to Abdul Kalam Block, ${mockUser.name}!`,
        user: {
          identifier: mockUser.identifier,
          name: mockUser.name,
          role: mockUser.role,
          department: mockUser.department,
          block: mockUser.block,
          route: mockUser.route,
        },
        token: `phase1-mock-jwt-${mockUser.role}-${Date.now()}`,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Please verify your ID and password.',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server encountered an internal error during authentication.',
    });
  }
};

/**
 * Returns available Phase 1 demo accounts for easy reference
 */
export const getDemoAccounts = (req, res) => {
  res.status(200).json({
    success: true,
    block: 'Abdul Kalam Block',
    accounts: [
      { role: 'Admin', identifier: 'Admin', description: 'Central Administration' },
      { role: 'Teacher', identifier: 'T101', description: 'Faculty Member' },
      { role: 'Student', identifier: '241342', description: 'Enrolled Student' },
    ],
  });
};
