# Implementation Plan

Date: 2026-05-04

## Current State

The project now has a deployable Next.js app in `web/` and the original local prototype in `prototype/`.

The current implementation target is:

```text
Next.js App Router
+ MongoDB Atlas
+ Vercel Blob
+ Vercel hosting
```

The Next.js app turns the planning docs into an operational MVP surface:

- Character profile and safety defaults
- Vlog template selection
- Episode package generation
- Human review queue
- Export package JSON
- Manual analytics feedback loop
- MongoDB Atlas persistence endpoints for drafts and metrics
- Vercel Blob client uploads for content files
- Media asset review states for uploaded content
- Approved-asset export packages with downloadable manifest JSON
- Editable episode copy before save, review, and export

The generation layer is currently deterministic. That is deliberate. It lets the product shape, data contracts, review gates, and creator workflow be tested before adding model costs, media pipeline complexity, publishing API approvals, or Fanvue integration.

## Product Slice Implemented

The first slice maps to Phase 1 of the roadmap:

```text
Character profile
+ Vlog templates
+ Episode generator
+ Export package
+ Manual upload workflow
+ Basic dashboard
```

Implemented MVP outputs:

- Editable hook
- Scene sequence
- Editable voiceover/script
- Subtitle copy
- Editable thumbnail title and direction
- Editable platform captions
- Hashtag suggestions
- AI disclosure text
- Review checklist
- Publishing checklist
- Export manifest

## Local Runbook

```bash
cd web
npm install
npm run dev
```

Validation commands:

```bash
npm run test
npm run build
```

## Next.js App Architecture

```text
web/src/app/page.tsx
  App Router entrypoint

web/src/components/StudioApp.tsx
  Client-side creator console

web/src/app/api/health/atlas/route.ts
  Atlas runtime health check

web/src/app/api/drafts/route.ts
  Draft persistence endpoint

web/src/app/api/metrics/route.ts
  Manual metrics persistence endpoint

web/src/app/api/uploads/route.ts
  Vercel Blob client upload token endpoint and upload-complete metadata hook

web/src/app/api/media-assets/route.ts
  Uploaded content metadata and review state endpoint

web/src/app/api/export-packages/route.ts
  Approved media package metadata endpoint

web/src/lib/mongodb.ts
  Lazy MongoDB Atlas client

web/src/lib/episodeGenerator.ts
  Deterministic package generator and data contract

web/src/lib/exportPackage.ts
  Builds publish-ready manifests from approved drafts and approved Blob assets

web/src/lib/draftEditor.ts
  Applies human copy edits to generated episode drafts before persistence
```

## Legacy Prototype Architecture

```text
prototype/src/App.tsx
  UI shell, character CMS, episode builder, queue, analytics

prototype/src/data/templates.ts
  10 MVP vlog templates from the PRD

prototype/src/data/sampleCharacter.ts
  Starter character profile aligned with persona management requirements

prototype/src/lib/episodeGenerator.ts
  Deterministic package generator and data contract

prototype/src/lib/episodeGenerator.test.ts
  Contract tests for disclosure, scene generation, and review safeguards
```

## Data Contracts To Preserve

The future backend should preserve these concepts:

- `CharacterProfile`
- `VlogTemplate`
- `EpisodeOptions`
- `EpisodeDraft`
- `ScenePlanItem`
- `ReviewChecklist`
- `ExportManifest`
- `MetricRecord`

When moving from local state to backend storage, each generated output should store:

- Character ID
- Character version
- Template ID
- Prompt template version
- Model or generator used
- Raw generated output
- Human edits
- Review status
- Export or publishing status
- Performance metrics

## Backend Sequence

### Step 1 - App persistence

- Use MongoDB Atlas collections for users, characters, character versions, episode templates, episodes, episode outputs, media assets, review items, and platform metrics.
- Replace localStorage fallback for saved drafts and analytics with Atlas-backed persistence.
- Keep manual export as the default publishing mode.

### Step 2 - Prompt and text generation

- Introduce a prompt builder service that assembles:
  - Global safety policy
  - Character identity
  - Character voice rules
  - Template task
  - Platform rules
  - Output JSON schema
- Store prompt template versions from day one.
- Require structured JSON output matching the current `EpisodeDraft` shape.

### Step 3 - Media pipeline

- Use Vercel Blob for uploaded source assets, thumbnails, rendered videos, subtitles, and export package files.
- Store Blob URLs and metadata in the `media_assets` Atlas collection.
- Track each media asset through `Needs review`, `Approved`, and `Rejected` states before packaging or publishing.
- Build export package manifests from approved drafts and approved assets only; pending and rejected assets are listed as excluded.
- Generate thumbnail concepts first, then still images, then video clips.
- Add subtitle file export and burned-in subtitle rendering.
- Keep a review item for every generated media asset.

### Step 4 - Publishing integrations

- Start with export packages.
- Add YouTube Shorts upload first after account and disclosure rules are verified.
- Add TikTok and Instagram Reels after app review readiness.
- Keep scheduled publishing and retry state in `publishing_jobs`.

### Step 5 - Fan monetization

- Add Fanvue as monetization and fan CRM, not as the primary discovery surface.
- Create premium post drafts and human-reviewed DM drafts.
- Keep fan memory separate from character memory.

## Immediate Product Backlog

1. Add character version snapshots instead of editing one live object.
2. Add template version numbers and content-safe defaults.
3. Add SRT and Markdown export in addition to JSON.
4. Add a simple episode calendar view.
5. Add sample series arcs so episodes can build continuity.
6. Add import/export for character profile JSON.
7. Add backend schema and API routes.
8. Add model-backed structured generation behind the deterministic generator.
9. Add media asset review queue.
10. Store and download approved-asset export manifests.

## Engineering Decisions

- Start as a creator-side workflow app, not a consumer social network.
- Keep human review in the loop for publishing and monetization.
- Add disclosure at profile, caption, and export-manifest levels.
- Treat publishing APIs as Phase 2, not MVP blockers.
- Treat Fanvue as a monetization backend and fan CRM, not a persona system.
