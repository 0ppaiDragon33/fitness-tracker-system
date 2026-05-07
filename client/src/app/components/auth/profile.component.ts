import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {

  form = this.fb.group({
    name:         ['', [Validators.required, Validators.minLength(2)]],
    weightKg:     [null as number | null, [Validators.min(20), Validators.max(500)]],
    age:          [null as number | null, [Validators.min(10), Validators.max(120)]],
    sex:          ['' as '' | 'male' | 'female'],
    fitnessLevel: ['' as '' | 'beginner' | 'intermediate' | 'advanced'],
  });

  saving    = false;
  saved     = false;
  errorMsg  = '';

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
  ) {}

  get f() { return this.form.controls; }

  get profile() { return this.authService.currentProfile; }

  /** How complete the fitness profile is (0–100) */
  get profileCompleteness(): number {
    const p = this.profile;
    let filled = 0;
    if (p?.weightKg)     filled++;
    if (p?.age)          filled++;
    if (p?.sex)          filled++;
    if (p?.fitnessLevel) filled++;
    return Math.round((filled / 4) * 100);
  }

  get completenessColor(): string {
    const pct = this.profileCompleteness;
    if (pct === 100) return 'bg-green-500';
    if (pct >= 50)   return 'bg-yellow-400';
    return 'bg-red-400';
  }

  get calorieFormulaReady(): boolean {
    const p = this.profile;
    return !!(p?.weightKg && p?.age && p?.sex);
  }

  ngOnInit(): void {
    // Pre-fill form from saved profile
    const p = this.profile;
    if (p) {
      this.form.patchValue({
        name:         p.name         || '',
        weightKg:     p.weightKg     ?? null,
        age:          p.age          ?? null,
        sex:          p.sex          ?? '',
        fitnessLevel: p.fitnessLevel ?? '',
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving   = true;
    this.errorMsg = '';
    this.saved    = false;

    const val = this.form.value;
    const updates: any = { name: val.name };
    if (val.weightKg != null) updates.weightKg     = val.weightKg;
    if (val.age      != null) updates.age          = val.age;
    if (val.sex)              updates.sex          = val.sex;        // intentionally skip empty string
    if (val.fitnessLevel)     updates.fitnessLevel = val.fitnessLevel;

    this.authService.updateProfile(updates).subscribe({
      next: () => {
        this.saving = false;
        this.saved  = true;
        setTimeout(() => (this.saved = false), 3000);
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Something went wrong.';
        this.saving   = false;
      },
    });
  }
}
