# E-Store Backend — Frontend Integration Guide

**Audience**: Yassine (Angular frontend)
**Backend**: Spring Boot 3.3.5 — `http://localhost:8080`
**Last updated**: 2026-04-27

This document is the single source of truth for the E-Store API. Everything you need to plug Angular into the backend is here: endpoints, request/response shapes, auth flow, error format, validation rules, dev setup, and gotchas.

---

## Table of contents

1. [Quick start](#1-quick-start)
2. [Authentication (JWT)](#2-authentication-jwt)
3. [Standard response shapes](#3-standard-response-shapes)
4. [Error format](#4-error-format)
5. [Pagination](#5-pagination)
6. [Endpoint reference](#6-endpoint-reference)
   - [6.1 Auth](#61-auth)
   - [6.2 Users](#62-users)
   - [6.3 Categories](#63-categories)
   - [6.4 Products](#64-products)
   - [6.5 Inventory](#65-inventory)
   - [6.6 Cart](#66-cart)
   - [6.7 Orders](#67-orders)
   - [6.8 Reviews](#68-reviews)
7. [DTO reference (TypeScript types)](#7-dto-reference-typescript-types)
8. [Validation rules](#8-validation-rules)
9. [End-to-end user journey](#9-end-to-end-user-journey)
10. [Angular setup tips](#10-angular-setup-tips)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Quick start

```bash
# From the backend project root:
mvn spring-boot:run
```

The backend boots on port 8080. On first start with an empty DB, a seeder creates:

| Role  | Email              | Password    |
|-------|--------------------|-------------|
| ADMIN | admin@estore.com   | admin123    |
| USER  | user@estore.com    | password123 |

Plus 3 categories (Books, Electronics, Clothing) and 15 products with varied stock.

**Useful URLs:**
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs
- H2 Console: http://localhost:8080/h2-console (JDBC: `jdbc:h2:file:./data/estore`, user: `sa`, no password)

**CORS** is open to `http://localhost:4200` (Angular dev server) by default. If you serve from a different port, ask me to update `estore.cors.allowed-origins` in `application.yml`.

---

## 2. Authentication (JWT)

### Flow

1. **Register** (`POST /api/auth/register`) or **login** (`POST /api/auth/login`) → returns a JWT in the response body.
2. Store the token (e.g., `localStorage`) and the basic user info from the response.
3. For every protected request, send the token as `Authorization: Bearer <token>`.
4. Token expires in 24 hours (`expiresAt` is in the response). When you get `401`, redirect to login.

### Public endpoints (no token needed)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`, `GET /api/products/{id}`
- `GET /api/categories`, `GET /api/categories/{id}`
- `GET /api/reviews/product/{productId}`
- Swagger / OpenAPI

Everything else needs a Bearer token.

### Admin-only endpoints

Endpoints marked **ADMIN** require a token whose user has `role: "ADMIN"`. A normal user calling them gets `403 Forbidden`.

The seeded admin (`admin@estore.com / admin123`) is the easiest way to test admin flows.

### Login response shape

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "userId": 2,
  "email": "user@estore.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "expiresAt": "2026-04-28T03:42:11.123456Z"
}
```

---

## 3. Standard response shapes

- **Success** — JSON object matching the DTO described per-endpoint below.
- **List with pagination** — wrapped in `PageResponse<T>` (see [§5](#5-pagination)).
- **Empty success** (e.g., DELETE) — `204 No Content`, empty body.
- **Error** — JSON `ApiError` (see [§4](#4-error-format)).

All timestamps are ISO-8601 UTC strings (`2026-04-27T14:23:11.123456Z`).
All money amounts are JSON numbers with 2 decimal places (e.g., `29.90`).

---

## 4. Error format

Every non-2xx response returns a JSON body with this exact shape:

```json
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Insufficient stock for product 5 (requested 10, available 3)",
  "path": "/api/cart/items",
  "timestamp": "2026-04-27T14:23:11.123456Z",
  "errors": [
    { "field": "email", "message": "must be a well-formed email address" }
  ]
}
```

`errors[]` is only populated for `400 Validation failed` responses. Empty array otherwise.

### Status code conventions

| Code | When | Frontend should… |
|------|------|------------------|
| `400 Bad Request` | Validation failed (`@NotBlank`, `@Email`, etc.) | Show field-specific errors from `errors[]` |
| `401 Unauthorized` | Missing/invalid/expired JWT | Redirect to login, clear stored token |
| `403 Forbidden` | Logged in but lacks permission (e.g., USER hitting admin endpoint) | Show "Access denied" toast |
| `404 Not Found` | Resource doesn't exist (e.g., `/api/products/99999`) | Show "Not found" page or toast |
| `422 Unprocessable Entity` | Business rule violated (insufficient stock, empty cart, duplicate name) | Show `message` to the user |
| `500 Internal Server Error` | Bug — please report | Generic "Something went wrong" toast |

---

## 5. Pagination

Endpoints that return lists use Spring's pagination. Pass `page`, `size`, and `sort` as query params:

```
GET /api/products?page=0&size=20&sort=price,asc
```

- `page` — 0-indexed (default `0`)
- `size` — items per page (default `20`)
- `sort` — `field,direction` where direction is `asc` or `desc`. Repeat for multi-sort: `sort=price,desc&sort=name,asc`

### `PageResponse<T>` shape

```json
{
  "content": [ /* array of T */ ],
  "page": 0,
  "size": 20,
  "totalElements": 47,
  "totalPages": 3,
  "last": false
}
```

### Sortable fields per endpoint

| Endpoint | Sortable fields |
|----------|-----------------|
| `GET /api/products` | `id`, `name`, `price`, `createdAt` |
| `GET /api/orders/user/me` | `id`, `orderDate`, `totalAmount`, `status` |
| `GET /api/reviews/product/{productId}` | `createdAt`, `rating` |

Unknown sort fields are silently ignored (you won't get an error, but the result falls back to a default sort).

---

## 6. Endpoint reference

For every endpoint:
- **Auth** — `public`, `bearer` (any logged-in user), or `ADMIN`
- **Request body** — JSON matching the request DTO (or empty for GET/DELETE)
- **Response body** — JSON matching the response DTO
- **Errors** — typical non-2xx cases

### 6.1 Auth

#### `POST /api/auth/register` — public

Create an account. Returns a JWT immediately (no separate login needed).

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (`201 Created`):** `AuthResponse` (see §2)

**Errors:**
- `400` — validation (firstName 2-50 chars, lastName 2-50, valid email, password 8-100)
- `422` — email already exists

#### `POST /api/auth/login` — public

**Request:**
```json
{
  "email": "user@estore.com",
  "password": "password123"
}
```

**Response (`200 OK`):** `AuthResponse`

**Errors:**
- `401` — wrong credentials
- `400` — empty fields / invalid email format

---

### 6.2 Users

#### `GET /api/users/me` — bearer

Returns the currently authenticated user with their profile.

**Response:** `UserResponse`
```json
{
  "id": 2,
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@estore.com",
  "role": "USER",
  "profile": {
    "id": 2,
    "phone": "+212600000000",
    "address": "Bd Anfa",
    "city": "Casablanca",
    "country": "Morocco"
  }
}
```

`profile` may be `null` if the user has just registered and never set their profile.

#### `PUT /api/users/me/profile` — bearer

Update the current user's profile. All fields optional — only sent fields are updated.

**Request:**
```json
{
  "phone": "+212600000000",
  "address": "Bd Anfa",
  "city": "Casablanca",
  "country": "Morocco"
}
```

**Response:** `UserResponse` (with updated profile)

---

### 6.3 Categories

#### `GET /api/categories` — public

Returns all categories (not paginated — there are few).

**Response:** `CategoryResponse[]`
```json
[
  { "id": 1, "name": "Books", "description": "Books, ebooks, and reading material" },
  { "id": 2, "name": "Electronics", "description": "Phones, laptops, accessories" }
]
```

#### `GET /api/categories/{id}` — public

**Response:** `CategoryResponse` or `404`

#### `POST /api/categories` — ADMIN

**Request:**
```json
{ "name": "Toys", "description": "Playthings" }
```

**Response (`201 Created`):** `CategoryResponse`

**Errors:** `422` if name already exists, `400` for validation.

#### `PUT /api/categories/{id}` — ADMIN

Same body as POST. **Response:** `CategoryResponse`.

#### `DELETE /api/categories/{id}` — ADMIN

**Response:** `204 No Content`. **Errors:** `422` if the category still has products attached.

---

### 6.4 Products

#### `GET /api/products` — public

**Query params:**
- `q` — keyword (matches product name, case-insensitive partial)
- `categoryId` — filter by category
- `page`, `size`, `sort` — pagination (see §5)

Examples:
```
GET /api/products
GET /api/products?q=clean
GET /api/products?categoryId=2&sort=price,asc
GET /api/products?q=shirt&categoryId=3&page=0&size=10
```

**Response:** `PageResponse<ProductResponse>`

#### `GET /api/products/{id}` — public

**Response:** `ProductResponse`
```json
{
  "id": 1,
  "name": "Clean Code",
  "description": "A handbook of agile software craftsmanship",
  "price": 29.90,
  "imageUrl": "https://placehold.co/600x400?text=Clean+Code",
  "category": { "id": 1, "name": "Books", "description": "..." },
  "quantityInStock": 25
}
```

> **Note for Yassine**: `quantityInStock` is computed live from the inventory table — you can rely on it for "Out of stock" / "Low stock" badges without a separate inventory call.

#### `POST /api/products` — ADMIN

**Request:**
```json
{
  "name": "New Product",
  "description": "...",
  "price": 19.99,
  "imageUrl": "https://...",
  "categoryId": 1
}
```

**Response (`201 Created`):** `ProductResponse` (with `quantityInStock: 0` — set stock separately via inventory endpoint).

#### `PUT /api/products/{id}` — ADMIN

Same body as POST. **Response:** `ProductResponse`.

#### `DELETE /api/products/{id}` — ADMIN

**Response:** `204 No Content`.

---

### 6.5 Inventory

#### `GET /api/inventory/product/{productId}` — bearer

**Response:** `InventoryResponse`
```json
{ "productId": 1, "productName": "Clean Code", "quantity": 25 }
```

> **Note**: usually you don't need this — `ProductResponse.quantityInStock` already gives you the value. Use this endpoint only for an admin "manage stock" screen.

#### `PUT /api/inventory/product/{productId}` — ADMIN

Set absolute stock value.

**Request:**
```json
{ "quantity": 50 }
```

**Response:** `InventoryResponse`.

---

### 6.6 Cart

The cart belongs to the logged-in user (derived from the JWT, not from the URL). Each user has exactly one cart.

#### `GET /api/cart` — bearer

Returns the current user's cart. Auto-creates an empty cart if none exists.

**Response:** `CartResponse`
```json
{
  "id": 5,
  "userId": 2,
  "items": [
    {
      "id": 12,
      "productId": 1,
      "productName": "Clean Code",
      "productImageUrl": "https://...",
      "quantity": 2,
      "unitPrice": 29.90,
      "lineTotal": 59.80
    }
  ],
  "itemCount": 2,
  "total": 59.80
}
```

> `unitPrice` is **frozen at the moment the item was added**. If the catalog price changes later, the cart still shows the original. This is intentional.

#### `POST /api/cart/items` — bearer

Add a product, or merge into an existing line if the product is already in the cart.

**Request:**
```json
{ "productId": 1, "quantity": 2 }
```

**Response:** updated `CartResponse`.

**Errors:** `422` if requested quantity > stock available; `404` if productId doesn't exist.

#### `PUT /api/cart/items/{itemId}` — bearer

Set absolute quantity for a cart line. `itemId` is `CartItemResponse.id`, **not** the product id.

**Request:**
```json
{ "quantity": 3 }
```

**Response:** updated `CartResponse`. `422` if exceeds stock.

#### `DELETE /api/cart/items/{itemId}` — bearer

Remove a single line. **Response:** updated `CartResponse`.

#### `DELETE /api/cart` — bearer

Clear all items. **Response:** updated (empty) `CartResponse`.

---

### 6.7 Orders

#### `POST /api/orders` — bearer

Validate the cart and place an order. This is **transactional**:
1. Cart must be non-empty.
2. For each item, stock is decremented.
3. Order + OrderItems are persisted with snapshotted name + price.
4. Cart is cleared.

If anything fails (e.g., stock insufficient), nothing is committed.

**Request body:** none (cart contents are used).

**Response (`201 Created`):** `OrderResponse`
```json
{
  "id": 7,
  "userId": 2,
  "orderDate": "2026-04-27T14:23:11.123Z",
  "status": "CONFIRMED",
  "totalAmount": 59.80,
  "items": [
    {
      "id": 14,
      "productId": 1,
      "productName": "Clean Code",
      "quantity": 2,
      "unitPrice": 29.90,
      "lineTotal": 59.80
    }
  ]
}
```

**Errors:**
- `422` — empty cart, or insufficient stock on any line

#### `GET /api/orders/user/me` — bearer

Paginated list of the current user's orders, most recent first by default.

**Query params:** `page`, `size`, `sort` (sortable: `id`, `orderDate`, `totalAmount`, `status`).

**Response:** `PageResponse<OrderResponse>`.

#### `GET /api/orders/{id}` — bearer

Single order. The caller must own the order, otherwise `422` (or admin can read any).

**Response:** `OrderResponse`.

---

### 6.8 Reviews (MongoDB)

#### `POST /api/reviews` — bearer

Post a product review. The author name is taken from the JWT (firstName + lastName).

**Request:**
```json
{
  "productId": 1,
  "rating": 5,
  "comment": "A must-read for every developer."
}
```

**Response (`201 Created`):** `ReviewResponse`
```json
{
  "id": "65ffb12d4a5b6c7d8e9f0a1b",
  "productId": 1,
  "userId": 2,
  "authorName": "John Doe",
  "rating": 5,
  "comment": "A must-read for every developer.",
  "createdAt": "2026-04-27T14:25:33.123Z"
}
```

**Errors:** `400` if rating not 1–5, `404` if product doesn't exist.

#### `GET /api/reviews/product/{productId}` — public

Paginated reviews for a product, most recent first.

**Query params:** `page`, `size`, `sort` (sortable: `createdAt`, `rating`).

**Response:** `PageResponse<ReviewResponse>`.

> **Note:** review `id` is a Mongo ObjectId (24-char hex string), not a number.

---

## 7. DTO reference (TypeScript types)

Drop these into `src/app/core/models/api.ts` as the canonical TypeScript shapes.

```typescript
// ============================================================ Standard wrappers

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string; // ISO-8601
  errors: FieldViolation[];
}

export interface FieldViolation {
  field: string;
  message: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ============================================================ Auth / Customer

export type Role = 'USER' | 'ADMIN';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: 'Bearer';
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  expiresAt: string; // ISO-8601
}

export interface ProfileResponse {
  id: number;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
}

export interface UpdateProfileRequest {
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  profile: ProfileResponse | null;
}

// ============================================================ Catalog

export interface CategoryRequest {
  name: string;
  description?: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
}

export interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: CategoryResponse;
  quantityInStock: number;
}

// ============================================================ Inventory

export interface AdjustStockRequest {
  quantity: number;
}

export interface InventoryResponse {
  productId: number;
  productName: string;
  quantity: number;
}

// ============================================================ Shopping (Cart)

export interface AddCartItemRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItemResponse {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartResponse {
  id: number;
  userId: number;
  items: CartItemResponse[];
  itemCount: number;
  total: number;
}

// ============================================================ Billing (Orders)

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderResponse {
  id: number;
  userId: number;
  orderDate: string; // ISO-8601
  status: OrderStatus;
  totalAmount: number;
  items: OrderItemResponse[];
}

// ============================================================ Reviews (Mongo)

export interface ReviewRequest {
  productId: number;
  rating: number; // 1-5
  comment?: string;
}

export interface ReviewResponse {
  id: string; // Mongo ObjectId
  productId: number;
  userId: number;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string; // ISO-8601
}
```

---

## 8. Validation rules

These are enforced server-side. Match them client-side to give immediate feedback.

| DTO | Field | Rule |
|-----|-------|------|
| `RegisterRequest` | `firstName` | required, 2–50 chars |
| `RegisterRequest` | `lastName` | required, 2–50 chars |
| `RegisterRequest` | `email` | required, valid email |
| `RegisterRequest` | `password` | required, 8–100 chars |
| `LoginRequest` | `email` | required, valid email |
| `LoginRequest` | `password` | required |
| `UpdateProfileRequest` | `phone` | optional, max 30 |
| `UpdateProfileRequest` | `address` | optional, max 200 |
| `UpdateProfileRequest` | `city` | optional, max 80 |
| `UpdateProfileRequest` | `country` | optional, max 80 |
| `CategoryRequest` | `name` | required, max 80 |
| `CategoryRequest` | `description` | optional, max 500 |
| `ProductRequest` | `name` | required, max 150 |
| `ProductRequest` | `description` | optional, max 2000 |
| `ProductRequest` | `price` | required, ≥ 0 |
| `ProductRequest` | `imageUrl` | optional, max 500 |
| `ProductRequest` | `categoryId` | required |
| `AdjustStockRequest` | `quantity` | required, ≥ 0 |
| `AddCartItemRequest` | `productId` | required |
| `AddCartItemRequest` | `quantity` | required, > 0 |
| `UpdateCartItemRequest` | `quantity` | required, > 0 |
| `ReviewRequest` | `productId` | required |
| `ReviewRequest` | `rating` | required, 1–5 |
| `ReviewRequest` | `comment` | optional, max 2000 |

---

## 9. End-to-end user journey

A typical e-commerce flow, with the corresponding API calls:

| Step | Frontend action | API call |
|------|-----------------|----------|
| 1 | User opens site | `GET /api/products?page=0&size=20` |
| 2 | User clicks a category filter | `GET /api/categories` (load filter options once), then `GET /api/products?categoryId=2` |
| 3 | User searches "laptop" | `GET /api/products?q=laptop` |
| 4 | User clicks a product | `GET /api/products/{id}` + `GET /api/reviews/product/{id}` |
| 5 | User clicks "Add to cart" (not logged in) | Redirect to login page |
| 6 | User logs in | `POST /api/auth/login` → store token |
| 7 | User adds product | `POST /api/cart/items { productId, quantity: 1 }` → update cart badge |
| 8 | User opens cart | `GET /api/cart` |
| 9 | User changes quantity | `PUT /api/cart/items/{itemId} { quantity: 3 }` |
| 10 | User removes a line | `DELETE /api/cart/items/{itemId}` |
| 11 | User clicks checkout | `POST /api/orders` (no body) → on 201, navigate to confirmation page |
| 12 | User views order history | `GET /api/orders/user/me?sort=orderDate,desc` |
| 13 | User views one order | `GET /api/orders/{id}` |
| 14 | User posts a review | `POST /api/reviews { productId, rating, comment }` |

---

## 10. Angular setup tips

### Environment file

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api'
};
```

### HTTP interceptor for JWT

```typescript
// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

Register in `app.config.ts`:
```typescript
provideHttpClient(withInterceptors([authInterceptor]))
```

### 401 redirect interceptor

```typescript
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
```

### Auth service skeleton

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, req).pipe(
      tap(res => this.storeAuth(res))
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, req).pipe(
      tap(res => this.storeAuth(res))
    );
  }

  logout() {
    localStorage.removeItem('estore.auth');
  }

  getToken(): string | null {
    const auth = this.getAuth();
    return auth?.token ?? null;
  }

  isAdmin(): boolean {
    return this.getAuth()?.role === 'ADMIN';
  }

  private storeAuth(auth: AuthResponse) {
    localStorage.setItem('estore.auth', JSON.stringify(auth));
  }

  private getAuth(): AuthResponse | null {
    const raw = localStorage.getItem('estore.auth');
    return raw ? JSON.parse(raw) : null;
  }
}
```

### Route guards

```typescript
export const authGuard: CanActivateFn = () =>
  inject(AuthService).getToken() ? true : inject(Router).parseUrl('/login');

export const adminGuard: CanActivateFn = () =>
  inject(AuthService).isAdmin() ? true : inject(Router).parseUrl('/');
```

### Recommended folder structure (matches the cahier des charges Annexe B)

```
src/app/
├── core/
│   ├── interceptors/   auth.interceptor.ts, unauthorized.interceptor.ts
│   ├── services/       auth.service.ts, ...
│   ├── models/         api.ts (the TypeScript types from §7)
│   └── guards/         auth.guard.ts, admin.guard.ts
├── shared/             reusable components (button, card, page-header, ...)
├── features/
│   ├── auth/           login.component.ts, register.component.ts
│   ├── catalog/        product-list.component.ts, product-detail.component.ts
│   ├── cart/           cart.component.ts
│   ├── orders/         orders.component.ts, order-detail.component.ts
│   └── profile/        profile.component.ts
└── app.routes.ts
```

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| CORS error in browser console | Backend started before Angular dev server changed port | Update `estore.cors.allowed-origins` in `application.yml`, restart backend |
| `401` even with token | Token expired (24h lifetime) | Re-login |
| `403` on a normal endpoint | Endpoint requires ADMIN role | Login as `admin@estore.com / admin123` |
| Reviews endpoint returns 500 | MongoDB not running | Start `mongod` (required only for `/api/reviews/**`) |
| `quantityInStock: 0` everywhere | Inventory not seeded | Backend was started without seeder; restart with `estore.seed-on-startup=true` (the default) |
| Cart items keep their old price after I update the product | Intentional — `unitPrice` is snapshotted at add time | Tell user to remove and re-add to refresh |

### Manual smoke test from PowerShell

```powershell
$body = @{ email = "user@estore.com"; password = "password123" } | ConvertTo-Json
$response = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/auth/login `
  -ContentType "application/json" -Body $body
$token = $response.token
Invoke-RestMethod -Uri http://localhost:8080/api/cart -Headers @{ Authorization = "Bearer $token" }
```

### Postman collection

A complete Postman collection with auto-token-capture is at [docs/E-Store.postman_collection.json](E-Store.postman_collection.json). Import it into Postman, run "Login (seeded user)" first, then any other request will have the JWT injected automatically.

---

**Questions? Bug? Missing endpoint?** Ping Adnane (backend).
