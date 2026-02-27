---
ticket_id: ptu-rule-038
type: ptu-rule
priority: P1
status: in-progress
source_ecosystem: dev
target_ecosystem: dev
created_by: game-logic-reviewer
created_at: 2026-02-18T19:20:00
domain: healing
severity: HIGH
affected_files:
  - app/server/api/characters/[id]/pokemon-center.post.ts
---

## Summary

Pokemon Center endpoint still conditionally restores drained AP when healing time exceeds 4 hours (5+ injuries). PTU rules treat Pokemon Centers and Extended Rests as entirely separate mechanics with separately enumerated benefits. Pokemon Centers never restore drained AP regardless of visit duration.

## Details

Commit `5198d2e` improved the previous behavior (unconditional AP restore) by making it conditional on `totalTime >= 240`. However, the conditional logic is still incorrect under strict PTU reading.

**Current code** (`pokemon-center.post.ts:61-62`):
```typescript
const meetsExtendedRest = timeResult.totalTime >= 240
const apRestored = meetsExtendedRest ? character.drainedAp : 0
```

And line 77:
```typescript
...(meetsExtendedRest ? { drainedAp: 0 } : {}),
```

### What PTU says

**Pokemon Centers** (`core/07-combat.md`, lines 2015-2020):
> "Pokemon Centers use expensive and advanced machinery to heal Pokemon. In a mere hour, Pokemon Centers can heal Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves."

Enumerated benefits: full HP, all status conditions, daily move frequency. **Drained AP is not listed.**

**Extended Rest** (`core/07-combat.md`, lines 2009-2011):
> "Extended Rests are rests that are at least 4 continuous hours long. Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP."

Drained AP is exclusively an Extended Rest benefit. A Pokemon Center visit is a medical procedure using "expensive and advanced machinery" — it is not a rest. Duration overlap does not merge separate mechanics.

### Correct behavior

Pokemon Centers should never restore drained AP. The `meetsExtendedRest` variable, conditional AP spread, and `apRestored` calculation should all be removed or replaced with hardcoded 0.

## Fix

Remove all AP restoration logic from `pokemon-center.post.ts`:

```typescript
// Remove these lines:
// const meetsExtendedRest = timeResult.totalTime >= 240
// const apRestored = meetsExtendedRest ? character.drainedAp : 0

// Replace the DB update spread:
// ...(meetsExtendedRest ? { drainedAp: 0 } : {}),
// with: nothing — simply remove the line

// In the response, set apRestored to 0 or remove the field
```

## PTU Reference

- `core/07-combat.md` lines 2015-2020: Pokemon Center benefits (no AP mention)
- `core/07-combat.md` lines 2009-2011: Extended Rest restores drained AP

## Discovered By

Game Logic Reviewer during rules-review-039. The developer's fix (commit `5198d2e`) improved on the original unconditional behavior but retained a conditional path that still violates strict PTU mechanics.

## Fix Log

- Removed `meetsExtendedRest` variable, `apRestored` calculation, and conditional `drainedAp: 0` spread from DB update
- Hardcoded `apRestored: 0` in response for backwards compatibility
- Updated JSDoc to note Pokemon Centers do NOT restore drained AP
- Verified `pokemon/[id]/pokemon-center.post.ts` already correct (no AP logic)
- Verified no other files reference drainedAp in pokemon-center context
- **Files changed:** `app/server/api/characters/[id]/pokemon-center.post.ts`
