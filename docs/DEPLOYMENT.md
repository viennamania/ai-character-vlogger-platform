# Deployment

Date: 2026-05-04

## Target Stack

```text
Application: Next.js App Router
Database: MongoDB Atlas
Hosting: Vercel
Repository root: ai-character-vlogger-platform
Vercel root directory: web
```

## Local Setup

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:

```bash
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB="ai_character_vlogger"
```

The app can run without `MONGODB_URI`, but it will use browser local storage fallback and return `configured: false` from `/api/health/atlas`.

## MongoDB Atlas

Create a MongoDB Atlas cluster and database user, then configure the app with the Atlas connection string.

Recommended database name:

```text
ai_character_vlogger
```

Collections currently used by the app:

```text
episode_drafts
platform_metrics
```

The app uses lazy MongoDB client initialization so `next build` does not require database credentials.

## Vercel Project Setup

When importing the GitHub repository into Vercel:

```text
Framework Preset: Next.js
Root Directory: web
Install Command: npm ci
Build Command: npm run build
Output Directory: leave default
```

Set these Vercel environment variables for Preview and Production:

```text
MONGODB_URI
MONGODB_DB
```

After deployment, verify:

```text
/api/health/atlas
```

Expected connected response:

```json
{
  "configured": true,
  "connected": true,
  "database": "ai_character_vlogger"
}
```

## CLI Preview Deploy

For a preview deployment from this workspace:

```bash
vercel deploy web -y
```

Use production deploy only when explicitly ready:

```bash
vercel deploy web --prod -y
```

## Runtime Behavior

- Draft saves call `POST /api/drafts`.
- Metrics saves call `POST /api/metrics`.
- Without Atlas env vars, both endpoints return `persisted: false` and the UI keeps local browser persistence.
- With Atlas env vars, drafts are upserted into `episode_drafts` and metrics are inserted into `platform_metrics`.
