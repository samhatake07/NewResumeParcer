import mongoose from 'mongoose';

// One resume compared against one job description.
//
// Note what is NOT stored: the resume text and the job description itself. They
// are held in memory for the duration of the request and then dropped. Keeping
// scores in the DB is a feature; keeping candidates' personal documents in it is
// a liability, and nobody asked for it.
const comparisonSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    jobTitle: { type: String, default: '' },
    score: { type: Number, required: true, min: 0, max: 100 },
    verdict: { type: String, default: '' },
    matched: { type: [String], default: [] },
    missing: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },

    // Character counts, so you can see when a document was long enough to be
    // truncated before it was sent to labd.
    resumeChars: { type: Number, default: 0 },
    jobDescriptionChars: { type: Number, default: 0 },

    // Percentage of the labd allowance left after this call.
    creditsPercentLeft: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Comparison', comparisonSchema);
