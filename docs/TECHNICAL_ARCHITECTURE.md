# Technical Architecture

## High-Level System

```text
Creator App
  |
  |-- Character CMS
  |-- Episode Builder
  |-- Asset Review Queue
  |-- Publishing Dashboard
  |
Backend API
  |
  |-- Character Service
  |-- Prompt Builder
  |-- Generation Orchestrator
  |-- Media Pipeline
  |-- Publishing Integrations
  |-- Analytics Service
  |
Data Stores
  |
  |-- MongoDB Atlas for characters, episodes, fan memory, publishing state
  |-- Vercel Blob for media assets and export packages
  |-- Queue for generation and publishing jobs
```

## Current Implementation Stack

The current app implementation uses:

```text
Next.js App Router in web/
+ MongoDB Atlas via the official MongoDB Node.js driver
+ Vercel Blob for content uploads
+ Approved-asset export manifests
+ Vercel hosting
```

The initial persistence endpoints are:

```text
GET /api/health/atlas
GET /api/health/blob
GET /api/drafts
POST /api/drafts
GET /api/metrics
POST /api/metrics
GET /api/media-assets
POST /api/media-assets
GET /api/export-packages
POST /api/export-packages
POST /api/uploads
```

MongoDB collections currently used:

```text
episode_drafts
platform_metrics
media_assets
export_packages
```

Media assets store Blob URLs plus review state:

```text
Needs review -> Approved -> packaging/publishing
Needs review -> Rejected -> exclude from packaging/publishing
```

Export packages are generated from approved episode drafts and approved Blob assets. Assets that are pending review or rejected remain in the manifest under `excludedAssets` for auditability, but they are not included in the publishable asset list.

## Core Services

### Character Service

Responsibilities:

- Store character profiles
- Manage character versions
- Store visual references
- Enforce disclosure and safety defaults
- Provide persona snippets to prompt builder

### Episode Builder

Responsibilities:

- Template selection
- Story arc continuity
- Script generation
- Scene plan generation
- Caption and CTA generation
- Draft management

### Prompt Builder

Responsibilities:

- Assemble task-specific prompts
- Keep persona and fan memory scoped
- Add platform-specific constraints
- Add safety instructions
- Output structured JSON when possible

### Media Pipeline

Responsibilities:

- Generate or ingest images/video/audio
- Add captions/subtitles
- Create thumbnails
- Normalize platform formats
- Store asset metadata

### Review Queue

Responsibilities:

- Human approval before publishing
- Flag identity/disclosure issues
- Flag visual consistency issues
- Flag platform policy risks
- Track edits and approvals

### Publishing Service

Responsibilities:

- Export packages
- OAuth token storage
- Platform-specific metadata
- Scheduled publishing
- Retry and status tracking

Initial platform priority:

1. YouTube Shorts
2. TikTok
3. Instagram Reels
4. Pinterest/Snapchat later

### Fan Platform Service

Fanvue can be supported as a monetization and fan CRM layer.

Potential Fanvue API usage:

- Upload media
- Create posts
- Schedule posts
- Send messages
- Read messages
- Receive webhooks
- Segment fans
- Analyze earnings

## Suggested MongoDB Collections

```text
users
characters
character_versions
character_reference_assets
episode_templates
episodes
episode_outputs
media_assets
publishing_accounts
publishing_jobs
platform_metrics
fan_profiles
fan_memories
conversation_logs
review_items
audit_logs
```

## Integration Notes

### YouTube

- Supports video upload through YouTube Data API.
- Synthetic/altered content disclosure must be handled.
- Good first publishing integration due to stability and long-term search/archive value.

### TikTok

- Content Posting API supports direct posting after app review and permission approval.
- Strong discovery channel for AI character vlog.
- Must handle AI-generated content labeling carefully.

### Instagram Reels

- Useful for visual brand building.
- Requires Meta app review and professional account setup.
- Good second or third integration.

### Fanvue

- Best treated as monetization backend, not discovery platform.
- Use public social platforms for top-of-funnel, then drive fans to paid fan platform.

## Build Recommendation

Phase 1 should not depend on full auto-publishing approval from every platform. Start with export-ready packages and add platform APIs after product demand is validated.
