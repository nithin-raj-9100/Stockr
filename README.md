# Stockr

A production-ready full-stack Inventory & Order Management System built for businesses to manage products, customers, and orders with real-time stock tracking.

## Tech Stack

- **Backend** — Python 3.12 + FastAPI, managed with `uv`
- **Frontend** — React + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Database** — PostgreSQL (Supabase)
- **Containerization** — Docker + Docker Compose

## Features

- Product management with SKU tracking and stock levels
- Customer management
- Order creation with automatic stock deduction and total calculation
- Dashboard with live stats and low-stock alerts
- Form validation with Zod
- Responsive UI with dark/light mode support

## Getting Started

### Prerequisites

- Python 3.12+, `uv`, Node.js 22+, `pnpm`, Docker

### Local Development

1. Copy the env file and fill in your values:
   ```bash
   cp .env.example .env
   ```

2. Start the backend:
   ```bash
   cd backend
   uv run alembic upgrade head
   uv run uvicorn app.main:app --reload --port 8000
   ```

3. Start the frontend:
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

### Docker

```bash
docker compose up --build
```

Frontend → `http://localhost:3000`  
Backend API → `http://localhost:8000`  
Swagger docs → `http://localhost:8000/docs`

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST/GET | `/api/v1/products` | Create / list products |
| GET/PUT/DELETE | `/api/v1/products/{id}` | Read / update / delete |
| POST/GET | `/api/v1/customers` | Create / list customers |
| GET/DELETE | `/api/v1/customers/{id}` | Read / delete |
| POST/GET | `/api/v1/orders` | Create / list orders |
| GET/DELETE | `/api/v1/orders/{id}` | Read with items / cancel |
| GET | `/api/v1/dashboard/stats` | Summary stats + low stock |
