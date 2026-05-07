export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: string;
  updatedAt?: string;
  // ── Fitness profile (used for accurate calorie estimation) ──────────────────
  weightKg?: number;                                     // body weight in kg
  age?: number;                                          // age in years
  sex?: 'male' | 'female';                               // biological sex (affects Keytel HR formula)
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export type WorkoutType = 'Strength' | 'Cardio' | 'Flexibility' | 'HIIT' | 'Yoga' | 'Sports' | 'Other';
export type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Core' | 'Legs' | 'Full Body' | 'Cardio';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ExerciseType = 'strength' | 'cardio';

export interface ExerciseSet {
  exerciseId?: string;
  exerciseName: string;
  exerciseType?: ExerciseType;
  // Strength fields
  sets?: number;
  reps?: number;
  weight?: number;
  // Cardio fields
  distance?: number;  // in km
  // Shared
  duration?: number;  // seconds for strength, minutes for cardio
  notes?: string;
}

export interface Workout {
  id: string;
  title: string;
  type: WorkoutType;
  date: string;
  durationMinutes: number;
  caloriesBurned: number;
  calorieMethod?: 'heart-rate' | 'MET' | 'manual' | 'per-exercise-MET'; // tracks which formula was used
  avgHeartRate?: number;                             // optional HR input for Keytel formula
  bodyWeightKg?: number;                             // body weight snapshot at time of workout
  notes?: string;
  exercises: ExerciseSet[];
  imageUrl?: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: string;
  description?: string;
  difficulty: Difficulty;
  isCustom: boolean;
  instructions?: string[];
  tips?: string[];
  commonMistakes?: string[];
}

export interface BodyLog {
  id: string;
  weight?: number;
  bodyFat?: number;
  notes?: string;
  date: string;
}

export interface ProgressStats {
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  byType: Record<string, number>;
  currentStreak: number;
}

export interface ChartData {
  labels: string[];
  calories: number[];
  minutes: number[];
  count: number[];
}

export interface AdminStats {
  totalUsers: number;
  totalWorkouts: number;
  totalCalories: number;
  totalMinutes: number;
  byType: Record<string, number>;
}

export interface Pagination {
  page: number; limit: number; total: number; pages: number;
}

