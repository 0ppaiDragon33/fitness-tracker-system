import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
dotenv.config();

import './config/firebase';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import workoutRoutes from './routes/workout.routes';
import exerciseRoutes from './routes/exercise.routes';
import progressRoutes from './routes/progress.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:4200', credentials: true }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, message: 'Too many requests.' } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'FitTrack API running', timestamp: new Date() }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 FitTrack API running on http://localhost:${PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api/docs`);
});

export default app;
