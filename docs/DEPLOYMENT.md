# Deployment

Running the academy locally, on Render, in Docker or on your own server. [النسخة العربية](ar/DEPLOYMENT.md)

Last reviewed: 13 October 2026. See also [diagram 13](diagrams/13-testing-ci-cd-deployment.md) and [DATABASE.md](DATABASE.md).

## 1. What the app needs

- **Node.js 22 or newer.**
- **A persistent, writable disk** for the SQLite file, if accounts and edits must survive restarts.
- **One server instance.** The database file and the login throttle live on that instance.
- No external database, email service or API keys.

Hosts with a persistent disk: Render (paid instance with a disk), a VPS (Hetzner, DigitalOcean, Lightsail), Fly.io or Railway with a volume, or any Docker host.

**Not suitable as is:** serverless platforms such as Vercel or Netlify Functions. They have no persistent writable disk, so the SQLite file can't be kept. Moving there would mean switching to PostgreSQL first (see [ARCHITECTURE.md](ARCHITECTURE.md#9-scaling-path)).

## 2. Start-up sequence

`npm run build` and `npm start` both run `scripts/prepare.ts` first. It:

1. creates the database file if needed and applies migrations;
2. inserts any missing seed content and never overwrites existing rows;
3. creates the first administrator from `ADMIN_EMAIL` and `ADMIN_PASSWORD`, if no administrator exists yet.

Demo accounts are created only by `npm run dev`, and never when `NODE_ENV=production`.

## 3. Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_PATH` | Production: yes | `./data/academy.db` | Location of the SQLite file. Point it at the persistent disk |
| `NODE_ENV` | Production: yes | set by Next.js | `production` disables demo accounts, `/dev/outbox` and `db:reset` |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Render's `RENDER_EXTERNAL_URL`, else `http://localhost:3000` | Public address used in reset links, canonical URLs and the sitemap. Set it when you use a custom domain |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | For the first start | — | Create the first administrator if none exists. Server-only, never sent to the browser. The password needs 10+ characters with a letter and a number |
| `ADMIN_NAME` | No | `Administrator` | Display name for that administrator |
| `DEMO_PASSWORD` | No | `Demo-Password-2026` | Password for development demo accounts |
| `INSECURE_COOKIES` | No | — | `1` allows session cookies over plain `http` when testing a production build on a LAN address. Never on a public site |
| `PORT` | No | `3000` | Port for `npm start` |

Copy `.env.example` to `.env.local` for local overrides.

## 4. Local

**Development** (hot reload, demo accounts):

```bash
npm ci
npm run dev            # http://localhost:3000 and http://localhost:3000/ar
```

**Production build on your machine:**

```bash
npm run build
npm start              # http://localhost:3000
```

Browsers accept secure cookies on `http://localhost`, so signing in works. To open it from another device on your network (`http://192.168.x.x:3000`), start with `INSECURE_COOKIES=1`.

