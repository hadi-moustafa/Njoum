import { Router } from 'express';
import { requireAuth, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import {
  listUsers, getUserDetail, changeUserRole, banUserHandler, unbanUserHandler,
  listReports, resolveReport, dismissReport, removePost,
  adminListHotlines, createHotline, updateHotline, listHotlineReports, resolveHotlineReport,
  listAuditLogs,
  getStats, getRecentSos, getMoodAnalytics, getSosAnalytics, getModuleAnalytics,
} from '../controllers/admin';
import { createArticle, updateArticle, deleteArticle } from '../controllers/articles';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// Users
router.get('/users',                    listUsers);
router.get('/users/:id',                getUserDetail);
router.patch('/users/:id/role',         requireSuperAdmin, changeUserRole);  // only super_admin changes roles
router.patch('/users/:id/ban',          banUserHandler);
router.patch('/users/:id/unban',        unbanUserHandler);

// Moderation
router.get('/reports',                  listReports);
router.patch('/reports/:id/resolve',    resolveReport);
router.patch('/reports/:id/dismiss',    dismissReport);
router.patch('/posts/:id/remove',       removePost);

// Hotlines
router.get('/hotlines',                         adminListHotlines);
router.post('/hotlines',                        createHotline);
router.patch('/hotlines/:id',                   updateHotline);
router.get('/hotlines/reports',                 listHotlineReports);
router.patch('/hotlines/reports/:id/resolve',   resolveHotlineReport);

// Analytics
router.get('/stats',              getStats);
router.get('/sos/recent',         getRecentSos);
router.get('/analytics/mood',     getMoodAnalytics);
router.get('/analytics/sos',      getSosAnalytics);
router.get('/analytics/modules',  getModuleAnalytics);

// Articles (content_admin + super_admin)
router.post('/articles',       createArticle);
router.patch('/articles/:id',  updateArticle);
router.delete('/articles/:id', deleteArticle);

// Audit log (super_admin only)
router.get('/audit-logs', requireSuperAdmin, listAuditLogs);

export default router;
