import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddCartItemRequest, CartResponse, UpdateCartItemRequest } from '../models/api';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly cart = signal<CartResponse | null>(null);

  constructor(private readonly http: HttpClient) {}

  load(): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${environment.apiBaseUrl}/cart`).pipe(tap((cart) => this.cart.set(cart)));
  }

  add(request: AddCartItemRequest): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${environment.apiBaseUrl}/cart/items`, request).pipe(tap((cart) => this.cart.set(cart)));
  }

  update(itemId: number, request: UpdateCartItemRequest): Observable<CartResponse> {
    return this.http.put<CartResponse>(`${environment.apiBaseUrl}/cart/items/${itemId}`, request).pipe(tap((cart) => this.cart.set(cart)));
  }

  remove(itemId: number): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${environment.apiBaseUrl}/cart/items/${itemId}`).pipe(tap((cart) => this.cart.set(cart)));
  }

  clear(): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${environment.apiBaseUrl}/cart`).pipe(tap((cart) => this.cart.set(cart)));
  }

  reset(): void {
    this.cart.set(null);
  }
}
