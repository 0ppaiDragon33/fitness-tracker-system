import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: { uid: string; email: string; name: string; role: 'user' | 'admin' };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) { res.status(401).json({ success: false, message: 'No token provided.' }); return; }
  try {
    const decoded = await auth.verifyIdToken(token);
    const doc = await db.collection('users').doc(decoded.uid).get();
    if (!doc.exists) { res.status(401).json({ success: false, message: 'User profile not found.' }); return; }
    const d = doc.data()!;
    req.user = { uid: decoded.uid, email: decoded.email || '', name: d.name, role: d.role || 'user' };
    next();
  } catch (e: any) {
    res.status(401).json({ success: false, message: e.code === 'auth/id-token-expired' ? 'Token expired.' : 'Invalid token.' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin access required.' }); return; }
  next();
};
