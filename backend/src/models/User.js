import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: [true, 'Identifier is required (File Number / Teacher ID / Admin)'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'teacher', 'student'],
      default: 'student',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    block: {
      type: String,
      default: 'Abdul Kalam Block',
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

export const User = mongoose.model('User', userSchema);
