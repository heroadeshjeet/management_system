import { Blackbox } from '../models/Blackbox.js';

/**
 * Direct helper function to write an entry to the Blackbox audit log
 */
export const recordAuditLog = async ({ actorName, role, action, details }) => {
  try {
    const entry = new Blackbox({
      actorName: actorName || 'System',
      role: role || 'admin',
      action: action || 'SYSTEM_ACTION',
      details: typeof details === 'object' ? JSON.stringify(details) : details || '',
      timestamp: new Date(),
    });
    await entry.save();
    return entry;
  } catch (err) {
    console.error('⚠️ [Audit Log Error]: Failed to write to Blackbox:', err.message);
    return null;
  }
};

/**
 * Express middleware that automatically logs modifying actions (POST, PUT, DELETE)
 * performed by Teachers or Admins to the Blackbox collection.
 */
export const auditLogger = async (req, res, next) => {
  // Listen to response finish to ensure modifying action status
  res.on('finish', async () => {
    // Only log modifying methods (POST, PUT, DELETE, PATCH)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      // Don't duplicate if already logged by specific controller or if not successful
      if (res.statusCode >= 200 && res.statusCode < 400) {
        // Skip routine health/ping checks if any
        if (req.originalUrl.includes('/api/health')) return;

        // Determine actor info from headers, authenticated user, or request body
        const actorName = req.headers['x-actor-name'] || req.user?.name || req.body?.actorName || 'Admin';
        const role = req.headers['x-actor-role'] || req.user?.role || req.body?.actorRole || 'admin';

        let action = 'MODIFY_OPERATION';
        if (req.originalUrl.includes('/api/admin/teachers')) {
          if (req.method === 'POST') action = 'TEACHER_ADDED';
          else if (req.method === 'DELETE') action = 'TEACHER_REMOVED';
        } else if (req.originalUrl.includes('/api/auth/login')) {
          action = 'LOGIN';
        }

        // Avoid double logging if the controller flagged it as custom-logged
        if (!req.auditLogged) {
          const details = `${req.method} ${req.originalUrl} - Status: ${res.statusCode} ${
            req.body?.name ? `(${req.body.name})` : ''
          }`.trim();

          await recordAuditLog({
            actorName,
            role,
            action,
            details,
          });
        }
      }
    }
  });

  next();
};

export default auditLogger;
