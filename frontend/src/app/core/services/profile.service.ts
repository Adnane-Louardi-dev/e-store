import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UpdateProfileRequest, UserResponse } from '../models/api';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private readonly http: HttpClient) {}

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${environment.apiBaseUrl}/users/me`);
  }

  update(request: UpdateProfileRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${environment.apiBaseUrl}/users/me/profile`, request);
  }
}
