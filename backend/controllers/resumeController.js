import Resume from '../models/Resume.js';
import Comparison from '../models/Comparison.js';
import { parseResume } from '../services/resumeService.js';
import { compareResumeToJob } from '../services/comparisonService.js';

// POST /api/resume/upload  — multipart with a "resume" file field
export async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    // `text` is left out of the record on purpose — see services/resumeService.js.
    const { text: _text, ...result } = await parseResume(req.file.buffer);
    const saved = await Resume.create({ fileName: req.file.originalname, ...result });

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}

// POST /api/resume/compare  — multipart with a "resume" file and a
// "jobDescription" text field. Both are required: a match score is only
// meaningful against a specific posting.
export async function compareResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    const jobDescription = (req.body?.jobDescription || '').trim();
    if (jobDescription.length < 30) {
      return res.status(400).json({
        error: 'Paste the job description you are applying to — a few sentences at least.',
      });
    }

    const { text, textLength } = await parseResume(req.file.buffer);

    // An image-only (scanned) PDF extracts to nothing, and silently scoring it 0
    // with every requirement "missing" would be a confident wrong answer.
    if (!text.trim()) {
      return res.status(422).json({
        error: 'No text found in that PDF — it may be a scan. Upload a text-based PDF.',
      });
    }

    const comparison = await compareResumeToJob({ resumeText: text, jobDescription });

    const saved = await Comparison.create({
      fileName: req.file.originalname,
      resumeChars: textLength,
      jobDescriptionChars: jobDescription.length,
      ...comparison,
    });

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}

// GET /api/resume — recent parses, newest first
export async function listResumes(_req, res, next) {
  try {
    const resumes = await Resume.find().sort({ createdAt: -1 }).limit(20);
    res.json(resumes);
  } catch (err) {
    next(err);
  }
}
