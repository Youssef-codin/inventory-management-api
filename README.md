# Inventory Management API

A robust, multi-tenant inventory management REST API built with Node.js, Express, TypeScript, and Prisma. The system supports multiple shops, each with independent inventory tracking, customer orders, and purchase orders.

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
   | `JWT_SECRET`   | Secret key for signing JWT tokens  | `your-secret-key`                                                          |

3. **Start the containers:**

   ```bash
   docker compose up
   ```


   This will start both the API server on port `3000` and a PostgreSQL instance on port `5433`.

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
   npm run seed
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
| `npm run seed`          | Clear the database and seed it with demo data                            |
| `npm run studio`        | Open Prisma Studio, a visual database editor                             |
| `npm test`              | Run integration and unit tests with Vitest                               |
| `npm run test:coverage` | Run tests and generate a code coverage report                            |
| `npm run lint`          | Lint and format the codebase using Biome                                 |
| `npm run lint:fix`      | Automatically fix linting and formatting issues                          |



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

## API Documentation

The full OpenAPI specification is available in the `docs/` directory:

- [OpenAPI Specification](docs/openapi.yaml) — Use with Swagger UI or Postman to explore all endpoints.

## Benchmarks

Load tested with [k6](https://k6.io/) using 100 VUs over 55 seconds (15s ramp-up → 30s steady → 10s ramp-down).

### Redis Cache Performance Comparison

| Metric                | Baseline     | With Redis   | Speedup      |
| --------------------- | ------------ | ------------ | ------------ |
| **Avg Latency**       | 51.05 ms     | 31.91 ms     | **37.5% faster** |
| **p95 Latency**       | 164.20 ms    | 110.73 ms    | **32.6% faster** |
| **Throughput**        | ~509 req/s   | ~581 req/s   | **14.1% increase** |
| **Total Requests**    | 28,032       | 32,093       | **+4,061 requests** |
| **Failure Rate**      | 0.00%        | 0.00%        | No change    |

**Key Improvements:**
- **37.5% reduction** in average response time (51ms → 32ms)
- **32.6% reduction** in p95 latency (164ms → 111ms)
- **14.1% higher throughput** handling 4,061 more requests in the same time period

**Cached Endpoints:**
- `GET /product/:id` - Product lookups
- `GET /product` - Product listings  
- `GET /product/low-stock` - Low stock alerts
- `GET /product/search` - Product search
- `POST /customer-order` - Order creation
- `POST /purchase-order` - Purchase orders

Redis caching significantly improves response times by caching frequently accessed product, shop, supplier, and order data with automatic cache invalidation on mutations.

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
| **Testing**     | Vitest, Supertest  |
| **Linting**     | Biome              |
| **Containers**  | Docker             |
