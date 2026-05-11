import { Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { CatalogService } from '../../core/services/catalog.service';
import { CategoryResponse, PageResponse, ProductResponse } from '../../core/models/api';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule
  ],
  styles: [`
    .products {
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    }

    .product-img {
      height: 170px;
      object-fit: cover;
      background: #edf0f5;
    }

    mat-card-content {
      display: grid;
      gap: 10px;
      min-height: 160px;
    }

    .product-title {
      min-height: 44px;
      font-weight: 700;
      line-height: 1.25;
    }
  `],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Catalog</h1>
          <p class="muted">Browse products, filter by category, and sort the storefront.</p>
        </div>
      </div>

      <div class="toolbar">
        <mat-form-field>
          <mat-label>Search</mat-label>
          <input matInput [formControl]="search" placeholder="Laptop, book, shirt">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Category</mat-label>
          <mat-select [(value)]="categoryId" (selectionChange)="loadProducts(0)">
            <mat-option [value]="null">All categories</mat-option>
            @for (category of categories; track category.id) {
              <mat-option [value]="category.id">{{ category.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Sort</mat-label>
          <mat-select [(value)]="sort" (selectionChange)="loadProducts(0)">
            <mat-option value="id,desc">Newest</mat-option>
            <mat-option value="name,asc">Name A-Z</mat-option>
            <mat-option value="price,asc">Price low to high</mat-option>
            <mat-option value="price,desc">Price high to low</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading) {
        <mat-card><div class="loading-state">Loading products...</div></mat-card>
      } @else if (!page?.content?.length) {
        <mat-card><div class="empty-state">No products found.</div></mat-card>
      } @else {
        <div class="grid products">
          @for (product of page!.content; track product.id) {
            <mat-card>
              <img mat-card-image class="product-img" [src]="product.imageUrl || fallbackImage(product.name)" [alt]="product.name">
              <mat-card-content>
                <div class="product-title">{{ product.name }}</div>
                <div class="muted">{{ product.category.name }}</div>
                <div class="price">{{ product.price | currency }}</div>
                <mat-chip-set>
                  <mat-chip [color]="product.quantityInStock > 0 ? 'primary' : 'warn'" highlighted>
                    {{ product.quantityInStock > 0 ? product.quantityInStock + ' in stock' : 'Out of stock' }}
                  </mat-chip>
                </mat-chip-set>
              </mat-card-content>
              <mat-card-actions>
                <a mat-button color="primary" [routerLink]="['/products', product.id]">View</a>
              </mat-card-actions>
            </mat-card>
          }
        </div>
        <mat-paginator
          [length]="page!.totalElements"
          [pageIndex]="page!.page"
          [pageSize]="page!.size"
          [pageSizeOptions]="[8, 12, 20]"
          (page)="pageChanged($event)" />
      }
    </section>
  `
})
export class ProductListComponent implements OnInit {
  readonly search = new FormControl('', { nonNullable: true });
  categories: CategoryResponse[] = [];
  page: PageResponse<ProductResponse> | null = null;
  categoryId: number | null = null;
  sort = 'id,desc';
  loading = false;

  constructor(private readonly catalog: CatalogService, private readonly errors: ApiErrorService) {}

  ngOnInit(): void {
    this.catalog.categories().subscribe({
      next: (categories) => (this.categories = categories),
      error: (error) => this.errors.show(error)
    });
    this.search.valueChanges.pipe(debounceTime(250)).subscribe(() => this.loadProducts(0));
    this.loadProducts(0);
  }

  loadProducts(page: number, size = this.page?.size ?? 12): void {
    this.loading = true;
    this.catalog.products({ q: this.search.value, categoryId: this.categoryId, sort: this.sort, page, size }).subscribe({
      next: (result) => {
        this.page = result;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errors.show(error);
      }
    });
  }

  pageChanged(event: PageEvent): void {
    this.loadProducts(event.pageIndex, event.pageSize);
  }

  fallbackImage(name: string): string {
    return `https://placehold.co/600x400?text=${encodeURIComponent(name)}`;
  }
}
