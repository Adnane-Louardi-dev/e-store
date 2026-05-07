import { Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { CategoryResponse, PageResponse, ProductResponse } from '../../core/models/api';
import { AdminService } from '../../core/services/admin.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatTableModule],
  template: `
    <section class="page">
      <div class="page-header"><h1>Products</h1></div>
      <div class="grid two-col">
        <mat-card>
          <mat-card-header><mat-card-title>{{ editing ? 'Edit product' : 'New product' }}</mat-card-title></mat-card-header>
          <mat-card-content>
            @if (categoryLoadError) {
              <div class="error-state">{{ categoryLoadError }}</div>
            }
            <form [formGroup]="form" (ngSubmit)="save()">
              <mat-form-field class="full-width"><mat-label>Name</mat-label><input matInput formControlName="name"><mat-error>{{ error('name') }}</mat-error></mat-form-field>
              <mat-form-field class="full-width"><mat-label>Description</mat-label><textarea matInput rows="3" formControlName="description"></textarea><mat-error>{{ error('description') }}</mat-error></mat-form-field>
              <mat-form-field class="full-width"><mat-label>Price</mat-label><input matInput type="number" min="0" formControlName="price"><mat-error>{{ error('price') }}</mat-error></mat-form-field>
              <mat-form-field class="full-width"><mat-label>Image URL</mat-label><input matInput formControlName="imageUrl"><mat-error>{{ error('imageUrl') }}</mat-error></mat-form-field>
              <mat-form-field class="full-width">
                <mat-label>Category</mat-label>
                <mat-select formControlName="categoryId" [disabled]="!categories.length">
                  @for (category of categories; track category.id) {
                    <mat-option [value]="category.id">{{ category.name }}</mat-option>
                  }
                </mat-select>
                <mat-error>{{ error('categoryId') }}</mat-error>
              </mat-form-field>
              <div class="actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || !categories.length"><mat-icon>save</mat-icon>Save</button>
                <button mat-button type="button" (click)="reset()">Cancel</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-content>
            @if (loadingProducts) {
              <div class="loading-state">Loading products...</div>
            } @else if (productLoadError) {
              <div class="error-state">
                <p>{{ productLoadError }}</p>
                <button mat-flat-button color="primary" type="button" (click)="load(page?.page ?? 0)">Retry</button>
              </div>
            } @else if (!page?.content?.length) {
              <div class="empty-state">No products found.</div>
            } @else {
              <table mat-table [dataSource]="page!.content">
                <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let product">{{ product.name }}</td></ng-container>
                <ng-container matColumnDef="price"><th mat-header-cell *matHeaderCellDef>Price</th><td mat-cell *matCellDef="let product">{{ product.price | currency }}</td></ng-container>
                <ng-container matColumnDef="stock"><th mat-header-cell *matHeaderCellDef>Stock</th><td mat-cell *matCellDef="let product">{{ product.quantityInStock }}</td></ng-container>
                <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let product">
                  <button mat-icon-button type="button" (click)="edit(product)" aria-label="Edit"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" type="button" (click)="delete(product.id)" aria-label="Delete"><mat-icon>delete</mat-icon></button>
                </td></ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns;"></tr>
              </table>
              <mat-paginator [length]="page!.totalElements" [pageIndex]="page!.page" [pageSize]="page!.size" (page)="pageChanged($event)" />
            }
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `
})
export class AdminProductsComponent implements OnInit {
  readonly columns = ['name', 'price', 'stock', 'actions'];
  categories: CategoryResponse[] = [];
  page: PageResponse<ProductResponse> | null = null;
  editing: ProductResponse | null = null;
  loadingProducts = false;
  productLoadError = '';
  categoryLoadError = '';
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', Validators.maxLength(2000)],
    price: [0, [Validators.required, Validators.min(0)]],
    imageUrl: ['', Validators.maxLength(500)],
    categoryId: [0, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly catalog: CatalogService,
    private readonly admin: AdminService,
    private readonly errors: ApiErrorService
  ) {}

  ngOnInit(): void {
    this.catalog.categories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.categoryLoadError = categories.length ? '' : 'No categories exist yet. Create a category before adding products.';
        if (categories[0]) {
          this.form.controls.categoryId.setValue(categories[0].id);
        }
      },
      error: (error) => {
        this.categoryLoadError = this.errors.message(error);
        this.errors.show(error);
      }
    });
    this.load(0);
  }

  load(page: number, size = this.page?.size ?? 8): void {
    this.loadingProducts = true;
    this.productLoadError = '';
    this.catalog.products({ page, size, sort: 'id,desc' }).subscribe({
      next: (result) => {
        this.page = result;
        this.loadingProducts = false;
      },
      error: (error) => {
        this.loadingProducts = false;
        this.productLoadError = this.errors.message(error);
        this.page = { content: [], page, size, totalElements: 0, totalPages: 0, last: true };
        this.errors.show(error);
      }
    });
  }

  save(): void {
    const request = this.form.getRawValue();
    const action = this.editing
      ? this.admin.updateProduct(this.editing.id, request)
      : this.admin.createProduct(request);
    action.subscribe({
      next: () => {
        this.reset();
        this.load(this.page?.page ?? 0);
      },
      error: (error) => {
        if (!this.errors.applyFormErrors(this.form, error)) this.errors.show(error);
      }
    });
  }

  edit(product: ProductResponse): void {
    this.editing = product;
    this.form.patchValue({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      imageUrl: product.imageUrl ?? '',
      categoryId: product.category.id
    });
  }

  delete(id: number): void {
    this.admin.deleteProduct(id).subscribe({
      next: () => this.load(this.page?.page ?? 0),
      error: (error) => this.errors.show(error)
    });
  }

  reset(): void {
    this.editing = null;
    this.form.reset({
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      categoryId: this.categories[0]?.id ?? 0
    });
  }

  pageChanged(event: PageEvent): void {
    this.load(event.pageIndex, event.pageSize);
  }

  error(name: 'name' | 'description' | 'price' | 'imageUrl' | 'categoryId'): string {
    const control = this.form.controls[name];
    if (control.hasError('server')) return control.getError('server');
    if (control.hasError('required')) return 'Required';
    if (control.hasError('min')) return 'Invalid value';
    if (control.hasError('maxlength')) return 'Too long';
    return '';
  }
}
