# Inventory Management System

A robust inventory management API built with Node.js, Express, TypeScript, and Prisma.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)

## Features

- **Modular Architecture**: Feature-based organization (Products, Suppliers, Orders).
- **Type Safety**: Built with TypeScript and Zod for runtime validation.
- **Database ORM**: Uses Prisma with PostgreSQL.
- **Logging**: Structured logging with Pino.

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v20 or higher recommended)
- **PostgreSQL** database

## Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Youssef-codin/inventory-management-api
   cd inventoryManagement
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory. You can use the example below as a reference:

   ```env
   PORT=3000
   DATABASE_URL="postgresql://yourUser:yourPassword@localhost:5432/inventory_db?schema=public"
   ```

4. **Database Setup:**
   Run the migrations to set up your database tables:

   ```bash
   npm run migrate init
   ```

   Generate the Prisma client:

   ```bash
   npm run generate
   ```

5. **Run the Application:**
   Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

Here is a list of available npm scripts to help you develop and maintain the project:

- **`npm run dev`**: Starts the development server using `tsx` with file watching and `.env` loading.
- **`npm run type-check`**: Runs the TypeScript compiler to check for type errors without emitting files.
- **`npm run migrate <name>`**: Runs Prisma migrations. Replace `<name>` with a descriptive name for your migration.
- **`npm run generate`**: Generates the Prisma Client based on your `schema.prisma`.
- **`npm run seed`**: Clears the database and seeds it with demo data (admin, suppliers, products, orders).
- **`npm run studio`**: Opens Prisma Studio, a visual editor for your database data.

## API Documentation

The API specification is available in the `docs/` directory:

- [OpenAPI Specification](docs/openapi.yaml): Use this file with tools like Swagger UI or Postman to explore and test the API endpoints.

## Project Structure

The project follows a modular, feature-based structure within the `src` directory:

```text
src/
├── errors/          # Custom error classes
├── middleware/      # Express middleware (auth, logging, validation)
├── modules/         # Feature modules (Controller, Service, Schema, Routes)
│   ├── admin/
│   ├── customerorder/
│   ├── product/
│   ├── purchaseorder/
│   └── supplier/
├── util/            # Utility functions and helpers
└── server.ts        # Application entry point
```

### Key Directories

- **`modules/`**: Contains the core business logic. Each module typically includes:
  - `*.controller.ts`: Handles HTTP requests and responses.
  - `*.service.ts`: Contains business logic and database interactions.
  - `*.schema.ts`: Zod schemas for validation.
  - `*.route.ts`: Express route definitions.
- **`prisma/`**: Contains the database schema (`schema.prisma`) and migration history.
- **`generated/`**: Contains the generated Prisma client.

## Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Validation**: Zod
- **Logging**: Pino
