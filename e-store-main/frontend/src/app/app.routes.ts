import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/catalog/product-list.component').then((m) => m.ProductListComponent)
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./features/catalog/product-detail.component').then((m) => m.ProductDetailComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./features/cart/cart.component').then((m) => m.CartComponent)
  },
  {
    path: 'checkout/success/:orderId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout-success.component').then((m) => m.CheckoutSuccessComponent)
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/order-list.component').then((m) => m.OrderListComponent)
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/order-detail.component').then((m) => m.OrderDetailComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/admin/admin-products.component').then((m) => m.AdminProductsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/admin-categories.component').then((m) => m.AdminCategoriesComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/admin/admin-inventory.component').then((m) => m.AdminInventoryComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/admin-orders.component').then((m) => m.AdminOrdersComponent)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found.component').then((m) => m.NotFoundComponent)
  }
];
