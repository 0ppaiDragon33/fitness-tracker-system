import { Router, RequestHandler } from 'express';
import { getExercises, createExercise, updateExercise, deleteExercise, seedExercises } from '../controllers/exercise.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validateExercise } from '../middleware/validation.middleware';

const asyncHandler = (fn: Function): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();
/**
 * @swagger
 * /exercises:
 *   get:
 *     summary: Browse exercise library — filter by muscleGroup, difficulty, search
 *     tags: [Exercises]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: muscleGroup
 *         schema: { type: string }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [Beginner, Intermediate, Advanced] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Exercise list }
 */
router.get('/', asyncHandler(getExercises));
router.post('/seed', protect, adminOnly, asyncHandler(seedExercises));
router.post('/', protect, adminOnly, validateExercise, asyncHandler(createExercise));
router.put('/:id', protect, adminOnly, validateExercise, asyncHandler(updateExercise));
router.delete('/:id', protect, adminOnly, asyncHandler(deleteExercise));
export default router;
