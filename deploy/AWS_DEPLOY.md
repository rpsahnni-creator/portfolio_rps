# Deploying to AWS (fits inside a $100 free-credit budget)

This app is now self-contained: FastAPI backend + PostgreSQL 18 + React frontend, all run via
Docker. One small EC2 instance runs the whole thing — no RDS, no ECS, no Elastic Beanstalk — so
cost stays far inside a $100 credit over several months.

## Cost estimate

| Item | Type | Approx. cost |
|---|---|---|
| EC2 instance | `t3.small` (2 GB RAM — recommended; `t2.micro`/`t3.micro` free-tier eligible for 12 months also works but is tight for a build) | ~$15/mo on-demand, $0 if still in the 12-month free tier |
| EBS volume | 20–30 GB gp3 (root + Docker + Postgres data) | ~$2–3/mo (30 GB is inside the free-tier 30 GB) |
| Elastic IP | attached to a *running* instance | $0 (charged only if left unattached) |
| Data transfer | a portfolio site's traffic | a few cents/mo |
| Domain (optional) | Route 53 or any registrar | ~$1/mo if using Route 53 hosted zone |

A `t3.small` running 24/7 for a full month costs well under $20 — the $100 credit covers several
months even without the free tier.

## 1. Launch the EC2 instance

1. AWS Console → EC2 → Launch Instance.
2. AMI: **Ubuntu Server 22.04 LTS** (or 24.04).
3. Instance type: `t3.small` (or `t3.micro`/`t2.micro` if you want to stay strictly in the free tier).
4. Key pair: create/download one — you'll need it for SSH.
5. Network settings → Security group: allow
   - SSH (22) — from your IP only
   - HTTP (80) — from anywhere
   - HTTPS (443) — from anywhere
6. Storage: 20–30 GB gp3.
7. Launch, then allocate and associate an **Elastic IP** to the instance (EC2 → Elastic IPs) so
   your domain's DNS doesn't break on reboot.

## 2. Point your domain at it (optional but recommended)

Add an `A` record for your domain (and `www`) pointing to the Elastic IP. Skip this and use the
bare IP if you don't have a domain yet — Caddy (step 5) will just serve plain HTTP in that case.

## 3. Install Docker on the instance

```bash
ssh -i your-key.pem ubuntu@<ELASTIC_IP>

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
# log out and back in so the group change takes effect
```

## 4. Deploy the app

```bash
git clone <your-repo-url> rps_portfolio
cd rps_portfolio
cp .env.example .env
nano .env   # fill in real values — see below
```

Fill in `.env` at the repo root:

- `POSTGRES_PASSWORD` — pick a strong password (used only inside the Docker network, not exposed).
- `JWT_SECRET` — generate with `openssl rand -hex 32`.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — your admin panel login (seeded automatically on first boot).
- `OWNER_EMAIL` — where contact-form notifications are sent.
- `SMTP_*` — see **Email** below. Leave blank to launch without email (enquiries still save to the
  database; you just won't get notified).
- `REACT_APP_BACKEND_URL` — leave **empty** (same-domain deploy; nginx proxies `/api` to the backend).
- `CORS_ORIGINS` — your domain, e.g. `https://rpsahnni.dev,https://www.rpsahnni.dev` (or
  `http://<ELASTIC_IP>` if you have no domain yet).

Then build and start everything:

```bash
docker compose up -d --build
docker compose ps        # all three services should be "running"/"healthy"
docker compose logs -f backend   # check for startup errors
```

The app is now listening on `127.0.0.1:8080` on the instance (not yet public — that's step 5).

## 5. Put Caddy in front for free, automatic HTTPS

Caddy gets a Let's Encrypt certificate and renews it automatically — no certbot cron jobs to
maintain.

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
```

Edit `/etc/caddy/Caddyfile`:

```
rpsahnni.dev, www.rpsahnni.dev {
    reverse_proxy 127.0.0.1:8080
}
```

(No domain yet? Use `http://<ELASTIC_IP> { reverse_proxy 127.0.0.1:8080 }` instead — Caddy will
serve plain HTTP without attempting a certificate.)

```bash
sudo systemctl reload caddy
```

Visit your domain — the site should load over HTTPS, admin login should work, and cookies will be
set correctly since the whole site is served from one origin over TLS.

## 6. Email (contact form)

The app sends email over plain SMTP, so any provider works. On AWS, **SES** is the natural choice
(62,000 free emails/month when sent from an EC2 instance):

1. SES Console → verify your sending domain (or at least the `SMTP_FROM_EMAIL` address) — SES
   starts in sandbox mode, where you can only send to verified addresses until you request
   production access (Console → "Request production access", usually approved within a day).
2. SES Console → SMTP settings → "Create SMTP credentials" — this gives you an SMTP username/password
   (different from your AWS IAM credentials).
3. Set in `.env`:
   ```
   SMTP_HOST=email-smtp.<your-ses-region>.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=<the SMTP username SES gave you>
   SMTP_PASSWORD=<the SMTP password SES gave you>
   SMTP_FROM_EMAIL=no-reply@yourdomain.com   # must be a verified identity
   ```
4. `docker compose up -d` (restarts the backend with the new env).

Gmail, SendGrid, Mailgun etc. also work the same way — just set `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD`
to that provider's values.

## 7. Backups

Postgres data lives in the `pgdata` Docker volume on the instance's EBS disk. A simple daily dump:

```bash
# /etc/cron.d/pg-backup  (adjust the path/bucket to taste)
0 3 * * * ubuntu docker compose -f /home/ubuntu/rps_portfolio/docker-compose.yml exec -T db pg_dump -U postgres rps_portfolio | gzip > /home/ubuntu/backups/db-$(date +\%F).sql.gz
```

Optionally sync `/home/ubuntu/backups` to an S3 bucket (free tier: 5 GB) with `aws s3 sync` on a cron job.

## 8. Updating the app later

```bash
cd rps_portfolio
git pull
docker compose up -d --build
```

Tables are created automatically on backend startup if they don't exist yet (see `backend/db.py`),
so no manual migration step is needed for this app's current schema.

## Local development (this machine)

You already have PostgreSQL 18 running locally with a `rps_portfolio` database created and the
schema/seed data loaded — `backend/.env` points at it. To run everything without Docker:

```bash
# backend
cd backend
.venv\Scripts\python -m uvicorn server:app --reload --port 8000

# frontend (separate terminal)
cd frontend
yarn start
```

Or, to test the exact Docker setup used in production, install Docker Desktop and run
`docker compose up --build` from the repo root (copy `.env.example` to `.env` first).
