import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WorkoutService } from '../../services/workout.service';
import { ExerciseService } from '../../services/other.services';
import { AuthService } from '../../services/auth.service';
import { WORKOUT_TYPES, Exercise, bestCalorieEstimate, CalorieEstimate } from '../../models';

@Component({
  selector: 'app-workout-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './workout-form.component.html',
})
export class WorkoutFormComponent implements OnInit, OnDestroy {

  form = this.fb.group({
    title:           ['', [Validators.required, Validators.minLength(2)]],
    type:            ['', Validators.required],
    date:            [new Date().toISOString().split('T')[0], Validators.required],
    durationMinutes: [30, [Validators.required, Validators.min(1)]],
    // Biometrics — pre-filled from user profile
    bodyWeightKg:    [null as number | null],
    avgHeartRate:    [null as number | null],  // optional: enables Keytel HR formula
    // Calorie output
    caloriesBurned:  [0],
    notes:           [''],
    exercises:       this.fb.array([]),
  });

  workoutTypes = WORKOUT_TYPES;
  exercises: Exercise[] = [];
  isEdit      = false;
  itemId:     string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  loading     = false;
  errorMsg    = '';
  successMsg  = '';
  autoCalories = true;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private workoutService: WorkoutService,
    private exerciseService: ExerciseService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  get f() { return this.form.controls; }
  get exercisesArray() { return this.form.get('exercises') as FormArray; }

  // ─── Calorie estimate ───────────────────────────────────────────────────────

  get calorieEstimate(): CalorieEstimate {
    const profile = this.authService.currentProfile;
    return bestCalorieEstimate({
      workoutType:     this.f['type'].value || 'Other',
      durationMinutes: this.f['durationMinutes'].value || 0,
      weightKg:        this.f['bodyWeightKg'].value   ?? profile?.weightKg ?? 70,
      age:             profile?.age,
      sex:             profile?.sex,
      avgHR:           this.f['avgHeartRate'].value   ?? undefined,
    });
  }

  get estimatedCalories(): number { return this.calorieEstimate.calories; }
  get estimateLabel(): string     { return this.calorieEstimate.label; }
  get estimateMethod(): string    { return this.calorieEstimate.method; }

  get canEstimate(): boolean {
    return (this.f['durationMinutes'].value ?? 0) > 0 && !!this.f['type'].value;
  }

  get missingBiometrics(): string[] {
    const profile = this.authService.currentProfile;
    const missing: string[] = [];
    if (!(this.f['bodyWeightKg'].value ?? profile?.weightKg)) missing.push('body weight');
    if (!profile?.age)  missing.push('age');
    if (!profile?.sex)  missing.push('sex');
    return missing;
  }

  get usingHRFormula(): boolean { return this.estimateMethod === 'heart-rate'; }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Pre-fill body weight from saved profile
    const profile = this.authService.currentProfile;
    if (profile?.weightKg) {
      this.f['bodyWeightKg'].setValue(profile.weightKg);
    }

    this.exerciseService.getExercises().subscribe({
      next: res => (this.exercises = res.data.exercises),
    });

    this.itemId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.itemId && this.router.url.includes('/edit');

    if (this.isEdit && this.itemId) {
      this.workoutService.getWorkout(this.itemId).subscribe({
        next: res => {
          const w = res.data.workout;
          this.form.patchValue({
            title:           w.title,
            type:            w.type,
            date:            w.date?.substring(0, 10),
            durationMinutes: w.durationMinutes,
            caloriesBurned:  w.caloriesBurned,
            avgHeartRate:    w.avgHeartRate ?? null,
            bodyWeightKg:    w.bodyWeightKg ?? null,
            notes:           w.notes,
          });
          this.autoCalories = false;
          (w.exercises || []).forEach((ex: any) =>
            this.exercisesArray.push(this.createExerciseGroup(ex))
          );
          if (w.imageUrl) this.previewUrl = w.imageUrl;
        },
      });
    }

