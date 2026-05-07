import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(private auth: Auth, private authService: AuthService) {}

  ngOnInit(): void {
    // Whenever Firebase confirms a logged-in user, refresh the profile
    // cache from the server so biometrics are always up to date.
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.authService.refreshProfile().subscribe();
      }
    });
  }
}
