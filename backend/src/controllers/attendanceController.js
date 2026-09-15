import { Attendance } from '../models/Attendance.js';
import { Class } from '../models/Class.js';
import { User } from '../models/User.js';
import { recordAuditLog } from '../middleware/auditLogger.js';

// Helper to normalize any date input to start-of-day UTC for consistent daily lookups
const normalizeDate = (rawDate) => {
  const d = rawDate ? new Date(rawDate) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * POST /api/attendance
 * Save or update daily attendance record for a class
 */
export const saveAttendance = async (req, res) => {
  try {
    const { classId, date, teacherId, records } = req.body;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required to record attendance.',
      });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance student records array cannot be empty.',
      });
    }

    // Verify Class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Target academic class not found.',
      });
    }

    // Resolve submitting teacher
    let teacherDoc = null;
    const actorFileNumber = req.headers['x-actor-name'] || teacherId;
    if (teacherId && teacherId.toString().match(/^[0-9a-fA-F]{24}$/)) {
      teacherDoc = await User.findById(teacherId);
    }
    if (!teacherDoc && actorFileNumber) {
      teacherDoc = await User.findOne({
        $or: [{ fileNumber: actorFileNumber }, { name: actorFileNumber }],
      });
    }
    if (!teacherDoc) {
      teacherDoc = classDoc.inchargeTeacherId
        ? await User.findById(classDoc.inchargeTeacherId)
        : null;
    }

    const effectiveTeacherId = teacherDoc ? teacherDoc._id : classDoc.inchargeTeacherId;
    const teacherName = teacherDoc ? teacherDoc.name : 'Faculty Member';
    const teacherIdentifier = teacherDoc ? teacherDoc.fileNumber : 'Teacher';

    const normalizedDate = normalizeDate(date);

    // Format & validate records
    const formattedRecords = records.map((r) => ({
      studentId: r.studentId,
      status: ['present', 'late', 'absent', 'leave'].includes(r.status) ? r.status : 'present',
    }));

    // Calculate quick counts for summary & audit
    const counts = { present: 0, late: 0, absent: 0, leave: 0 };
    formattedRecords.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });

    // Upsert attendance record for (classId, date)
    const attendance = await Attendance.findOneAndUpdate(
      { classId, date: normalizedDate },
      {
        classId,
        date: normalizedDate,
        teacherId: effectiveTeacherId,
        records: formattedRecords,
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Log action to Blackbox
    req.auditLogged = true;
    const dateFormatted = normalizedDate.toISOString().split('T')[0];
    const logDetails = `Teacher ${teacherIdentifier} marked attendance for Class ${classDoc.className} (${counts.present} Present, ${counts.late} Late, ${counts.absent} Absent, ${counts.leave} Leave)`;

    await recordAuditLog({
      actorName: teacherName,
      role: 'teacher',
      action: 'ATTENDANCE_SUBMITTED',
      details: logDetails,
    });

    return res.status(200).json({
      success: true,
      message: `Attendance for ${classDoc.className} on ${dateFormatted} saved successfully.`,
      attendance,
      summary: counts,
    });
  } catch (error) {
    console.error('❌ [saveAttendance Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record class attendance.',
      error: error.message,
    });
  }
};

/**
 * GET /api/attendance/:classId/:date
 * Fetch existing attendance record for a class on a specified date
 */
export const getAttendance = async (req, res) => {
  try {
    const { classId, date } = req.params;

    if (!classId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Both classId and date parameters are required.',
      });
    }

    const normalizedDate = normalizeDate(date);

    const attendance = await Attendance.findOne({
      classId,
      date: normalizedDate,
    }).populate('records.studentId', 'name fileNumber points avatar');

    if (!attendance) {
      return res.status(200).json({
        success: true,
        exists: false,
        message: 'No attendance recorded yet for this date.',
        records: [],
      });
    }

    return res.status(200).json({
      success: true,
      exists: true,
      attendance,
    });
  } catch (error) {
    console.error('❌ [getAttendance Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance record.',
      error: error.message,
    });
  }
};

export default { saveAttendance, getAttendance };
