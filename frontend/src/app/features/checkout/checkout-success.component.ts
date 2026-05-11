import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { OrderResponse } from '../../core/models/api';
import { OrderService } from '../../core/services/order.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <section class="page">
      @if (!order) {
        <mat-card><div class="loading-state">Loading confirmation...</div></mat-card>
      } @else {
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">check_circle</mat-icon>
            <mat-card-title>Order confirmed</mat-card-title>
            <mat-card-subtitle>Order #{{ order.id }} placed {{ order.orderDate | date:'medium' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="order.items">
              <ng-container matColumnDef="product"><th mat-header-cell *matHeaderCellDef>Product</th><td mat-cell *matCellDef="let item">{{ item.productName }}</td></ng-container>
              <ng-container matColumnDef="quantity"><th mat-header-cell *matHeaderCellDef>Qty</th><td mat-cell *matCellDef="let item">{{ item.quantity }}</td></ng-container>
              <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let item">{{ item.lineTotal | currency }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
            <p class="price">Total: {{ order.totalAmount | currency }}</p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-flat-button color="primary" [routerLink]="['/orders', order.id]">View order</a>
            <a mat-button routerLink="/">Continue shopping</a>
          </mat-card-actions>
        </mat-card>
      }
    </section>
  `
})
export class CheckoutSuccessComponent implements OnInit {
  readonly columns = ['product', 'quantity', 'total'];
  order: OrderResponse | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orders: OrderService,
    private readonly errors: ApiErrorService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('orderId'));
    this.orders.get(id).subscribe({
      next: (order) => (this.order = order),
      error: (error) => this.errors.show(error)
    });
  }
}
