import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listGroups, createGroup, joinGroup, leaveGroup,
  listPosts, createPost,
  addReaction, removeReaction,
  addComment,
  reportPost,
} from '../controllers/community';

const router = Router();

router.use(requireAuth);

// Groups
router.get('/groups',               listGroups);
router.post('/groups',              createGroup);
router.post('/groups/:id/join',     joinGroup);
router.delete('/groups/:id/leave',  leaveGroup);

// Posts within a group
router.get('/groups/:id/posts',     listPosts);
router.post('/groups/:id/posts',    createPost);

// Post-level actions
router.post('/posts/:id/reactions',             addReaction);
router.delete('/posts/:id/reactions/:type',     removeReaction);
router.post('/posts/:id/comments',              addComment);
router.post('/posts/:id/report',                reportPost);

export default router;
