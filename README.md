# AI Character Vlogger Platform

This workspace captures the initial product research and planning for a creator platform that lets anyone operate an AI character vlog channel.

## Documents

- [Project Brief](./docs/PROJECT_BRIEF.md): product concept, positioning, target users, and strategy
- [PRD](./docs/PRD.md): product requirements, MVP scope, metrics, and safety requirements
- [Persona Management](./docs/PERSONA_MANAGEMENT.md): character bible, memory, prompt assembly, and versioning model
- [Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md): system design, services, integrations, and data model
- [MVP Roadmap](./docs/MVP_ROADMAP.md): build phases, scope, risks, and mitigations
- [Research Summary](./docs/RESEARCH_SUMMARY.md): industry, Fanvue API, vlog platforms, and strategic conclusions
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md): current prototype, engineering sequence, backend boundaries, and next milestones
- [Deployment](./docs/DEPLOYMENT.md): MongoDB Atlas, Next.js, and Vercel hosting setup

## Current App Stack

The current implementation stack is:

```text
Next.js App Router
+ MongoDB Atlas through the official MongoDB Node.js driver
+ Vercel Blob for content uploads
+ Approved-asset export manifests for reviewed media packages
+ Editable episode drafts before human review
+ Vercel hosting
```

The deployable app lives in `web/`.

```bash
cd web
npm install
npm run dev
```

Production checks:

```bash
cd web
npm run typecheck
npm run test
npm run build
```

MongoDB Atlas is configured through environment variables:

```bash
MONGODB_URI="mongodb+srv://..."
MONGODB_DB="ai_character_vlogger"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

If `MONGODB_URI` is not configured, the app still runs with browser local storage fallback. Use `/api/health/atlas` to verify Atlas runtime connectivity and `/api/health/blob` to verify Blob token configuration.

## Legacy Prototype

The first working artifact remains available as a local Vite prototype:

```bash
cd prototype
npm install
npm run dev
```

The prototype currently includes:

- Character profile editor with disclosure and content boundary fields
- 10 vlog templates from the PRD
- Deterministic episode package generation for Shorts, TikTok, and Reels
- Scene plan, script, subtitles, thumbnail direction, captions, hashtags, review gates, and publishing checklist
- Draft review queue with approval/export actions
- Manual analytics entry for the first feedback loop

The Next.js app in `web/` is now the primary implementation target.

## Working Thesis

The product should be built as an AI character creator operating platform, not a generic AI video generator.

```text
Character IP creation
+ Observation-style vlog planning
+ Short-form production automation
+ Multi-platform publishing
+ Fan relationship and monetization management
```
