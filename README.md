# AppForge — AI App Generator

> **Track A Submission** — Full Stack Developer Internship  
> Converts JSON config → fully working web app (frontend + backend + database)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone & Install

```bash
# Install all dependencies
npm run install:all
```

### 2. Configure Environment

**Backend** — copy and edit:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/appgenerator
JWT_SECRET=change-this-to-a-long-random-string
FRONTEND_URL=http://localhost:3000
```

**Frontend** — copy and edit:
```bash
cp frontend/.env.example frontend/.env.local
```

### 3. Create Database & Run Migrations

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE appgenerator;"

# Run migrations
cd backend && npm run db:migrate
```

### 4. Start Development Servers

```bash
# From root — starts both frontend and backend
npm run dev

# Or individually:
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:3000
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    JSON Config Input                     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Config Validator / Sanitizer                │
│  - Fixes missing fields        - Normalizes types        │
│  - Handles alternate key names - Auto-generates pages    │
│  - Adds sensible defaults      - Reports warnings        │
└─────────────────────────┬───────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
┌───────────────────┐       ┌───────────────────────────┐
│  Schema Generator │       │     Dynamic API Router     │
│                   │       │                            │
│  PostgreSQL table │       │  Auto CRUD endpoints       │
│  provisioning     │       │  for any entity            │
│  (CREATE IF NOT   │       │  /:appId/data/:entity      │
│   EXISTS)         │       │                            │
└─────────┬─────────┘       └────────────┬──────────────┘
          │                              │
          └──────────────┬───────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Next.js Frontend                        │
│                                                          │
│  AppRuntime → reads config.pages[]                       │
│    → DynamicTable (searchable, sortable, paginated)      │
│    → DynamicForm  (all field types, validation)          │
│    → DynamicStats (live counts from DB)                  │
│    → DynamicChart (bar/line/pie from recharts)           │
│    → NotificationPanel (real-time in-app notifs)         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Features Implemented

### Core (Required)
- [x] **Dynamic UI** — forms, tables, dashboards from JSON config
- [x] **Dynamic API** — CRUD for any entity, auto-provisioned
- [x] **PostgreSQL** — tables created on app creation, handles schema mismatches
- [x] **Authentication** — JWT, email/password, roles, user-scoped data
- [x] **Extensibility** — add component types, field types, or API routes without touching core

### 3 Required Features (All 3 Implemented)
1. **CSV Import/Export** — Upload CSV → auto-map fields → store in DB; Export any entity
2. **Multi-language / i18n** — Config-driven locale switching, translation keys
3. **Notifications** — In-app event-based notifications, unread count, mark-all-read

### Bonus
- Fault-tolerant config parser (handles 20+ edge cases)
- Auto-page generation when pages[] is missing
- Auto-column detection from live data
- Conditional form fields (dependsOn)
- Soft delete support

---

## 🔧 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |
| POST | `/api/auth/change-password` | Change password |

### Apps
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/apps` | List user's apps |
| POST | `/api/apps` | Create app from config |
| GET | `/api/apps/:id` | Get app + config |
| PUT | `/api/apps/:id` | Update config |
| DELETE | `/api/apps/:id` | Delete app + tables |
| POST | `/api/apps/validate` | Validate without saving |

### Dynamic Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/apps/:appId/data/:entity` | List records |
| POST | `/api/apps/:appId/data/:entity` | Create record |
| GET | `/api/apps/:appId/data/:entity/:id` | Get record |
| PUT | `/api/apps/:appId/data/:entity/:id` | Update record |
| DELETE | `/api/apps/:appId/data/:entity/:id` | Delete record |
| GET | `/api/apps/:appId/data/:entity/stats` | Aggregate stats |
| POST | `/api/apps/:appId/data/:entity/import` | CSV import |
| GET | `/api/apps/:appId/data/:entity/export` | CSV export |

### Query Parameters (List endpoint)
```
?page=1&pageSize=20&search=keyword&sortBy=created_at&sortDir=desc
?status=active&priority=high  (any field filter)
```

---

## 📄 Config Schema

