import { Request, Response } from 'express';
import { auth, db } from '../config/firebase';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, idToken } = req.body;
  if (!name || !email || !idToken) throw new AppError('name, email, idToken required.', 400);
  const decoded = await auth.verifyIdToken(idToken);
  if (decoded.email !== email) throw new AppError('Token email mismatch.', 400);
  const existing = await db.collection('users').doc(decoded.uid).get();
  if (existing.exists) throw new AppError('User already registered.', 409);
  const userDoc = { uid: decoded.uid, name, email, role: 'user', createdAt: new Date().toISOString() };
  await db.collection('users').doc(decoded.uid).set(userDoc);
  res.status(201).json({ success: true, message: 'Registration successful.', data: { user: userDoc } });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;
  if (!idToken) throw new AppError('idToken required.', 400);
  const decoded = await auth.verifyIdToken(idToken);
  const doc = await db.collection('users').doc(decoded.uid).get();
  if (!doc.exists) throw new AppError('Profile not found. Please register.', 404);
  res.json({ success: true, message: 'Login successful.', data: { user: doc.data() } });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await db.collection('users').doc(req.user!.uid).get();
  if (!doc.exists) throw new AppError('User not found.', 404);
  res.json({ success: true, data: { user: doc.data() } });
};

/**
 * PATCH /auth/me
 * Allows the user to save fitness profile fields used for calorie calculations:
 * weightKg, age, sex, fitnessLevel
 * Also allows updating their display name.
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const uid = req.user!.uid;

  // Only allow safe, non-privileged fields to be updated
  const allowedFields = ['name', 'weightKg', 'age', 'sex', 'fitnessLevel'];
  const updates: Record<string, any> = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields provided to update.', 400);
  }

  // Validate types
  if (updates.weightKg !== undefined) {
    const w = parseFloat(updates.weightKg);
    if (isNaN(w) || w < 20 || w > 500) throw new AppError('weightKg must be between 20 and 500.', 400);
    updates.weightKg = w;
  }
  if (updates.age !== undefined) {
    const a = parseInt(updates.age);
    if (isNaN(a) || a < 10 || a > 120) throw new AppError('age must be between 10 and 120.', 400);
    updates.age = a;
  }
  if (updates.sex !== undefined && !['male', 'female'].includes(updates.sex)) {
    throw new AppError("sex must be 'male' or 'female'.", 400);
  }
  if (updates.fitnessLevel !== undefined &&
      !['beginner', 'intermediate', 'advanced'].includes(updates.fitnessLevel)) {
    throw new AppError("fitnessLevel must be 'beginner', 'intermediate', or 'advanced'.", 400);
  }

  updates.updatedAt = new Date().toISOString();

  const docRef = db.collection('users').doc(uid);
  await docRef.update(updates);

  const updated = await docRef.get();
  res.json({ success: true, message: 'Profile updated.', data: { user: updated.data() } });
};
