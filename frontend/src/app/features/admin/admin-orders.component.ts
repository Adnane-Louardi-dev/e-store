import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { OrderResponse, PageResponse } from '../../core/models/api';
import { ApiErrorService } from '../../core/services/api-error.service';
import { OrderService } from '../../core/services/order.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatPaginatorModule, MatTableModule],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>All orders</h1>
          <p class="muted">Admin view of every customer order.</p>
        </div>
      </div>

      @if (loading) {
        <mat-card><div class="loading-state">Loading orders...</div></mat-card>
      } @else if (errorMessage) {
        <mat-card>
          <div class="error-state">
            <p>{{ errorMessage }}</p>
            <button mat-flat-button color="primary" type="button" (click)="load(page?.page ?? 0)">Retry</button>
          </div>
        </mat-card>
      } @else if (!page?.content?.length) {
        <mat-card><div class="empty-state">No orders have been placed yet.</div></mat-card>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="page!.content">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>Order</th>
              <td mat-cell *matCellDef="let order">#{{ order.id }}</td>
            </ng-container>
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef>User</th>
              <td mat-cell *matCellDef="let order">#{{ order.userId }}</td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let order">{{ order.orderDate | date:'medium' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let order"><mat-chip highlighted>{{ order.status }}</mat-chip></td>
            </ng-container>
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let order">{{ order.totalAmount | currency }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let order"><a mat-button [routerLink]="['/orders', order.id]">Open</a></td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <mat-paginator
            [length]="page!.totalElements"
            [pageIndex]="page!.page"
            [pageSize]="page!.size"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="pageChanged($event)" />
        </mat-card>
      }
    </section>
  `
})
export class AdminOrdersComponent implements OnInit {
  readonly columns = ['id', 'user', 'date', 'status', 'total', 'actions'];
  page: PageResponse<OrderResponse> | null = null;
  loading = false;
  errorMessage = '';

  constructor(private readonly orders: OrderService, private readonly errors: ApiErrorService) {}

  ngOnInit(): void {
    this.load(0);
  }

  load(page: number, size = this.page?.size ?? 20): void {
    this.loading = true;
    this.errorMessage = '';
    this.orders.all(page, size).subscribe({
      next: (result) => {
        this.page = result;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.errors.message(error);
        this.errors.show(error);
      }
    });
  }

  pageChanged(event: PageEvent): void {
    this.load(event.pageIndex, event.pageSize);
  }
}
