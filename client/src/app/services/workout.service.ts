import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkoutFilters } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private apiUrl = `${environment.apiUrl}/workouts`;
  constructor(private http: HttpClient) {}

  getWorkouts(f: WorkoutFilters = {}): Observable<any> {
    let p = new HttpParams();
    if (f.type) p = p.set('type', f.type);
    if (f.dateFrom) p = p.set('dateFrom', f.dateFrom);
    if (f.dateTo) p = p.set('dateTo', f.dateTo);
    p = p.set('page', f.page?.toString() || '1');
    p = p.set('limit', f.limit?.toString() || '12');
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getWorkout(id: string): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  createWorkout(fd: FormData): Observable<any> { return this.http.post<any>(this.apiUrl, fd); }
  updateWorkout(id: string, fd: FormData): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, fd); }
  deleteWorkout(id: string): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
  getMyWorkouts(): Observable<any> { return this.http.get<any>(`${this.apiUrl}/user/my`); }
}
