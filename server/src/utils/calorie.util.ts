/**
 * calorie.util.ts
 * Centralised calorie-burn estimation.
 *
 * Two methods are supported:
 *   1. MET-based   – fast, requires only workout type + weight + duration
 *   2. Heart-rate  – Keytel (2005) formula, more accurate when HR/age/sex are known
 */

export type Sex = 'male' | 'female';

// ─── MET lookup tables ───────────────────────────────────────────────────────

/** Workout-type MET values (fallback when no per-exercise MET is available) */
export const WORKOUT_TYPE_MET: Record<string, number> = {
  Strength:    3.5,
  Cardio:      7.0,
  HIIT:        8.5,
  Flexibility: 2.5,
  Yoga:        3.0,
  Sports:      6.0,
  Other:       4.0,
};

/**
 * Per-exercise MET values.
 * Source: Compendium of Physical Activities (Ainsworth et al., 2011)
 * Covers every exercise in SEED_EXERCISES plus common extras.
 */
export const EXERCISE_MET: Record<string, number> = {
  // ── Cardio ────────────────────────────────────────────────────────────────
  'Running':              9.8,
  'Cycling':              7.5,
  'Swimming':             8.0,
  'Jump Rope':           11.0,
  'Rowing':               7.0,
  'Rowing Machine':       7.0,
  'Elliptical':           5.0,
  'Stair Climbing':       8.8,
  'Walking':              3.5,
  'Hiking':               5.3,
  'Treadmill Walk':       3.5,
  'Treadmill Run':        9.8,
  'Stationary Bike':      6.8,
  'Assault Bike':        10.5,
  'Box Jump':             8.0,
  'Sled Push':            9.0,
  'Sled Pull':            8.5,
  'Battle Ropes':        10.0,
  'Sprint Intervals':    13.5,

  // ── Compound Strength ─────────────────────────────────────────────────────
  'Bench Press':          3.8,
  'Incline Press':        3.8,
  'Incline Bench Press':  3.8,
  'Decline Bench Press':  3.8,
  'Squat':                5.0,
  'Front Squat':          5.0,
  'Goblet Squat':         4.5,
  'Hack Squat':           4.5,
  'Deadlift':             6.0,
  'Romanian Deadlift':    5.5,
  'Sumo Deadlift':        5.5,
  'Pull-up':              4.0,
  'Chin-up':              4.0,
  'Lat Pulldown':         3.5,
  'Push-up':              3.8,
  'Dip':                  3.8,
  'Chest Dip':            3.8,
  'Tricep Dip':           3.5,
  'Overhead Press':       3.5,
  'Arnold Press':         3.5,
  'Barbell Row':          3.8,
  'Bent-over Row':        3.8,
  'Dumbbell Row':         3.5,
  'Single-arm Dumbbell Row': 3.5,
  'Seated Cable Row':     3.5,
  'T-Bar Row':            3.8,
  'T-bar Row':            3.8,
  'Cable Row':            3.5,
  'Lunge':                4.0,
  'Walking Lunge':        4.0,
  'Reverse Lunge':        4.0,
  'Bulgarian Split Squat': 4.5,
  'Leg Press':            3.5,
  'Leg Extension':        3.0,
  'Leg Curl':             3.0,
  'Hip Thrust':           4.0,
  'Glute Bridge':         3.5,
  'Good Morning':         4.5,
  'Power Clean':          6.5,
  'Hang Clean':           6.0,
  'Clean and Press':      6.5,
  'Snatch':               7.0,
  'Clean and Jerk':       6.5,

  // ── Isolation / Accessory ────────────────────────────────────────────────
  'Bicep Curl':           3.0,
  'Hammer Curl':          3.0,
  'Preacher Curl':        3.0,
  'Concentration Curl':   3.0,
  'Cable Curl':           3.0,
  'Tricep Extension':     3.0,
  'Skull Crusher':        3.0,
  'Cable Pushdown':       3.0,
  'Tricep Rope Pushdown': 3.0,
  'Close-grip Bench Press': 3.8,
  'Overhead Tricep Extension': 3.0,
  'Lateral Raise':        3.0,
  'Front Raise':          3.0,
  'Face Pull':            3.0,
  'Rear Delt Fly':        3.0,
  'Reverse Fly':          3.0,
  'Dumbbell Flyes':       3.0,
  'Chest Fly':            3.0,
  'Cable Crossover':      3.0,
  'Cable Fly':            3.0,
  'Pec Deck':             3.0,
  'Calf Raise':           2.8,
  'Seated Calf Raise':    2.5,
  'Shrug':                3.0,
  'Upright Row':          3.5,
  'Wrist Curl':           2.5,

  // ── Core / Bodyweight ────────────────────────────────────────────────────
  'Plank':                3.0,
  'Side Plank':           3.0,
  'Crunch':               2.8,
  'Sit-up':               3.0,
  'Leg Raise':            3.0,
  'Hanging Leg Raise':    3.5,
  'Russian Twist':        3.5,
  'Ab Wheel Rollout':     4.0,
  'Cable Crunch':         3.0,
  'Bicycle Crunch':       3.5,
  'Flutter Kick':         3.0,
  'V-up':                 3.5,
  'Hollow Hold':          3.0,
  'Dead Bug':             3.0,
  'Bird Dog':             2.5,
  'Superman':             2.5,
  'Back Extension':       3.5,

  // ── HIIT / Plyometrics ───────────────────────────────────────────────────
  'Burpee':               8.0,
  'Mountain Climber':     8.0,
  'Kettlebell Swing':     9.0,
  'Kettlebell Snatch':    9.5,
  'Kettlebell Clean':     7.5,
  'Jumping Jack':         7.0,
  'High Knees':           8.0,
  'Squat Jump':           7.5,
  'Tuck Jump':            8.0,
  'Lateral Bound':        6.5,
  'Depth Jump':           7.0,
  'Medicine Ball Slam':   8.0,
  'Box Step-up':          5.0,

  // ── Full Body ────────────────────────────────────────────────────────────
  'Farmers Carry':        5.0,
  'Battle Ropes':        10.0,

  // ── Flexibility / Mobility ───────────────────────────────────────────────
  'Stretching':           2.3,
  'Foam Rolling':         2.0,
  'Yoga Flow':            3.0,
  'Pilates':              3.0,

  // ── Sports / Recreation ──────────────────────────────────────────────────
  'Basketball':           8.0,
  'Soccer':               8.8,
  'Tennis':               7.3,
  'Volleyball':           4.0,
  'Boxing':               9.0,
  'Sparring':            10.5,
  'Heavy Bag':            8.5,
  'Shadow Boxing':        7.8,
  'MMA Training':        10.0,
  'Martial Arts':         7.5,
  'Rock Climbing':        8.0,
  'Gymnastics':           5.5,
};

