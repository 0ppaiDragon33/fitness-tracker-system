import { Router, RequestHandler } from 'express';
import { getStats, getUsers, updateUserRole, deleteUser, getAllWorkouts } from '../controllers/admin.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

// Express 4 does not catch async errors automatically; wrap each handler.
const asyncHandler = (fn: Function): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();
router.use(protect, adminOnly);
/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Platform dashboard stats (admin only)
 *     tags: [Admin]
 *     responses:
 *       200: { description: Stats }
 */
router.get('/stats', asyncHandler(getStats));
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: All users with pagination (admin only)
 *     tags: [Admin]
 *     responses:
 *       200: { description: Users }
 */
router.get('/users', asyncHandler(getUsers));
/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update user role (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       200: { description: Role updated }
 */
router.patch('/users/:id/role', asyncHandler(updateUserRole));
/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User deleted }
 */
router.delete('/users/:id', asyncHandler(deleteUser));
/**
 * @swagger
 * /admin/workouts:
 *   get:
 *     summary: All workouts on platform (admin only)
 *     tags: [Admin]
 *     responses:
 *       200: { description: All workouts }
 */
router.get('/workouts', asyncHandler(getAllWorkouts));
export default router;
