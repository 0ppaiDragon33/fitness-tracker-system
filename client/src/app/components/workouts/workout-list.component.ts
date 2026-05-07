import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { WorkoutService } from '../../services/workout.service';
import { Workout, WorkoutFilters, Pagination, WORKOUT_TYPES, WORKOUT_TYPE_COLORS } from '../../models';

@Component({
  selector: 'app-workout-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './workout-list.component.html',
})
export class WorkoutListComponent implements OnInit {
  workouts: Workout[] = [];
  pagination: Pagination | null = null;
  loading = false;
  filters: WorkoutFilters = { page: 1, limit: 12 };
  types = WORKOUT_TYPES;
  typeColors = WORKOUT_TYPE_COLORS;

  constructor(private workoutService: WorkoutService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.workoutService.getWorkouts(this.filters).subscribe({
      next: res => { this.workouts = res.data.workouts; this.pagination = res.data.pagination; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  goTo(p: number): void { this.filters.page = p; this.load(); }

  clearFilters(): void { this.filters = { page: 1, limit: 12 }; this.load(); }

  getTypeEmoji(t: string): string {
    const map: Record<string, string> = {
      Strength: '🏋️', Cardio: '🏃', Flexibility: '🧘', HIIT: '⚡',
      Yoga: '🧘', Sports: '⚽', Other: '💪',
    };
    return map[t] || '💪';
  }
}
