# GearLedger

Full-stack capstone: **Flask** REST API + **React** (Vite) SPA for shared **equipment checkout** (school clubs, makerspaces, small teams). Aligns with the **GearLedger** project pitch: catalog, member checkouts with due dates, and custodian inventory management.

## Features

- **JWT authentication** — register, login; token stored in `localStorage`; `Authorization: Bearer` on API calls.
- **Roles** — The **first registered user** becomes **custodian** (inventory admin). Later users are **members**.
- **Resources**
  - **Equipment** (`/api/equipment`) — catalog with total vs. available quantity (available = total minus active checkouts). Custodians: full CRUD. Members: read-only list/detail.
  - **Checkouts** (`/api/checkouts`) — members create and manage **their own** loans (update notes/status/due date for own rows; delete own). Custodians see **all** checkouts and may update quantity or delete any.
- **React UI** — protected routes, nav reflects login + custodian link, responsive layout.
- **Security** — Passwords hashed with Werkzeug; secrets from environment; API namespaced under `/api/*`.

## Tech stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Python 3, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Cors |
| Database | SQLite (default); set `DATABASE_URL` for Postgres |
| Frontend | React 18, React Router 6, Vite 5                |

## Local setup

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # Windows — or: cp .env.example .env
# Edit .env: set SECRET_KEY and JWT_SECRET_KEY to random strings
python run.py
```

API runs at **http://127.0.0.1:5555** (debug mode).

SQLite file (default): `backend/instance/gearledger.db`. Delete that file to reset the database (e.g. to make the next registered user the custodian again).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://127.0.0.1:5173**. Vite **proxies** `/api` to the Flask server so you do not need `VITE_API_URL` locally.

### 3. Try it

1. Register the first account → becomes **custodian**.
2. **Manage inventory** — add equipment (name, description, total quantity).
3. Register a second account (member) in another browser/incognito.
4. Member: **Equipment** → open item → **Check out** → **My checkouts** → mark returned or delete.

## API overview

Base path: `/api`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Body: `{ email, password }` |
| POST | `/api/auth/login` | No | Body: `{ email, password }` |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/equipment` | JWT | List items + `available_quantity` |
| GET | `/api/equipment/<id>` | JWT | Single item |
| POST | `/api/equipment` | JWT custodian | Create item |
| PUT | `/api/equipment/<id>` | JWT custodian | Update item |
| DELETE | `/api/equipment/<id>` | JWT custodian | Delete if no active checkouts |
| GET | `/api/checkouts` | JWT | Member: own rows; custodian: all |
| GET | `/api/checkouts/<id>` | JWT | Owner or custodian |
| POST | `/api/checkouts` | JWT | Body: `{ equipment_id, quantity, due_date, notes? }` |
| PUT | `/api/checkouts/<id>` | JWT | Owner or custodian (see server rules) |
| DELETE | `/api/checkouts/<id>` | JWT | Owner or custodian |

## Deployment notes (optional)

- Set `DATABASE_URL` (e.g. Postgres) and strong `SECRET_KEY` / `JWT_SECRET_KEY` on the host.
- Set `CORS_ORIGINS` to your deployed frontend URL(s), comma-separated.
- Build the frontend: `cd frontend && npm run build`; serve `dist/` as static files or use a static host.
- Set `VITE_API_URL` at **build time** to your public API origin if the frontend is not served from the same host as the API.

## Project structure

```
backend/
  run.py
  gearledger/
    __init__.py      # app factory, CORS, blueprints
    config.py
    models.py
    auth_routes.py
    equipment_routes.py
    checkout_routes.py
frontend/
  src/
    App.jsx
    api.js
    context/AuthContext.jsx
    components/
    pages/
```

## License

Educational use — capstone project.
