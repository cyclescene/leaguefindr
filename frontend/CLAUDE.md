# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LeagueFindr Frontend - A monorepo containing Next.js frontend applications for the community sports league discovery platform.

## Development Commands

### Setup

```bash
# Install dependencies
pnpm install
```

### Running Applications

```bash
# Start development server for all apps
pnpm dev

# Start a specific app
pnpm --filter [app-name] dev
```

### Building

```bash
# Build all apps for production
pnpm build

# Build a specific app
pnpm --filter [app-name] build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run a single test file
pnpm test [test-file-path]
```

### Linting & Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

## Architecture

[To be documented as the project develops]

for the structure of most of the frontend applications we build i would like to follow a similar direcrory structure to this:

dashboard/
├── app/
│ ├── layout.tsx # Root layout
│ ├── page.tsx # Home page
│ ├── (auth)/ # Auth route group
│ │ ├── login/
│ │ │ └── page.tsx
│ │ ├── signup/
│ │ │ └── page.tsx
│ │ └── layout.tsx # Auth layout wrapper
│ ├── (dashboard)/ # Dashboard route group
│ │ ├── layout.tsx
│ │ ├── page.tsx
│ │ ├── products/
│ │ │ ├── page.tsx
│ │ │ └── [id]/
│ │ │ └── page.tsx
│ │ └── settings/
│ │ └── page.tsx
│ └── api/
│ ├── auth/
│ │ ├── login/
│ │ │ └── route.ts
│ │ └── logout/
│ │ └── route.ts
│ └── products/
│ ├── route.ts # GET /api/products, POST /api/products
│ └── [id]/
│ └── route.ts # GET /api/products/[id], PUT, DELETE
├── components/
│ ├── common/
│ │ ├── Header.tsx
│ │ ├── Footer.tsx
│ │ └── Navigation.tsx
│ ├── auth/
│ │ ├── LoginForm.tsx
│ │ └── SignupForm.tsx
│ └── products/
│ ├── ProductCard.tsx
│ └── ProductList.tsx
├── hooks/
│ ├── useAuth.ts
│ ├── useProducts.ts
│ └── useFetch.ts
├── lib/
│ ├── config.ts # Configuration
│ ├── utils.ts # Utility functions
│ ├── auth.ts # Auth logic
│ └── db.ts # Database client
├── types/
│ └── index.ts # TypeScript types
├── public/
│ ├── images/
│ └── icons/
├── **tests**/
│ ├── components/
│ └── lib/
├── .env.local # Environment variables
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts # If using Tailwind
└── package.json

- testing is paramount, when ever you notice a bug or a problem please add a test to the test suite
  - either when you notice soemthing new that i built or something you generated
- if need be we can switch to a different architecture if i notice that I am reusing the same components between different frontends
- Monorepo structure with multiple Next.js apps, this is a good way to organize the codebase
- Shared packages and utilities
- Key directories and their purposes
- How apps interact with each other

## Important Notes

[To be added as patterns emerge during development]
