import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  loading = false;
  successMsg = '';
  errorMsg = '';

  get f() { return this.form.controls; }

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.authService.sendPasswordReset(this.form.value.email!).subscribe({
      next: () => {
        this.successMsg = 'Password reset email sent! Check your inbox.';
        this.loading = false;
        this.form.reset();
      },
      error: err => {
        const code = err?.code || '';
        this.errorMsg = code.includes('user-not-found')
          ? 'No account found with that email.'
          : 'Failed to send reset email. Try again.';
        this.loading = false;
      },
    });
  }
}
