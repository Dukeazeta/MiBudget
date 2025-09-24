# MiBudget - Personal Finance Tracker

A modern, offline-first personal finance tracking application with automatic sync capabilities.

## Features

✅ **Core Features (Completed)**
- Clean minimal onboarding with current balance setup
- Weekly balance reveal (configurable day - default Saturday)
- Prominent income (+) and expense (-) buttons
- JSON-based database (simple, no compilation needed)
- Full REST API with sync endpoint
- React frontend with Vite + Tailwind CSS
- PWA with service worker for offline capability
- Zustand state management with persistence
- Mobile-first responsive design

🚧 **In Progress**
- Complete offline functionality with IndexedDB
- Transaction management UI with sync
- Category-based budgeting system  
- Savings goals with cash allocation

## Tech Stack

### Backend
- **Server**: Express.js with TypeScript
- **Database**: LowDB (JSON-based, no compilation required)
- **Validation**: Zod schemas
- **Logging**: Pino with pretty printing
- **Security**: Helmet, CORS, rate limiting

### Frontend (Planned)
- **Framework**: React with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **Offline**: IndexedDB + Service Worker
- **PWA**: Installable with manifest

### Infrastructure
- **Monorepo**: pnpm workspaces
- **Build**: TypeScript project references
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged

## Project Structure

```
MiBudget/
├── apps/
│   ├── server/          # Express.js backend
│   └── web/            # React frontend (coming soon)
├── packages/
│   ├── shared/         # Shared types and utilities
│   └── db/            # Database layer with LowDB
├── data/              # Database JSON files
└── docs/              # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18 or newer
- pnpm (recommended) or npm

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd MiBudget
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Start backend server (port 4000)
pnpm --filter mibudget-server start

# Or for development with watch mode
pnpm --filter mibudget-server dev

# Build all packages
pnpm build

# Lint all code
pnpm lint

# Format code
pnpm format
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=./data/app.sqlite

# CORS (for development)
ALLOWED_ORIGINS=http://localhost:5173
```

## API Documentation

### Base URL
`http://localhost:4000/api`

### Endpoints

#### Health Check
- `GET /health` - Server health status

#### Settings
- `GET /settings` - Get user settings
- `PUT /settings` - Update settings

#### Categories
- `GET /categories` - List categories
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

#### Transactions
- `GET /transactions` - List transactions with filters
- `POST /transactions` - Create transaction  
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

#### Budgets
- `GET /budgets` - List budgets
- `POST /budgets` - Create budget
- `PUT /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget

#### Goals
- `GET /goals` - List goals
- `POST /goals` - Create goal
- `PUT /goals/:id` - Update goal
- `DELETE /goals/:id` - Delete goal

#### Sync
- `POST /sync` - Synchronize client data with server

### Sample Requests

#### Create a Category
```bash
curl -X POST http://localhost:4000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Food", "color": "#ff6b6b"}'
```

#### Create a Transaction
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount_cents": 1500,
    "type": "expense", 
    "description": "Lunch",
    "category_id": "category-id-here"
  }'
```

## Architecture

### Data Flow
1. **Client-First**: All operations happen locally first for instant UI
2. **Outbox Pattern**: Changes queued for sync when online
3. **Conflict Resolution**: Last-write-wins based on `updated_at` timestamps
4. **Sync Endpoint**: Bidirectional sync with server

### Database Schema
All entities share common fields:
- `id` (UUID)
- `created_at` (timestamp)
- `updated_at` (timestamp) 
- `deleted` (boolean for soft deletes)
- `client_id` (optional, for tracking origin)

Entities:
- **Settings**: Currency, reveal day, balance settings
- **Categories**: Name, color, icon for organizing transactions
- **Transactions**: Amount, type (income/expense/transfer/adjustment), category, goal
- **Budgets**: Category allocation with periods (weekly/monthly/custom)
- **Goals**: Savings targets with due dates

## Development Roadmap

### Week 1 ✅ (Completed)
- [x] Monorepo setup and tooling
- [x] Backend API with all endpoints
- [x] Database layer with LowDB
- [x] Shared types and validation

### Week 2 ✅ (Completed)
- [x] React frontend scaffolding with Vite + Tailwind
- [x] PWA setup with service worker
- [x] Zustand state management
- [x] Onboarding flow with balance setup
- [x] Dashboard with balance reveal logic
- [x] Prominent +/- transaction buttons

### Week 3 (Current)
- [ ] IndexedDB offline storage layer
- [ ] Transaction UI and management
- [ ] Full sync engine implementation

### Week 3
- [ ] Transaction UI with prominent +/- buttons
- [ ] Balance reveal logic
- [ ] Sync engine implementation

### Week 4
- [ ] Categories and budgeting system
- [ ] Goals and cash allocation
- [ ] UI polish and responsive design

### Week 5
- [ ] Testing suite
- [ ] Performance optimization
- [ ] Documentation and deployment

## Scripts

- `pnpm dev` - Start both web and server in development
- `pnpm build` - Build all packages
- `pnpm test` - Run test suite
- `pnpm lint` - Lint all code
- `pnpm format` - Format code with Prettier

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run linting and formatting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.