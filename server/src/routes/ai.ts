import { Router } from 'express';
import {
  chatWithAI,
  predictEligibilityAndProbability,
  generateCareerAndCompanyRoadmap,
  generateInterviewQuestions,
  generateCoverLetter,
} from '../controllers/ai.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = Router();

// Secure all AI endpoints
router.use(authenticateJWT as any);

router.post('/chat', chatWithAI as any);
router.post('/eligibility-prediction', predictEligibilityAndProbability as any);
router.get('/career-roadmap', generateCareerAndCompanyRoadmap as any);
router.post('/interview-questions', generateInterviewQuestions as any);
router.post('/cover-letter', generateCoverLetter as any);

export default router;
