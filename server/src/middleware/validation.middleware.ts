import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const validate = (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction): void => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) { res.status(400).json({ success: false, message: error.details.map(d => d.message).join(', ') }); return; }
  next();
};

export const workoutSchema = Joi.object({
  title: Joi.string().min(2).max(80).required(),
  type: Joi.string().valid('Strength','Cardio','Flexibility','HIIT','Yoga','Sports','Other').required(),
  date: Joi.date().required(),
  durationMinutes: Joi.number().min(1).required(),
  caloriesBurned: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional().allow(''),
  exercises: Joi.string().optional(),
  calorieMethod: Joi.string().valid('MET', 'per-exercise-MET', 'heart-rate', 'manual').optional(),
  avgHeartRate: Joi.number().min(0).max(250).optional(),
  bodyWeightKg: Joi.number().min(20).max(500).optional(),
});

export const exerciseSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  muscleGroup: Joi.string().valid('Chest','Back','Shoulders','Arms','Core','Legs','Full Body','Cardio').required(),
  equipment: Joi.string().max(50).optional().allow(''),
  description: Joi.string().max(500).optional().allow(''),
  difficulty: Joi.string().valid('Beginner','Intermediate','Advanced').required(),
  instructions: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  tips: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  commonMistakes: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
});

export const bodyLogSchema = Joi.object({
  weight: Joi.number().min(0).optional(),
  bodyFat: Joi.number().min(0).max(100).optional(),
  notes: Joi.string().max(200).optional().allow(''),
});

export const validateWorkout = validate(workoutSchema);
export const validateExercise = validate(exerciseSchema);
export const validateBodyLog = validate(bodyLogSchema);



