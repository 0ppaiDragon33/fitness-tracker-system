import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = false;
  errorMsg = '';

  get f() {
    return this.form.controls;
  }

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    const { email, password } = this.form.value;
    this.authService.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/workouts']),
      error: err => {
        const code = err?.code || '';
        if (code.includes('email-not-verified')) {
          this.router.navigate(['/verify-email']);
        } else {
          this.errorMsg = code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')
            ? 'Invalid email or password.' : err?.error?.message || 'Login failed.';
        }
        this.loading = false;
      },
    });
  }
}
