import { User } from '../models/User.js';
import { recordAuditLog } from '../middleware/auditLogger.js';

/**
 * GET /api/admin/teachers
 * Retrieve all registered teachers
 */
export const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error('❌ [getTeachers Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve teachers from database.',
      error: error.message,
    });
  }
};

/**
 * POST /api/admin/teachers
 * Add a new teacher
 * Requires: name, fileNumber (Teacher ID). Default password '123'.
 */
export const addTeacher = async (req, res) => {
  try {
    const { name, fileNumber, password, department, block } = req.body;

    if (!name || !fileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Both Teacher Name and Teacher ID / File Number are required.',
      });
    }

    const trimmedFileNumber = fileNumber.trim();
    const trimmedName = name.trim();

    // Check if user already exists with fileNumber
    const existing = await User.findOne({
      fileNumber: { $regex: new RegExp(`^${trimmedFileNumber}$`, 'i') },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A user with Teacher ID / File Number "${trimmedFileNumber}" already exists.`,
      });
    }

    const newTeacher = new User({
      fileNumber: trimmedFileNumber,
      name: trimmedName,
      password: password && password.trim() ? password.trim() : '123',
      role: 'teacher',
      points: 500,
      block: block || 'Abdul Kalam Block',
      department: department || 'Department of Computer Science & Engineering',
    });

    await newTeacher.save();

    // Custom Blackbox audit log
    req.auditLogged = true;
    const actorName = req.headers['x-actor-name'] || 'Administrator';
    await recordAuditLog({
      actorName,
      role: 'admin',
      action: 'TEACHER_ADDED',
      details: `New Faculty Member "${trimmedName}" (ID: ${trimmedFileNumber}) added to ${newTeacher.block}.`,
    });

    return res.status(201).json({
      success: true,
      message: `Teacher ${trimmedName} successfully registered.`,
      teacher: {
        _id: newTeacher._id,
        fileNumber: newTeacher.fileNumber,
        identifier: newTeacher.fileNumber,
        name: newTeacher.name,
        role: newTeacher.role,
        points: newTeacher.points,
        block: newTeacher.block,
        department: newTeacher.department,
        createdAt: newTeacher.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ [addTeacher Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create teacher record.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/admin/teachers/:id
 * Delete a teacher by MongoDB _id or fileNumber
 */
export const removeTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Teacher identifier parameter is required.',
      });
    }

    // Try finding by _id first, then by fileNumber
    let teacher = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      teacher = await User.findById(id);
    }
    if (!teacher) {
      teacher = await User.findOne({
        fileNumber: id,
        role: 'teacher',
      });
    }

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher record not found.',
      });
    }

    const teacherName = teacher.name;
    const teacherId = teacher.fileNumber;

    await User.findByIdAndDelete(teacher._id);

    // Custom Blackbox audit log
    req.auditLogged = true;
    const actorName = req.headers['x-actor-name'] || 'Administrator';
    await recordAuditLog({
      actorName,
      role: 'admin',
      action: 'TEACHER_REMOVED',
      details: `Faculty Member "${teacherName}" (ID: ${teacherId}) removed from institutional directory.`,
    });

    return res.status(200).json({
      success: true,
      message: `Teacher "${teacherName}" (ID: ${teacherId}) removed successfully.`,
      removedId: teacher._id,
    });
  } catch (error) {
    console.error('❌ [removeTeacher Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete teacher record.',
      error: error.message,
    });
  }
};

export default { getTeachers, addTeacher, removeTeacher };
