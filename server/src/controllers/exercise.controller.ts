import { Response, Request } from 'express';
import { db } from '../config/firebase';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { SEED_EXERCISES } from '../utils/seed';

export const getExercises = async (req: Request, res: Response): Promise<void> => {
  const { muscleGroup, difficulty, search } = req.query;
  // Apply only one Firestore .where() at a time to avoid needing composite indexes.
  // Additional filters are applied in memory.
  let query: FirebaseFirestore.Query = db.collection('exercises');
  if (muscleGroup) query = query.where('muscleGroup', '==', muscleGroup);

  const snap = await query.get();
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  if (difficulty) items = items.filter((e: any) => e.difficulty === difficulty);
  if (search) {
    const q = (search as string).toLowerCase();
    items = items.filter((e: any) => e.name?.toLowerCase().includes(q) || e.muscleGroup?.toLowerCase().includes(q));
  }

  items.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  res.json({ success: true, data: { exercises: items } });
};

export const createExercise = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = { ...req.body, isCustom: true, createdAt: new Date().toISOString() };
  const ref = await db.collection('exercises').add(data);
  res.status(201).json({ success: true, message: 'Exercise created.', data: { exercise: { id: ref.id, ...data } } });
};

export const updateExercise = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await db.collection('exercises').doc(req.params.id).get();
  if (!doc.exists) throw new AppError('Exercise not found.', 404);
  await db.collection('exercises').doc(req.params.id).update({ ...req.body, updatedAt: new Date().toISOString() });
  res.json({ success: true, message: 'Exercise updated.' });
};

export const deleteExercise = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await db.collection('exercises').doc(req.params.id).get();
  if (!doc.exists) throw new AppError('Exercise not found.', 404);
  await db.collection('exercises').doc(req.params.id).delete();
  res.json({ success: true, message: 'Exercise deleted.' });
};

// Seed the database with built-in exercises (admin only, run once)
export const seedExercises = async (_req: AuthRequest, res: Response): Promise<void> => {
  // Delete all existing built-in exercises (isCustom: false)
  const existingSnap = await db.collection('exercises').where('isCustom', '==', false).get();
  const deleteBatch = db.batch();
  existingSnap.docs.forEach(doc => {
    deleteBatch.delete(doc.ref);
  });
  await deleteBatch.commit();

  // Seed new exercises
  const batch = db.batch();
  SEED_EXERCISES.forEach(ex => {
    const ref = db.collection('exercises').doc();
    batch.set(ref, { ...ex, isCustom: false, createdAt: new Date().toISOString() });
  });
  await batch.commit();
  res.json({ success: true, message: `${SEED_EXERCISES.length} exercises seeded.` });
};
