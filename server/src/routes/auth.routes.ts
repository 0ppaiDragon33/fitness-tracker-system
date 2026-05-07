import { Router, RequestHandler } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const asyncHandler = (fn: Function): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register user — create Firestore profile after Firebase Auth signup
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               idToken: { type: string }
 *     responses:
 *       201: { description: Registration successful }
 */
router.post('/register', asyncHandler(register));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login — verify Firebase token, return user profile with role
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken: { type: string }
 *     responses:
 *       200: { description: Login successful }
 */
router.post('/login', asyncHandler(login));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     responses:
 *       200: { description: User profile }
 */
router.get('/me', protect, asyncHandler(getMe));

/**
 * @swagger
 * /auth/me:
 *   patch:
 *     summary: Update fitness profile fields (weightKg, age, sex, fitnessLevel, name)
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               weightKg: { type: number, example: 75 }
 *               age: { type: integer, example: 28 }
 *               sex: { type: string, enum: [male, female] }
 *               fitnessLevel: { type: string, enum: [beginner, intermediate, advanced] }
 *     responses:
 *       200: { description: Profile updated }
 */
router.patch('/me', protect, asyncHandler(updateProfile));

export default router;
