import { Router } from 'express';
import resumeRoutes from './resume.routes.js';

const router = Router();

router.use('/resume', resumeRoutes);

export default router;
