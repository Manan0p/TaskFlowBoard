# TaskFlow - Project Task Management System

## Overview

TaskFlow is a modern web application designed for project and task management. It provides a comprehensive dashboard for tracking projects, managing tasks through different statuses, and visualizing progress through analytics. The application features a kanban-style board for task management, project organization capabilities, and real-time statistics to help users stay organized and productive.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React and TypeScript, utilizing a component-based architecture with modern UI patterns:
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS for utility-first styling with CSS custom properties for theming
- **Drag & Drop**: DnD Kit for kanban board interactions
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
The server follows a RESTful API design with Express.js:
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: OpenID Connect (OIDC) with Passport.js for Replit-based authentication
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **API Design**: RESTful endpoints organized by resource (projects, tasks, auth)
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Database Design
PostgreSQL database with the following core entities:
- **Users**: Profile information from OIDC authentication
- **Projects**: User-owned project containers
- **Tasks**: Individual work items linked to projects with status, priority, and deadlines
- **Sessions**: Secure session storage for authentication state

The schema supports hierarchical organization (users → projects → tasks) with proper foreign key relationships and indexes for performance.

### Authentication & Authorization
- **Provider**: Replit OIDC integration for seamless platform authentication
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session store
- **Authorization**: User-scoped data access with middleware protection on all API routes
- **Security**: CSRF protection through SameSite cookies and origin validation

### Development & Build System
- **Build Tool**: Vite for fast development and optimized production builds
- **Development**: Hot module replacement with error overlay for development experience
- **TypeScript**: Strict type checking across client, server, and shared code
- **Code Organization**: Monorepo structure with shared schema definitions
- **Path Aliases**: Configured aliases for clean imports (@/, @shared/, etc.)

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL for scalable data storage
- **Session Storage**: PostgreSQL-backed session management for authentication persistence

### UI & Interaction Libraries
- **Radix UI**: Accessible, unstyled component primitives for dialogs, dropdowns, and form controls
- **DnD Kit**: Accessibility-focused drag and drop for kanban board functionality
- **Recharts**: Chart library for dashboard analytics and data visualization
- **Lucide React**: Consistent icon set for UI elements

### Development Tools
- **TypeScript**: Static type checking for enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Zod**: Runtime type validation for forms and API data

### Authentication Integration
- **OpenID Connect**: Standard protocol for secure authentication with Replit
- **Passport.js**: Authentication middleware for Express.js applications