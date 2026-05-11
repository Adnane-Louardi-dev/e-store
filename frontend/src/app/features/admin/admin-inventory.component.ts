import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProductResponse } from '../../core/models/api';
import { AdminService } from '../../core/services/admin.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page">
      <div class="page-header"><h1>Inventory</h1></div>
      <mat-card>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()">
            <mat-form-field class="full-width">
              <mat-label>Product</mat-label>
              <mat-select formControlName="productId" (selectionChange)="loadStock()">
                @for (product of products; track product.id) {
                  <mat-option [value]="product.id">{{ product.name }} - current {{ product.quantityInStock }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field class="full-width">
              <mat-label>Quantity</mat-label>
              <input matInput type="number" min="0" formControlName="quantity">
              <mat-error>Quantity must be zero or more</mat-error>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
              <mat-icon>save</mat-icon>
              Set stock
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </section>
  `
})
export class AdminInventoryComponent implements OnInit {
  products: ProductResponse[] = [];
  readonly form = this.fb.nonNullable.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [0, [Validators.required, Validators.min(0)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly catalog: CatalogService,
    private readonly admin: AdminService,
    private readonly errors: ApiErrorService
  ) {}

  ngOnInit(): void {
    this.catalog.products({ page: 0, size: 100, sort: 'name,asc' }).subscribe({
      next: (page) => {
        this.products = page.content;
        if (this.products[0]) {
          this.form.controls.productId.setValue(this.products[0].id);
          this.loadStock();
        }
      },
      error: (error) => this.errors.show(error)
    });
  }

  loadStock(): void {
    const productId = this.form.controls.productId.value;
    if (!productId) return;
    this.admin.getStock(productId).subscribe({
      next: (stock) => this.form.controls.quantity.setValue(stock.quantity),
      error: (error) => this.errors.show(error)
    });
  }

  save(): void {
    const { productId, quantity } = this.form.getRawValue();
    this.admin.setStock(productId, { quantity }).subscribe({
      next: () => this.ngOnInit(),
      error: (error) => {
        if (!this.errors.applyFormErrors(this.form, error)) this.errors.show(error);
      }
    });
  }
}
