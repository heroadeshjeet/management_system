import { Notification } from '../models/Notification.js';
import { Class } from '../models/Class.js';
import { User } from '../models/User.js';
import { recordAuditLog } from '../middleware/auditLogger.js';

/**
 * POST /api/notifications/send
 * Dispatches a notice to specified student IDs or to all students in a class.
 * If isTest is true, marks it as an MST/Test notice for Phase 5 grading triggers.
 */
export const sendNotification = async (req, res) => {
  try {
    const { senderId, classId, targetAudience, message, isTest } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Notice message content is required.',
      });
    }

    // Resolve sender
    let senderDoc = null;
    const actorFileNumber = req.headers['x-actor-name'] || senderId;
    if (senderId && senderId.toString().match(/^[0-9a-fA-F]{24}$/)) {
      senderDoc = await User.findById(senderId);
    }
    if (!senderDoc && actorFileNumber) {
      senderDoc = await User.findOne({
        $or: [{ fileNumber: actorFileNumber }, { name: actorFileNumber }],
      });
    }

    const effectiveSenderId = senderDoc ? senderDoc._id : null;
    const senderName = senderDoc ? senderDoc.name : 'Faculty Member';
    const senderRole = senderDoc ? senderDoc.role : 'teacher';
    const senderIdentifier = senderDoc ? senderDoc.fileNumber : 'Teacher';

    let resolvedStudentIds = [];

    // If targetAudience array provided
    if (Array.isArray(targetAudience) && targetAudience.length > 0) {
      resolvedStudentIds = targetAudience.filter((id) => id && id.toString().match(/^[0-9a-fA-F]{24}$/));
    } else if (classId) {
      // Broadcast to whole class
      const classDoc = await Class.findById(classId);
      if (classDoc && Array.isArray(classDoc.students)) {
        resolvedStudentIds = classDoc.students;
      }
    }

    let classDoc = null;
    if (classId) {
      classDoc = await Class.findById(classId);
    }

    const notification = new Notification({
      senderId: effectiveSenderId || req.user?._id,
      senderName,
      senderRole,
      classId: classId || null,
      targetAudience: resolvedStudentIds,
      message: message.trim(),
      isTest: Boolean(isTest),
      createdAt: new Date(),
    });

    await notification.save();

    // Log to Blackbox
    req.auditLogged = true;
    const isTestNotice = Boolean(isTest);
    const noticeType = isTestNotice ? 'Test/MST Notification' : 'Standard Notice';
    const recipientText = classDoc
      ? `Class ${classDoc.className} (${resolvedStudentIds.length} scholars)`
      : `${resolvedStudentIds.length} scholars`;

    const logDetails = `Teacher ${senderIdentifier} dispatched ${noticeType} to ${recipientText}: "${message.trim().substring(0, 60)}${message.length > 60 ? '...' : ''}"`;

    await recordAuditLog({
      actorName: senderName,
      role: senderRole,
      action: isTestNotice ? 'TEST_NOTIFICATION_DISPATCHED' : 'NOTIFICATION_DISPATCHED',
      details: logDetails,
    });

    return res.status(201).json({
      success: true,
      message: `${isTestNotice ? 'MST Test Notification' : 'Notice'} dispatched successfully to ${resolvedStudentIds.length} scholars.`,
      notification,
      recipientCount: resolvedStudentIds.length,
    });
  } catch (error) {
    console.error('❌ [sendNotification Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch notification.',
      error: error.message,
    });
  }
};

/**
 * GET /api/notifications
 * Retrieves notifications, filterable by classId or limit
 */
export const getNotifications = async (req, res) => {
  try {
    const { classId, isTest, limit = 50 } = req.query;
    const query = {};

    if (classId) {
      query.classId = classId;
    }
    if (isTest !== undefined) {
      query.isTest = isTest === 'true';
    }

    const notifications = await Notification.find(query)
      .populate('senderId', 'name fileNumber department')
      .populate('classId', 'className block')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('❌ [getNotifications Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.',
      error: error.message,
    });
  }
};

/**
 * GET /api/notifications/:id
 * Retrieves a single notification by its ObjectId
 */
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id)
      .populate('senderId', 'name fileNumber department')
      .populate('classId', 'className block students');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('❌ [getNotificationById Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification.',
      error: error.message,
    });
  }
};

export default { sendNotification, getNotifications, getNotificationById };

