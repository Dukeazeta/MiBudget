# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository overview
- Monorepo managed with pnpm workspaces and TypeScript project references.
- Applications:
  - apps/server: Express.js API (TypeScript) persisting to a JSON file via LowDB.
  - apps/web: React + Vite PWA with offline-first data via IndexedDB (Dexie).
- Packages:
  - packages/shared: Zod schemas for all domain entities plus utility helpers (generateId, now, money/date utils).
  - packages/db: LowDB-based persistence layer. Exposes Database (used by server) and AtomicDatabase (advanced, includes queued atomic writes and backups).

Common commands
Use pnpm (Node 18+).
- Install dependencies (root):
  pnpm install

- Build everything in dependency order:
  pnpm build

- Lint all packages:
  pnpm lint

- Format with Prettier:
  pnpm format

- Run both apps together (note):
  pnpm dev
  Note: This starts the server using its compiled output (start). If the server hasn’t been built yet, run:
  pnpm -F mibudget-server build

- Run each app during development (recommended):
  - Backend (watch with tsx):
    pnpm -F mibudget-server dev
  - Frontend (Vite dev server):
    pnpm -F mibudget-web dev

- Quick start both servers (Windows):
  start-dev.bat
  (This script automatically creates the data directory, builds the server, and starts both services)

- Build individual apps/packages:
  - Server: pnpm -F mibudget-server build
  - Web: pnpm -F mibudget-web build
  - Shared: pnpm -F @mibudget/shared build
  - DB: pnpm -F @mibudget/db build

- Start compiled server (after build):
  pnpm -F mibudget-server start

- Tests
  - Run all tests across the workspace:
    pnpm test
    (Currently, tests live in apps/web and run with Vitest.)
  - Run a single test file (web):
    pnpm -F mibudget-web test -- --run src/path/to/file.test.ts
  - Run tests matching a name pattern (web):
    pnpm -F mibudget-web test -- --run -t "pattern"
  - Watch mode (web):
    pnpm -F mibudget-web test

Environment and data paths
- Server environment variables (used in apps/server/src/index.ts):
  - PORT (default 4000)
  - NODE_ENV (development|production)
  - ALLOWED_ORIGINS (comma-separated list, e.g., http://localhost:5173)
- Data storage (server): LowDB JSON at data/db.json (relative to repo root). Ensure the data/ directory exists. Backups (if AtomicDatabase is used) are stored under data/backups/.

High-level architecture and flow
- Shared domain model (packages/shared)
  - All entities extend a BaseEntity: id (UUID), created_at, updated_at, deleted (soft delete), client_id (optional).
  - Zod schemas validate all API inputs/outputs and keep server/client types aligned.

- Client offline-first layer (apps/web)
  - Local persistence via Dexie (IndexedDB) with tables for settings, categories, transactions, budgets, goals.
  - Outbox pattern queues local mutations (create/update/delete) with retry counters and synced flags.
  - Cross-tab coordination via BroadcastChannel to notify other tabs of local DB changes.
  - SyncEngine periodically syncs when online (and on focus/online events):
    1) Reads unsynced outbox items and groups them by entity.
    2) Sends SyncRequest to the server: { client_id, since, push }.
    3) Marks pushed items as synced if the call succeeds.
    4) Applies server changes using bulk upserts guarded by updated_at timestamps.
    5) Updates local sync state (lastSync / lastFullSync). Retries with exponential backoff on failure.
  - ApiClient wraps fetch with typed helpers for the REST endpoints and sync.

- Server API (apps/server)
  - Express app with security middleware (helmet), CORS, JSON body parsing, Pino logging; optional rate limiting in production.
  - Implements CRUD routes for settings, categories, transactions, budgets, goals plus /api/health and /api/sync.
  - Sync endpoint contract:
    - Accepts a Zod-validated SyncRequest.
    - Applies push data via db.bulkUpdate (server takes client payload at face value in the default Database implementation).
    - Returns pull data calculated by db.getSyncData(since) and a server_time.
  - Error handling middleware normalizes 500s; 404 handler for unknown routes.

- Persistence layer (packages/db)
  - Database (default, used by server): Simple LowDB wrapper that reads/writes a single JSON file and provides typed CRUD for all entities, plus getSyncData and bulkUpdate used by /api/sync.
  - AtomicDatabase (advanced): Adds queued atomic writes, file-level backups/restore, conflict detection, and a bulkSync API that updates updated_at to server time. Not currently wired into the server entrypoint, but available if stronger durability is needed.

Offline-first architecture
- The web app is designed to work offline-first using IndexedDB for local storage
- All transaction operations (create/update/delete) work immediately in the client, even without server connection
- Sync engine automatically syncs with server when available, but gracefully handles server unavailability
- ResponsiveAmount and ResponsiveBalance components automatically adjust font sizes for mobile devices
- Use start-dev.bat on Windows to quickly start both server and client for development

Workflow tips for this repo
- Prefer running server and web independently during development (pnpm -F mibudget-server dev and pnpm -F mibudget-web dev). Use the combined pnpm dev only after building the server once.
- When focusing on one package, use workspace filters (pnpm -F <name> <script>) to keep operations fast.
- Client and server both rely on the updated_at field for last-write-wins reconciliation, so ensure any manual data manipulation preserves monotonic timestamps.
- The app will function fully offline - server connection errors are handled gracefully.
