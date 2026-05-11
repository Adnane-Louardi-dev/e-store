import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { OrderResponse } from '../../core/models/api';
import { OrderService } from '../../core/services/order.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, MatInputModule, MatTableModule],
  styles: [`
    .quantity-input {
      width: 82px;
    }
  `],
  template: `
    <section class="page">
      @if (!order) {
        <mat-card><div class="loading-state">Loading order...</div></mat-card>
      } @else {
        <div class="page-header">
          <div>
            <h1>Order #{{ order.id }}</h1>
            <p class="muted">{{ order.orderDate | date:'medium' }}</p>
          </div>
          <mat-chip highlighted>{{ order.status }}</mat-chip>
        </div>
        <mat-card>
          <table mat-table [dataSource]="order.items">
            <ng-container matColumnDef="product"><th mat-header-cell *matHeaderCellDef>Product</th><td mat-cell *matCellDef="let item">{{ item.productName }}</td></ng-container>
            <ng-container matColumnDef="price"><th mat-header-cell *matHeaderCellDef>Unit</th><td mat-cell *matCellDef="let item">{{ item.unitPrice | currency }}</td></ng-container>
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Qty</th>
              <td mat-cell *matCellDef="let item">
                @if (canEdit()) {
                  <input class="quantity-input" matInput type="number" min="1" [value]="item.quantity" #qty>
                  <button mat-button type="button" (click)="updateItem(item.id, qty.value)">
                    <mat-icon>save</mat-icon>
                    Update
                  </button>
                } @else {
                  {{ item.quantity }}
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let item">{{ item.lineTotal | currency }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <mat-card-actions>
            <strong class="price">Total: {{ order.totalAmount | currency }}</strong>
            <span class="spacer"></span>
            @if (canEdit()) {
              <button mat-button color="warn" type="button" (click)="cancelOrder()">
                <mat-icon>cancel</mat-icon>
                Cancel order
              </button>
            }
            <a mat-button [routerLink]="auth.isAdmin() ? '/admin/orders' : '/orders'">Back to orders</a>
          </mat-card-actions>
        </mat-card>
      }
    </section>
  `
})
export class OrderDetailComponent implements OnInit {
  readonly columns = ['product', 'price', 'quantity', 'total'];
  order: OrderResponse | null = null;

  constructor(
    readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly orders: OrderService,
    private readonly errors: ApiErrorService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.orders.get(id).subscribe({
      next: (order) => (this.order = order),
      error: (error) => this.errors.show(error)
    });
  }

  canEdit(): boolean {
    return this.order?.status !== 'CANCELLED';
  }

  updateItem(itemId: number, rawQuantity: string): void {
    if (!this.order) return;
    const quantity = Number(rawQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      this.errors.success('Quantity must be greater than zero.');
      return;
    }

    this.orders.updateItem(this.order.id, itemId, { quantity }).subscribe({
      next: (order) => {
        this.order = order;
        this.errors.success('Order updated.');
      },
      error: (error) => this.errors.show(error)
    });
  }

  cancelOrder(): void {
    if (!this.order) return;
    this.orders.cancel(this.order.id).subscribe({
      next: (order) => {
        this.order = order;
        this.errors.success('Order cancelled.');
      },
      error: (error) => this.errors.show(error)
    });
  }
}
