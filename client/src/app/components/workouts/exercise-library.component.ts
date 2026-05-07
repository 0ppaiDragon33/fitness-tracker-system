import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { ExerciseService } from '../../services/other.services';
import { AuthService } from '../../services/auth.service';
import { Exercise, MUSCLE_GROUPS, DIFFICULTIES } from '../../models';

@Component({
  selector: 'app-exercise-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exercise-library.component.html',
})
export class ExerciseLibraryComponent implements OnInit {
  exercises: Exercise[] = [];
  grouped: Record<string, Exercise[]> = {};
  selectedExercise: Exercise | null = null;
  loading = false;
  searchQuery = '';
  filterMuscle = '';
  filterDifficulty = '';
  seeding = false;
  muscleGroups = MUSCLE_GROUPS;
  difficulties = DIFFICULTIES;
  private searchSubject = new Subject<string>();

  constructor(
    private exerciseService: ExerciseService,
    public authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
    this.searchSubject.pipe(debounceTime(350)).subscribe(() => this.load());
  }

  load(): void {
    this.loading = true;
    this.exerciseService
      .getExercises(
        this.filterMuscle || undefined,
        this.filterDifficulty || undefined,
        this.searchQuery || undefined
      )
      .subscribe({
        next: res => {
          this.exercises = res.data.exercises;
          this.grouped = this.exercises.reduce((acc: any, ex) => {
            const key = ex.muscleGroup;
            if (!acc[key]) acc[key] = [];
            acc[key].push(ex);
            return acc;
          }, {});
          this.loading = false;
        },
        error: () => { this.loading = false; },
      });
  }

  onSearch(q: string): void { this.searchSubject.next(q); }

  groupedKeys(): string[] { return Object.keys(this.grouped).sort(); }

  openModal(ex: Exercise): void {
    this.selectedExercise = ex;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.selectedExercise = null;
    document.body.style.overflow = '';
  }

  getExType(muscleGroup: string, name = ''): string {
    const n = name.toLowerCase();
    if (/yoga|warrior|downward dog|child.s pose|sun salutation|pigeon|cobra|tree pose|mountain pose/.test(n)) return 'Yoga';
    if (/stretch|flexibility|foam roll|mobility|hip flexor|hamstring stretch/.test(n)) return 'Flexibility';
    if (/burpee|box jump|battle rope|medicine ball slam|sprint interval|hiit|jump rope|mountain climber/.test(n)) return 'HIIT';
    if (/basketball|football|tennis|soccer|volleyball|cricket|rugby|sport/.test(n)) return 'Sports';
    if (muscleGroup === 'Cardio') return 'Cardio';
    if (muscleGroup === 'Full Body') return 'HIIT';
    return 'Strength';
  }

  getExTypeEmoji(muscleGroup: string, name = ''): string {
    const type = this.getExType(muscleGroup, name);
    const map: Record<string, string> = {
      Strength: '🏋️', Cardio: '🏃', HIIT: '⚡', Yoga: '🧘', Flexibility: '🤸', Sports: '⚽',
    };
    return map[type] || '🏋️';
  }

  getExTypeClass(muscleGroup: string, name = ''): string {
    const type = this.getExType(muscleGroup, name);
    const map: Record<string, string> = {
      Strength:    'bg-blue-100 text-blue-700',
      Cardio:      'bg-red-100 text-red-700',
      HIIT:        'bg-orange-100 text-orange-700',
      Yoga:        'bg-purple-100 text-purple-700',
      Flexibility: 'bg-green-100 text-green-700',
      Sports:      'bg-yellow-100 text-yellow-700',
    };
    return map[type] || 'bg-slate-100 text-slate-600';
  }

  startSession(ex: Exercise): void {
    this.closeModal();
    const type = ex.muscleGroup === 'Cardio' ? 'cardio' : 'strength';
    this.router.navigate(['/workouts/session'], {
      queryParams: { exercise: ex.name, type },
    });
  }

  seed(): void {
    this.seeding = true;
    this.exerciseService.seedExercises().subscribe({
      next: () => { this.seeding = false; this.load(); },
      error: () => { this.seeding = false; },
    });
  }

  getDiffClass(d: string): string {
    return d === 'Beginner'
      ? 'bg-green-100 text-green-700'
      : d === 'Intermediate'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';
  }

  getMuscleEmoji(m: string): string {
    const map: Record<string, string> = {
      Chest: '💪', Back: '🏋️', Shoulders: '🤷', Arms: '💪',
      Core: '🎯', Legs: '🦵', 'Full Body': '🏃', Cardio: '❤️',
    };
    return map[m] || '💪';
  }
}
