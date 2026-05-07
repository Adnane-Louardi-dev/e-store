import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  styles: [`
    .admin-grid {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }
  `],
  template: `
    <section class="page">
      <div class="page-header">
        <h1>Admin</h1>
      </div>
      <div class="grid admin-grid">
        <mat-card>
          <mat-card-header><mat-icon mat-card-avatar>inventory_2</mat-icon><mat-card-title>Products</mat-card-title></mat-card-header>
          <mat-card-content><p class="muted">Create, update, and remove catalog items.</p></mat-card-content>
          <mat-card-actions><a mat-flat-button color="primary" routerLink="/admin/products">Manage products</a></mat-card-actions>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-icon mat-card-avatar>category</mat-icon><mat-card-title>Categories</mat-card-title></mat-card-header>
          <mat-card-content><p class="muted">Maintain category names and descriptions.</p></mat-card-content>
          <mat-card-actions><a mat-flat-button color="primary" routerLink="/admin/categories">Manage categories</a></mat-card-actions>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-icon mat-card-avatar>warehouse</mat-icon><mat-card-title>Inventory</mat-card-title></mat-card-header>
          <mat-card-content><p class="muted">Set absolute stock quantities for products.</p></mat-card-content>
          <mat-card-actions><a mat-flat-button color="primary" routerLink="/admin/inventory">Manage stock</a></mat-card-actions>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-icon mat-card-avatar>receipt_long</mat-icon><mat-card-title>Orders</mat-card-title></mat-card-header>
          <mat-card-content><p class="muted">View every customer order placed in the store.</p></mat-card-content>
          <mat-card-actions><a mat-flat-button color="primary" routerLink="/admin/orders">View orders</a></mat-card-actions>
        </mat-card>
      </div>
    </section>
  `
})
export class AdminDashboardComponent {}
