# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Linkwarden is a self-hosted, open-source collaborative bookmark manager. It saves bookmarks along with archived copies (screenshots, PDFs, readable HTML) and supports collaboration, tagging, full-text search, and RSS subscriptions.

## Monorepo Structure

Yarn v4 workspaces monorepo using `dotenv-cli` for env var loading.

```
apps/
  web/       → Next.js 14 (Pages Router) - main web application
  worker/    → Node.js background worker (link archival, RSS polling, AI tagging)
  mobile/    → React Native / Expo mobile app

packages/
  prisma/    → Prisma schema + generated client (PostgreSQL)
  router/    → React Query hooks (shared between web & mobile)
  lib/       → Shared business logic (validation schemas, utilities)
  types/     → Shared TypeScript type definitions
  filesystem/→ Storage abstraction (local filesystem or S3)
```

## Common Commands

```bash
# Development (runs both web + worker)
yarn concurrently:dev

# Individual dev servers
yarn web:dev          # Next.js dev server on :3000
yarn worker:dev       # Background worker

# Build & start
yarn web:build
yarn concurrently:start

# Database
yarn prisma:generate  # Regenerate Prisma client after schema changes
yarn prisma:dev       # Create/apply migrations during development
yarn prisma:deploy    # Apply migrations in production
yarn prisma:studio    # Open Prisma Studio GUI

# Formatting
yarn format           # Run Prettier across all workspaces

# E2E Tests (Playwright, from apps/web)
cd apps/web && npx playwright test                    # Run all tests
cd apps/web && npx playwright test e2e/tests/public   # Run specific test directory
cd apps/web && npx playwright test --project="chromium public"  # Run specific project
```

## Architecture

### API Layer
REST API using Next.js API routes at `apps/web/pages/api/v1/`. Business logic lives in controllers at `apps/web/lib/api/controllers/`. Every authenticated route calls `verifyUser()`. Response format: `{ response: data, status: number }`.

### Authentication
NextAuth.js 4 with JWT strategy (30-day sessions). Supports credentials + 40+ SSO providers. API token auth via `AccessToken` model (Bearer tokens). Config in `apps/web/pages/api/v1/auth/[...nextauth].ts`.

### Data Fetching
**packages/router** provides React Query hooks (`useLinks`, `useCollections`, `useTags`, etc.) consumed by both web and mobile. Links use infinite queries with cursor-based pagination. The search endpoint powers link fetching with full-text search via MeiliSearch.

### State Management
- **Server state:** React Query (via packages/router hooks)
- **Client state:** Zustand stores (link selection, local view settings)

### Worker
Spawns from `apps/worker/index.ts` → `worker.ts` with auto-restart. Processes links asynchronously: screenshots (Playwright), PDFs, readable extraction (@mozilla/readability), Wayback Machine archival, MeiliSearch indexing. Also handles RSS polling and AI auto-tagging (Vercel AI SDK with multiple LLM providers).

### Storage
`packages/filesystem` abstracts local disk vs S3 storage. Configured via `SPACES_*` env vars for S3.

### i18n
next-i18next with 14 locales. Translations managed via Crowdin.

## Key Configuration

- **Environment:** Copy `.env.sample` → `.env` at root. Key vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- **ESLint:** `next/core-web-vitals` with `react-hooks/exhaustive-deps` and `@next/next/no-img-element` disabled
- **Prettier:** 2-space tabs, ES5 trailing commas
- **Node:** v20, TypeScript throughout
- **Database:** PostgreSQL 16+
- **Search:** MeiliSearch v1.12+

## Key Models (Prisma)

Core entities: `User`, `Collection` (hierarchical with parent/subCollections), `Link`, `Tag`, `Highlight`, `AccessToken`, `RssSubscription`, `Subscription` (Stripe billing). Schema at `packages/prisma/schema.prisma`.

## Conventions

- API validation uses Zod schemas defined in `packages/lib/schemaValidation.ts`
- Permission checks via `getPermission()` helper in controllers
- UI uses DaisyUI (Tailwind component library) with light/dark themes
- Pages Router (`pages/`) not App Router
- The web app version is tracked in `apps/web/package.json` (field `version`)
