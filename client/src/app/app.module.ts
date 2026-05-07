import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./components/auth/verify-email.component').then(m => m.VerifyEmailComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/auth/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'workouts',
    loadComponent: () => import('./components/workouts/workout-list.component').then(m => m.WorkoutListComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'workouts/log',
    loadComponent: () => import('./components/workouts/workout-form.component').then(m => m.WorkoutFormComponent),
    canActivate: [AuthGuard],
  },

  // ── NEW: Guided workout session ──────────────────────────────────────────
  // NOTE: This route MUST be defined before 'workouts/:id' so Angular does not
  // treat the literal "session" as a dynamic :id parameter.
  {
    path: 'workouts/session',
    loadComponent: () =>
      import('./components/workouts/workout.session.component').then(
        m => m.WorkoutSessionComponent
      ),
    canActivate: [AuthGuard],
  },
  // ────────────────────────────────────────────────────────────────────────

  {
    path: 'workouts/:id',
    loadComponent: () => import('./components/workouts/workout-detail.component').then(m => m.WorkoutDetailComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'workouts/:id/edit',
    loadComponent: () => import('./components/workouts/workout-form.component').then(m => m.WorkoutFormComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'exercises',
    loadComponent: () =>
      import('./components/workouts/exercise-library.component').then(
        m => m.ExerciseLibraryComponent
      ),
  },
  {
    path: 'progress',
    loadComponent: () => import('./components/progress/progress.component').then(m => m.ProgressComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AuthGuard],
    data: { role: 'admin' },
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./components/admin/admin-users.component').then(m => m.AdminUsersComponent),
    canActivate: [AuthGuard],
    data: { role: 'admin' },
  },
  {
    path: 'admin/workouts',
    loadComponent: () => import('./components/admin/admin-workouts.component').then(m => m.AdminWorkoutsComponent),
    canActivate: [AuthGuard],
    data: { role: 'admin' },
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/auth/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: '' },
];