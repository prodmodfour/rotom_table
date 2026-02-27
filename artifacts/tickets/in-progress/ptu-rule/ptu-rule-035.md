---
ticket_id: ptu-rule-035
type: ptu-rule
priority: P2
status: in-progress
source_ecosystem: dev
target_ecosystem: dev
created_by: game-logic-reviewer
created_at: 2026-02-18T15:40:00
domain: healing
severity: MEDIUM
affected_files:
  - app/server/api/characters/[id]/pokemon-center.post.ts
---

## Summary

The character Pokemon Center endpoint unconditionally restores drained AP (`drainedAp: 0`), but PTU rules say drained AP is restored by **Extended Rests** (4+ continuous hours), not by Pokemon Centers.

## Details

**Character Pokemon Center endpoint** (`pokemon-center.post.ts:76`):
```typescript
drainedAp: 0,
```

This unconditionally sets drained AP to 0 during any Pokemon Center visit, regardless of how long the healing takes.

### What PTU says

PTU 1.05 p.252 (`core/07-combat.md`), Pokemon Centers section (lines 2015-2020):
> "Pokemon Centers use expensive and advanced machinery to heal Pokemon. In a mere hour, Pokemon Centers can heal Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves."

Pokemon Centers provide:
1. Full HP restoration
2. All Status Conditions cured
3. Daily-Frequency Moves restored
4. Up to 3 injuries healed (with time penalty)

**NOT listed:** restore drained AP.

PTU 1.05 p.252, Extended Rests section (lines 2009-2011):
> "Extended Rests are rests that are at least 4 continuous hours long. Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP."

Drained AP is explicitly an **Extended Rest** benefit. A base Pokemon Center visit takes 1 hour — well under the 4-hour Extended Rest threshold.

### Edge case: Long Pokemon Center visits

With enough injuries, a Pokemon Center visit CAN exceed 4 hours (e.g., 7 injuries at 1hr/injury = 7hr + 1hr base = 8hr total). In this case, the visit time overlaps with Extended Rest requirements, and AP restoration would be reasonable. But the code restores AP unconditionally, even for a quick 1-hour visit with no injuries.

## Fix

Only restore drained AP if the Pokemon Center healing time meets the Extended Rest threshold (4+ hours):

```typescript
const totalTimeMinutes = timeResult.totalTime
const meetsExtendedRest = totalTimeMinutes >= 240 // 4 hours

const updated = await prisma.humanCharacter.update({
  where: { id },
  data: {
    // ... existing fields ...
    drainedAp: meetsExtendedRest ? 0 : character.drainedAp,
    // ...
  }
})
```

Alternatively, simply remove `drainedAp: 0` and let the existing Extended Rest endpoint handle AP restoration separately. The simpler approach depends on whether Pokemon Center visits are intended to overlap with Extended Rest mechanically.

## PTU Reference

- `core/07-combat.md` p.252, lines 2015-2020: Pokemon Center capabilities (no AP mention)
- `core/07-combat.md` p.252, lines 2009-2011: Extended Rest restores drained AP

## Discovered By

Game Logic Reviewer during rules-review-037 (ptu-rule-032 AP drain fix review). Developer's duplicate check claimed "Pokemon-center endpoints correctly preserve the value" — the `lastInjuryTime` handling is correct, but `drainedAp: 0` is a separate PTU violation.

## Fix Log

- **Fixed by:** Developer
- **Files changed:**
  - `app/server/api/characters/[id]/pokemon-center.post.ts` — `drainedAp` restoration now conditional on `totalTime >= 240` (Extended Rest threshold of 4 hours). Short visits (e.g., 1hr base with no injuries) no longer restore AP. Long visits (7+ injuries = 8hr+) still restore AP since they exceed the threshold.
- **Note:** Pokemon endpoint (`pokemon/[id]/pokemon-center.post.ts`) does not have `drainedAp` — Pokemon don't have AP in PTU, so no change needed there.
