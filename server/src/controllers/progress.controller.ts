import { Response } from 'express';
import { db } from '../config/firebase';
import { AuthRequest } from '../middleware/auth.middleware';

export const getProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  const uid = req.user!.uid;
  const snap = await db.collection('workouts').where('userId', '==', uid).orderBy('date', 'desc').get();
  const workouts = snap.docs.map(d => d.data()) as any[];

  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((s: number, w: any) => s + (w.durationMinutes || 0), 0);
  const totalCalories = workouts.reduce((s: number, w: any) => s + (w.caloriesBurned || 0), 0);

  const byType: Record<string, number> = {};
  workouts.forEach((w: any) => { byType[w.type] = (byType[w.type] || 0) + 1; });

  // Streak calculation — counts consecutive days ending today OR yesterday
  const dates = [...new Set(
    workouts.map((w: any) => w.date?.substring(0, 10)).filter(Boolean)
  )].sort().reverse() as string[];
  let streak = 0;
  const today = new Date().toISOString().substring(0, 10);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);
  // Start from today if worked out today, otherwise from yesterday
  const startDate = dates[0] === today ? today : (dates[0] === yesterdayStr ? yesterdayStr : null);
  if (startDate) {
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(startDate);
      expected.setDate(expected.getDate() - i);
      if (dates[i] === expected.toISOString().substring(0, 10)) streak++;
      else break;
    }
  }

  res.json({ success: true, data: { stats: { totalWorkouts, totalMinutes, totalCalories, byType, currentStreak: streak } } });
};

export const getChartData = async (req: AuthRequest, res: Response): Promise<void> => {
  const uid = req.user!.uid;
  const since = new Date(); since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().substring(0, 10);

  const snap = await db.collection('workouts')
    .where('userId', '==', uid)
    .where('date', '>=', sinceStr)
    .orderBy('date')
    .get();

  const byDay: Record<string, { calories: number; minutes: number; count: number }> = {};
  snap.docs.forEach(d => {
    const w = d.data() as any;
    const day = w.date?.substring(0, 10) || '';
    if (!byDay[day]) byDay[day] = { calories: 0, minutes: 0, count: 0 };
    byDay[day].calories += w.caloriesBurned || 0;
    byDay[day].minutes += w.durationMinutes || 0;
    byDay[day].count += 1;
  });

  const labels = Object.keys(byDay).sort();
  res.json({
    success: true,
    data: {
      labels,
      calories: labels.map(l => byDay[l].calories),
      minutes: labels.map(l => byDay[l].minutes),
      count: labels.map(l => byDay[l].count),
    },
  });
};

export const logBodyMeasurement = async (req: AuthRequest, res: Response): Promise<void> => {
  const uid = req.user!.uid;
  const data = { ...req.body, date: new Date().toISOString(), userId: uid };
  const ref = await db.collection('users').doc(uid).collection('bodyLogs').add(data);
  res.status(201).json({ success: true, message: 'Body measurement logged.', data: { log: { id: ref.id, ...data } } });
};

export const getBodyLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const snap = await db.collection('users').doc(req.user!.uid).collection('bodyLogs')
    .orderBy('date', 'desc').limit(30).get();
  res.json({ success: true, data: { logs: snap.docs.map(d => ({ id: d.id, ...d.data() })) } });
};
