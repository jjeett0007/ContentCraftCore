# Corebase CMS - Project Overview

## User Preferences
Preferred communication style: Simple, everyday language.

## Overview

Corebase CMS is a full-stack content management system built with a React frontend and Express backend. It uses Drizzle ORM with PostgreSQL for data persistence. The application follows a modern architecture with a clear separation between client and server code.

Key features include:
- Content type builder for creating custom data structures
- Content management for CRUD operations on content
- User authentication and role-based permissions
- Media library management
- RESTful API for content access

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query for server state, React Context for global app state
- **UI Components**: Custom components using Radix UI primitives with Tailwind CSS styling
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database Access**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with cookies for session management
- **File Storage**: Local file system with optional Cloudinary integration
- **API Design**: RESTful API with JSON responses

### Data Storage
- **Primary Database**: PostgreSQL (via Drizzle ORM)
- **Schema**: Defined in shared/schema.ts with Drizzle and Zod schemas
- **File Storage**: Local uploads directory with optional cloud storage

## Key Components

### Frontend Components
1. **Admin Layout**: Main layout wrapper for authenticated pages
2. **Content Type Builder**: Interface for creating and managing content types
3. **Content Manager**: Interface for managing content entries
4. **Media Library**: Interface for uploading and managing media files
5. **User Management**: Interface for managing users and permissions
6. **Authentication Flows**: Login, registration, and session management

### Backend Components
1. **Auth System**: JWT-based authentication with role-based access control
2. **Content Type API**: Endpoints for creating and managing content types
3. **Content API**: Dynamic endpoints for managing content based on defined types
4. **Media API**: Endpoints for file uploads and management
5. **User API**: Endpoints for user management
6. **Storage Layer**: Abstraction for database operations

### Shared Components
1. **Database Schema**: Shared schema definitions for type safety
2. **Validation Schemas**: Zod schemas for data validation
3. **TypeScript Types**: Shared type definitions

## Data Flow

1. **Authentication Flow**:
   - User submits credentials
   - Server validates credentials and issues JWT
   - JWT is stored in cookies
   - Subsequent requests include JWT for authentication

2. **Content Type Management Flow**:
   - Admin creates content type with fields
   - Server validates and stores content type
   - Content type becomes available for content creation

3. **Content Management Flow**:
   - User creates/edits content based on content type
   - Server validates against content type schema
   - Content is stored and made available via API

4. **Media Management Flow**:
   - User uploads files
   - Server processes and stores files
   - Media becomes available for use in content

## External Dependencies

### Frontend Dependencies
- **@radix-ui**: UI component primitives
- **@tanstack/react-query**: Data fetching and caching
- **react-hook-form**: Form handling
- **zod**: Schema validation
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing

### Backend Dependencies
- **express**: Web server framework
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **multer**: File upload handling
- **cloudinary**: Optional cloud storage for media

## Deployment Strategy

The application is designed to be deployed on Replit with:
1. **Build Process**: `npm run build` which:
   - Builds the frontend with Vite
   - Bundles the server code with esbuild
2. **Runtime**: Node.js serving both the API and static frontend assets
3. **Database**: PostgreSQL database (needs to be provisioned)
4. **Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret for JWT signing
   - Optional Cloudinary credentials if using cloud storage

The application is configured to run in development mode with `npm run dev`, which starts both the frontend development server and the backend API.

## Development Guidelines

1. **Code Organization**:
   - Frontend code in `client/src`
   - Backend code in `server`
   - Shared code in `shared`

2. **Database Migrations**:
   - Managed with Drizzle ORM
   - Schema changes should be applied with `npm run db:push`

3. **API Conventions**:
   - RESTful endpoints
   - JSON request/response format
   - Authentication via JWT in Authorization header or cookies

4. **UI Design**:
   - Follows a consistent design system with Tailwind CSS
   - Dark/light mode support
   - Responsive design for mobile and desktop