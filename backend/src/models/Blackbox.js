import mongoose from 'mongoose';

const blackboxSchema = new mongoose.Schema(
  {
    actorName: {
      type: String,
      required: [true, 'Actor name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Actor role is required'],
      trim: true,
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true,
    },
    details: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Blackbox = mongoose.model('Blackbox', blackboxSchema);
export default Blackbox;
