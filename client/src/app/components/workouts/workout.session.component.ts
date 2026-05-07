import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { WorkoutService } from '../../services/workout.service';
import { ExerciseService } from '../../services/other.services';
import { AuthService } from '../../services/auth.service';
import { Exercise, WORKOUT_TYPES, WorkoutType, MUSCLE_GROUPS, WORKOUT_TYPE_MET, calcExerciseCalories, calcSessionCalories, ExerciseEntry } from '../../models';

const SESSION_KEY = 'active_workout_session';

// ─── Cardio mode ─────────────────────────────────────────────────────────────
// distance = running/swimming/cycling  → shows km field, calculates pace + speed
// reps     = jump rope/burpees/etc.   → shows rep goal, tracks reps/min
// time     = plank/elliptical/etc.    → shows countdown only, no reps or distance
export type CardioMode = 'distance' | 'reps' | 'time';

/** Exercises that use no external weight — hides the weight field in the UI */
const BODYWEIGHT_EXERCISES = new Set([
  // Core
  'Plank','Side Plank','Crunch','Sit-up','Leg Raise','Hanging Leg Raise',
  'Russian Twist','Ab Wheel Rollout','Bicycle Crunch','Flutter Kick','V-up',
  'Hollow Hold','Dead Bug','Bird Dog','Superman','Mountain Climber',
  // Upper body
  'Push-up','Pull-up','Chin-up','Dip','Chest Dip','Tricep Dip',
  // Lower body
  'Lunge','Walking Lunge','Reverse Lunge','Glute Bridge','Box Jump',
  'Squat Jump','Tuck Jump','Depth Jump','Box Step-up',
  // Cardio / conditioning
  'Burpee','Jumping Jack','High Knees','Lateral Bound',
  'Running','Walking','Hiking','Swimming','Sprint Intervals',
  'Jump Rope','Stair Climbing',
]);
const TIME_KEYWORDS  = ['plank', 'wall sit', 'hollow hold', 'l-sit', 'dead hang', 'farmer carry', 'rowing machine', 'elliptical', 'stair', 'hiit'];
const DIST_KEYWORDS  = ['run', 'jog', 'sprint', 'walk', 'swim', 'cycle', 'bike', 'cycling', 'treadmill'];
const REPS_KEYWORDS  = ['burpee', 'jumping jack', 'high knee', 'jump rope', 'box jump', 'squat jump', 'tuck jump', 'lateral bound', 'box step', 'step-up'];

function detectCardioMode(name: string): CardioMode {
  const n = name.toLowerCase();
  if (REPS_KEYWORDS.some((k: string) => n.includes(k))) return 'reps';
  if (TIME_KEYWORDS.some(k => n.includes(k)))  return 'time';
  if (DIST_KEYWORDS.some(k => n.includes(k)))  return 'distance';
  return 'time'; // safe default for unknown cardio
}

interface SessionSet {
  targetReps: number;
  targetWeight: number;
  actualReps: number | null;
  actualWeight: number | null;
  completed: boolean;
}

interface LapSplit {
  lapNumber: number;
  splitTime: string;
  totalTime: string;
  totalSeconds: number;
}

interface SessionExercise {
  exerciseName: string;
  exerciseType: 'strength' | 'cardio';
  cardioMode: CardioMode;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  restSeconds: number;
  sets: SessionSet[];
  setsGenerated: boolean;
  // cardio — distance mode
  distance: number | null;
  // cardio — reps mode
  cardioTargetReps: number | null;
  cardioActualReps: number | null;
  // cardio — shared
  durationMin: number | null;
  targetDurationMin: number | null;
  laps: LapSplit[];
}

interface PersistedSession {
  workoutName: string;
  workoutType: WorkoutType;
  workoutDate: string;
  manualCalories: number | null;
  elapsedSeconds: number;
  sessionExercises: SessionExercise[];
}

function pad(n: number): string { return n.toString().padStart(2, '0'); }