// ─── Formula implementations ─────────────────────────────────────────────────

/**
 * Standard MET formula.
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
 * Keytel (2005) heart-rate-based formula.
 *
 * Male:   cal/min = (−55.0969 + 0.6309×HR + 0.1988×W + 0.2017×A) / 4.184
 * Female: cal/min = (−20.4022 + 0.4472×HR − 0.1263×W + 0.074×A)  / 4.184
 */
export function calcCaloriesHR(
  avgHR: number,
  weightKg: number,
  age: number,
  sex: Sex,
  durationMinutes: number,
): number {
  const calPerMin =
    sex === 'male'
      ? (-55.0969 + 0.6309 * avgHR + 0.1988 * weightKg + 0.2017 * age) / 4.184
      : (-20.4022 + 0.4472 * avgHR - 0.1263 * weightKg + 0.074 * age) / 4.184;

  return Math.max(0, Math.round(calPerMin * durationMinutes));
}

/**
 * Per-exercise calorie estimate using individual MET values.
 * Falls back to workout-type MET if the exercise name isn't in the table.
 */
export function calcExerciseCalories(
  exerciseName: string,
  weightKg: number,
  durationMinutes: number,
  fallbackWorkoutType = 'Other',
): number {
  const met =
    EXERCISE_MET[exerciseName] ??
    WORKOUT_TYPE_MET[fallbackWorkoutType] ??
    4.0;
  return Math.max(0, Math.round(met * weightKg * (durationMinutes / 60)));
}

// ─── Session-level calorie sum ────────────────────────────────────────────────

export interface ExerciseEntry {
  exerciseName: string;
  /** Active + rest time for this exercise in minutes */
  durationMinutes: number;
}

/**
 * Sums per-exercise calorie estimates for a full session.
 *
 * Usage in finishWorkout() / createWorkout controller:
 *
 *   const { totalCalories, breakdown } = calcSessionCalories(
 *     exercises.map(ex => ({ exerciseName: ex.exerciseName, durationMinutes: ex.duration ?? 0 })),
 *     userWeightKg,
 *     workoutType,
 *   );
 */
export function calcSessionCalories(
  exercises: ExerciseEntry[],
  weightKg: number,
  fallbackWorkoutType = 'Other',
): { totalCalories: number; breakdown: Array<ExerciseEntry & { calories: number }> } {
  const breakdown = exercises.map(ex => ({
    ...ex,
    calories: calcExerciseCalories(ex.exerciseName, weightKg, ex.durationMinutes, fallbackWorkoutType),
  }));
  return { totalCalories: breakdown.reduce((s, e) => s + e.calories, 0), breakdown };
}

// ─── Smart estimator ─────────────────────────────────────────────────────────

export interface CalorieEstimateParams {
  workoutType: string;
  durationMinutes: number;
  weightKg?: number;
  age?: number;
  sex?: Sex;
  avgHR?: number;
  /** If provided, per-exercise MET is used instead of flat workout-type MET */
  exercises?: ExerciseEntry[];
}

export interface CalorieEstimateResult {
  calories: number;
  method: 'heart-rate' | 'MET' | 'per-exercise-MET';
  note: string;
  breakdown?: Array<ExerciseEntry & { calories: number }>;
}

/**
 * Best available estimate — priority order:
 *   1. Keytel HR formula  (avgHR + age + sex all present)
 *   2. Per-exercise MET   (exercises array provided)
 *   3. Flat workout-type MET  (fallback)
 */
export function bestCalorieEstimate(
  params: CalorieEstimateParams,
): CalorieEstimateResult {
  const { workoutType, durationMinutes, weightKg = 70, age, sex, avgHR, exercises } = params;

  if (avgHR && age && sex) {
    return {
      calories: calcCaloriesHR(avgHR, weightKg, age, sex, durationMinutes),
      method: 'heart-rate',
      note: `Keytel HR formula (avg HR ${avgHR} bpm, ${age} y/o ${sex}, ${weightKg} kg)`,
    };
  }

  if (exercises && exercises.length > 0) {
    const { totalCalories, breakdown } = calcSessionCalories(exercises, weightKg, workoutType);
    return {
      calories: totalCalories,
      method: 'per-exercise-MET',
      note: `Per-exercise MET sum · ${exercises.length} exercise(s) · ${weightKg} kg`,
      breakdown,
    };
  }

  return {
    calories: calcCaloriesMET(workoutType, weightKg, durationMinutes),
    method: 'MET',
    note: `MET ${WORKOUT_TYPE_MET[workoutType] ?? 4.0} × ${weightKg} kg × ${(durationMinutes / 60).toFixed(2)} h`,
  };
}
