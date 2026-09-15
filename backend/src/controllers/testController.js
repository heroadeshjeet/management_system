import { TestResult } from '../models/TestResult.js';
import { Notification } from '../models/Notification.js';
import { Class } from '../models/Class.js';
import { User } from '../models/User.js';
import { recordAuditLog } from '../middleware/auditLogger.js';

/**
 * POST /api/tests/marks
 * Submit or update test marks for a class test linked to a notification
 */
export const submitMarks = async (req, res) => {
  try {
    const { notificationId, classId, teacherId, totalMarks, passingMarks, scores } = req.body;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID linking to the test is required.',
      });
    }

    if (!Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Scores array cannot be empty.',
      });
    }

    // Verify Notification exists
    const notice = await Notification.findById(notificationId);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Referenced test notification not found.',
      });
    }

    // Ensure notification is marked as a test
    if (!notice.isTest) {
      notice.isTest = true;
      await notice.save();
    }

    // Resolve teacher
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
    if (!teacherDoc && notice.senderId) {
      teacherDoc = await User.findById(notice.senderId);
    }

    const effectiveTeacherId = teacherDoc ? teacherDoc._id : notice.senderId;
    const teacherName = teacherDoc ? teacherDoc.name : 'Faculty Member';
    const teacherIdentifier = teacherDoc ? teacherDoc.fileNumber : 'Teacher';

    const totalMarksNum = Math.max(1, Number(totalMarks) || 100);
    const passingMarksNum = Math.max(0, Number(passingMarks) || 40);

    // Format scores
    const formattedScores = scores.map((s) => ({
      studentId: s.studentId,
      marksObtained: Math.min(totalMarksNum, Math.max(0, Number(s.marksObtained) || 0)),
    }));

    // Upsert TestResult document
    const testResult = await TestResult.findOneAndUpdate(
      { notificationId },
      {
        notificationId,
        classId: classId || notice.classId,
        teacherId: effectiveTeacherId,
        totalMarks: totalMarksNum,
        passingMarks: passingMarksNum,
        scores: formattedScores,
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Populate student details
    await testResult.populate('scores.studentId', 'name fileNumber points avatar');

    // Sort scores descending by marksObtained
    testResult.scores.sort((a, b) => b.marksObtained - a.marksObtained);

    // Compute evaluation statistics for Blackbox
    const topScorer = testResult.scores[0]?.studentId?.name || 'Scholar';
    const topScore = testResult.scores[0]?.marksObtained || 0;
    const passedCount = testResult.scores.filter(
      (s) => s.marksObtained >= passingMarksNum
    ).length;
    const passPercentage = Math.round((passedCount / testResult.scores.length) * 100);

    let className = 'Batch';
    if (testResult.classId) {
      const cls = await Class.findById(testResult.classId).select('className');
      if (cls) className = cls.className;
    }

    // Blackbox audit log
    req.auditLogged = true;
    const logDetails = `Teacher ${teacherIdentifier} evaluated test marks for ${className} (${testResult.scores.length} scholars, Top: ${topScorer} with ${topScore}/${totalMarksNum}, Pass Rate: ${passPercentage}%)`;

    await recordAuditLog({
      actorName: teacherName,
      role: 'teacher',
      action: 'TEST_EVALUATED',
      details: logDetails,
    });

    return res.status(200).json({
      success: true,
      message: `Test marks evaluated successfully! ${passedCount}/${testResult.scores.length} passed.`,
      testResult,
      leaderboard: testResult.scores,
      stats: {
        totalEvaluated: testResult.scores.length,
        passedCount,
        failedCount: testResult.scores.length - passedCount,
        passPercentage,
        totalMarks: totalMarksNum,
        passingMarks: passingMarksNum,
        topScorer: { name: topScorer, marks: topScore },
      },
    });
  } catch (error) {
    console.error('❌ [submitMarks Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit test evaluation marks.',
      error: error.message,
    });
  }
};

/**
 * GET /api/tests/marks/:notificationId
 * Retrieve test results for a specific test notice, sorted descending by marksObtained
 */
export const getMarksByNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required.',
      });
    }

    const testResult = await TestResult.findOne({ notificationId })
      .populate('scores.studentId', 'name fileNumber points avatar block')
      .populate('teacherId', 'name fileNumber department')
      .populate('classId', 'className block');

    if (!testResult) {
      return res.status(200).json({
        success: true,
        exists: false,
        message: 'No evaluation marks recorded yet for this test.',
        testResult: null,
      });
    }

    // Sort scores descending by marksObtained
    testResult.scores.sort((a, b) => b.marksObtained - a.marksObtained);

    return res.status(200).json({
      success: true,
      exists: true,
      testResult,
      leaderboard: testResult.scores,
    });
  } catch (error) {
    console.error('❌ [getMarksByNotification Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch test results.',
      error: error.message,
    });
  }
};

export default { submitMarks, getMarksByNotification };
