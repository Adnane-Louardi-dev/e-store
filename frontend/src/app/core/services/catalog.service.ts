import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryResponse, PageResponse, ProductResponse } from '../models/api';

export interface ProductQuery {
  q?: string;
  categoryId?: number | null;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private readonly http: HttpClient) {}

  categories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(`${environment.apiBaseUrl}/categories`);
  }

  products(query: ProductQuery = {}): Observable<PageResponse<ProductResponse>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 0))
      .set('size', String(query.size ?? 20))
      .set('sort', query.sort ?? 'id,desc');
    if (query.q?.trim()) {
      params = params.set('q', query.q.trim());
    }
    if (query.categoryId) {
      params = params.set('categoryId', String(query.categoryId));
    }
    return this.http.get<PageResponse<ProductResponse>>(`${environment.apiBaseUrl}/products`, { params });
  }

  product(id: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${environment.apiBaseUrl}/products/${id}`);
  }
}
