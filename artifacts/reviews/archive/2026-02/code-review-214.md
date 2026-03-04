---
review_id: code-review-214
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-114+ptu-rule-116
domain: combat
commits_reviewed:
  - cc1a105
  - e64704f
  - 2dd89fa
  - 5c25cdd
files_reviewed:
  - app/server/api/encounters/[id]/breather.post.ts
  - app/composables/useEncounterActions.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/utils/combatantCapabilities.ts
  - app/utils/evasionCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/stores/encounterCombat.ts
  - app/constants/combatManeuvers.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-28T02:30:00Z
follows_up: code-review-210
---

## Review Scope

Re-review of fix cycle for rules-review-186 CHANGES_REQUIRED findings against ptu-rule-114 (assisted breather) and ptu-rule-116 (Naturewalk status immunity). Three issues were raised:

- HIGH-1: Assisted breather omitted Tripped condition (RAW requires both Tripped + 0 Evasion)
- MEDIUM-1: Shift prompt suppressed for assisted variant (RAW requires shift for both variants)
- MEDIUM-2: Incorrect PTU page references (p.239-240 should be p.276/p.322 for Naturewalk)

Also verified no regressions to original implementation approved in code-review-210.

## Verification of Fixes

### HIGH-1: Tripped condition added to assisted breather (cc1a105) -- VERIFIED CORRECT

Confirmed against PTU p.245 RAW: "They then both become Tripped and are treated as having 0 Evasion until the end of their next turn."

The assisted branch in `breather.post.ts` (lines 145-156) now applies BOTH `Tripped` and `ZeroEvasion` tempConditions:

```typescript
if (assisted) {
  if (!combatant.tempConditions.includes('Tripped')) {
    combatant.tempConditions = [...combatant.tempConditions, 'Tripped']
    result.trippedApplied = true
  }
  if (!combatant.tempConditions.includes('ZeroEvasion')) {
    combatant.tempConditions = [...combatant.tempConditions, 'ZeroEvasion']
    result.zeroEvasionApplied = true
  }
}
```

Key verification points:
- Immutability pattern preserved (spread operator, not push)
- Duplicate guard (`includes` check) prevents double-application
- Both conditions share the same lifecycle (cleared at end of next turn via `tempConditions = []` in `next-turn.post.ts` lines 68 and 208)
- `combatManeuvers.ts` shortDesc updated to mention "Tripped + 0 Evasion (no Vulnerable)"
- Move log notes updated to "ASSISTED: Tripped + Evasion set to 0 (no Vulnerable)"
- Header comment updated to reflect "Tripped + ZeroEvasion tempConditions"

### MEDIUM-1: Shift prompt enabled for both variants (e64704f) -- VERIFIED CORRECT

Confirmed against PTU p.245 RAW: "both the assisting Trainer and their target must Shift as far away from enemies as possible, using the lower of the two's maximum movement for a single Shift."

The `if (!assisted)` guard in `useEncounterActions.ts` (lines 171-175) has been removed. The `breatherShift` signal now fires unconditionally for both `take-a-breather` and `take-a-breather-assisted` maneuvers:

```typescript
breatherShift = { combatantId, combatantName: name }
```

The move log notes for the assisted variant now also mention the shift requirement: "SHIFT REQUIRED: Both must shift away using lower speed."

### MEDIUM-2: Naturewalk PTU page references corrected (2dd89fa) -- VERIFIED CORRECT

Cross-referenced against the actual PTU book content in `books/markdown/core/`:
- `04-trainer-classes.md` line 2800: "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains." (This is the p.276 reference.)
- `10-indices-and-reference.md` line 322: "Naturewalk is always listed with Terrain types... treat all listed terrains as Basic Terrain." (This is the p.322 reference.)

All four comment locations in `combatantCapabilities.ts` and the one in `status.post.ts` now cite the correct pages:
- Section header: "Naturewalk Status Immunity (PTU p.276)"
- `NATUREWALK_IMMUNE_STATUSES` doc: "PTU p.276: Immunity to Slowed or Stuck in its appropriate Terrains."
- `findNaturewalkImmuneStatuses` doc: "PTU p.276 + p.322" with split attribution
- `status.post.ts` line 73: "PTU p.276: Naturewalk grants immunity to Slowed/Stuck on matching terrain."

The p.239 references in `typeStatusImmunity.ts` (type-based immunity, different topic) are correctly left unchanged.

## Regression Check

### ZeroEvasion lifecycle -- NO REGRESSION
- `evasionCalculation.ts`: `computeTargetEvasions` still checks both `statusConditions` and `tempConditions` for ZeroEvasion (line 46)
- `calculate-damage.post.ts`: Server-side accuracy check still recognizes ZeroEvasion in tempConditions (line 232)
- `next-turn.post.ts`: tempConditions cleared at end of next turn (lines 68, 208) -- both Tripped and ZeroEvasion auto-expire together

### Action consumption -- NO REGRESSION
- Both standard and shift actions marked as used (lines 170-175 of breather.post.ts)
- `useEncounterActions.ts` lines 155-158: both standard and shift consumed for full action maneuvers

### Decree compliance -- VERIFIED
- **Decree-005**: `reapplyActiveStatusCsEffects(combatant)` still called after stage reset (line 134). Persistent condition CS re-application unaffected by these changes.
- **Decree-003**: Naturewalk bypasses painted terrain only, not enemy-occupied rough terrain. `naturewalkBypassesTerrain` comment (line 249) explicitly notes this. No changes to this function.
- **Decree-010**: Multi-tag terrain handling via `NATUREWALK_TERRAIN_MAP` lookup unchanged.
- **Decree-012**: Server-side type immunity enforcement pattern in `status.post.ts` (lines 52-71) unchanged. Naturewalk immunity follows same 409 + override pattern (lines 76-98).

### Immutability -- NO VIOLATIONS
All tempConditions mutations use spread operator (e.g., `[...combatant.tempConditions, 'Tripped']`). No direct `.push()` calls.

## What Looks Good

1. **Surgical fixes**: Each commit addresses exactly one issue with minimal blast radius. No unrelated changes mixed in.
2. **Commit granularity**: Three separate commits for three separate concerns (Tripped condition, shift prompt, page refs). Follows project conventions.
3. **RAW fidelity**: All three fixes align precisely with the PTU 1.05 text. Cross-verified against `books/markdown/core/07-combat.md` (p.245) and `04-trainer-classes.md` (p.276).
4. **Immutability discipline**: tempConditions updated via spread, not mutation.
5. **Consistent messaging**: Move log notes, combatManeuvers shortDesc, and code comments all updated to reflect the new behavior (Tripped + 0 Evasion for assisted, shift required for both).
6. **Ticket documentation**: ptu-rule-114 and ptu-rule-116 ticket files updated with fix cycle commit logs.

## Verdict

**APPROVED**

All three fixes from rules-review-186 are correctly implemented and verified against RAW. No regressions to the original implementation. Decree compliance maintained. Immutability patterns followed.

Note: The `encounterCombat.ts` store comment on line 118 still reads "0 Evasion instead of Tripped+Vulnerable" which is now slightly stale (should mention Tripped + 0 Evasion), but this is a JSDoc comment on an internal store method, not user-facing or logic-affecting. It does not warrant blocking this approval or a separate ticket.

## Required Changes

None.
