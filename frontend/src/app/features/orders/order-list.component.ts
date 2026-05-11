import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { OrderResponse, PageResponse } from '../../core/models/api';
import { OrderService } from '../../core/services/order.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatPaginatorModule, MatTableModule],
  template: `
    <section class="page">
      <div class="page-header"><h1>Orders</h1></div>
      @if (!page) {
        <mat-card><div class="loading-state">Loading orders...</div></mat-card>
      } @else if (!page.content.length) {
        <mat-card><div class="empty-state">No orders yet.</div></mat-card>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="page.content">
            <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>Order</th><td mat-cell *matCellDef="let order">#{{ order.id }}</td></ng-container>
            <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let order">{{ order.orderDate | date:'medium' }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let order"><mat-chip highlighted>{{ order.status }}</mat-chip></td></ng-container>
            <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let order">{{ order.totalAmount | currency }}</td></ng-container>
            <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let order"><a mat-button [routerLink]="['/orders', order.id]">Open</a></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <mat-paginator [length]="page.totalElements" [pageIndex]="page.page" [pageSize]="page.size" (page)="pageChanged($event)" />
        </mat-card>
      }
    </section>
  `
})
export class OrderListComponent implements OnInit {
  readonly columns = ['id', 'date', 'status', 'total', 'actions'];
  page: PageResponse<OrderResponse> | null = null;

  constructor(private readonly orders: OrderService, private readonly errors: ApiErrorService) {}

  ngOnInit(): void {
    this.load(0);
  }

  load(page: number, size = this.page?.size ?? 20): void {
    this.orders.mine(page, size).subscribe({
      next: (result) => (this.page = result),
      error: (error) => this.errors.show(error)
    });
  }

  pageChanged(event: PageEvent): void {
    this.load(event.pageIndex, event.pageSize);
  }
}
