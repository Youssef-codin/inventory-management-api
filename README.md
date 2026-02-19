# Inventory Management API

A robust, multi-tenant inventory management REST API built with Node.js, Express, TypeScript, and Prisma. The system supports multiple shops, each with independent inventory tracking, customer orders, and purchase orders. With Redis caching, p95 latency is reduced by 74%.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Local Setup (without Docker)](#local-setup-without-docker)
- [Scripts](#scripts)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Benchmarks](#benchmarks)
- [API Documentation](#api-documentation)
- [Technologies Used](#technologies-used)

## Features

- **Multi-Tenant Architecture**: Support for multiple shops, each with isolated inventory and order management.
- **Modular Design**: Feature-based organization (Auth, Admin, Shop, Products, Suppliers, Customer Orders, Purchase Orders).
- **Per-Shop Inventory**: Products maintain separate stock levels per shop with automatic low-stock detection.
- **Type Safety**: Built with TypeScript and Zod for runtime request validation.
- **JWT Authentication**: Secure API access with JSON Web Token-based authentication.
- **Database ORM**: Prisma with PostgreSQL for type-safe database access.
- **Docker Support**: Containerized setup with Docker Compose for easy deployment.
- **Comprehensive Testing**: Integration and unit tests with Vitest and Supertest.
- **Structured Logging**: Request logging with Pino.
- **Code Quality**: Linting and formatting with Biome.
- **Performance Testing**: Load testing with k6.

## Prerequisites

- **Docker** — the recommended way to run the project. No other dependencies needed.

If running without Docker:

- **Node.js** (v20 or higher)
- **PostgreSQL** database

## Getting Started

The quickest way to run the project is with Docker.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Youssef-codin/inventory-management-api
   cd inventoryManagement
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory:

   | Variable       | Description                        | Example                                                                    |
   | -------------- | ---------------------------------- | -------------------------------------------------------------------------- |
   | `PORT`         | Port the server listens on         | `3000`                                                                     |
   | `DATABASE_URL` | PostgreSQL connection string       | `postgresql://yourUser:yourPassword@localhost:5432/inventory_db?schema=public` |
   | `JWT_SECRET`   | Secret key for signing JWT tokens | `your-secret-key`                                                          |
   | `REDIS_URL`    | Redis connection string            | `redis://:yourPassword@localhost:6380`                                     |

> **Note:** When running inside Docker, use `redis://:password@redis:6379` (internal network). When running locally on the host, use `redis://:password@localhost:6380` (exposed port).

3. **Start the containers:**

   ```bash
   docker compose up
   ```


   This will start both the API server on port `3000`, a PostgreSQL instance on port `5433`, and Redis on port `6380`.

## Local Setup (without Docker)

If you prefer to run without Docker, make sure you have Node.js and PostgreSQL installed.

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Database Setup:**
   Run the migrations to set up your database tables:

   ```bash
   npm run migrate init
   ```

   Generate the Prisma client:

   ```bash
   npm run generate
   ```

 3. **Seed the Database (optional):**
   Populate the database with demo data (admin user, shops, suppliers, products, orders):

   ```bash
   # Small dataset (~5 products, 2 shops, 2 suppliers)
   npm run seed

   # Large dataset (~1000 products, 10 shops, 50 suppliers, 150 orders) - for load testing
   npm run seed:large
   ```

4. **Run the Application:**

   ```bash
   npm run dev
   ```

## Scripts

| Script                  | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `npm run dev`           | Start the development server with file watching and `.env` loading       |
| `npm run start`         | Build and start the production server                                    |
| `npm run type-check`    | Run the TypeScript compiler to check for type errors                     |
| `npm run migrate <name>`| Run Prisma migrations with a descriptive name                            |
| `npm run generate`      | Generate the Prisma Client from `schema.prisma`                          |
| `npm run seed`          | Clear the database and seed it with demo data (~5 products)             |
| `npm run seed:large`    | Clear the database and seed it with large dataset (~1000 products)       |
| `npm run studio`        | Open Prisma Studio, a visual database editor                             |
| `npm test`              | Run integration and unit tests with Vitest                               |
| `npm run test:coverage` | Run tests and generate a code coverage report                            |
| `npm run lint`          | Lint and format the codebase using Biome                                 |
| `npm run lint:fix`      | Automatically fix linting and formatting issues                          |

## Benchmarks

Load tested with [k6](https://k6.io/) using 100 VUs over 55 seconds (15s ramp-up → 30s steady → 10s ramp-down). Tests run locally with Docker against a dataset of 1000 products, 10 shops, and 50 suppliers.

### Redis Cache Performance Comparison

| Metric                | Without Redis | With Redis   | Difference   |
| --------------------- | ------------ | ------------ | ------------ |
| **Avg Latency**       | 3.50 ms      | 1.06 ms      | **69.7% faster** |
| **p95 Latency**       | 9.14 ms      | 2.37 ms      | **74.1% faster** |
| **Throughput**        | 450.54 req/s | 454.33 req/s | **0.8% higher** |
| **Total Requests**    | 24,848      | 25,071      | +223         |
| **Passes**            | 24,843      | 25,066      | +223         |

**Key Improvements:**
- **69.7% reduction** in average response time (3.50ms → 1.06ms)
- **74.1% reduction** in p95 latency (9.14ms → 2.37ms)

**Cached Endpoints:**
- `GET /product/:id` - Product lookups
- `GET /product` - Product listings  
- `GET /product/low-stock` - Low stock alerts
- `GET /product/search` - Product search
- `GET /shop/:id` - Shop lookups
- `GET /supplier/:id` - Supplier lookups
- `GET /customer-order/:id` - Customer order lookups
- `GET /purchase-order/:id` - Purchase order lookups

Cache is automatically invalidated on create/update/delete operations.

**Reproducing the Benchmarks:**
```bash
# 1. Seed the large dataset
npm run seed:large

# 2. Test WITHOUT Redis - comment out initRedis() in src/app.ts
# Then start the server:
docker compose up -d

# 3. Run the baseline test (without Redis)
k6 run --summary-export=docs/baseline.json tests/perf/cache-benchmark.test.js

# 4. Test WITH Redis - uncomment initRedis() in src/app.ts
# Then restart the server:
docker compose restart

# 5. Run the Redis test
k6 run --summary-export=docs/redis.json tests/perf/cache-benchmark.test.js
```

## Authentication

The API uses JWT (JSON Web Token) for authentication.

1. **Login** by sending a `POST` request to `/auth/login` with your credentials:

   ```json
   {
     "username": "admin_user",
     "password": "securePassword123"
   }
   ```

2. **Use the token** in subsequent requests via the `Authorization` header:

   ```
   Authorization: Bearer <your-jwt-token>
   ```

## Project Structure

```text
src/
├── errors/              # Custom error classes (AppError)
├── middleware/          # Express middleware (auth, logging, validation, error handling)
├── modules/             # Feature modules (admin, auth, product, orders, etc.)
│   └── [module]/        # Each module contains:
│       ├── *.controller.ts  # HTTP request handlers
│       ├── *.service.ts     # Business logic & DB operations
│       ├── *.schema.ts      # Zod validation schemas
│       └── *.router.ts      # Express routes
├── scripts/             # Database seeding scripts
├── util/                # Utilities (DB, Redis, auth, responses)
├── app.ts               # Express app configuration
└── server.ts            # Application entry point

tests/
└── [module]/            # Integration & unit tests per module
```

## Testing

Tests are organized per-module with both integration and unit tests:

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

### Performance Testing

Load tests are located in `tests/perf/` and require [k6](https://k6.io/) to be installed.

```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Linux)
sudo apt install k6
```

Run the performance tests:

```bash
# Test full system (includes list, search, create operations)
k6 run tests/perf/load.test.js

# Test cached endpoints only
k6 run tests/perf/cache-benchmark.test.js
```

By default, tests connect to `http://localhost:3000`. Override with:
```bash
k6 run tests/perf/load.test.js -e BASE_URL=http://your-server:3000
```

To test without Redis caching, comment out the `initRedis()` call in `src/app.ts`.

## API Documentation

The full OpenAPI specification is available in the `docs/` directory:

- [OpenAPI Specification](docs/openapi.yaml) — Use with Swagger UI or Postman to explore all endpoints.

## Technologies Used

| Category        | Technology         |
| --------------- | ------------------ |
| **Runtime**     | Node.js            |
| **Framework**   | Express.js         |
| **Language**    | TypeScript         |
| **ORM**         | Prisma             |
| **Database**    | PostgreSQL         |
| **Validation**  | Zod                |
| **Auth**        | JSON Web Tokens    |
| **Logging**     | Pino               |
| **Testing**     | Vitest, Supertest, k6  |
| **Linting**     | Biome              |
| **Containers**  | Docker             |

## Scalability Considerations

- Redis caching reduces database load and tail latency (~74% p95 improvement).
- Database indexed on primary and foreign keys for fast lookups.
- Stateless API with JWT auth enables horizontal scaling.
- Cache invalidation on write operations ensures data consistency.
