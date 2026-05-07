import { Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { CartResponse } from '../../core/models/api';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatTableModule],
  styles: [`
    .cart-image {
      width: 64px;
      height: 48px;
      object-fit: cover;
      border-radius: 6px;
      background: #edf0f5;
    }

    input[type="number"] {
      width: 76px;
    }

    .summary {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 18px;
      margin-top: 18px;
    }
  `],
  template: `
    <section class="page">
      <div class="page-header">
        <h1>Your cart</h1>
        <button mat-button color="warn" type="button" (click)="clear()" [disabled]="!cart?.items?.length">
          <mat-icon>delete_sweep</mat-icon>
          Clear
        </button>
      </div>

      @if (!cart) {
        <mat-card><div class="loading-state">Loading cart...</div></mat-card>
      } @else if (!cart.items.length) {
        <mat-card>
          <div class="empty-state">
            <p>Your cart is empty.</p>
            <a mat-flat-button color="primary" routerLink="/">Browse products</a>
          </div>
        </mat-card>
      } @else {
        <mat-card>
          <mat-card-content>
            <table mat-table [dataSource]="cart.items">
              <ng-container matColumnDef="image">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let item">
                  <img class="cart-image" [src]="item.productImageUrl || fallbackImage(item.productName)" [alt]="item.productName">
                </td>
              </ng-container>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Product</th>
                <td mat-cell *matCellDef="let item">{{ item.productName }}</td>
              </ng-container>
              <ng-container matColumnDef="unitPrice">
                <th mat-header-cell *matHeaderCellDef>Unit</th>
                <td mat-cell *matCellDef="let item">{{ item.unitPrice | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Qty</th>
                <td mat-cell *matCellDef="let item">
                  <input matInput type="number" min="1" [value]="item.quantity" (change)="update(item.id, $any($event.target).value)">
                </td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let item">{{ item.lineTotal | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let item">
                  <button mat-icon-button color="warn" type="button" (click)="remove(item.id)" aria-label="Remove item">
                    <mat-icon>close</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
            <div class="summary">
              <strong class="price">{{ cart.total | currency }}</strong>
              <button mat-flat-button color="primary" type="button" (click)="checkout()">
                <mat-icon>payment</mat-icon>
                Checkout
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </section>
  `
})
export class CartComponent implements OnInit {
  readonly columns = ['image', 'name', 'unitPrice', 'quantity', 'total', 'actions'];
  cart: CartResponse | null = null;

  constructor(
    private readonly cartApi: CartService,
    private readonly orders: OrderService,
    private readonly errors: ApiErrorService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.cartApi.load().subscribe({
      next: (cart) => (this.cart = cart),
      error: (error) => this.errors.show(error)
    });
  }

  update(itemId: number, rawQuantity: string): void {
    const quantity = Math.max(1, Number(rawQuantity) || 1);
    this.cartApi.update(itemId, { quantity }).subscribe({
      next: (cart) => (this.cart = cart),
      error: (error) => this.errors.show(error)
    });
  }

  remove(itemId: number): void {
    this.cartApi.remove(itemId).subscribe({
      next: (cart) => (this.cart = cart),
      error: (error) => this.errors.show(error)
    });
  }

  clear(): void {
    this.cartApi.clear().subscribe({
      next: (cart) => (this.cart = cart),
      error: (error) => this.errors.show(error)
    });
  }

  checkout(): void {
    this.orders.place().subscribe({
      next: (order) => {
        this.cartApi.reset();
        void this.router.navigate(['/checkout/success', order.id]);
      },
      error: (error) => this.errors.show(error)
    });
  }

  fallbackImage(name: string): string {
    return `https://placehold.co/160x120?text=${encodeURIComponent(name)}`;
  }
}
