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

## Prototype

The first working artifact is a local Creator Workflow MVP prototype:

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

This is intentionally not wired to generation, publishing, or Fanvue APIs yet. It validates the creator workflow shape before adding expensive or approval-gated integrations.

## Working Thesis

The product should be built as an AI character creator operating platform, not a generic AI video generator.

```text
Character IP creation
+ Observation-style vlog planning
+ Short-form production automation
+ Multi-platform publishing
+ Fan relationship and monetization management
```
