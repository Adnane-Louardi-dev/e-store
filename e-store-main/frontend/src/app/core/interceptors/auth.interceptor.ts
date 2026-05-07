import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPublicRequest(req.method, req.url)) {
    return next(req);
  }
  const token = inject(AuthService).getToken();
  if (!token) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

function isPublicRequest(method: string, url: string): boolean {
  if (method === 'POST' && (url.includes('/auth/login') || url.includes('/auth/register'))) {
    return true;
  }

  if (method !== 'GET') {
    return false;
  }

  return url.includes('/api/products')
    || url.includes('/api/categories')
    || url.includes('/api/reviews/product/');
}
