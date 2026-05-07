import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  loading = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    const { name, email, password } = this.form.value;
    this.authService.register(name!, email!, password!).subscribe({
      next: () => this.router.navigate(['/verify-email']),
      error: err => {
        const code = err?.code || '';
        this.errorMsg = code.includes('email-already-in-use') ? 'Email already registered.'
          : code.includes('weak-password') ? 'Password too weak.'
          : err?.error?.message || 'Registration failed.';
        this.loading = false;
      },
    });
  }
}
