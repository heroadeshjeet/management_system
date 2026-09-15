import { User } from '../models/User.js';
import { Class } from '../models/Class.js';
import { TestResult } from '../models/TestResult.js';
import { Notification } from '../models/Notification.js';
import { recordAuditLog } from '../middleware/auditLogger.js';

/**
 * POST /api/students/bulk-import
 * Bulk imports parsed student records from Excel and links them to the active Class.
 */
export const bulkImportStudents = async (req, res) => {
  try {
    const { classId, students } = req.body;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Active Class ID is required for student enrollment.',
      });
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No student data provided for import.',
      });
    }

    // Verify Class exists
    const targetClass = await Class.findById(classId);
    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: 'Target academic class not found in system.',
      });
    }

    const validStudents = [];
    const missingFieldErrors = [];
    const seenFileNumbers = new Set();
    const inSheetDuplicates = [];

    // 1. In-sheet verification
    students.forEach((row, idx) => {
      const rowNum = idx + 1;
      const fileNumber = row.fileNumber || row['File numbers'] || row['File Number'];
      const name = row.name || row['Name'];
      const rawPassword = row.password || row['Password'];
      const rawPoints = row.points || row['Points'];

      if (!fileNumber || !fileNumber.toString().trim() || !name || !name.toString().trim()) {
        missingFieldErrors.push(`Row ${rowNum}: Missing File Number or Name`);
        return;
      }

      const trimmedFileNum = fileNumber.toString().trim();
      const trimmedName = name.toString().trim();

      if (seenFileNumbers.has(trimmedFileNum.toLowerCase())) {
        inSheetDuplicates.push(trimmedFileNum);
        return;
      }
      seenFileNumbers.add(trimmedFileNum.toLowerCase());

      const pointsVal = Number(rawPoints);
      const points = !isNaN(pointsVal) && pointsVal >= 0 ? pointsVal : 500;
      const password = rawPassword && rawPassword.toString().trim() ? rawPassword.toString().trim() : '123';

      validStudents.push({
        fileNumber: trimmedFileNum,
        name: trimmedName,
        password,
        role: 'student',
        points,
        block: targetClass.block || 'Abdul Kalam Block',
        department: targetClass.className,
        classId: targetClass._id,
        className: targetClass.className,
      });
    });

    if (validStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid student records could be parsed from the upload.',
        errors: missingFieldErrors,
      });
    }

    // 2. Check for existing duplicates in MongoDB
    const candidateFileNumbers = validStudents.map((s) => s.fileNumber);
    const existingUsers = await User.find({
      fileNumber: { $in: candidateFileNumbers },
    }).select('fileNumber name');

    const existingFileNumberSet = new Set(existingUsers.map((u) => u.fileNumber.toLowerCase()));
    const skippedExisting = [];
    const studentsToInsert = [];

    validStudents.forEach((student) => {
      if (existingFileNumberSet.has(student.fileNumber.toLowerCase())) {
        skippedExisting.push(student.fileNumber);
      } else {
        studentsToInsert.push(student);
      }
    });

    if (studentsToInsert.length === 0) {
      return res.status(409).json({
        success: false,
        message: 'All student File Numbers in this sheet already exist in the database.',
        duplicateFileNumbers: skippedExisting,
      });
    }

    // 3. Perform bulk insert using User.insertMany()
    const insertedUsers = await User.insertMany(studentsToInsert, { ordered: false });

    // 4. Automatically link new students to the active Class
    const insertedIds = insertedUsers.map((u) => u._id);
    targetClass.students.push(...insertedIds);
    await targetClass.save();

    // 5. Record Blackbox audit log
    req.auditLogged = true;
    const actorName = req.headers['x-actor-name'] || req.body?.actorName || 'Faculty In-Charge';
    const actorRole = req.headers['x-actor-role'] || 'teacher';
    const logDetails = `Imported ${insertedUsers.length} students into ${targetClass.className}${
      skippedExisting.length > 0 ? ` (${skippedExisting.length} duplicates skipped)` : ''
    }`;

    await recordAuditLog({
      actorName,
      role: actorRole,
      action: 'STUDENT_IMPORT',
      details: logDetails,
    });

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${insertedUsers.length} students into ${targetClass.className}.`,
      importedCount: insertedUsers.length,
      classId: targetClass._id,
      className: targetClass.className,
      totalClassStudents: targetClass.students.length,
      skippedExisting,
      inSheetDuplicates,
      missingFieldErrors,
    });
  } catch (error) {
    console.error('❌ [bulkImportStudents Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to bulk import students.',
      error: error.message,
    });
  }
};

/**
 * GET /api/students
 * Retrieve students, optionally filtered by classId
 */
export const getStudents = async (req, res) => {
  try {
    const { classId } = req.query;
    const query = { role: 'student' };
    if (classId) {
      query.classId = classId;
    }

    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error('❌ [getStudents Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch students.',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/students/:id/points
 * Increment or decrement a student's behavioral points
 */
export const updateStudentPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta, reason } = req.body;

    if (delta === undefined || isNaN(Number(delta))) {
      return res.status(400).json({
        success: false,
        message: 'Numeric delta value is required for point adjustment.',
      });
    }

    const deltaNum = Number(delta);

    // Find student by ObjectId or fileNumber
    let student = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await User.findById(id);
    }
    if (!student) {
      student = await User.findOne({ fileNumber: id, role: 'student' });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.',
      });
    }

    const previousPoints = student.points !== undefined ? student.points : 500;
    const newPoints = Math.max(0, previousPoints + deltaNum);
    student.points = newPoints;
    await student.save();

    // Log to Blackbox audit trail
    req.auditLogged = true;
    const actorIdentifier = req.headers['x-actor-name'] || 'Teacher';
    const actionDesc =
      deltaNum >= 0
        ? `awarded ${deltaNum} points to`
        : `deducted ${Math.abs(deltaNum)} points from`;

    const logDetails = `Teacher ${actorIdentifier} ${actionDesc} FileNumber ${student.fileNumber} (${student.name})${
      reason ? ` Reason: "${reason}"` : ''
    }. Balance: ${previousPoints} -> ${newPoints}`;

    await recordAuditLog({
      actorName: actorIdentifier,
      role: 'teacher',
      action: 'POINT_ADJUSTMENT',
      details: logDetails,
    });

    return res.status(200).json({
      success: true,
      message: `Points for ${student.name} updated: ${previousPoints} -> ${newPoints}`,
      points: newPoints,
      student: {
        _id: student._id,
        fileNumber: student.fileNumber,
        name: student.name,
        points: newPoints,
      },
    });
  } catch (error) {
    console.error('❌ [updateStudentPoints Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update student points.',
      error: error.message,
    });
  }
};

/**
 * GET /api/students/:id/dashboard
 * Aggregates student profile, dynamic class rank, recent test results, and notifications
 */
export const getStudentDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find Student by ObjectId or fileNumber
    let student = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await User.findById(id);
    }
    if (!student && id) {
      student = await User.findOne({ fileNumber: id, role: 'student' });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.',
      });
    }

    // 2. Find Class and Peers for Rank Calculation
    let classDoc = null;
    if (student.classId) {
      classDoc = await Class.findById(student.classId);
    }
    if (!classDoc) {
      classDoc = await Class.findOne({ students: student._id });
    }

    let classRank = 1;
    let totalClassmates = 1;
    let className = student.department || 'Enrolled Class';

    if (classDoc) {
      className = classDoc.className;
      const enrolledStudentIds = classDoc.students || [];
      totalClassmates = Math.max(1, enrolledStudentIds.length);

      // Fetch all classmates' points to calculate dynamic rank
      const classmates = await User.find({ _id: { $in: enrolledStudentIds } })
        .select('_id name fileNumber points')
        .lean();

      // Sort by points descending; tie-break by fileNumber
      classmates.sort((a, b) => {
        const ptsA = a.points !== undefined ? a.points : 500;
        const ptsB = b.points !== undefined ? b.points : 500;
        if (ptsB !== ptsA) return ptsB - ptsA;
        return (a.fileNumber || '').localeCompare(b.fileNumber || '');
      });

      const foundIndex = classmates.findIndex(
        (c) => c._id.toString() === student._id.toString()
      );
      if (foundIndex !== -1) {
        classRank = foundIndex + 1;
      }
    }

    // 3. Fetch Recent Test Results for this student
    const testResultsDocs = await TestResult.find({ 'scores.studentId': student._id })
      .populate('notificationId', 'message createdAt isTest')
      .populate('teacherId', 'name fileNumber department')
      .populate('classId', 'className')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentTests = testResultsDocs.map((tr) => {
      const scoreObj = (tr.scores || []).find(
        (s) => s.studentId && s.studentId.toString() === student._id.toString()
      );
      const marksObtained = scoreObj ? scoreObj.marksObtained : 0;
      const totalMarks = tr.totalMarks || 100;
      const passingMarks = tr.passingMarks || 40;
      const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
      const isPassing = marksObtained >= passingMarks;

      return {
        _id: tr._id,
        notificationId: tr.notificationId?._id,
        title: tr.notificationId?.message || 'Mid-Semester Examination',
        className: tr.classId?.className || className,
        teacherName: tr.teacherId?.name || 'Faculty Member',
        marksObtained,
        totalMarks,
        passingMarks,
        percentage,
        isPassing,
        date: tr.notificationId?.createdAt || tr.createdAt,
      };
    });

    // 4. Fetch Active Notifications
    const noticeQuery = {
      $or: [
        { targetAudience: student._id },
        ...(classDoc ? [{ classId: classDoc._id }] : []),
      ],
    };

    const notificationsDocs = await Notification.find(noticeQuery)
      .populate('senderId', 'name fileNumber department role')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Tag notifications: check for behavioral warning keywords
    const warningKeywords = [
      'late',
      'warning',
      'disciplinary',
      'short attendance',
      'absent',
      'penalty',
      'fine',
      'urgent',
    ];

    const formattedNotifications = notificationsDocs.map((n) => {
      const lowerMsg = (n.message || '').toLowerCase();
      const isBehavioralWarning = warningKeywords.some((kw) => lowerMsg.includes(kw));

      return {
        _id: n._id,
        message: n.message,
        isTest: !!n.isTest,
        isBehavioralWarning,
        senderName: n.senderName || n.senderId?.name || 'Institutional Faculty',
        senderRole: n.senderRole || n.senderId?.role || 'teacher',
        createdAt: n.createdAt,
      };
    });

    // Summary stats
    const latestTestPercentage = recentTests.length > 0 ? recentTests[0].percentage : null;
    const averageTestPercentage =
      recentTests.length > 0
        ? Math.round(
            recentTests.reduce((acc, curr) => acc + curr.percentage, 0) / recentTests.length
          )
        : null;

    return res.status(200).json({
      success: true,
      dashboard: {
        student: {
          _id: student._id,
          name: student.name,
          fileNumber: student.fileNumber,
          points: student.points !== undefined ? student.points : 500,
          block: student.block || 'Abdul Kalam Block',
          department: student.department || className,
          avatar: student.avatar,
        },
        classInfo: {
          _id: classDoc?._id,
          className,
          totalStudents: totalClassmates,
        },
        rank: {
          currentRank: classRank,
          totalClassmates,
          percentile: Math.max(
            1,
            Math.round(((totalClassmates - classRank + 1) / totalClassmates) * 100)
          ),
        },
        recentTests,
        notifications: formattedNotifications,
        stats: {
          latestTestPercentage,
          averageTestPercentage,
          totalTestsTaken: recentTests.length,
          unreadNoticesCount: formattedNotifications.length,
        },
      },
    });
  } catch (error) {
    console.error('❌ [getStudentDashboard Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate student dashboard data.',
      error: error.message,
    });
  }
};

export default {
  bulkImportStudents,
  getStudents,
  updateStudentPoints,
  getStudentDashboard,
};

