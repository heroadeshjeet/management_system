import { Class } from '../models/Class.js';
import { User } from '../models/User.js';
import { recordAuditLog } from '../middleware/auditLogger.js';

/**
 * POST /api/classes
 * Create a new academic class with in-charge teacher and subject allocations
 */
export const createClass = async (req, res) => {
  try {
    const { className, block, inchargeTeacherId, subjects } = req.body;

    if (!className || !className.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Class Name is required.',
      });
    }

    if (!inchargeTeacherId) {
      return res.status(400).json({
        success: false,
        message: 'In-charge Teacher assignment is required.',
      });
    }

    // Verify incharge teacher exists
    let teacher = null;
    if (inchargeTeacherId.toString().match(/^[0-9a-fA-F]{24}$/)) {
      teacher = await User.findById(inchargeTeacherId);
    } else {
      teacher = await User.findOne({ fileNumber: inchargeTeacherId, role: 'teacher' });
    }

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'In-charge Teacher not found in faculty directory.',
      });
    }

    // Format and validate subjects
    const formattedSubjects = [];
    if (Array.isArray(subjects)) {
      for (const subj of subjects) {
        if (subj.subjectName && subj.subjectName.trim()) {
          let assignedTeacher = null;
          if (subj.assignedTeacherId && subj.assignedTeacherId.toString().match(/^[0-9a-fA-F]{24}$/)) {
            assignedTeacher = await User.findById(subj.assignedTeacherId);
          } else if (subj.assignedTeacherId) {
            assignedTeacher = await User.findOne({ fileNumber: subj.assignedTeacherId, role: 'teacher' });
          }

          formattedSubjects.push({
            subjectName: subj.subjectName.trim(),
            assignedTeacherId: assignedTeacher ? assignedTeacher._id : teacher._id,
          });
        }
      }
    }

    const newClass = new Class({
      className: className.trim(),
      block: block || teacher.block || 'Abdul Kalam Block',
      inchargeTeacherId: teacher._id,
      subjects: formattedSubjects,
      students: [],
    });

    await newClass.save();

    // Populate for response
    await newClass.populate('inchargeTeacherId', 'name fileNumber department');
    await newClass.populate('subjects.assignedTeacherId', 'name fileNumber department');

    // Audit log
    req.auditLogged = true;
    const actorName = req.headers['x-actor-name'] || req.body?.actorName || 'Administrator';
    const actorRole = req.headers['x-actor-role'] || 'admin';
    await recordAuditLog({
      actorName,
      role: actorRole,
      action: 'CLASS_CREATED',
      details: `Created new class "${newClass.className}" in ${newClass.block} under In-Charge ${teacher.name} (${teacher.fileNumber}) with ${formattedSubjects.length} subjects.`,
    });

    return res.status(201).json({
      success: true,
      message: `Class "${newClass.className}" created successfully.`,
      class: newClass,
    });
  } catch (error) {
    console.error('❌ [createClass Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create class record.',
      error: error.message,
    });
  }
};

/**
 * GET /api/classes
 * Fetch all registered classes with populated teachers and student counts
 */
export const getClasses = async (req, res) => {
  try {
    const classes = await Class.find({})
      .populate('inchargeTeacherId', 'name fileNumber department block')
      .populate('subjects.assignedTeacherId', 'name fileNumber department')
      .sort({ createdAt: -1 });

    const classesWithCount = classes.map((c) => ({
      _id: c._id,
      className: c.className,
      block: c.block,
      inchargeTeacher: c.inchargeTeacherId,
      subjects: c.subjects,
      studentCount: c.students ? c.students.length : 0,
      createdAt: c.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: classesWithCount.length,
      classes: classesWithCount,
    });
  } catch (error) {
    console.error('❌ [getClasses Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve classes.',
      error: error.message,
    });
  }
};

/**
 * GET /api/classes/:id
 * Fetch single class details including populated student roster
 */
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const classRecord = await Class.findById(id)
      .populate('inchargeTeacherId', 'name fileNumber department block')
      .populate('subjects.assignedTeacherId', 'name fileNumber department')
      .populate('students', 'name fileNumber points block lastLogin createdAt');

    if (!classRecord) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.',
      });
    }

    return res.status(200).json({
      success: true,
      class: classRecord,
    });
  } catch (error) {
    console.error('❌ [getClassById Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch class record.',
      error: error.message,
    });
  }
};

export default { createClass, getClasses, getClassById };
