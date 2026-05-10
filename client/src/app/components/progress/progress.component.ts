import { Component, OnInit } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../../services/other.services';
import { ProgressStats, BodyLog, ChartData } from '../../models';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './progress.component.html',
})
export class ProgressComponent implements OnInit {
  stats: ProgressStats | null = null;
  chartData: ChartData | null = null;
  bodyLogs: BodyLog[] = [];
  loading = true;
  showBodyForm = false;
  loggingBody = false;
  bodyForm = this.fb.group({ weight: [null], bodyFat: [null], notes: [''] });

  constructor(private progressService: ProgressService, private fb: FormBuilder) {}

  ngOnInit(): void {
    Promise.all([
      lastValueFrom(this.progressService.getStats()),
      lastValueFrom(this.progressService.getChartData()),
      lastValueFrom(this.progressService.getBodyLogs()),
    ]).then(([statsRes, chartRes, bodyRes]: any[]) => {
      this.stats = statsRes?.data?.stats || null;
      this.chartData = chartRes?.data || null;
      this.bodyLogs = bodyRes?.data?.logs || [];
      this.loading = false;
    }).catch(() => { this.loading = false; });
  }

  logBody(): void {
    const val = this.bodyForm.value;
    if (!val.weight && !val.bodyFat) return;
    const payload: any = {};
    if (val.weight) payload.weight = Number(val.weight);
    if (val.bodyFat) payload.bodyFat = Number(val.bodyFat);
    if (val.notes) payload.notes = val.notes;
    this.loggingBody = true;
    this.progressService.logBody(payload).subscribe({
      next: res => {
        this.bodyLogs.unshift(res.data.log);
        this.bodyForm.reset();
        this.showBodyForm = false;
        this.loggingBody = false;
      },
      error: () => { this.loggingBody = false; },
    });
  }

  formatHours(mins?: number): string {
    if (!mins) return '0';
    return (mins / 60).toFixed(1);
  }

  topType(): string {
    if (!this.stats?.byType) return '—';
    const entries = Object.entries(this.stats.byType);
    if (!entries.length) return '—';
    return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  typeEntries(): [string, number][] {
    if (!this.stats?.byType) return [];
    return Object.entries(this.stats.byType).sort((a, b) => b[1] - a[1]) as [string, number][];
  }

  getBarWidth(count: number): number {
    const max = Math.max(...Object.values(this.stats?.byType || { x: 1 }));
    return max === 0 ? 0 : Math.round((count / max) * 100);
  }

  getBarH(calories: number): number {
    if (!this.chartData) return 0;
    const max = Math.max(...this.chartData.calories, 1);
    return Math.max(4, Math.round((calories / max) * 120));
  }
}
