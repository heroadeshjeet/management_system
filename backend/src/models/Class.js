import mongoose from 'mongoose';

const subjectAssignmentSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
  },
  assignedTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned teacher is required'],
  },
});

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    block: {
      type: String,
      default: 'Abdul Kalam Block',
      trim: true,
    },
    inchargeTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'In-charge teacher is required'],
    },
    subjects: [subjectAssignmentSchema],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Class = mongoose.model('Class', classSchema);
export default Class;
