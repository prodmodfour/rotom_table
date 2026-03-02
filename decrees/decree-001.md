---
decree_id: decree-001
status: active
domain: combat
topic: minimum-damage-floor
title: "Apply minimum 1 damage at both post-defense and final steps"
ruled_at: 2026-02-26T18:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-001
implementation_tickets: []
tags: [damage, minimum-damage, type-effectiveness, defense]
---

# decree-001: Apply minimum 1 damage at both post-defense and final steps

## The Ambiguity

Where should the "minimum 1 damage" floor apply in the damage pipeline? PTU p.236 says "An attack will always do a minimum of 1 damage, even if Defense Stats would reduce it to 0" — wording that places the floor after defense. But the code applies a second floor after type effectiveness as well.

Source: decree-need-001.

## Options Considered

### Option A: After defense only
Floor at step 7 only. Type effectiveness CAN reduce to 0. Strict reading of "Defense Stats would reduce it to 0."

### Option B: Final floor at both steps (current code)
Two minimum-1 floors: after defense subtraction (step 7) AND after type effectiveness (step 8). If not immune, always deal at least 1.

### Option C: Final floor only
Remove step-7 floor, keep only the post-effectiveness floor. Slightly different edge-case math.

## Ruling

**The true master decrees: keep both minimum-1 floors — after defense and after type effectiveness.**

The current dual-floor approach is more forgiving for attackers and ensures every non-immune hit deals at least 1 damage. This is a deliberate design choice that favors gameplay over strict RAW interpretation.

## Precedent

Non-immune attacks always deal at least 1 damage regardless of defense or type resistance. Only full type immunity (x0 multiplier) produces 0 damage.

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: `app/utils/damageCalculation.ts`
- Skills affected: all reviewers (cite this decree when reviewing damage calculations)
