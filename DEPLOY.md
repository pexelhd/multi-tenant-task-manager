# Deploying to Render

## What gets created

| Service | Type | Plan |
|---|---|---|
| `task-manager-db` | PostgreSQL | Free |
| `task-manager-keycloak` | Web Service (Docker) | Free |
| `task-manager-backend` | Web Service (Docker) | Free |
| `task-manager-frontend` | Static Site | Free |
| `keycloak-db` | PostgreSQL (for Keycloak) | Free |

---

## Step 1 — Push to GitHub

```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

---

## Step 2 — Create services on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New → Blueprint**
3. Connect your GitHub repo
4. Render reads `render.yaml` and creates all 5 services automatically

---

## Step 3 — Set secret environment variables

Render will pause on `sync: false` vars. Fill these in the dashboard:

### `task-manager-keycloak` service
| Key | Value |
|---|---|
| `KEYCLOAK_ADMIN_PASSWORD` | A strong password you choose |

### `task-manager-backend` service
| Key | Value |
|---|---|
| `KEYCLOAK_URL` | `https://task-manager-keycloak.onrender.com` (set after Keycloak deploys) |
| `KEYCLOAK_CLIENT_SECRET` | From Keycloak admin console (Step 5) |
| `GROQ_API_KEY` | Your Groq API key from console.groq.com |

### `task-manager-frontend` service
| Key | Value |
|---|---|
| `VITE_API_URL` | `https://task-manager-backend.onrender.com/api` |
| `VITE_KEYCLOAK_URL` | `https://task-manager-keycloak.onrender.com` |

---

## Step 4 — Configure Keycloak realm

Once `task-manager-keycloak` is deployed and healthy:

1. Open `https://task-manager-keycloak.onrender.com/admin`
2. Log in with `admin` / your `KEYCLOAK_ADMIN_PASSWORD`
3. Create a new **Realm** named `task-manager`
4. Under **Clients** → Create client:
   - Client ID: `task-manager-app`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `https://task-manager-frontend.onrender.com/*`
   - Web Origins: `https://task-manager-frontend.onrender.com`
5. Go to the client's **Credentials** tab → copy the **Secret**
   → paste it as `KEYCLOAK_CLIENT_SECRET` in the backend service env vars

---

## Step 5 — Create realm roles in Keycloak

Under **Realm Roles** in your `task-manager` realm, create these three roles:

- `SUPER_ADMIN`
- `ADMIN`
- `STAFF`

---

## Step 6 — Create your first user

1. In Keycloak admin → **Users** → Add user
2. Set username/email/name, save
3. Under **Credentials** → set a password
4. Under **Role Mappings** → assign `SUPER_ADMIN`
5. Copy the user's **ID** (from the URL or user detail page)
6. In the backend, run the seed with the Keycloak user ID:

The backend has a `/api/health` endpoint — once it's up, you can seed via:
```bash
# SSH into the Render shell (or run locally pointed at prod DB)
node seed.js
# Edit seed.js first to set the correct keycloakId from Step 6
```

---

## Step 7 — Trigger a frontend redeploy

After setting all env vars, manually trigger a redeploy of the frontend so
it picks up the production `VITE_*` values:

Render Dashboard → `task-manager-frontend` → **Manual Deploy**

---

## Free tier notes

- Render free services **spin down after 15 min of inactivity** — first request after sleep takes ~30s
- Free PostgreSQL databases expire after **90 days** on Render's free tier
- Keycloak on the free plan may be slow to start — it needs ~60s on first boot

## Upgrading

To keep services always-on, upgrade the backend and Keycloak to the **Starter plan** ($7/mo each) in the Render dashboard.
