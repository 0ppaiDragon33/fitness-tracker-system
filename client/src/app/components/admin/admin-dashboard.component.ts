import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/other.services';
import { AdminStats } from '../../models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  loading = true;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: res => { this.stats = res.data.stats; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  typeEntries(): [string, number][] {
    if (!this.stats?.byType) return [];
    return Object.entries(this.stats.byType).sort((a, b) => b[1] - a[1]) as [string, number][];
  }

  formatHours(mins: number): string { return (mins / 60).toFixed(0); }
}
