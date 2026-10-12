import { Router } from 'express';
import upload from '../middleware/upload.js';
import {
  uploadResume,
  compareResume,
  listResumes,
} from '../controllers/resumeController.js';

const router = Router();

// Field name the frontend must use in its FormData: "resume"
router.post('/upload', upload.single('resume'), uploadResume);

// The same "resume" file field, plus a "jobDescription" text field.
router.post('/compare', upload.single('resume'), compareResume);

router.get('/', listResumes);

export default router;
