import { Response } from 'express';
import { db, auth } from '../config/firebase';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [usersSnap, workoutsSnap] = await Promise.all([db.collection('users').get(), db.collection('workouts').get()]);
  const workouts = workoutsSnap.docs.map(d => d.data()) as any[];
  const byType: Record<string, number> = {};
  workouts.forEach((w: any) => { byType[w.type] = (byType[w.type] || 0) + 1; });
  res.json({ success: true, data: { stats: {
    totalUsers: usersSnap.size,
    totalWorkouts: workoutsSnap.size,
    totalCalories: workouts.reduce((s: number, w: any) => s + (w.caloriesBurned || 0), 0),
    totalMinutes: workouts.reduce((s: number, w: any) => s + (w.durationMinutes || 0), 0),
    byType,
  }}});
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20' } = req.query;
  const p = parseInt(page as string); const l = parseInt(limit as string);
  const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  res.json({ success: true, data: { users: all.slice((p-1)*l, p*l), pagination: { page: p, limit: l, total: all.length, pages: Math.ceil(all.length/l) } } });
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role } = req.body;
  if (!['user','admin'].includes(role)) throw new AppError('Invalid role.', 400);
  const ref = db.collection('users').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) throw new AppError('User not found.', 404);
  await ref.update({ role });
  await auth.setCustomUserClaims(req.params.id, { role });
  res.json({ success: true, message: 'Role updated.', data: { user: { ...doc.data(), role } } });
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await db.collection('users').doc(req.params.id).get();
  if (!doc.exists) throw new AppError('User not found.', 404);
  await auth.deleteUser(req.params.id);
  await db.collection('users').doc(req.params.id).delete();
  res.json({ success: true, message: 'User deleted.' });
};

export const getAllWorkouts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', type } = req.query;
  const p = parseInt(page as string); const l = parseInt(limit as string);
  // Fetch all workouts ordered by date, then filter in memory.
  // A where('type')+orderBy('date') query requires a composite index that
  // may not exist yet; doing the filter client-side avoids that dependency.
  const snap = await db.collection('workouts').orderBy('date', 'desc').get();
  let all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  if (type) all = all.filter((w: any) => w.type === type);
  res.json({ success: true, data: { workouts: all.slice((p-1)*l, p*l), pagination: { page: p, limit: l, total: all.length, pages: Math.ceil(all.length/l) } } });
};
