# Advanced-Web-Technology
Assignments, projects, and practice works for Advanced Programming in Web Technology.
# Product and Employee Management API

## Project Information

- **Project Name:** Product and Employee Management API
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **API Testing:** Postman

## Description

This project is a REST API developed using NestJS, PostgreSQL, and TypeORM. It provides CRUD (Create, Read, Update, Delete) operations for Products and Employees.

## Features

- Create a product or employee
- Retrieve all products or employees
- Retrieve a single record by ID
- Update an existing record
- Delete a record
- Validate request data using DTOs
- Store data in PostgreSQL
- Return a 404 Not Found response when a record does not exist

## Technologies Used

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- class-validator
- Postman

## Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- A code editor such as Visual Studio Code
- Postman

## Installation and Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root directory.

Add the following configuration and replace the password placeholder with your own local PostgreSQL password:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgresql_password
DB_DATABASE=shop_management_db
```

Do not commit the real `.env` file to GitHub.

### 3. Start the application

```bash
npm run start:dev
```

The API runs at:

`http://localhost:3000`

## Product API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/products` | Create a product |
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get a product by ID |
| PATCH | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete a product |

### Product JSON Example

```json
{
  "name": "Tea",
  "category": "Grocery",
  "price": 25,
  "quantity": 100
}
```

## Employee API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/employees` | Create an employee |
| GET | `/employees` | Get all employees |
| GET | `/employees/:id` | Get an employee by ID |
| PATCH | `/employees/:id` | Update an employee |
| DELETE | `/employees/:id` | Delete an employee |

### Employee JSON Example

```json
{
  "name": "Rahim Ahmed",
  "email": "rahim@example.com",
  "phone": "01712345678",
  "password": "demo1234",
  "age": 25,
  "yearsOfWorking": 3
}
```

Use dummy credentials for testing. This lab implementation does not hash the password and should not be used as-is in production.

## Validation and Error Handling

- Required string fields are validated.
- Email format is validated.
- Price and quantity must be non-negative.
- Employee age must be at least 18.
- Years of working experience must be non-negative.
- Invalid input is rejected by the validation pipe.
- A record that does not exist returns `404 Not Found`.
- Successful DELETE requests return `204 No Content`.

## Screenshots

The `screenshots/` directory contains Postman evidence for Product CRUD operations:

1. `01-create.png`
2. `02-get-all.png`
3. `03-get-by-id.png`
4. `04-update.png`
5. `05-confirm-update.png`
6. `06-delete.png`
7. `07-confirm-delete.png`

## Project Structure

```text
product-management-api/
├── src/
│   ├── modules/
│   │   ├── product/
│   │   └── employee/
│   ├── app.module.ts
│   └── main.ts
├── screenshots/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Database Note

TypeORM `synchronize` is enabled for local lab development. Database migrations should be used for production applications.

## Student Information

- **Student Name:** [Masudur Rahman]
- **Student ID:** [23-50797-1]
- **Course:** Advanced Web Technology
- **Assignment:** Lab Task 1

## Author

[Masudur Rahman]