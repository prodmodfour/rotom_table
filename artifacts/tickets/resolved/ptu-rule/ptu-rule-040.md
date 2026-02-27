---
ticket_id: ptu-rule-040
type: ptu-rule
priority: P2
status: resolved
source_ecosystem: dev
target_ecosystem: dev
created_by: game-logic-reviewer
created_at: 2026-02-19T16:00:00
domain: healing
severity: MEDIUM
affected_files:
  - app/server/api/characters/[id]/pokemon-center.post.ts
  - app/server/api/pokemon/[id]/pokemon-center.post.ts
---

## Summary

Both Pokemon Center endpoints set `restMinutesToday: 480` after healing, consuming the character/Pokemon's entire daily rest budget. PTU rules treat Pokemon Centers and rest as entirely separate mechanics — a Pokemon Center visit should not affect rest availability.

## Details

**Character endpoint** (`characters/[id]/pokemon-center.post.ts:71`):
```typescript
restMinutesToday: 480, // Max out rest for the day
```

**Pokemon endpoint** (`pokemon/[id]/pokemon-center.post.ts:85`):
```typescript
restMinutesToday: 480, // Max out rest for the day
```

### What the code does

After a Pokemon Center visit (even a quick 1-hour visit with no injuries), the daily rest counter is set to 480 minutes (8 hours). The `calculateRestHealing` function in `restHealing.ts:40` blocks rest-healing when `restMinutesToday >= 480`. This means the character/Pokemon cannot rest-heal for the remainder of that calendar day.

### What PTU says

PTU 1.05 p.252 (`core/07-combat.md`, lines 1995-1998):
> "For the first 8 hours of rest each day, Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points."

The 8-hour limit tracks actual **rest** time. Rest is a deliberate, passive activity.

PTU 1.05 p.252 (`core/07-combat.md`, lines 2015-2017):
> "Pokemon Centers use expensive and advanced machinery to heal Pokemon."

A Pokemon Center visit is a medical procedure, not rest. The time spent at a Pokemon Center (1hr base + injury time) should not count against the daily rest budget.

### Correct behavior

A Pokemon Center visit should not modify `restMinutesToday` at all. After visiting a Pokemon Center and being healed to full HP, if the character takes damage later that day, they should still have their full 8 hours of rest-healing available.

## Fix

Remove `restMinutesToday: 480` from both Pokemon Center endpoints:

```typescript
// In characters/[id]/pokemon-center.post.ts — remove line 71:
// restMinutesToday: 480, // Max out rest for the day

// In pokemon/[id]/pokemon-center.post.ts — remove line 85:
// restMinutesToday: 480, // Max out rest for the day
```

The `lastRestReset: new Date()` line should remain — it tracks daily counter resets (injuriesHealedToday), which is separate from rest minutes.

## PTU Reference

- `core/07-combat.md` lines 1995-1998: Rest healing rules (8 hours/day of actual rest)
- `core/07-combat.md` lines 2015-2020: Pokemon Center mechanics (medical procedure, not rest)

## Fix Log

- Removed `restMinutesToday: 480` from `app/server/api/characters/[id]/pokemon-center.post.ts` (line 71)
- Removed `restMinutesToday: 480` from `app/server/api/pokemon/[id]/pokemon-center.post.ts` (line 85)
- Pokemon Center visits no longer consume the daily rest budget

## Discovered By

Game Logic Reviewer during rules-review-045. Pre-existing issue in untouched code, discovered while verifying ptu-rule-038 fix context.
