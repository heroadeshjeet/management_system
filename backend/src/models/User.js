import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fileNumber: {
      type: String,
      required: [true, 'File Number is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    password: {
      type: String,
      default: '123',
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['admin', 'teacher', 'student'],
      default: 'student',
    },
    points: {
      type: Number,
      default: 500,
    },
    block: {
      type: String,
      default: 'Abdul Kalam Block',
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    className: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field to ensure both fileNumber and identifier can be used seamlessly across frontend and backend
userSchema.virtual('identifier').get(function () {
  return this.fileNumber;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export const User = mongoose.model('User', userSchema);
export default User;
