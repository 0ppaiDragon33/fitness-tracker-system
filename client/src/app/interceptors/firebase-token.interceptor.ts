import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { Auth } from '@angular/fire/auth';

@Injectable()
export class FirebaseTokenInterceptor implements HttpInterceptor {
  constructor(private afAuth: Auth) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const user = this.afAuth.currentUser;
    if (!user) return next.handle(req);
    return from(user.getIdToken()).pipe(
      switchMap(token => next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
    );
  }
}
