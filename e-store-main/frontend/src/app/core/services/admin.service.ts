import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdjustStockRequest,
  CategoryRequest,
  CategoryResponse,
  InventoryResponse,
  ProductRequest,
  ProductResponse
} from '../models/api';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly http: HttpClient) {}

  createCategory(request: CategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(`${environment.apiBaseUrl}/categories`, request);
  }

  updateCategory(id: number, request: CategoryRequest): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${environment.apiBaseUrl}/categories/${id}`, request);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/categories/${id}`);
  }

  createProduct(request: ProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${environment.apiBaseUrl}/products`, request);
  }

  updateProduct(id: number, request: ProductRequest): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${environment.apiBaseUrl}/products/${id}`, request);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/products/${id}`);
  }

  getStock(productId: number): Observable<InventoryResponse> {
    return this.http.get<InventoryResponse>(`${environment.apiBaseUrl}/inventory/product/${productId}`);
  }

  setStock(productId: number, request: AdjustStockRequest): Observable<InventoryResponse> {
    return this.http.put<InventoryResponse>(`${environment.apiBaseUrl}/inventory/product/${productId}`, request);
  }
}
