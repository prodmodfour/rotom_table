---
decree_id: decree-022
status: active
domain: character-lifecycle
topic: branch-class-handling
title: "Use specialization suffix for branching classes (e.g., 'Type Ace: Fire')"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-022
implementation_tickets:
  - ptu-rule-091
tags: [character-lifecycle, branch-classes, specialization, trainer-classes]
---

# decree-022: Use specialization suffix for branching classes

## The Ambiguity

PTU allows `[Branch]` classes (Type Ace, Stat Ace, Style Expert, Researcher) to be taken multiple times with different specializations. (Note: Martial Artist was originally listed here but removed per decree-026 — it is `[Class]` only, not `[Branch]`.) The codebase currently blocks duplicate class names entirely. Surfaced by character-lifecycle-audit.md (R035), decree-need-022.

## Options Considered

### Option A: Allow duplicate class names with metadata
Skip duplicate check for branching classes. Store multiple "Type Ace" entries. Specialization stored as separate metadata, requiring a data model change from `string[]` to `{name, specialization?}[]`. Raw class name stays canonical.

### Option B: Specialization suffix in name
Store as "Type Ace: Fire", "Type Ace: Water" — naturally unique strings. No data model change needed. Class lookups use prefix matching (`startsWith`) instead of exact matching.

## Ruling

**The true master decrees: use specialization suffix for branching classes (e.g., "Type Ace: Fire").**

Branching classes are stored with their specialization appended after a colon separator: `"Type Ace: Fire"`, `"Stat Ace: Attack"`, etc. This keeps the data model as a simple `string[]` with no schema changes. The duplicate check works naturally since the names differ. Class lookups that need to check "does this character have Type Ace?" use `startsWith("Type Ace")` or similar prefix matching. The UI should provide a specialization selection step when adding a branching class.

## Precedent

When storing variant data, prefer encoding it into the existing string format with a consistent separator (colon + space) rather than changing the data model. This keeps storage simple at the cost of requiring prefix matching for lookups.

## Implementation Impact

- Tickets created: ptu-rule-091 (already exists, was blocked by this decree — now unblocked)
- Files affected: class add UI, class validation logic, any class lookup code
- Skills affected: Character lifecycle reviewers must verify prefix matching for branching class lookups
