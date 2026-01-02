# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Naver Place Monitoring System** built with TypeScript, Express, TypeORM, PostgreSQL, and Next.js. The application monitors Naver Place rankings, reviews, and competitor data for businesses, providing automated tracking and notification capabilities.

## Project Structure

This is a monorepo containing both backend and frontend:

- **Root directory**: Backend (Express + TypeORM + PostgreSQL)
- **`web/` directory**: Frontend (Next.js + React)

Both applications work together to provide a full-stack monitoring solution.

## Common Development Commands

### Backend Commands

#### Build and Run
```bash
npm run build              # Compile TypeScript to JavaScript
npm start                  # Run compiled code from dist/
npm run dev                # Run in development mode with ts-node
```

#### Testing
```bash
npm test                   # Run all tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:e2e           # Run E2E API tests only
npm run test:e2e:watch     # Run E2E tests in watch mode
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

**Test Structure**: Tests are organized in `tests/` directory with:
- `unit/` - Unit tests for individual components
- `integration/` - Integration tests for repository and database interactions
- `e2e/` - End-to-end API tests
- `fixtures/` - Test data and factory functions
- `helpers/` - Test utilities
- `mocks/` - Mock implementations
- `setup/` - Test environment setup

#### Code Quality
```bash
npm run lint               # Check for linting errors
npm run lint:fix           # Auto-fix linting errors
npm run format             # Format code with Prettier
npm run format:check       # Check formatting without writing
npm run type-check         # Type check without emitting files
```

#### Database Migrations
```bash
npm run migration:generate # Generate new migration based on entity changes
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
```

**Important**: Migration commands use `ts-node -r tsconfig-paths/register` to support path aliases. When generating migrations, TypeORM compares current entities against database schema (synchronize is disabled in production).

### Frontend Commands

```bash
cd web                  # Navigate to frontend directory
npm run dev             # Start development server (default: http://localhost:3001)
npm run build           # Build for production
npm start               # Start production server
npm run lint            # Run ESLint
```

## Architecture

This project follows **Clean Architecture** with strict layer separation:

### Layer Structure

```
src/
├── domain/              # Core business logic (framework-agnostic)
│   ├── entities/        # Business entities (TypeORM entities)
│   ├── repositories/    # Repository interfaces (contracts)
│   └── services/        # Domain service interfaces (IPasswordHashService, IJwtAuthService)
│
├── application/         # Application business rules
│   ├── dtos/           # Data Transfer Objects
│   ├── errors/         # Application-level error classes (HttpError, NotFoundError, etc.)
│   └── usecases/       # Use case implementations
│       ├── auth/       # User authentication (register, login, refresh, logout)
│       ├── place/      # Place management
│       ├── keyword/    # Keyword management
│       └── tracking/   # Ranking/review tracking
│           ├── ranking/
│           ├── review/
│           ├── review-history/
│           └── competitor/
│
├── infrastructure/      # External dependencies & implementations
│   ├── ai/             # AI/ML integrations (sentiment analysis)
│   ├── auth/           # Authentication implementations (PasswordHashService, JwtAuthService)
│   ├── cache/          # Redis/caching layer
│   ├── database/       # TypeORM data source & migrations
│   ├── naver/          # Naver API/scraping (Puppeteer)
│   ├── notification/   # Email/Slack notification implementations
│   └── repositories/   # Repository concrete implementations
│
└── presentation/        # External interfaces
    └── api/            # REST API layer
        ├── config/     # DIContainer for dependency injection
        ├── controllers/
        ├── middleware/
        └── routes/
