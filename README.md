![Screenshot (health-crm-image1)](https://github.com/user-attachments/assets/d5d38786-65c1-43fc-b230-7cd20a66b10b)

# HealthCRM - Healthcare 
Management System

HealthCRM is a full-stack healthcare management system designed to streamline the management of appointments, patients, doctors, medical records, and examinations. 
Built with modern technologies, it provides a robust and scalable solution for healthcare organizations.

## Features

## Authentication & Authorization:
Role-based access control (Admin, Manager, Doctor, Staff).
JWT-based authentication with cookie support.

## Appointment Management:
Create, update, delete, and view appointments.
Validation for appointment dates, patient/doctor IDs, and examination IDs.

## Patient & Doctor Management:
Manage patient and doctor records.

## Examination Management:
Upload and manage examination results (PDFs).
Track examination statuses and types.

## Medical Records:
Link medical records to patients and appointments.

## Responsive Frontend:
Built with React and Material-UI for a modern and user-friendly interface.

## API Documentation:
Swagger UI for testing and exploring APIs.

# Database:
SQL Server for secure and efficient data storage.

## Technologies Used

# Frontend

## React: 
For building the user interface.

## Vite: 
A fast development build tool.

## Material-UI: 
For responsive and modern UI components.

## React Router: 
For routing and navigation.

## Backend

## .NET 8: 
For building a scalable and high-performance API.

## Entity Framework Core: 
For database interactions.

## ASP.NET Identity: 
For user authentication and role management.

## Swagger: 
For API documentation.

# Database

## SQL Server: 
For relational data storage.

## Getting Started

# Prerequisites

Node.js: v18 or later.
.NET SDK: v8.0 or later.
SQL Server: Installed and running.

# Environment Variables:

DB_CONNECTION_STRING: Connection string for SQL Server.
JWT_SECRET_KEY: Secret key for JWT authentication.
JWT_ISSUER: JWT issuer.
JWT_AUDIENCE: JWT audience.
ADMIN_EMAIL: Default admin email.
ADMIN_PASSWORD: Default admin password.
