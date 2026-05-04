# Character Persona Management

## Principle

Character persona management is not one long prompt. It is a structured system that keeps character identity, voice, visual style, fan memory, monetization rules, and safety rules consistent over time.

## Core Layers

### Identity

- Display name
- AI/virtual disclosure
- Age policy: adult-only for monetized fan-platform contexts
- Public bio
- Primary language and secondary languages

### Voice

- Tone
- Sentence length
- Favorite expressions
- Terms to avoid
- Humor style
- How the character addresses fans

### Lore

- Occupation or role
- Hobbies
- Recurring locations
- Recurring routines
- Personal preferences
- Story arcs
- Things the character must never claim

### Visual Style

- Reference image IDs
- Face consistency rules
- Hair, makeup, fashion, color palette
- Camera framing
- Lighting
- Forbidden traits, including celebrity likeness and underage-coded styling

### Commercial Rules

- Free content boundaries
- Paid content boundaries
- Default PPV price
- VIP offer style
- Upsell tone
- Fan platform disclosure rules

### Safety Rules

- Human review triggers
- Disallowed claims
- Disallowed visual content
- Platform-specific restrictions
- Required AI disclosure language

## Suggested Data Model

```yaml
character:
  id: "char_001"
  version: "2026-05-04.1"
  status: "active"

  identity:
    display_name: "Working Name"
    ai_disclosure: "This is a virtual AI creator."
    public_bio: "..."
    languages: ["ko", "en"]

  voice:
    tone: ["warm", "playful", "short"]
    vocabulary_do: []
    vocabulary_avoid: []
    fan_address_style: "friendly"

  lore:
    occupation: "virtual lifestyle creator"
    hobbies: []
    recurring_topics: []
    story_arcs: []
    never_claims:
      - "being a real human"
      - "having physically attended real-world events unless disclosed as fictional/staged"

  visual:
    reference_asset_ids: []
    style_tags: []
    forbidden_traits:
      - "celebrity likeness"
      - "underage-coded styling"

  monetization:
    default_ppv_price_cents: 999
    free_content_ratio: 0.7
    upsell_style: "soft"

  safety:
    human_review_required_for:
      - "high_spender"
      - "policy_uncertain"
      - "explicit_identity_claim"
      - "user_distress"
```

## Fan Memory

Character memory and fan memory must be separate.

Character memory:

- Stable persona
- Voice rules
- Visual rules
- Brand and safety rules

Fan memory:

- Preferred name
- Language preference
- Content preferences
- Purchase history
- Last interaction
- Boundaries expressed by fan
- VIP or risk status

## Runtime Prompt Assembly

For each output, the system should assemble only the relevant parts:

```text
Global safety policy
+ Character identity
+ Character voice rules
+ Current task
+ Relevant fan memory
+ Recent conversation or episode context
+ Platform rules
+ Commercial rules
+ Output format
```

## Versioning

Every generated episode, script, caption, DM draft, and visual prompt should store:

- Character ID
- Character version
- Prompt template version
- Model used
- Generated output
- Human edits
- Approval status
- Published platform
- Performance results

This is required to learn which persona versions improve engagement without increasing policy risk or user complaints.

