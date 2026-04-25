import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listArticles, getArticle,
  listVideos,
  listQuizzes, getQuiz, submitQuizAttempt,
} from '../controllers/content';

const router = Router();

// Articles and videos are public (needed for offline cache)
router.get('/articles',           listArticles);
router.get('/articles/:id',       getArticle);
router.get('/videos',             listVideos);
router.get('/quizzes',            listQuizzes);
router.get('/quizzes/:id',        getQuiz);

// Submitting attempts requires auth
router.post('/quizzes/:id/attempt', requireAuth, submitQuizAttempt);

export default router;
