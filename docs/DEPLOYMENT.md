# Deployment

Date: 2026-05-04

## Target Stack

```text
Application: Next.js App Router
Database: MongoDB Atlas
Content uploads: Vercel Blob
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
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

The app can run without `MONGODB_URI`, but it will use browser local storage fallback and return `configured: false` from `/api/health/atlas`.

The app can render without `BLOB_READ_WRITE_TOKEN`, but content uploads will not work until a Vercel Blob store is connected.

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
media_assets
export_packages
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
BLOB_READ_WRITE_TOKEN
```

Vercel creates `BLOB_READ_WRITE_TOKEN` automatically when a Blob store is connected to the project from the Storage tab. Pull it locally with:

```bash
cd web
vercel env pull .env.local
```

After deployment, verify:

```text
/api/health/atlas
/api/health/blob
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
- Content uploads call `POST /api/uploads` for a client upload token, then the browser uploads directly to Vercel Blob.
- Uploaded content metadata is stored in `media_assets` when Atlas is configured.
- Uploaded content can be reviewed as `Needs review`, `Approved`, or `Rejected`; review state is persisted through `POST /api/media-assets`.
- Approved draft exports call `POST /api/export-packages`; generated manifests include only approved Blob assets in the publishable asset list.
- Without Atlas env vars, persistence endpoints return `persisted: false` and the UI keeps local browser persistence.
- With Atlas env vars, drafts are upserted into `episode_drafts`, media assets into `media_assets`, export packages into `export_packages`, and metrics are inserted into `platform_metrics`.