```json
{
  "name": "string (required)",
  "description": "string",
  "theme": {
    "primaryColor": "#6366f1",
    "mode": "light | dark | system",
    "appName": "string"
  },
  "auth": {
    "methods": ["email"],
    "roles": ["admin", "user"]
  },
  "i18n": {
    "defaultLocale": "en",
    "supportedLocales": ["en", "es"],
    "translations": { "es": { "key": "value" } }
  },
  "notifications": { "enabled": true },
  "entities": [{
    "name": "string",
    "fields": [{
      "name": "string",
      "type": "string|text|integer|float|boolean|date|timestamp|json|uuid",
      "required": false,
      "nullable": true,
      "unique": false,
      "default": "any",
      "index": false
    }],
    "timestamps": true,
    "softDelete": false,
    "userScoped": false
  }],
  "pages": [{
    "id": "string",
    "title": "string",
    "path": "/path",
    "hidden": false,
    "components": [{
      "id": "string",
      "type": "table|form|stats|chart|card|dashboard",
      "entity": "entity_name",
      "searchable": true,
      "exportable": false,
      "importable": false,
      "fields": [...],
      "columns": [...],
      "actions": [...],
      "pagination": true,
      "stats": [...],
      "chart": { "type": "bar|line|pie|donut", "xKey": "field", "yKey": "field" }
    }]
  }]
}
```

---

## 🔀 Fault Tolerance

The system handles these edge cases automatically:

| Issue | Handling |
|-------|----------|
| Missing `name` | Defaults to "Unnamed App" |
| `models` instead of `entities` | Recognized automatically |
| `screens` instead of `pages` | Recognized automatically |
| Unknown field types (varchar, int, etc.) | Mapped to closest valid type |
| Missing `pages` | Auto-generated from entities |
| Unknown component type | Renders warning, doesn't crash |
| Invalid JSON in form | Shows parse error, won't submit |
| DB column doesn't exist | Query still succeeds |
| Unknown config keys | Ignored safely |
| Mixed case field names | Converted to snake_case |

---

## 📁 Project Structure

```
ai-app-generator/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express entry point
│   │   ├── db/
│   │   │   ├── pool.ts           # PG connection pool
│   │   │   └── migrate.ts        # Core table migrations
│   │   ├── middleware/
│   │   │   └── auth.ts           # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.routes.ts    # Auth endpoints
│   │   │   ├── apps.routes.ts    # App CRUD
│   │   │   ├── data.routes.ts    # Dynamic data CRUD
│   │   │   └── notifications.routes.ts
│   │   ├── services/
│   │   │   ├── config.validator.ts  # Fault-tolerant parser
│   │   │   ├── schema.generator.ts  # DB table provisioner
│   │   │   └── data.service.ts      # Dynamic CRUD logic
│   │   └── types/
│   │       └── config.types.ts   # TypeScript definitions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── dashboard/
│   │   │       ├── page.tsx      # App list
│   │   │       ├── new/page.tsx  # JSON editor
│   │   │       ├── settings/page.tsx
│   │   │       └── apps/[appId]/
│   │   │           ├── page.tsx       # App runtime
│   │   │           └── settings/page.tsx
│   │   ├── components/
│   │   │   └── runtime/
│   │   │       ├── AppRuntime.tsx     # Page renderer
│   │   │       ├── DynamicTable.tsx   # Table + CRUD
│   │   │       ├── DynamicForm.tsx    # All field types
│   │   │       ├── DynamicStats.tsx   # Stats + Charts
│   │   │       └── NotificationPanel.tsx
│   │   ├── lib/api.ts            # Axios client
│   │   ├── store/auth.store.ts   # Zustand auth
│   │   └── types/config.ts      # Frontend types
│   └── package.json
├── configs/
│   ├── project-manager.json     # Full example config
│   └── broken-config-example.json  # Edge case demo
└── README.md
```

---

## 🧪 Testing Edge Cases

Run these curl commands to test fault tolerance:

```bash
# Test broken config (missing pages, wrong keys)
curl -X POST http://localhost:4000/api/apps/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @configs/broken-config-example.json

# Test dynamic CRUD
curl http://localhost:4000/api/apps/APP_ID/data/product?search=widget&sortBy=price&sortDir=desc

# Test CSV import
curl -X POST http://localhost:4000/api/apps/APP_ID/data/product/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@products.csv"
```

---

## 🚢 Deployment

### Backend (Railway / Render / Heroku)
```bash
cd backend
npm run build
npm start
```
Set env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`

### Frontend (Vercel)
```bash
cd frontend
npm run build
```
Set env var: `NEXT_PUBLIC_API_URL=https://your-backend.com`

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| State | Zustand, React Query |
| Charts | Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Auth | JWT, bcrypt |
| CSV | csv-parser, papaparse |
| Forms | React Hook Form |
