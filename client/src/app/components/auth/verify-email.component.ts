import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent {
  loading = false;
  successMsg = '';
  errorMsg = '';

  constructor(private authService: AuthService) {}

  resend(): void {
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.authService.resendVerificationEmail().subscribe({
      next: () => {
        this.successMsg = 'Verification email sent! Check your inbox.';
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to resend. Please try logging in again.';
        this.loading = false;
      },
    });
  }
}
