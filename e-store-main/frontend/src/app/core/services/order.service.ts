import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderResponse, PageResponse, UpdateOrderItemRequest } from '../models/api';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private readonly http: HttpClient) {}

  place(): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${environment.apiBaseUrl}/orders`, null);
  }

  mine(page = 0, size = 20): Observable<PageResponse<OrderResponse>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', 'orderDate,desc');
    return this.http.get<PageResponse<OrderResponse>>(`${environment.apiBaseUrl}/orders/user/me`, { params });
  }

  all(page = 0, size = 20): Observable<PageResponse<OrderResponse>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', 'orderDate,desc');
    return this.http.get<PageResponse<OrderResponse>>(`${environment.apiBaseUrl}/orders`, { params });
  }

  get(id: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${environment.apiBaseUrl}/orders/${id}`);
  }

  updateItem(orderId: number, itemId: number, request: UpdateOrderItemRequest): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(`${environment.apiBaseUrl}/orders/${orderId}/items/${itemId}`, request);
  }

  cancel(orderId: number): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(`${environment.apiBaseUrl}/orders/${orderId}/cancel`, null);
  }
}
