import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private afAuth: Auth, private authService: AuthService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const user = await firstValueFrom(authState(this.afAuth));

    if (!user || !this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }

    if (!user.emailVerified) {
      this.router.navigate(['/verify-email']);
      return false;
    }

    if (route.data['role'] === 'admin' && !this.authService.isAdmin) {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
