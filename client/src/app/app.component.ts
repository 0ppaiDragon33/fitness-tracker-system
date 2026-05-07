import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  showNavbar = false;
  private publicRoutes = ['', '/', 'login', 'register', 'verify-email', 'forgot-password'];

  constructor(
    private auth: Auth,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Whenever Firebase confirms a logged-in user, refresh the profile
    // cache from the server so biometrics are always up to date.
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.authService.refreshProfile().subscribe();
      }
    });

    // Show navbar only on non-public routes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || '';
        const path = url.split('?')[0].split('#')[0]; // Remove query/hash
        const normalizedPath = path === '/' || path === '' ? '' : path.substring(1); // Remove leading slash
        this.showNavbar = !this.publicRoutes.includes(normalizedPath) && !this.publicRoutes.includes(path);
      });
  }
}
