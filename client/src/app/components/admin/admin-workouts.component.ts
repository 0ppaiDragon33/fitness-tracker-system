import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/other.services';
import { WorkoutService } from '../../services/workout.service';
import { WORKOUT_TYPES, WORKOUT_TYPE_COLORS } from '../../models';

@Component({
  selector: 'app-admin-workouts',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-workouts.component.html',
})
export class AdminWorkoutsComponent implements OnInit {
  workouts: any[] = [];
  pagination: any = null;
  loading = true;
  filterType = '';
  page = 1;
  types = WORKOUT_TYPES;
  typeColors = WORKOUT_TYPE_COLORS;

  constructor(private adminService: AdminService, private workoutService: WorkoutService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const p: any = { page: this.page, limit: 20 };
    if (this.filterType) p.type = this.filterType;
    this.adminService.getAllWorkouts(p).subscribe({
      next: res => { this.workouts = res.data.workouts; this.pagination = res.data.pagination; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  del(id: string): void {
    if (!confirm('Delete this workout?')) return;
    this.workoutService.deleteWorkout(id).subscribe({
      next: () => { this.workouts = this.workouts.filter(w => w.id !== id); },
    });
  }

  goTo(p: number): void { this.page = p; this.load(); }
}
