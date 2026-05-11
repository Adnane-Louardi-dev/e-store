# E-Store Backend

Spring Boot backend for the **E-Store** mini-project (Full Stack module, S6, FSBM — Université Hassan II de Casablanca, Pr. Omar Zahour).

Pairs with an Angular frontend developed in parallel.

## Stack

- Java 21, Spring Boot 3.3
- Spring Data JPA (H2 dev / MySQL prod profile)
- Spring Data MongoDB (product reviews)
- Spring Security + JWT
- springdoc-openapi (Swagger UI)

## Run

### Default — H2 file mode (no setup)

```bash
mvn spring-boot:run
```

H2 console: http://localhost:8080/h2-console (JDBC `jdbc:h2:file:./data/estore`).

### MySQL profile

Requires a local MySQL instance. The DB `estore` is auto-created on first run.

```bash
MYSQL_USER=root MYSQL_PASSWORD=root mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

### MongoDB

Required for the reviews module. Default URI `mongodb://localhost:27017/estore`.

## API

Once running:

- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## Project layout

```
com.estore
├── customer    User, Profile, Auth (JWT)
├── catalog     Category, Product
├── inventory   Inventory (1-1 Product)
├── shopping    Cart, CartItem
├── billing     Order, OrderItem
├── review      Review (Mongo document)
├── shared      BaseEntity, ApiError
├── config      Security, CORS, OpenAPI, JPA auditing
└── exception   GlobalExceptionHandler
```

## Status

- [x] Day 1 — skeleton, profiles, exception handler, OpenAPI
- [x] Day 2 — Customer + JWT auth (register, login, /users/me)
- [x] Day 3 — Catalog (Category + Product, paginated search, admin CRUD)
- [x] Day 4 — Inventory (separate entity, stock in product responses, batched fetch)
- [x] Day 5 — Shopping (cart with stock validation, snapshotted unit price)
- [x] Day 6 — Billing (orders, transactional checkout, stock decrement, history)
- [x] Day 7 — Reviews (Mongo, public read, authenticated write)
- [x] Day 8 — Seeder + Postman + handoff

## Seeded test users (DataSeeder)

On first start with an empty DB, the seeder creates:

| Role  | Email              | Password    |
|-------|--------------------|-------------|
| ADMIN | admin@estore.com   | admin123    |
| USER  | user@estore.com    | password123 |

Plus 3 categories (Books, Electronics, Clothing), 15 products with varied stock, and a few seed reviews (only if MongoDB is reachable). Skip seed by leaving any user in the DB.

## Endpoints

| Module     | Method | Path                              | Auth         |
|------------|--------|-----------------------------------|--------------|
| Auth       | POST   | /api/auth/register                | public       |
| Auth       | POST   | /api/auth/login                   | public       |
| Customer   | GET    | /api/users/me                     | bearer       |
| Customer   | PUT    | /api/users/me/profile             | bearer       |
| Catalog    | GET    | /api/categories[/{id}]            | public       |
| Catalog    | POST/PUT/DELETE | /api/categories[/{id}]   | ADMIN        |
| Catalog    | GET    | /api/products[/{id}]              | public       |
| Catalog    | POST/PUT/DELETE | /api/products[/{id}]     | ADMIN        |
| Inventory  | GET    | /api/inventory/product/{id}       | bearer       |
| Inventory  | PUT    | /api/inventory/product/{id}       | ADMIN        |
| Cart       | GET/POST/PUT/DELETE | /api/cart[/items[/{id}]] | bearer    |
| Orders     | POST   | /api/orders                       | bearer       |
| Orders     | GET    | /api/orders/user/me?page&size&sort| bearer       |
| Orders     | GET    | /api/orders/{id}                  | bearer       |
| Reviews    | POST   | /api/reviews                      | bearer       |
| Reviews    | GET    | /api/reviews/product/{id}         | public       |

Search products: `GET /api/products?q=keyword&categoryId=1&page=0&size=20&sort=name,asc` (sortable: `id`, `name`, `price`, `createdAt`).

## Quick curl walkthrough (for the frontend)

```bash
# 1. Login as the seeded user → grab the token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@estore.com","password":"password123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. List products
curl http://localhost:8080/api/products

# 3. Add to cart
curl -X POST http://localhost:8080/api/cart/items \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"productId":1,"quantity":2}'

# 4. Place order (checks stock, decrements, clears cart, all in one transaction)
curl -X POST http://localhost:8080/api/orders -H "Authorization: Bearer $TOKEN"

# 5. Order history
curl http://localhost:8080/api/orders/user/me -H "Authorization: Bearer $TOKEN"
```

## End-to-end smoke test

```bash
bash scripts/smoke-test.sh
```

Boots the jar, exercises auth/catalog/inventory/cart/orders, asserts ~28 expectations.

## Database scripts

- [scripts/schema.sql](scripts/schema.sql) — MySQL DDL mirroring the JPA entities. Hibernate's `ddl-auto: update` creates the schema automatically on first run; this file is provided so the schema can be inspected, version-controlled, or applied manually:

  ```bash
  mysql -u root -p < scripts/schema.sql
  ```

- MongoDB requires no DDL — collections are created on first insert. Connection URI is in [application.yml](src/main/resources/application.yml).

## CORS

Open to `http://localhost:4200` for the Angular dev server (configurable via `estore.cors.allowed-origins`).
