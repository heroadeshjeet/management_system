import { Blackbox } from '../models/Blackbox.js';

/**
 * GET /api/blackbox/logs
 * Retrieve all Blackbox audit log records sorted by newest first
 */
export const getLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const logs = await Blackbox.find({})
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('❌ [getLogs Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve Blackbox audit logs.',
      error: error.message,
    });
  }
};

export default { getLogs };
