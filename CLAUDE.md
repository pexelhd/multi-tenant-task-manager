# Task Manager

Full-stack task management app with Keycloak auth and AI integration.

## Stack
- **Frontend**: React 19 + Vite + TailwindCSS + shadcn/ui + React Query + React Router
- **Backend**: Node.js + Express 5 + Sequelize + PostgreSQL
- **Auth**: Keycloak (JWT / jwks-rsa)
- **AI**: Anthropic Claude SDK + OpenAI SDK
- **Infrastructure**: Docker Compose (PostgreSQL + Keycloak)

## Project Structure
\frontend/         # React Vite app
  src/
backend/          # Express API
  server.js       # entry point
  routes/
  controllers/
  models/         # Sequelize models
  middleware/
  validators/
  config/
docker-compose.yml
\
## Common Commands
\\ash
# Start infrastructure
docker compose up -d

# Backend
cd backend && npm run dev   # nodemon server.js

# Frontend
cd frontend && npm run dev  # Vite dev server (default: http://localhost:5173)

# Keycloak admin UI: http://localhost:8080
\
## Notes
- Auth is handled via Keycloak (keycloak-js on frontend, jwks-rsa on backend)
- Database: PostgreSQL via Sequelize ORM
- AI features use both Anthropic and OpenAI SDKs
