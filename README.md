# Multi-Tenant Task Management System

A full-stack multi-tenant task management application with role-based access control (RBAC), Keycloak SSO authentication, and an AI-powered chat assistant.

## Tech Stack

**Frontend:** React (Vite), ShadCN UI, Axios, TanStack Query, Zod, React Router, Tailwind CSS v4, Keycloak JS adapter

**Backend:** Express.js, Sequelize ORM, Joi validation, JWT verification via Keycloak JWKS

**Database:** PostgreSQL

**Authentication:** Keycloak (SSO, JWT-based, RBAC)

**AI Chat:** Groq API (OpenAI-compatible, Llama 3.3 70B)

---

## Architecture Overview

This is a multi-tenant system where multiple companies (tenants) share the same application instance with strict data isolation enforced at the API layer.

### Roles

| Role | Scope |
|---|---|
| **Super Admin** | Full system access — manage all tenants, users, and tasks across the platform |
| **Admin** | Scoped to their own tenant — manage users and tasks within that tenant only |
| **Staff** | Scoped to their own assigned tasks — can view and update task status only |

### Request Flow

1. User authenticates via Keycloak (SSO, Authorization Code + PKCE flow on the frontend)
2. Frontend receives a JWT access token, attached to every API request via Axios interceptor
3. Backend middleware (`verifyToken`) validates the JWT signature against Keycloak's public JWKS endpoint
4. A second middleware (`loadDbUser`) maps the Keycloak identity to a local `User` record (for tenant scoping)
5. RBAC middleware (`requireRole`) gates access to specific roles
6. Controllers enforce tenant-level data isolation on top of role checks

### Database Schema

- **Tenant**: `id`, `name`
- **User**: `id`, `keycloakId`, `email`, `name`, `role`, `tenantId`
- **Task**: `id`, `title`, `description`, `status`, `dueDate`, `tenantId`, `assignedToId`, `createdById`

---

## Project Setup

### Prerequisites

- Node.js 24+
- Docker Desktop (with WSL2 integration enabled, if on Windows)
- A free [Groq API key](https://console.groq.com/keys) (for the AI Chat feature)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd task-manager
```

### 2. Start PostgreSQL and Keycloak via Docker

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on port `5432`
- **Keycloak** on port `8080`

### 3. Configure Keycloak

1. Go to `http://localhost:8080/admin` and log in with the admin credentials set in `docker-compose.yml`
2. Create a realm named `task-manager`
3. Create a client:
   - **Client ID**: `task-manager-app`
   - **Client authentication**: **Off** (public client — required for frontend SSO via PKCE)
   - **Standard flow**: enabled
   - **Direct access grants**: enabled (optional, useful for testing via curl)
   - **Valid redirect URIs**: `http://localhost:5173/*`
   - **Valid post logout redirect URIs**: `http://localhost:5173/*`
   - **Web origins**: `http://localhost:5173`
4. Create three **Realm roles**: `SUPER_ADMIN`, `ADMIN`, `STAFF`
5. Create at least one test user, set a (non-temporary) password, and assign them the `SUPER_ADMIN` role under **Role mapping**

### 4. Backend setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in real values, see below
node seed.js            # seeds the Super Admin user into Postgres — see "Assumptions" below
npm run dev             # or: node server.js
```

Backend runs on `http://localhost:5000`.

### 5. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # then fill in real values, see below
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 6. Log in

Navigate to `http://localhost:5173`, click **Login with SSO**, and sign in with the test user created in Keycloak.

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_manager
DB_USER=taskadmin
DB_PASSWORD=your_db_password
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=task-manager
KEYCLOAK_CLIENT_ID=task-manager-app
GROQ_API_KEY=your_groq_api_key
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=task-manager
VITE_KEYCLOAK_CLIENT_ID=task-manager-app
```

---

## Database Setup (PostgreSQL)

The database and tables are managed via Sequelize. On first run, models sync automatically through the app's connection (see `models/index.js`). No manual migration step is required for this assessment — Sequelize handles table creation on startup via `sequelize.sync()` in the seed/test scripts.

---

## Assumptions & Notes

- **Keycloak ↔ Local DB user mapping**: Keycloak manages authentication identity; the local Postgres `users` table manages tenant scoping and role-based business logic. A user must exist in **both** systems — Keycloak (for login) and Postgres (for authorization context) — for the app to recognize them. New users are provisioned through the **Users** page (Super Admin/Admin), which currently expects a Keycloak User ID to be entered manually; in a production system this would be automated via the Keycloak Admin REST API.
- **Initial Super Admin bootstrapping**: since the system has no users on first run, a one-time `seed.js` script is provided to insert the first Super Admin record into Postgres, matched to a Keycloak user created via the Admin Console. This avoids a chicken-and-egg problem where no Super Admin exists yet to create other users.
- **AI Chat provider**: the spec calls for an AI-powered chat backed by an LLM provider. This implementation uses **Groq** (OpenAI-compatible API, Llama 3.3 70B model) rather than OpenAI or Anthropic directly, chosen for its free tier suitability for this assessment. The integration pattern (backend-only API key, `/api/ai/chat` endpoint, frontend calls via Axios) is provider-agnostic and can be swapped for any OpenAI-compatible or custom LLM endpoint by changing the `baseURL` in `controllers/aiChatController.js`.
- **Direct access grants**: left enabled on the Keycloak client to support quick backend testing via curl during development. This can be disabled for a stricter production security posture, since the frontend only uses the Authorization Code + PKCE flow.
- **Token storage**: JWT access/refresh tokens are stored in `localStorage` on the frontend for simplicity. A production system might prefer httpOnly cookies to mitigate XSS risk.

---


## Project Structure

```
project-root/
├── screenshots/
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, ProtectedRoute, ChatWidget, ui/ (ShadCN)
│   │   ├── pages/           # Dashboard, Tenants, Users, Tasks
│   │   ├── context/         # AuthContext (Keycloak)
│   │   ├── lib/             # api.js, keycloak.js, tenantApi.js, userApi.js, taskApi.js
│   │   └── App.jsx
│   └── .env.example
├── backend/
│   ├── controllers/         # tenant, user, task, aiChat
│   ├── routes/
│   ├── middleware/          # auth (JWT), rbac, loadDbUser, validate
│   ├── models/               # Tenant, User, Task (Sequelize)
│   ├── validators/          # Joi schemas
│   ├── seed.js
│   └── .env.example
└── README.md
```
