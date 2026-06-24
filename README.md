# Multi-Tenant Task Manager

A production-ready full-stack task management system with multi-tenancy, role-based access control, analytics, AI chat, and task comments — deployed live on Render.

**Live Demo:** [task-manager-frontend-hxbt.onrender.com](https://task-manager-frontend-hxbt.onrender.com)

> Demo credentials: `superadmin` / `Admin1234!`

---

## Features

- **Multi-tenancy** — strict data isolation per tenant at the API layer
- **RBAC** — Super Admin, Admin, and Staff roles with scoped permissions
- **Keycloak SSO** — Authorization Code + PKCE flow, JWT verification via JWKS
- **Task management** — priority (HIGH/MEDIUM/LOW), status, due dates, assignees, overdue detection
- **Task comments** — threaded comments/instructions per task, role-aware delete
- **Analytics dashboard** — area chart (30-day activity), pie charts (status/priority), bar chart (workload by assignee), breakdown tables
- **AI chat assistant** — powered by Groq + Llama 3.3 70B, session-persistent with quick prompts
- **Advanced UI** — debounced search, multi-filter, sortable columns, pagination, task detail drawer, loading skeletons

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TailwindCSS v4, shadcn/ui, React Query, React Router 7 |
| Backend | Node.js, Express 5, Sequelize ORM, Joi validation |
| Database | PostgreSQL 18 |
| Auth | Keycloak 24 (SSO, JWT, PKCE) |
| AI | Groq API — Llama 3.3 70B |
| Charts | Recharts |
| Deployment | Render (Node + Static + PostgreSQL free tier) |

## Roles & Permissions

| Role | Tasks | Users | Tenants | Comments |
|---|---|---|---|---|
| **SUPER_ADMIN** | All tenants — full CRUD | Create any user in any tenant | Full CRUD | Add/delete any |
| **ADMIN** | Own tenant only — full CRUD | Own tenant users only | Read only | Add/delete own |
| **STAFF** | Assigned tasks only — status update | Read only | No access | Add on assigned tasks |

## Architecture

```
Browser → Keycloak (SSO / PKCE) → JWT token
       → Frontend (React + Vite) → Axios + Bearer token
       → Backend (Express) → verifyToken → loadDbUser → requireRole
       → PostgreSQL (Sequelize) — tenant-scoped queries
```

## Project Structure

```
task-manager/
├── frontend/
│   └── src/
│       ├── pages/          # Dashboard, Analytics, Tasks, Users, Tenants
│       ├── components/     # Layout, ChatWidget, ui/ (shadcn)
│       ├── context/        # AuthContext (Keycloak)
│       └── lib/            # api, taskApi, commentApi, analyticsApi...
├── backend/
│   ├── controllers/        # task, user, tenant, comment, analytics, aiChat, db
│   ├── routes/
│   ├── middleware/         # auth, rbac, loadDbUser, validate
│   ├── models/             # Tenant, User, Task, TaskComment (Sequelize)
│   └── validators/         # Joi schemas
├── render.yaml             # Render Blueprint (3 services + DB)
└── DEPLOY.md               # Step-by-step deployment guide
```

## Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop (WSL2 integration on Windows)
- Free [Groq API key](https://console.groq.com/keys)

### 1. Start infrastructure
```bash
docker compose up -d   # starts PostgreSQL + Keycloak
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in values
npm install
node server.js         # auto-syncs DB schema on startup
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env   # fill in values
npm install
npm run dev
```

### 4. Seed first user
```bash
cd backend
node seed.js   # creates Super Admin in DB (Keycloak user must exist first)
```

### Environment Variables

**Backend (`backend/.env`)**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_manager
DB_USER=taskadmin
DB_PASSWORD=your_password
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=task-manager
KEYCLOAK_CLIENT_ID=task-manager-app
GROQ_API_KEY=your_groq_key
```

**Frontend (`frontend/.env`)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=task-manager
VITE_KEYCLOAK_CLIENT_ID=task-manager-app
```

## Deployment (Render)

See [DEPLOY.md](DEPLOY.md) for the full step-by-step guide. The `render.yaml` Blueprint provisions everything automatically:
- `task-manager-db` — PostgreSQL free
- `task-manager-backend` — Node web service free
- `task-manager-frontend` — Static site free
