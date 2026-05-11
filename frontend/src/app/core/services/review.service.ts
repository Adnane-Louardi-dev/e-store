import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse, ReviewRequest, ReviewResponse } from '../models/api';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private readonly http: HttpClient) {}

  forProduct(productId: number, page = 0, size = 20): Observable<PageResponse<ReviewResponse>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', 'createdAt,desc');
    return this.http.get<PageResponse<ReviewResponse>>(`${environment.apiBaseUrl}/reviews/product/${productId}`, { params });
  }

  create(request: ReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${environment.apiBaseUrl}/reviews`, request);
  }
}
