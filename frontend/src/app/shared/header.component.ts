import { Component, OnInit, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../core/services/auth.service';
import { CartService } from '../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatBadgeModule, MatButtonModule, MatIconModule, MatToolbarModule],
  styles: [`
    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      padding-inline: max(16px, calc((100vw - 1180px) / 2));
      background: #ffffff;
      color: #1c2635;
      border-bottom: 1px solid #e4e8f0;
    }

    .brand {
      font-weight: 800;
      font-size: 20px;
      letter-spacing: 0;
      margin-right: 18px;
    }

    nav {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .active {
      background: #eef3ff;
    }

    @media (max-width: 760px) {
      mat-toolbar {
        height: auto;
        align-items: flex-start;
        padding: 10px;
        flex-wrap: wrap;
      }

      nav {
        width: 100%;
        overflow-x: auto;
        padding-top: 8px;
      }
    }
  `],
  template: `
    <mat-toolbar>
      <a class="brand" routerLink="/">E-Store</a>
      <nav>
        <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <mat-icon>storefront</mat-icon>
          Catalog
        </a>
        @if (auth.isLoggedIn()) {
          <a mat-button [routerLink]="ordersLink()" routerLinkActive="active">
            <mat-icon>receipt_long</mat-icon>
            Orders
          </a>
          <a mat-button routerLink="/profile" routerLinkActive="active">
            <mat-icon>person</mat-icon>
            Profile
          </a>
          @if (auth.isAdmin()) {
            <a mat-button routerLink="/admin" routerLinkActive="active">
              <mat-icon>admin_panel_settings</mat-icon>
              Admin
            </a>
          }
        }
      </nav>
      <span class="spacer"></span>
      @if (auth.isLoggedIn()) {
        <a
          mat-icon-button
          routerLink="/cart"
          aria-label="Open cart"
          [matBadge]="cartCount()"
          [matBadgeHidden]="cartCount() === 0"
          matBadgeColor="accent">
          <mat-icon>shopping_cart</mat-icon>
        </a>
        <button mat-button type="button" (click)="logout()">
          <mat-icon>logout</mat-icon>
          Logout
        </button>
      } @else {
        <a mat-button routerLink="/login">
          <mat-icon>login</mat-icon>
          Login
        </a>
        <a mat-flat-button color="primary" routerLink="/register">Register</a>
      }
    </mat-toolbar>
  `
})
export class HeaderComponent implements OnInit {
  readonly cartCount = computed(() => this.cart.cart()?.itemCount ?? 0);
  readonly ordersLink = computed(() => this.auth.isAdmin() ? '/admin/orders' : '/orders');

  constructor(
    readonly auth: AuthService,
    readonly cart: CartService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.getToken()) {
      this.cart.load().subscribe({ error: () => this.cart.reset() });
    }
  }

  logout(): void {
    this.cart.reset();
    this.auth.logout(false);
    void this.router.navigate(['/']);
  }
}
