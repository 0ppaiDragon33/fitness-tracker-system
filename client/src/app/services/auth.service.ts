import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification, sendPasswordResetEmail
} from '@angular/fire/auth';
import { BehaviorSubject, Observable, from, switchMap, tap } from 'rxjs';
import { User } from '../models';
import { environment } from '../../environments/environment';

export interface FitnessProfile {
  weightKg?: number;
  age?: number;
  sex?: 'male' | 'female';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private profileSubject = new BehaviorSubject<User | null>(this.getStored());
  profile$ = this.profileSubject.asObservable();

  constructor(private afAuth: Auth, private http: HttpClient) {}

  private getStored(): User | null {
    const p = localStorage.getItem('fittrack_profile');
    return p ? JSON.parse(p) : null;
  }

  get currentProfile(): User | null { return this.profileSubject.value; }
  get isLoggedIn(): boolean { return !!this.afAuth.currentUser && !!this.currentProfile; }
  get isAdmin(): boolean { return this.currentProfile?.role === 'admin'; }

  /** Convenience getter — returns the user's body weight or undefined */
  get weightKg(): number | undefined { return this.currentProfile?.weightKg; }

  /** True if the user has filled in enough biometrics for the HR formula */
  get hasFullBiometrics(): boolean {
    const p = this.currentProfile;
    return !!(p?.weightKg && p?.age && p?.sex);
  }

  register(name: string, email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.afAuth, email, password)).pipe(
      switchMap(async c => {
        await sendEmailVerification(c.user);
        return { idToken: await c.user.getIdToken() };
      }),
      switchMap(({ idToken }) => this.http.post(`${this.apiUrl}/register`, { name, email, idToken })),
    );
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.afAuth, email, password)).pipe(
      switchMap(async c => {
        if (!c.user.emailVerified) {
          await signOut(this.afAuth);
          throw { code: 'auth/email-not-verified' };
        }
        return await c.user.getIdToken();
      }),
      switchMap(idToken => this.http.post(`${this.apiUrl}/login`, { idToken })),
      tap((res: any) => this.store(res.data.user))
    );
  }

  /** Resend verification email to the currently signed-in (unverified) user */
  resendVerificationEmail(): Observable<void> {
    return from(
      (async () => {
        const user = this.afAuth.currentUser;
        if (user) await sendEmailVerification(user);
      })()
    );
  }

  /** Send a password reset email via Firebase */
  sendPasswordReset(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.afAuth, email));
  }

  logout(): Observable<void> {
    localStorage.removeItem('fittrack_profile');
    this.profileSubject.next(null);
    return from(signOut(this.afAuth));
  }

  /**
   * Save fitness profile fields (weightKg, age, sex, fitnessLevel, name).
   * Persists to Firestore via PATCH /auth/me and refreshes local cache.
   */
  updateProfile(data: FitnessProfile): Observable<any> {
    return this.http.patch(`${this.apiUrl}/me`, data).pipe(
      tap((res: any) => this.store(res.data.user))
    );
  }

  /** Silently refresh the local profile cache from the server */
  refreshProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`).pipe(
      tap((res: any) => this.store(res.data.user))
    );
  }

  private store(u: User): void {
    localStorage.setItem('fittrack_profile', JSON.stringify(u));
    this.profileSubject.next(u);
  }
}
