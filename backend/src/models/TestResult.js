import mongoose from 'mongoose';

const studentScoreSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0,
  },
});

const testResultSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: [true, 'Notification ID reference is required'],
      unique: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class ID reference is required'],
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Grading teacher ID is required'],
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks are required'],
      default: 100,
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks are required'],
      default: 40,
    },
    scores: [studentScoreSchema],
  },
  {
    timestamps: true,
  }
);

export const TestResult = mongoose.model('TestResult', testResultSchema);
export default TestResult;
