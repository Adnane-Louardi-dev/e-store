# E-Store Frontend

Angular frontend for the E-Store Spring Boot backend.

## Run locally

```bash
npm install
npm start
```

The app runs on `http://localhost:4200` and calls the backend at `http://localhost:8080/api`.

## Seeded users

| Role | Email | Password |
| --- | --- | --- |
| User | `user@estore.com` | `password123` |
| Admin | `admin@estore.com` | `admin123` |

## Backend

From the repository root:

```bash
mvn spring-boot:run
```

Reviews require MongoDB at `mongodb://localhost:27017/estore`. The frontend will show a graceful reviews-unavailable state if MongoDB is down.
