import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private apiUrl = `${environment.apiUrl}/exercises`;
  constructor(private http: HttpClient) {}

  getExercises(muscleGroup?: string, difficulty?: string, search?: string): Observable<any> {
    let p = new HttpParams();
    if (muscleGroup) p = p.set('muscleGroup', muscleGroup);
    if (difficulty) p = p.set('difficulty', difficulty);
    if (search) p = p.set('search', search);
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  createExercise(data: any): Observable<any> { return this.http.post<any>(this.apiUrl, data); }
  updateExercise(id: string, data: any): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, data); }
  deleteExercise(id: string): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
  seedExercises(): Observable<any> { return this.http.post<any>(`${this.apiUrl}/seed`, {}); }
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private apiUrl = `${environment.apiUrl}/progress`;
  constructor(private http: HttpClient) {}
  getStats(): Observable<any> { return this.http.get<any>(this.apiUrl); }
  getChartData(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/chart`); }
  logBody(data: any): Observable<any> { return this.http.post<any>(`${this.apiUrl}/body`, data); }
  getBodyLogs(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/body`); }
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;
  constructor(private http: HttpClient) {}
  getStats(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/stats`); }
  getUsers(page = 1): Observable<any> { return this.http.get<any>(`${this.apiUrl}/users?page=${page}&limit=20`); }
  updateUserRole(uid: string, role: string): Observable<any> { return this.http.patch(`${this.apiUrl}/users/${uid}/role`, { role }); }
  deleteUser(uid: string): Observable<any> { return this.http.delete(`${this.apiUrl}/users/${uid}`); }
  getAllWorkouts(params: any = {}): Observable<any> { return this.http.get<any>(`${this.apiUrl}/workouts?${new URLSearchParams(params)}`); }
}