function secondsToDisplay(s: number): string {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

@Component({
  selector: 'app-workout-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workout.session.component.html',
})
export class WorkoutSessionComponent implements OnInit, OnDestroy {
  workoutName  = '';
  workoutType: WorkoutType = 'Strength';
  workoutDate  = new Date().toISOString().split('T')[0];
  manualCalories: number | null = null;
  sessionExercises: SessionExercise[] = [];

  elapsedSeconds = 0;
  timerRunning   = false;
  private elapsedInterval: any;

  get elapsedDisplay(): string { return secondsToDisplay(this.elapsedSeconds); }

  // ─── Calorie calculation ─────────────────────────────────────────────────────

  private get userWeightKg(): number { return this.authService.weightKg ?? 70; }
  private get currentMET(): number   { return WORKOUT_TYPE_MET[this.workoutType] ?? 4.0; }

  /**
   * Auto calorie estimate.
   * - Cardio exercises with a recorded durationMin → per-exercise MET (accurate)
   * - Everything else (strength + uncovered time) → flat workout-type MET on total elapsed time
   */
  get autoCalories(): number {
    const weightKg = this.userWeightKg;

    // Only cardio exercises with a recorded timer duration get per-exercise MET
    const cardioWithDuration: ExerciseEntry[] = this.sessionExercises
      .filter(ex => ex.exerciseType === 'cardio' && ex.durationMin && ex.durationMin > 0)
      .map(ex => ({ exerciseName: ex.exerciseName, durationMinutes: ex.durationMin! }));

    if (cardioWithDuration.length > 0) {
      const cardioCals = calcSessionCalories(cardioWithDuration, weightKg, this.workoutType);
      // Remaining elapsed time (warmup, strength sets, rest) uses flat MET
      const coveredMinutes = cardioWithDuration.reduce((s, e) => s + e.durationMinutes, 0);
      const remainingMinutes = Math.max(0, (this.elapsedSeconds / 60) - coveredMinutes);
      const remainingCals = Math.round(this.currentMET * weightKg * (remainingMinutes / 60));
      return Math.max(0, cardioCals + remainingCals);
    }

    // Pure strength session — flat MET on total elapsed time
    return Math.max(0, Math.round(this.currentMET * weightKg * (this.elapsedSeconds / 3600)));
  }
  get caloriesBurned(): number { return this.manualCalories !== null ? this.manualCalories : this.autoCalories; }
  set caloriesBurned(val: number) { this.manualCalories = val; }
  get isAutoCalories(): boolean { return this.manualCalories === null; }
  resetToAutoCalories(): void { this.manualCalories = null; this.saveSession(); }

  // ─── Rest timer ─────────────────────────────────────────────────────────────

  isResting     = false;
  restRemaining = 0;
  restTotal     = 0;
  private restInterval: any;

  get restProgress(): number { return this.restTotal > 0 ? (this.restRemaining / this.restTotal) * 100 : 0; }
  get restDisplay(): string {
    const m = Math.floor(this.restRemaining / 60);
    return m > 0 ? `${m}:${pad(this.restRemaining % 60)}` : `${this.restRemaining % 60}s`;
  }

  // ─── Exercise timer ──────────────────────────────────────────────────────────

  activeExerciseIndex: number | null = null;
  exerciseTimerSeconds = 0;
  private exerciseTimerInterval: any;
  isExerciseTimerRunning = false;

  get exerciseTimerDisplay(): string { return secondsToDisplay(this.exerciseTimerSeconds); }

  // ─── Cardio mode helpers ─────────────────────────────────────────────────────

  cardioModes: { value: CardioMode; label: string; emoji: string }[] = [
    { value: 'distance', label: 'Distance',  emoji: '📍' },
    { value: 'reps',     label: 'Reps',      emoji: '🔁' },
    { value: 'time',     label: 'Time Only',  emoji: '⏱' },
  ];

  setCardioMode(ex: SessionExercise, mode: CardioMode): void {
    ex.cardioMode = mode;
    // Reset irrelevant fields when switching
    if (mode !== 'distance') { ex.distance = null; ex.laps = []; }
    if (mode !== 'reps')     { ex.cardioTargetReps = null; ex.cardioActualReps = null; }
    this.saveSession();
  }

  /** Countdown display toward target duration */
  cardioCountdownDisplay(ex: SessionExercise): string {
    if (!ex.targetDurationMin) return '';
    const remaining = Math.max(0, ex.targetDurationMin * 60 - this.exerciseTimerSeconds);
    return secondsToDisplay(remaining);
  }

  /** Progress 0–100 toward goal — works for time and reps modes */
  getExerciseProgress(ex: SessionExercise): number {
    if (ex.cardioMode === 'reps' && ex.cardioTargetReps && ex.cardioActualReps) {
      return Math.min((ex.cardioActualReps / ex.cardioTargetReps) * 100, 100);
    }
    if (!ex.targetDurationMin || ex.targetDurationMin <= 0) return 0;
    return Math.min((this.exerciseTimerSeconds / (ex.targetDurationMin * 60)) * 100, 100);
  }

  cardioTargetReached(ex: SessionExercise): boolean {
    if (ex.cardioMode === 'reps') {
      return !!ex.cardioTargetReps && !!ex.cardioActualReps && ex.cardioActualReps >= ex.cardioTargetReps;
    }
    return !!ex.targetDurationMin && this.exerciseTimerSeconds >= ex.targetDurationMin * 60;
  }

  /** Live reps per minute (reps mode) */
  getLiveRepsPerMin(ex: SessionExercise): string | null {
    if (ex.cardioMode !== 'reps' || !ex.cardioActualReps || this.exerciseTimerSeconds <= 0) return null;
    const rpm = (ex.cardioActualReps / this.exerciseTimerSeconds) * 60;
    return rpm.toFixed(0);
  }

  /** Live pace — distance mode only */
  getLivePace(ex: SessionExercise): string | null {
    if (ex.cardioMode !== 'distance') return null;
    const secs = this.activeExerciseIndex !== null ? this.exerciseTimerSeconds : (ex.durationMin ?? 0) * 60;
    if (!ex.distance || ex.distance <= 0 || secs <= 0) return null;
    const pace = (secs / 60) / ex.distance;
    return `${Math.floor(pace)}:${pad(Math.round((pace % 1) * 60))}`;
  }

  /** Live speed — distance mode only */
  getLiveSpeed(ex: SessionExercise): string | null {
    if (ex.cardioMode !== 'distance') return null;
    const secs = this.activeExerciseIndex !== null ? this.exerciseTimerSeconds : (ex.durationMin ?? 0) * 60;
    if (!ex.distance || ex.distance <= 0 || secs <= 0) return null;
    return ((ex.distance / secs) * 3600).toFixed(1);
  }

  getPace(ex: SessionExercise): string | null { return this.getLivePace(ex); }

  recordLap(ex: SessionExercise): void {
    const prev  = ex.laps.length > 0 ? ex.laps[ex.laps.length - 1].totalSeconds : 0;
    const split = this.exerciseTimerSeconds - prev;
    ex.laps.push({
      lapNumber:    ex.laps.length + 1,
      splitTime:    secondsToDisplay(split),
      totalTime:    secondsToDisplay(this.exerciseTimerSeconds),
      totalSeconds: this.exerciseTimerSeconds,
    });
    this.saveSession();
    this.playBeep(660, 0.12);
  }

  clearLaps(ex: SessionExercise): void { ex.laps = []; this.saveSession(); }

  // ─── Exercise library ────────────────────────────────────────────────────────

  showAddModal      = false;
  exerciseSearch    = '';
  modalMuscleFilter = '';
  libraryExercises: Exercise[] = [];
  muscleGroups = MUSCLE_GROUPS;

  get filteredLibrary(): Exercise[] {
    let r = this.libraryExercises;
    if (this.modalMuscleFilter) r = r.filter(e => e.muscleGroup === this.modalMuscleFilter);
    const q = this.exerciseSearch.toLowerCase().trim();
    if (q) r = r.filter(e => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q));
    return r;
  }

  saving     = false;
  errorMsg   = '';
  workoutTypes = WORKOUT_TYPES;

  constructor(
    private workoutService: WorkoutService,
    private exerciseService: ExerciseService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.exerciseService.getExercises().subscribe({
      next: res => { this.libraryExercises = res.data.exercises; },
    });

    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed: PersistedSession = JSON.parse(saved);
        this.workoutName      = parsed.workoutName;
        this.workoutType      = parsed.workoutType;
        this.workoutDate      = parsed.workoutDate;
        this.manualCalories   = parsed.manualCalories ?? null;
        this.elapsedSeconds   = parsed.elapsedSeconds;
        this.sessionExercises = parsed.sessionExercises.map(ex => ({
          ...ex,
          cardioMode:        ex.cardioMode        ?? 'time',
          targetDurationMin: ex.targetDurationMin ?? null,
          cardioTargetReps:  ex.cardioTargetReps  ?? null,
          cardioActualReps:  ex.cardioActualReps  ?? null,
          laps:              ex.laps              ?? [],
        }));
      } catch { sessionStorage.removeItem(SESSION_KEY); }
    }

    const exName = this.route.snapshot.queryParamMap.get('exercise');
    const exType = this.route.snapshot.queryParamMap.get('type') as 'strength' | 'cardio' | null;
    if (exName && !this.sessionExercises.some(e => e.exerciseName === exName)) {
      this.addNewExercise(exName, exType || 'strength');
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.elapsedInterval);
    clearInterval(this.restInterval);
    clearInterval(this.exerciseTimerInterval);
  }

  // ─── Session-level timer ─────────────────────────────────────────────────────

  toggleTimer(): void { this.timerRunning ? this.pauseTimer() : this.startTimer(); }

  startTimer(): void {
    if (this.timerRunning) return;
    this.timerRunning    = true;
    this.elapsedInterval = setInterval(() => {
      this.elapsedSeconds++;
      if (this.elapsedSeconds % 10 === 0) this.saveSession();
    }, 1000);
  }

  pauseTimer(): void {
    this.timerRunning = false;
    clearInterval(this.elapsedInterval);
    this.saveSession();
  }

  saveSession(): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      workoutName:      this.workoutName,
      workoutType:      this.workoutType,
      workoutDate:      this.workoutDate,
      manualCalories:   this.manualCalories,
      elapsedSeconds:   this.elapsedSeconds,
      sessionExercises: this.sessionExercises,
    } as PersistedSession));
  }

  discardSession(): void {
    if (!confirm('Discard this session? All progress will be lost.')) return;
    sessionStorage.removeItem(SESSION_KEY);
    this.sessionExercises = [];
    this.workoutName      = '';
    this.workoutType      = 'Strength';
    this.workoutDate      = new Date().toISOString().split('T')[0];
    this.manualCalories   = null;
    this.elapsedSeconds   = 0;
    this.timerRunning     = false;
    clearInterval(this.elapsedInterval);
  }

  // ─── Exercise management ─────────────────────────────────────────────────────

  addNewExercise(name: string, type: 'strength' | 'cardio'): void {
    this.sessionExercises.push({
      exerciseName:      name,
      exerciseType:      type,
      cardioMode:        type === 'cardio' ? detectCardioMode(name) : 'time',
      targetSets:        3,
      targetReps:        10,
      targetWeight:      0,
      restSeconds:       90,
      sets:              [],
      setsGenerated:     false,
      distance:          null,
      cardioTargetReps:  null,
      cardioActualReps:  null,
      durationMin:       null,
      targetDurationMin: null,
      laps:              [],
    });
    this.saveSession();
  }

  addFromLibrary(ex: Exercise): void {
    const type: 'strength' | 'cardio' = ex.muscleGroup === 'Cardio' ? 'cardio' : 'strength';
    this.addNewExercise(ex.name, type);
    this.closeAddModal();
  }

  addCustom(): void {
    const name = this.exerciseSearch.trim();
    if (!name) return;
    this.addNewExercise(name, 'strength');
    this.closeAddModal();
  }

  removeExercise(index: number): void { this.sessionExercises.splice(index, 1); this.saveSession(); }
  closeAddModal(): void { this.showAddModal = false; this.exerciseSearch = ''; this.modalMuscleFilter = ''; }

  // ─── Set management ──────────────────────────────────────────────────────────

  generateSets(ex: SessionExercise): void {
    ex.sets = Array.from({ length: ex.targetSets }, () => ({
      targetReps: ex.targetReps, targetWeight: ex.targetWeight,
      actualReps: ex.targetReps, actualWeight: ex.targetWeight || null, completed: false,
    }));
    ex.setsGenerated = true;
    this.saveSession();
  }

  addSet(ex: SessionExercise): void {
    ex.sets.push({
      targetReps: ex.targetReps, targetWeight: ex.targetWeight,
      actualReps: ex.targetReps, actualWeight: ex.targetWeight || null, completed: false,
    });
    this.saveSession();
  }

  completeSet(ex: SessionExercise, set: SessionSet): void {
    set.completed = true;
    this.saveSession();
    this.startRest(ex.restSeconds);
  }

  completedSets(ex: SessionExercise): number { return ex.sets.filter(s => s.completed).length; }

  // ─── Rest timer ──────────────────────────────────────────────────────────────

  startRest(seconds: number): void {
    clearInterval(this.restInterval);
    this.isResting     = true;
    this.restTotal     = seconds;
    this.restRemaining = seconds;
    this.restInterval  = setInterval(() => {
      this.restRemaining--;
      if (this.restRemaining <= 0) { this.playRestDoneAlert(); this.skipRest(); }
    }, 1000);
  }

  skipRest(): void { clearInterval(this.restInterval); this.isResting = false; this.restRemaining = 0; }

  // ─── Audio ───────────────────────────────────────────────────────────────────

  private playBeep(freq: number, duration: number): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination); osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
      setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
    } catch {}
  }

  private playRestDoneAlert(): void {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const play = (t: number, f: number, d: number) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination); osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.4, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + d); osc.start(t); osc.stop(t + d);
      };
      const now = ctx.currentTime;
      play(now, 880, 0.18); play(now + 0.25, 880, 0.18); play(now + 0.5, 1100, 0.3);
      setTimeout(() => ctx.close(), 1500);
    } catch {}
  }

  // ─── Cardio exercise timer ────────────────────────────────────────────────────

  startExerciseTimer(index: number): void {
    if (this.activeExerciseIndex === index && this.isExerciseTimerRunning) {
      this.pauseExerciseTimer(); return;
    }
    clearInterval(this.exerciseTimerInterval);
    this.activeExerciseIndex    = index;
    this.isExerciseTimerRunning = true;
    this.exerciseTimerInterval  = setInterval(() => {
      this.exerciseTimerSeconds++;
      const ex = this.sessionExercises[index];
      if (ex?.targetDurationMin && this.exerciseTimerSeconds === ex.targetDurationMin * 60) {
        this.playRestDoneAlert();
      }
      if (this.exerciseTimerSeconds % 10 === 0) this.saveSession();
    }, 1000);
  }

  pauseExerciseTimer(): void { clearInterval(this.exerciseTimerInterval); this.isExerciseTimerRunning = false; }

  stopExerciseTimer(index: number): void {
    clearInterval(this.exerciseTimerInterval);
    const ex = this.sessionExercises[index];
    if (ex) { ex.durationMin = Math.round((this.exerciseTimerSeconds / 60) * 10) / 10; this.saveSession(); }
    this.activeExerciseIndex    = null;
    this.exerciseTimerSeconds   = 0;
    this.isExerciseTimerRunning = false;
  }

  isBodyweight(ex: SessionExercise): boolean {
    return BODYWEIGHT_EXERCISES.has(ex.exerciseName);
  }

  getMuscleEmoji(m: string): string {
    const map: Record<string, string> = {
      Chest: '🫁', Back: '🦴', Shoulders: '🤷', Arms: '💪',
      Core: '🎯', Legs: '🦵', 'Full Body': '🏃', Cardio: '❤️',
    };
    return map[m] || '💪';
  }

  get exercises(): Exercise[] { return this.libraryExercises; }

  // ─── Finish & save ───────────────────────────────────────────────────────────

  finishWorkout(): void {
    if (!this.workoutName.trim()) {
      this.errorMsg = 'Please give your workout a name before saving.';
      window.scrollTo({ top: 0, behavior: 'smooth' }); return;
    }
    if (this.sessionExercises.length === 0) {
      this.errorMsg = 'Add at least one exercise before finishing.'; return;
    }

    this.saving = true; this.errorMsg = '';
    this.timerRunning = false; clearInterval(this.elapsedInterval);

    const exercises = this.sessionExercises.map(ex => {
      if (ex.exerciseType === 'cardio') {
        return {
          exerciseName: ex.exerciseName, exerciseType: 'cardio' as const,
          distance: ex.cardioMode === 'distance' ? ex.distance : null,
          reps:     ex.cardioMode === 'reps'     ? ex.cardioActualReps : null,
          duration: ex.durationMin,
        };
      }
      const doneSets = ex.sets.filter(s => s.completed);
      return {
        exerciseName: ex.exerciseName, exerciseType: 'strength' as const,
        sets:   doneSets.length || ex.targetSets,
        reps:   doneSets[0]?.actualReps   ?? ex.targetReps,
        weight: doneSets[0]?.actualWeight ?? ex.targetWeight,
        // duration for strength = rest between sets in seconds (distinct from cardio duration which is minutes)
        duration: ex.restSeconds ?? null,
      };
    });

    const fd = new FormData();
    fd.append('title',           this.workoutName.trim());
    fd.append('type',            this.workoutType);
    fd.append('date',            this.workoutDate);
    fd.append('durationMinutes', String(Math.max(1, Math.round(this.elapsedSeconds / 60))));
    fd.append('caloriesBurned',  String(this.caloriesBurned));
    fd.append('calorieMethod',   this.isAutoCalories
      ? (this.sessionExercises.some(ex => ex.durationMin && ex.durationMin > 0) ? 'per-exercise-MET' : 'MET')
      : 'manual');
    const bw = this.authService.weightKg;
    if (bw) fd.append('bodyWeightKg', String(bw));
    fd.append('notes',           '');
    fd.append('exercises',       JSON.stringify(exercises));

    this.workoutService.createWorkout(fd).subscribe({
      next: res => { sessionStorage.removeItem(SESSION_KEY); this.router.navigate(['/workouts', res.data.workout.id]); },
      error: err => { this.errorMsg = err.error?.message || 'Something went wrong. Try again.'; this.saving = false; this.startTimer(); },
    });
  }
}