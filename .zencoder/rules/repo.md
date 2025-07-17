# Repository Information Overview

## Repository Summary
This repository contains a multi-component e-commerce platform with a backend API service, buyer-facing storefront, and seller dashboard. The system is designed to facilitate online sales with features for authentication, product listings, orders, reviews, and wallet management.

## Repository Structure
- **backend**: Fastify-based Node.js API with MongoDB integration
- **buyer**: Next.js-based customer-facing storefront
- **dashboard-seller**: React-based admin interface for sellers
- **dashboard-admin**: Admin dashboard (structure present but implementation details not found)
- **dashboard-support**: Support dashboard (structure present but implementation details not found)

### Main Repository Components
- **Backend API**: Core service handling authentication, data storage, and business logic
- **Buyer Frontend**: Customer-facing e-commerce storefront
- **Seller Dashboard**: Interface for sellers to manage products and orders

## Projects

### Backend API
**Configuration File**: `package.json`

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Version**: Node.js 16 (from Dockerfile)
**Framework**: Fastify v3.29.4
**Database**: MongoDB with Mongoose v7.0.0
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- fastify: Web framework
- mongoose: MongoDB ORM
- jsonwebtoken: Authentication
- bcryptjs: Password hashing
- stripe: Payment processing
- node-cron: Scheduled tasks
- nodemailer: Email sending

#### Build & Installation
```bash
npm install
npm run dev  # Development with nodemon
npm start    # Production
```

#### Docker
**Dockerfile**: `backend/Dockerfile`
**Image**: Node.js 16
**Configuration**: Exposes port 8080, runs server.js

#### Testing
**Test Location**: `/backend/tests`
**Test Files**: Various integration tests for wallet, authentication, and listings

### Buyer Frontend
**Configuration File**: `package.json`

#### Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.2.2
**Framework**: Next.js 14.2.14
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- next: React framework
- react: UI library
- @reduxjs/toolkit: State management
- @mui/material: UI components
- axios: HTTP client
- @stripe/react-stripe-js: Payment integration
- tailwindcss: CSS framework

#### Build & Installation
```bash
npm install
npm run dev  # Development on port 3001
npm run build  # Production build
npm start  # Start production server
```

### Seller Dashboard
**Configuration File**: `package.json`

#### Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 4.7.3
**Framework**: React 17.0.2
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- react: UI library
- @mui/material: UI components
- @reduxjs/toolkit: State management
- axios: HTTP client
- react-router: Routing
- apexcharts: Charts and visualizations
- react-quill: Rich text editor

#### Build & Installation
```bash
npm install
npm start  # Development server
npm run build  # Production build
```