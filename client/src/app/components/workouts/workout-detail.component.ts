import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { WorkoutService } from '../../services/workout.service';
import { AuthService } from '../../services/auth.service';
import { Workout, WORKOUT_TYPE_COLORS } from '../../models';

@Component({
  selector: 'app-workout-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './workout-detail.component.html',
})
export class WorkoutDetailComponent implements OnInit {
  workout: Workout | null = null;
  loading = true;
  typeColors = WORKOUT_TYPE_COLORS;

  constructor(
    private workoutService: WorkoutService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.workoutService.getWorkout(id).subscribe({
      next: res => { this.workout = res.data.workout; this.loading = false; },
      error: () => { this.loading = false; this.router.navigate(['/workouts']); },
    });
  }

  get canEdit(): boolean {
    if (!this.workout || !this.authService.isLoggedIn) return false;
    return this.authService.isAdmin || this.workout.userId === this.authService.currentProfile?.uid;
  }

  calcPace(distance: number, durationMin: number): string {
    if (!distance || !durationMin || distance <= 0) return '—';
    const paceDecimal = durationMin / distance;
    const mins = Math.floor(paceDecimal);
    const secs = Math.round((paceDecimal - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  deleteWorkout(): void {
    if (!confirm('Delete this workout?')) return;
    this.workoutService.deleteWorkout(this.workout!.id).subscribe({
      next: () => this.router.navigate(['/workouts']),
    });
  }
}
