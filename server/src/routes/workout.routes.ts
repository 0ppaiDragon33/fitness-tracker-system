import { Router, RequestHandler } from 'express';
import { getWorkouts, getWorkout, createWorkout, updateWorkout, deleteWorkout, getMyWorkouts } from '../controllers/workout.controller';
import { protect } from '../middleware/auth.middleware';
import { validateWorkout } from '../middleware/validation.middleware';
import { upload } from '../middleware/upload.middleware';

const asyncHandler = (fn: Function): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();
router.use(protect);

/**
 * @swagger
 * /workouts:
 *   get:
 *     summary: Get my workouts with filter and pagination
 *     tags: [Workouts]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [Strength,Cardio,Flexibility,HIIT,Yoga,Sports,Other] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200: { description: Paginated workouts }
 */
router.get('/', asyncHandler(getWorkouts));
/**
 * @swagger
 * /workouts/user/my:
 *   get:
 *     summary: Get all my workouts (no pagination)
 *     tags: [Workouts]
 *     responses:
 *       200: { description: All my workouts }
 */
router.get('/user/my', asyncHandler(getMyWorkouts));
/**
 * @swagger
 * /workouts/{id}:
 *   get:
 *     summary: Get single workout by ID
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Workout detail }
 */
router.get('/:id', asyncHandler(getWorkout));
/**
 * @swagger
 * /workouts:
 *   post:
 *     summary: Log a new workout
 *     tags: [Workouts]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, type, date, durationMinutes]
 *             properties:
 *               title: { type: string }
 *               type: { type: string }
 *               date: { type: string, format: date }
 *               durationMinutes: { type: integer }
 *               caloriesBurned: { type: integer }
 *               notes: { type: string }
 *               exercises: { type: string, description: JSON array of exercise sets }
 *               image: { type: string, format: binary }
 *     responses:
 *       201: { description: Workout logged }
 */
router.post('/', upload.single('image'), validateWorkout, asyncHandler(createWorkout));
/**
 * @swagger
 * /workouts/{id}:
 *   put:
 *     summary: Update a workout
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Workout updated }
 */
router.put('/:id', upload.single('image'), asyncHandler(updateWorkout));
/**
 * @swagger
 * /workouts/{id}:
 *   delete:
 *     summary: Delete a workout
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Workout deleted }
 */
router.delete('/:id', asyncHandler(deleteWorkout));
export default router;
