import { Response } from 'express';
import { db } from '../config/firebase';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { uploadToStorage, deleteFromStorage } from '../utils/storage.util';

const COL = 'workouts';

export const getWorkouts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, dateFrom, dateTo, page = '1', limit = '12' } = req.query;
  let query: FirebaseFirestore.Query = db.collection(COL).where('userId', '==', req.user!.uid);
  if (type) query = query.where('type', '==', type);
  query = query.orderBy('date', 'desc');

  const snap = await query.get();
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  if (dateFrom) items = items.filter((w: any) => w.date >= dateFrom);
  if (dateTo) items = items.filter((w: any) => w.date <= dateTo);

  const total = items.length;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const paginated = items.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({ success: true, data: { workouts: paginated, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } } });
};

export const getWorkout = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await db.collection(COL).doc(req.params.id).get();
  if (!doc.exists) throw new AppError('Workout not found.', 404);
  const data = doc.data()!;
  if (data.userId !== req.user!.uid && req.user!.role !== 'admin') throw new AppError('Not authorized.', 403);
  res.json({ success: true, data: { workout: { id: doc.id, ...data } } });
};

export const createWorkout = async (req: AuthRequest, res: Response): Promise<void> => {
  let imageUrl: string | undefined;
  let imagePath: string | undefined;
  if (req.file) {
    const result = await uploadToStorage(req.file, 'workouts');
    imageUrl = result.url;
    imagePath = result.path;
  }

  let exercises: any[] = [];
  try { exercises = req.body.exercises ? JSON.parse(req.body.exercises) : []; } catch { exercises = []; }

  const data = {
    title: req.body.title,
    type: req.body.type,
    date: req.body.date,
    durationMinutes: parseInt(req.body.durationMinutes) || 0,
    caloriesBurned: parseInt(req.body.caloriesBurned) || 0,
    calorieMethod: req.body.calorieMethod || 'MET',
    ...(req.body.avgHeartRate && { avgHeartRate: parseInt(req.body.avgHeartRate) }),
    ...(req.body.bodyWeightKg && { bodyWeightKg: parseFloat(req.body.bodyWeightKg) }),
    notes: req.body.notes || '',
    exercises,
    userId: req.user!.uid,
    userName: req.user!.name,
    ...(imageUrl && { imageUrl, imagePath }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const ref = await db.collection(COL).add(data);
  res.status(201).json({ success: true, message: 'Workout logged.', data: { workout: { id: ref.id, ...data } } });
};

export const updateWorkout = async (req: AuthRequest, res: Response): Promise<void> => {
  const docRef = db.collection(COL).doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists) throw new AppError('Workout not found.', 404);
  const item = doc.data()!;
  if (item.userId !== req.user!.uid && req.user!.role !== 'admin') throw new AppError('Not authorized.', 403);

  let imageUrl = item.imageUrl;
  let imagePath = item.imagePath;
  if (req.file) {
    if (imagePath) await deleteFromStorage(imagePath);
    const r = await uploadToStorage(req.file, 'workouts');
    imageUrl = r.url; imagePath = r.path;
  }

  let exercises = item.exercises;
  try { if (req.body.exercises) exercises = JSON.parse(req.body.exercises); } catch { /* keep existing */ }

  const updates: any = {
    title: req.body.title || item.title,
    type: req.body.type || item.type,
    date: req.body.date || item.date,
    durationMinutes: req.body.durationMinutes ? parseInt(req.body.durationMinutes) : item.durationMinutes,
    caloriesBurned: req.body.caloriesBurned ? parseInt(req.body.caloriesBurned) : item.caloriesBurned,
    calorieMethod: req.body.calorieMethod || item.calorieMethod || 'MET',
    avgHeartRate: req.body.avgHeartRate ? parseInt(req.body.avgHeartRate) : (item.avgHeartRate ?? null),
    bodyWeightKg: req.body.bodyWeightKg ? parseFloat(req.body.bodyWeightKg) : (item.bodyWeightKg ?? null),
    notes: req.body.notes !== undefined ? req.body.notes : item.notes,
    exercises,
    updatedAt: new Date().toISOString(),
  };
  
  // Only include imageUrl and imagePath if they are defined
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (imagePath !== undefined) updates.imagePath = imagePath;

  await docRef.update(updates);
  res.json({ success: true, message: 'Workout updated.', data: { workout: { id: doc.id, ...item, ...updates } } });
};

export const deleteWorkout = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await db.collection(COL).doc(req.params.id).get();
  if (!doc.exists) throw new AppError('Workout not found.', 404);
  const item = doc.data()!;
  if (item.userId !== req.user!.uid && req.user!.role !== 'admin') throw new AppError('Not authorized.', 403);
  if (item.imagePath) await deleteFromStorage(item.imagePath);
  await db.collection(COL).doc(req.params.id).delete();
  res.json({ success: true, message: 'Workout deleted.' });
};

export const getMyWorkouts = async (req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection(COL).where('userId', '==', req.user!.uid).orderBy('date', 'desc').get();
  res.json({ success: true, data: { workouts: snap.docs.map(d => ({ id: d.id, ...d.data() })) } });
};
