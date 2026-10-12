import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    textLength: { type: Number, default: 0 },
    score: { type: Number, required: true, min: 0, max: 100 },
    present: { type: [String], default: [] },
    missing: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Resume', resumeSchema);
