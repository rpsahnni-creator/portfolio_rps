# rpsahnni.dev — Portfolio

Full-stack portfolio site: FastAPI backend, PostgreSQL 18 database, React (CRA) frontend, with a
built-in admin panel for projects/skills/testimonials/enquiries/resume.

## Stack

- **Frontend**: React 19, CRA + craco, Tailwind, shadcn/radix-ui
- **Backend**: FastAPI, asyncpg (PostgreSQL), JWT auth (bcrypt-hashed passwords)
- **Database**: PostgreSQL 18
- **Email**: plain SMTP (any provider — AWS SES, Gmail, SendGrid, ...)

## Local development

### 1. Database

Needs a running PostgreSQL 18 server and a database created once:

```bash
psql -U postgres -c "CREATE DATABASE rps_portfolio;"
```

Tables and seed content are created automatically the first time the backend starts.

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt   # or requirements-dev.txt for test/lint tools
cp .env.example .env   # fill in POSTGRES_PASSWORD, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, OWNER_EMAIL
.venv\Scripts\python -m uvicorn server:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # set REACT_APP_BACKEND_URL=http://localhost:8000
yarn install
yarn start
```

Admin panel: `http://localhost:3000/admin` (login with `ADMIN_EMAIL`/`ADMIN_PASSWORD` from
`backend/.env`).

## Running the whole stack with Docker

```bash
cp .env.example .env   # fill in the same values as above
docker compose up --build
```

Opens on `http://localhost:8080`.

## Deploying to AWS

See [deploy/AWS_DEPLOY.md](deploy/AWS_DEPLOY.md) for a step-by-step guide (EC2 + Docker + Caddy for
automatic HTTPS), sized to fit comfortably inside a $100 AWS credit.