export interface WorkoutFilters {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const WORKOUT_TYPES: WorkoutType[] = ['Strength','Cardio','Flexibility','HIIT','Yoga','Sports','Other'];
export const MUSCLE_GROUPS: MuscleGroup[] = ['Chest','Back','Shoulders','Arms','Core','Legs','Full Body','Cardio'];
export const DIFFICULTIES: Difficulty[] = ['Beginner','Intermediate','Advanced'];

export const WORKOUT_TYPE_COLORS: Record<string, string> = {
  Strength:    'bg-blue-100 text-blue-700',
  Cardio:      'bg-red-100 text-red-700',
  Flexibility: 'bg-green-100 text-green-700',
  HIIT:        'bg-orange-100 text-orange-700',
  Yoga:        'bg-purple-100 text-purple-700',
  Sports:      'bg-yellow-100 text-yellow-700',
  Other:       'bg-gray-100 text-gray-600',
};

// ─── Client-side calorie helpers (mirrors server calorie.util.ts) ─────────────

export const WORKOUT_TYPE_MET: Record<string, number> = {
  Strength:    3.5,
  Cardio:      7.0,
  HIIT:        8.5,
  Flexibility: 2.5,
  Yoga:        3.0,
  Sports:      6.0,
  Other:       4.0,
};

/** Per-exercise MET values — mirrors server EXERCISE_MET exactly */
export const EXERCISE_MET: Record<string, number> = {
  'Running': 9.8, 'Cycling': 7.5, 'Swimming': 8.0, 'Jump Rope': 11.0,
  'Rowing': 7.0, 'Rowing Machine': 7.0, 'Elliptical': 5.0, 'Stair Climbing': 8.8,
  'Walking': 3.5, 'Hiking': 5.3, 'Treadmill Walk': 3.5, 'Treadmill Run': 9.8,
  'Stationary Bike': 6.8, 'Assault Bike': 10.5, 'Box Jump': 8.0,
  'Sled Push': 9.0, 'Sled Pull': 8.5, 'Battle Ropes': 10.0, 'Sprint Intervals': 13.5,
  'Bench Press': 3.8, 'Incline Press': 3.8, 'Incline Bench Press': 3.8,
  'Decline Bench Press': 3.8, 'Squat': 5.0, 'Front Squat': 5.0,
  'Goblet Squat': 4.5, 'Hack Squat': 4.5, 'Deadlift': 6.0,
  'Romanian Deadlift': 5.5, 'Sumo Deadlift': 5.5, 'Pull-up': 4.0,
  'Chin-up': 4.0, 'Lat Pulldown': 3.5, 'Push-up': 3.8, 'Dip': 3.8,
  'Chest Dip': 3.8, 'Tricep Dip': 3.5, 'Overhead Press': 3.5,
  'Arnold Press': 3.5, 'Barbell Row': 3.8, 'Bent-over Row': 3.8,
  'Dumbbell Row': 3.5, 'Single-arm Dumbbell Row': 3.5, 'Seated Cable Row': 3.5,
  'T-Bar Row': 3.8, 'T-bar Row': 3.8, 'Cable Row': 3.5,
  'Lunge': 4.0, 'Walking Lunge': 4.0, 'Reverse Lunge': 4.0,
  'Bulgarian Split Squat': 4.5, 'Leg Press': 3.5, 'Leg Extension': 3.0,
  'Leg Curl': 3.0, 'Hip Thrust': 4.0, 'Glute Bridge': 3.5,
  'Good Morning': 4.5, 'Power Clean': 6.5, 'Hang Clean': 6.0,
  'Clean and Press': 6.5, 'Snatch': 7.0, 'Clean and Jerk': 6.5,
  'Bicep Curl': 3.0, 'Hammer Curl': 3.0, 'Preacher Curl': 3.0,
  'Concentration Curl': 3.0, 'Cable Curl': 3.0, 'Tricep Extension': 3.0,
  'Skull Crusher': 3.0, 'Cable Pushdown': 3.0, 'Tricep Rope Pushdown': 3.0,
  'Close-grip Bench Press': 3.8, 'Overhead Tricep Extension': 3.0,
  'Lateral Raise': 3.0, 'Front Raise': 3.0, 'Face Pull': 3.0,
  'Rear Delt Fly': 3.0, 'Reverse Fly': 3.0, 'Dumbbell Flyes': 3.0,
  'Chest Fly': 3.0, 'Cable Crossover': 3.0, 'Cable Fly': 3.0,
  'Pec Deck': 3.0, 'Calf Raise': 2.8, 'Seated Calf Raise': 2.5,
  'Shrug': 3.0, 'Upright Row': 3.5, 'Wrist Curl': 2.5,
  'Plank': 3.0, 'Side Plank': 3.0, 'Crunch': 2.8, 'Sit-up': 3.0,
  'Leg Raise': 3.0, 'Hanging Leg Raise': 3.5, 'Russian Twist': 3.5,
  'Ab Wheel Rollout': 4.0, 'Cable Crunch': 3.0, 'Bicycle Crunch': 3.5,
  'Flutter Kick': 3.0, 'V-up': 3.5, 'Hollow Hold': 3.0, 'Dead Bug': 3.0,
  'Bird Dog': 2.5, 'Superman': 2.5, 'Back Extension': 3.5,
  'Burpee': 8.0, 'Mountain Climber': 8.0, 'Kettlebell Swing': 9.0,
  'Kettlebell Snatch': 9.5, 'Kettlebell Clean': 7.5, 'Jumping Jack': 7.0,
  'High Knees': 8.0, 'Squat Jump': 7.5, 'Tuck Jump': 8.0,
  'Lateral Bound': 6.5, 'Depth Jump': 7.0, 'Medicine Ball Slam': 8.0,
  'Box Step-up': 5.0, 'Farmers Carry': 5.0,
  'Stretching': 2.3, 'Foam Rolling': 2.0, 'Yoga Flow': 3.0, 'Pilates': 3.0,
  'Basketball': 8.0, 'Soccer': 8.8, 'Tennis': 7.3, 'Volleyball': 4.0,
  'Boxing': 9.0, 'Sparring': 10.5, 'Heavy Bag': 8.5, 'Shadow Boxing': 7.8,
  'MMA Training': 10.0, 'Martial Arts': 7.5, 'Rock Climbing': 8.0, 'Gymnastics': 5.5,
};

/** Per-exercise calorie estimate — falls back to workout-type MET if unknown */
export function calcExerciseCalories(
  exerciseName: string,
  weightKg: number,
  durationMinutes: number,
  fallbackWorkoutType = 'Other',
): number {
  const met = EXERCISE_MET[exerciseName] ?? WORKOUT_TYPE_MET[fallbackWorkoutType] ?? 4.0;
  return Math.max(0, Math.round(met * weightKg * (durationMinutes / 60)));
}

export interface ExerciseEntry {
  exerciseName: string;
  durationMinutes: number;
}

/** Sums per-exercise calories for a session — use instead of flat calcCaloriesMET */
export function calcSessionCalories(
  exercises: ExerciseEntry[],
  weightKg: number,
  fallbackWorkoutType = 'Other',
): number {
  return exercises.reduce(
    (sum, ex) => sum + calcExerciseCalories(ex.exerciseName, weightKg, ex.durationMinutes, fallbackWorkoutType),
    0,
  );
}

/**
 * MET-based estimate.
 * calories = MET × weight(kg) × time(hours)
 */
export function calcCaloriesMET(
  workoutType: string,
  weightKg: number,
  durationMinutes: number,
): number {
  const met = WORKOUT_TYPE_MET[workoutType] ?? 4.0;
  return Math.max(0, Math.round(met * weightKg * (durationMinutes / 60)));
}

/**
 * Keytel (2005) heart-rate formula.
 * More accurate when avgHR, age, and sex are all known.
 */
export function calcCaloriesHR(
  avgHR: number,
  weightKg: number,
  age: number,
  sex: 'male' | 'female',
  durationMinutes: number,
): number {
  const calPerMin =
    sex === 'male'
      ? (-55.0969 + 0.6309 * avgHR + 0.1988 * weightKg + 0.2017 * age) / 4.184
      : (-20.4022 + 0.4472 * avgHR - 0.1263 * weightKg + 0.074 * age) / 4.184;
  return Math.max(0, Math.round(calPerMin * durationMinutes));
}

export interface CalorieEstimate {
  calories: number;
  method: 'heart-rate' | 'MET';
  label: string;
}

/**
 * Smart estimator — uses Keytel HR formula when all biometrics are available,
 * otherwise falls back to the MET formula.
 */
export function bestCalorieEstimate(params: {
  workoutType: string;
  durationMinutes: number;
  weightKg?: number;
  age?: number;
  sex?: 'male' | 'female';
  avgHR?: number;
}): CalorieEstimate {
  const { workoutType, durationMinutes, weightKg = 70, age, sex, avgHR } = params;

  if (avgHR && avgHR > 0 && age && sex) {
    return {
      calories: calcCaloriesHR(avgHR, weightKg, age, sex, durationMinutes),
      method: 'heart-rate',
      label: `Keytel HR formula · avg ${avgHR} bpm`,
    };
  }

  const met = WORKOUT_TYPE_MET[workoutType] ?? 4.0;
  return {
    calories: calcCaloriesMET(workoutType, weightKg, durationMinutes),
    method: 'MET',
    label: `MET ${met} · ${weightKg} kg`,
  };
}