Windows users: see the step-by-step section in the [README](../README.md#run-it-locally). Use PowerShell or Command Prompt. No build tools are needed, because `better-sqlite3` ships prebuilt binaries.

## 5. Render

The repository includes a Blueprint, `render.yaml`. Render reads it and creates the web service with the right settings. It starts on Render's **free plan**, so you can try the site at no cost. Switch to the persistent setup (Option B) when real learners start using it.

### Option A: free demo (the Blueprint's default)

What to expect on the free plan:

- the service sleeps after about 15 minutes without visits, and the next visit waits roughly a minute while it wakes up;
- there is no persistent disk, so **every restart, wake-up or deploy starts from a fresh database**. The content is always there (it's seeded during the build and at start), and the administrator is recreated from the environment variables, but new accounts, progress and admin edits are lost.

Steps:

1. Sign in at <https://dashboard.render.com> (you can sign in with GitHub).
2. Open <https://render.com/deploy?repo=https://github.com/eman-dev2/qa-engineering-academy> (the **Deploy to Render** button in the README). Or choose **New → Blueprint**, connect GitHub if asked, and pick the `eman-dev2/qa-engineering-academy` repository.
3. Render shows the service `qa-engineering-academy` (plan: Free). Fill in the two prompted values:
   - `ADMIN_EMAIL`: your email;
   - `ADMIN_PASSWORD`: a strong password (10+ characters, with a letter and a number).
4. Select **Deploy Blueprint** (or **Apply**). The first build takes a few minutes. The build log shows `administrator created: you@example.com`, and the service status changes to **Live**.
5. Open the URL Render shows, for example `https://qa-engineering-academy.onrender.com` (Render adds a suffix if that name is taken). Log in with the admin email and password.

What the Blueprint sets:

```yaml
plan: free
buildCommand: npm ci --include=dev && npm run build
startCommand: npm start
envVars: NODE_VERSION=22, NODE_ENV=production, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME=Eman Abo-Oun
autoDeploy: true      # every push to main redeploys
```

### Option B: persistent, Starter instance with a disk

Accounts, progress and admin edits are kept across restarts and deploys. Render's Starter instance is a paid plan (check current pricing on render.com); disks require a paid instance. Change `render.yaml` as follows, then commit and push. Render applies Blueprint changes on the next sync.

```yaml
    plan: starter
    # The disk isn't mounted while building, so the build uses its own throwaway database.
    buildCommand: npm ci --include=dev && DATABASE_PATH=./data/build.db npm run build
    envVars:
      # ...keep the existing variables, and add:
      - key: DATABASE_PATH
        value: /var/data/academy.db
    disk:
      name: academy-data
      mountPath: /var/data
      sizeGB: 1
```

- The build prerenders pages from its own throwaway database (`build.db`), because the disk isn't mounted while building.
- At start, the app migrates and seeds the database on the disk.
- Pages built from the build database are refreshed from the live one within the hour, and immediately after any admin edit.
- Switching from Option A starts with a fresh database on the disk. Nothing is lost, because the free plan doesn't keep data anyway.

`ADMIN_PASSWORD` is only read when the database has no administrator. With Option B you can remove it from the service's **Environment** after the first start. On the free plan, keep it: the administrator is recreated from it whenever the database starts fresh.

### Custom domain

In the service's **Settings → Custom Domains**, add your domain and the DNS records Render shows. Then set `NEXT_PUBLIC_SITE_URL=https://your-domain` and redeploy, so reset links and the sitemap use it.

### Shell, logs and backups on Render

- **Logs:** reset links (until real email is added) and start-up messages appear here.
- **Shell** (paid instances): `npm run admin:create -- --email … --name "…"`, `npm run user:role -- grant … instructor`, or a database backup (see [DATABASE.md](DATABASE.md#7-backups-and-restore)).
- Render takes daily snapshots of persistent disks.

## 6. Docker

```bash
docker build -t qa-academy .
docker run -d --name qa-academy -p 3000:3000 \
  -v qa-academy-data:/data \
  -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD='a-strong-password-1' \
  -e NEXT_PUBLIC_SITE_URL=https://your-domain \
  qa-academy
```

- The database lives on the `/data` volume (`DATABASE_PATH=/data/academy.db`).
- Put a TLS-terminating reverse proxy (Caddy, nginx, Traefik) in front, because session cookies are `Secure` in production.
- The Dockerfile follows the same build and start steps as the tested Render build, but it hasn't been built in this project's environment, which has no Docker daemon. Report any problem as an issue.

## 7. A plain Linux server

```bash
# as a non-root user, with Node.js 22 installed
git clone https://github.com/eman-dev2/qa-engineering-academy.git && cd qa-engineering-academy
npm ci --include=dev
export NODE_ENV=production DATABASE_PATH=/srv/qa-academy/academy.db NEXT_PUBLIC_SITE_URL=https://your-domain
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password-1' npm run build
npm start          # keep it running with systemd or pm2; proxy HTTPS to port 3000
```

Updating: `git pull && npm ci --include=dev && npm run build`, then restart. Seeding adds new content and keeps your edits.

## 8. After deploying: checklist

- [ ] The site opens in English (`/`) and Arabic (`/ar`).
- [ ] You can log in as the administrator and open **Admin**.
- [ ] `/dev/outbox` returns "page not found".
- [ ] A new sign-up gets the learner role only (check **Admin → Users and roles**).
- [ ] `/robots.txt` ends with your public address. If it shows `localhost`, set `NEXT_PUBLIC_SITE_URL` to the public address and redeploy.
- [ ] `NEXT_PUBLIC_SITE_URL` is set if you use a custom domain.
- [ ] Option B only: backups are planned (Render's disk snapshots plus your own copies).

## 9. Updating content and code

- **Code:** push to `main`. CI runs the checks, and Render redeploys automatically (`autoDeploy: true`).
- **New seed content** (a new lesson file, for example) is inserted at the next start. Content already edited in the studio is never overwritten.
- **Studio edits** are live immediately. They survive deploys only with a persistent disk (Option B, or Docker or a plain server with a persistent path).
