import { Router, RequestHandler } from 'express';
import { getProgress, getChartData, logBodyMeasurement, getBodyLogs } from '../controllers/progress.controller';
import { protect } from '../middleware/auth.middleware';
import { validateBodyLog } from '../middleware/validation.middleware';

const asyncHandler = (fn: Function): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();
router.use(protect);
/**
 * @swagger
 * /progress:
 *   get:
 *     summary: Get user progress summary stats
 *     tags: [Progress]
 *     responses:
 *       200: { description: Progress stats }
 */
router.get('/', asyncHandler(getProgress));
/**
 * @swagger
 * /progress/chart:
 *   get:
 *     summary: Chart data — workouts and calories over last 30 days
 *     tags: [Progress]
 *     responses:
 *       200: { description: Chart data arrays }
 */
router.get('/chart', asyncHandler(getChartData));
/**
 * @swagger
 * /progress/body:
 *   post:
 *     summary: Log a body measurement (weight, body fat)
 *     tags: [Progress]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weight: { type: number }
 *               bodyFat: { type: number }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Measurement logged }
 */
router.post('/body', validateBodyLog, asyncHandler(logBodyMeasurement));
/**
 * @swagger
 * /progress/body:
 *   get:
 *     summary: Get body measurement history (last 30 entries)
 *     tags: [Progress]
 *     responses:
 *       200: { description: Body log history }
 */
router.get('/body', asyncHandler(getBodyLogs));
export default router;