```

### Dependency Rule

Dependencies flow inward:
- **presentation** → **application** → **domain**
- **infrastructure** → **application** & **domain**
- Domain layer has NO dependencies on outer layers

### Path Aliases

Use TypeScript path aliases to reference layers:
- `@domain/*` → `src/domain/*`
- `@application/*` → `src/application/*`
- `@infrastructure/*` → `src/infrastructure/*`
- `@presentation/*` → `src/presentation/*`
- `@tests/*` → `tests/*`

## Frontend (Next.js)

The `web/` directory contains a Next.js frontend application that consumes the backend API.

### Technology Stack

- **Next.js 16**: App Router with React Server Components
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety across the application
- **Tailwind CSS + shadcn/ui**: Utility-first CSS with pre-built components
- **Zustand**: Lightweight client-side state management
- **React Query (@tanstack/react-query)**: Server state management and caching
- **Zod**: Schema validation for forms and API responses
- **React Hook Form**: Form handling with validation
- **Axios**: HTTP client with interceptors for authentication

### Directory Structure

```
web/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Route group for authentication pages
│   │   ├── login/      # Login page
│   │   └── register/   # Registration page
│   ├── (dashboard)/    # Route group for authenticated pages
│   │   ├── dashboard/  # Main dashboard
│   │   └── places/     # Place management pages
│   │       ├── page.tsx                         # List all places
│   │       ├── new/page.tsx                     # Create new place
│   │       ├── [id]/page.tsx                    # View place details
│   │       ├── [id]/edit/page.tsx              # Edit place
│   │       └── [id]/keywords/[keywordId]/rankings/page.tsx  # Ranking data
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
│
├── components/          # Reusable React components
│   ├── auth/           # Authentication components (LoginForm, RegisterForm)
│   ├── places/         # Place management components (PlaceForm)
│   └── ui/             # shadcn/ui components (button, input, form, etc.)
│
├── lib/                # Utilities and core logic
│   ├── api/            # API client configuration
│   │   ├── client.ts   # Axios instance with interceptors
│   │   ├── auth.ts     # Authentication API calls
│   │   ├── place.ts    # Place API calls
│   │   ├── keyword.ts  # Keyword API calls
│   │   └── ranking.ts  # Ranking API calls
│   ├── stores/         # Zustand stores
│   │   └── authStore.ts # Authentication state (persisted to localStorage)
│   ├── hooks/          # Custom React hooks
│   │   └── useAuth.ts  # Authentication hook with hydration handling
│   ├── validations/    # Zod schemas
│   │   ├── auth.ts     # Auth validation schemas
│   │   └── place.ts    # Place validation schemas
│   ├── providers/      # React context providers
│   │   └── QueryProvider.tsx # React Query provider
│   └── utils.ts        # Utility functions
│
└── types/              # TypeScript type definitions
    └── api.ts          # API response types
```

### Authentication Flow

- **JWT-based authentication** with access and refresh tokens
- **Axios interceptors** automatically attach access tokens to requests
- **Automatic token refresh**: On 401 errors, interceptor attempts to refresh using refresh token
- **Client-side route protection**: `useRequireAuth` hook in protected pages redirects unauthenticated users
- **Token storage**: Tokens stored in localStorage (access and refresh tokens) via Zustand persist middleware
- **Hydration handling**: `authStore` tracks `_hasHydrated` to prevent SSR/client mismatches
- **Protected routes**: `/dashboard`, `/places/*`
- **Public routes**: `/login`, `/register`

### Key Patterns

- **Route Groups**: Uses `(auth)` and `(dashboard)` to organize routes without affecting URLs
- **Server/Client Components**: Leverages RSC where possible, marks interactive components with `'use client'`
- **API Integration**: All API calls go through `lib/api/client.ts` with automatic auth handling
- **Form Validation**: Zod schemas in `lib/validations/` used with React Hook Form
- **State Management**: Zustand for client state (auth, UI), React Query for server state (data fetching)

## Database Schema

The system uses PostgreSQL with 11 core tables:

### Core Entities
- **users**: User accounts with JWT authentication
- **refresh_tokens**: Refresh tokens for JWT auth (linked to users)
- **places**: Naver Place entries being monitored
- **keywords**: Search keywords for ranking tracking
- **place_keywords**: Many-to-many relation (place + keyword + region)

### Tracking Data
- **ranking_histories**: Historical ranking data per place/keyword
- **review_histories**: Aggregated review stats over time
- **reviews**: Individual reviews with sentiment analysis
- **competitors**: Competitor places for comparison
- **competitor_snapshots**: Historical competitor metrics

### Notifications
- **notification_settings**: User notification preferences (JSONB conditions)
- **notification_logs**: Notification delivery logs

### Key Design Patterns
- Uses UUIDs for all primary keys
- Composite indexes on frequently queried columns (place_id + checked_at)
- JSONB for flexible notification conditions
- ON DELETE CASCADE for data integrity

## Technology Stack

### Core Dependencies
- **TypeORM**: ORM with decorators (experimentalDecorators enabled)
- **Express**: Web framework
- **Puppeteer**: Web scraping for Naver Place data
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT authentication
- **class-validator** & **class-transformer**: DTO validation
- **pg**: PostgreSQL driver

### Configuration Notes
- TypeORM synchronize is disabled (use migrations only)
- Strict TypeScript mode enabled
- StrictPropertyInitialization disabled for TypeORM entities
- CommonJS module system

## Environment Setup

### Backend (.env)

Copy `.env.example` to `.env` and configure:
- PostgreSQL connection (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE)
- JWT settings (JWT_SECRET, JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN)
- Security (BCRYPT_SALT_ROUNDS)
- Application (PORT, NODE_ENV)
- SMTP for email notifications
- Slack webhook URL for Slack notifications
- Redis connection (optional, for caching)
- Naver scraping configuration (PUPPETEER_HEADLESS, PUPPETEER_TIMEOUT, etc.)

### Frontend (web/.env.local)

Create `web/.env.local` for frontend environment variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3000/api)
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`: Toss Payments client key (for payment integration)
- `NODE_ENV`: Environment (development/production)

Note: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Development Workflow

1. **Database First**: Always run migrations before starting development
2. **Entity Changes**: When modifying entities, generate migrations (don't rely on synchronize)
3. **Use Cases**: Place business logic in application/usecases, not controllers
4. **Repository Pattern**: Infrastructure repositories implement domain interfaces
5. **DTO Validation**: Use class-validator decorators on DTOs
6. **Testing**: Jest is configured with ts-jest; tests go in `tests/` or `*.test.ts` files
7. **Full-Stack Development**: Run backend (`npm run dev`) and frontend (`cd web && npm run dev`) in separate terminals

## Important Patterns

### Dependency Injection Container
- Located at `presentation/api/config/DIContainer.ts`
- Singleton pattern managing all repositories, services, and use cases
- Initialized at application startup with TypeORM DataSource
- Uses `ServiceRegistry` interface for compile-time type safety and IDE autocomplete
- Access dependencies via `container.get('ServiceName')` (returns correctly typed instance)
- All use cases receive dependencies through constructor injection
- Example: `container.get('UserRepository')` returns `IUserRepository` type

### Error Handling
- Custom error classes located in `application/errors/HttpError.ts`
- Base `HttpError` class with `statusCode` and `isOperational` flag
- Specific errors: `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `BadRequestError`, `ValidationError`, `ConflictError`, `InternalServerError`
- Use these errors in use cases; middleware handles conversion to HTTP responses

### Repository Implementation
- Interfaces defined in `domain/repositories/`
- Implementations in `infrastructure/repositories/`
- Inject repository interfaces into use cases, not concrete implementations

### Use Case Structure
- One class per use case
- Dependencies injected via constructor
- Return DTOs, not entities directly
- Handle domain logic, not HTTP concerns

### Scraping with Puppeteer
- Located in `infrastructure/naver/`
- Must handle dynamic content loading
- Implement rate limiting to avoid blocking
- Extract ranking, review count, ratings

### Notification System
- Conditions stored as JSONB in database
- Support multiple channels (email, Slack)
- Log all notification attempts in notification_logs
- Check notification_settings.is_enabled before sending

## Code Organization Principles

- Keep controllers thin (delegate to use cases)
- No business logic in presentation layer
- Use dependency injection for testability
- Entities should only contain data structure and simple validations
- Complex business rules belong in domain services or use cases
