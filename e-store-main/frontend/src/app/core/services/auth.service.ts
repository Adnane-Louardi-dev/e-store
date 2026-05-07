import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/api';

const AUTH_KEY = 'estore.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authSignal = signal<AuthResponse | null>(this.readStoredAuth());
  readonly auth = this.authSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.authSignal());
  readonly isAdmin = computed(() => this.authSignal()?.role === 'ADMIN');

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, request).pipe(
      tap((auth) => this.storeAuth(auth))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, request).pipe(
      tap((auth) => this.storeAuth(auth))
    );
  }

  logout(redirect = true): void {
    localStorage.removeItem(AUTH_KEY);
    this.authSignal.set(null);
    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    const auth = this.authSignal();
    if (!auth) {
      return null;
    }
    if (new Date(auth.expiresAt).getTime() <= Date.now()) {
      this.logout(false);
      return null;
    }
    return auth.token;
  }

  private storeAuth(auth: AuthResponse): void {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    this.authSignal.set(auth);
  }

  private readStoredAuth(): AuthResponse | null {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) {
      return null;
    }
    try {
      const auth = JSON.parse(raw) as AuthResponse;
      return new Date(auth.expiresAt).getTime() > Date.now() ? auth : null;
    } catch {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
  }
}
