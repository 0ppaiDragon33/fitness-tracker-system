import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  private routerSub?: Subscription;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Close mobile menu automatically on every navigation
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => { this.mobileMenuOpen = false; });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  logout(): void {
    this.mobileMenuOpen = false;
    this.authService.logout().subscribe({ next: () => this.router.navigate(['/']) });
  }
}