    // Re-compute auto calories on any form change
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.autoCalories) {
          this.f['caloriesBurned'].setValue(this.estimatedCalories, { emitEvent: false });
        }
      });


  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleAutoCalories(): void {
    this.autoCalories = !this.autoCalories;
    if (this.autoCalories) {
      this.f['caloriesBurned'].setValue(this.estimatedCalories, { emitEvent: false });
    }
  }

  // ─── Exercise array ─────────────────────────────────────────────────────────

  createExerciseGroup(ex: any = {}): any {
    return this.fb.group({
      exerciseName: [ex.exerciseName || ''],
      exerciseType: [ex.exerciseType || 'strength'],
      sets:         [ex.sets     ?? null],
      reps:         [ex.reps     ?? null],
      weight:       [ex.weight   ?? null],
      distance:     [ex.distance ?? null],
      duration:     [ex.duration ?? null],
    });
  }

  addExercise(): void    { this.exercisesArray.push(this.createExerciseGroup()); }
  removeExercise(i: number): void { this.exercisesArray.removeAt(i); }

  getExType(i: number): string {
    return this.exercisesArray.at(i).get('exerciseType')?.value || 'strength';
  }

  setExerciseType(i: number, type: 'strength' | 'cardio'): void {
    const group = this.exercisesArray.at(i);
    group.get('exerciseType')?.setValue(type);
    if (type === 'cardio') {
      group.get('sets')?.setValue(null);
      group.get('reps')?.setValue(null);
      group.get('weight')?.setValue(null);
      // Clear duration when switching to cardio — strength stores rest seconds,
      // cardio stores exercise minutes; they are different units.
      group.get('duration')?.setValue(null);
    } else {
      group.get('distance')?.setValue(null);
      // Clear duration when switching to strength for the same reason.
      group.get('duration')?.setValue(null);
    }
  }

  onExerciseSelect(i: number, event: Event): void {
    const selectedName = (event.target as HTMLSelectElement).value;
    if (!selectedName) return;
    const group = this.exercisesArray.at(i);
    group.get('exerciseName')?.setValue(selectedName);
    const exercise = this.exercises.find(ex => ex.name === selectedName);
    if (exercise) {
      const isCardio =
        exercise.muscleGroup === 'Cardio' ||
        ['Running', 'Jump Rope', 'Cycling', 'Swimming'].includes(exercise.name);
      this.setExerciseType(i, isCardio ? 'cardio' : 'strength');
    }
  }

  getPace(i: number): string | null {
    const group = this.exercisesArray.at(i);
    const dist  = parseFloat(group.get('distance')?.value);
    const dur   = parseFloat(group.get('duration')?.value);
    if (!dist || !dur || dist <= 0) return null;
    const pace = dur / dist;
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onFile(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) {
      this.selectedFile = f;
      const reader = new FileReader();
      reader.onload = ev => { this.previewUrl = ev.target?.result as string; };
      reader.readAsDataURL(f);
    }
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading  = true;
    this.errorMsg = '';

    const calories = this.autoCalories
      ? this.estimatedCalories
      : (this.form.value.caloriesBurned || 0);

    const fd = new FormData();
    fd.append('title',           this.form.value.title!);
    fd.append('type',            this.form.value.type!);
    fd.append('date',            this.form.value.date!);
    fd.append('durationMinutes', String(this.form.value.durationMinutes));
    fd.append('caloriesBurned',  String(calories));
    fd.append('calorieMethod',   this.autoCalories ? this.estimateMethod : 'manual');
    if (this.form.value.avgHeartRate) {
      fd.append('avgHeartRate', String(this.form.value.avgHeartRate));
    }
    const bw = this.form.value.bodyWeightKg ?? this.authService.currentProfile?.weightKg;
    if (bw) fd.append('bodyWeightKg', String(bw));
    fd.append('notes', this.form.value.notes || '');
    const exs = this.exercisesArray.value.filter((e: any) => e.exerciseName?.trim());
    fd.append('exercises', JSON.stringify(exs));
    if (this.selectedFile) fd.append('image', this.selectedFile);

    const req = this.isEdit && this.itemId
      ? this.workoutService.updateWorkout(this.itemId, fd)
      : this.workoutService.createWorkout(fd);

    req.subscribe({
      next: res => {
        this.successMsg = this.isEdit ? 'Workout updated!' : 'Workout logged!';
        setTimeout(() => this.router.navigate(['/workouts', res.data.workout.id]), 1000);
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Something went wrong.';
        this.loading  = false;
      },
    });
  }
}
