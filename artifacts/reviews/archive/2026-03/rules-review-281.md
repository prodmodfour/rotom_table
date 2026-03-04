---
review_id: rules-review-281
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-129
domain: combat
commits_reviewed:
  - c23f674e
  - 42dfca09
  - 3011be5c
  - 67484b45
  - 8037b2dc
  - 5e7ff8d5
mechanics_verified:
  - trapped-blocks-forced-recall
  - trapped-bypass-moves
  - tempConditions-data-source
  - bound-condition-applicability
verdict: APPROVED
issues_found:
  critical: 0
  high: 1
  medium: 1
ptu_refs:
  - core/07-combat.md#Trapped (p.247)
  - core/10-indices-and-reference.md#Roar (p.406)
  - core/10-indices-and-reference.md#U-Turn (p.347)
  - core/10-indices-and-reference.md#Baton-Pass (p.378)
  - core/10-indices-and-reference.md#Volt-Switch (p.362)
  - core/10-indices-and-reference.md#Parting-Shot (p.355)
  - core/04-trainer-classes.md#Round-Trip (p.130)
  - core/10-indices-and-reference.md#Destiny-Bond (p.367)
  - core/10-indices-and-reference.md#Vortex-keyword (p.340)
reviewed_at: 2026-03-03T19:25:00Z
follows_up: null
---

## Mechanics Verified

### Trapped Blocks Forced Recall (decree-039)

- **Rule:** "A Pokemon or Trainer that is Trapped cannot be recalled." (`core/07-combat.md` p.247, line 1728)
- **Decree:** decree-039 explicitly rules: "Roar's forced recall does NOT override the Trapped condition." Only moves with explicit bypass text (U-Turn, Baton Pass, Volt Switch, Parting Shot) and trainer features (Round Trip) can bypass Trapped.
- **Implementation:** `validateForcedSwitch()` in `app/server/services/switching.service.ts` (line 603-613) now checks both `statusConditions` and `tempConditions` for 'Trapped' or 'Bound'. If found, returns `{ valid: false, error: 'Cannot recall Trapped Pokemon -- forced switch blocked (decree-039)' }`. The error message correctly cites the decree.
- **Status:** CORRECT

The Roar move text (`core/10-indices-and-reference.md` p.406, line 8855-8869) reads: "Targets hit by Roar immediately Shift away from the target using their highest usable movement capability, and towards their Trainer if possible. If the target is an owned Pokemon and ends this shift within 6 meters of their Poke Ball, they are immediately recalled." The text says nothing about overriding Trapped. Per decree-039's "explicit exception" precedent, absence of bypass text means Trapped applies normally.

The implementation correctly blocks only the recall step, not the shift movement. The comment at line 607 notes: "The shift movement still happens (handled by the caller), but recall fails here." This matches decree-039's ruling that "the shift away still occurs (Trapped restricts recall, not movement)."

### Trapped Bypass Moves (Exclusion Verification)

- **Rule:** PTU explicitly marks moves that bypass Trapped:
  - U-Turn: "Using U-Turn lets a Trapped user be recalled." (`core/10-indices-and-reference.md` p.347, line 4011)
  - Baton Pass: "Baton Pass may be used to switch even if the user is Trapped." (`core/10-indices-and-reference.md` p.378, line 7548-7549)
  - Volt Switch: "Using Volt Switch lets a Trapped user be recalled." (`core/10-indices-and-reference.md` p.362, line 4848-4849)
  - Parting Shot: "Using Parting Shot lets a Trapped user be recalled." (`core/10-indices-and-reference.md` p.355, line 4249-4250)
  - Round Trip (trainer feature): "This effect lets Pokemon with the Trapped condition switch out." (`core/04-trainer-classes.md` p.130, line 1763-1764)
- **Implementation:** The `validateForcedSwitch()` function does not include any bypass logic for U-Turn, Baton Pass, Volt Switch, or Parting Shot. This is correct because these moves are self-recall moves (the user recalls itself), not forced-switch moves targeting an opponent. They would go through different code paths entirely (or are not yet implemented). Roar is the only implemented forced switch that targets an opponent's Pokemon, and it correctly does NOT bypass Trapped.
- **Status:** CORRECT

### tempConditions Data Source (Combatant vs Entity)

- **Rule:** The `tempConditions` field is defined on the `Combatant` interface (`app/types/encounter.ts` line 49), NOT on the entity (Pokemon/HumanCharacter). This is a data model concern, not a PTU rule, but it affects whether the Trapped check actually works at runtime.
- **Implementation (after fix):**
  - `validateSwitch()` (line 427): `recalled.tempConditions || []` -- reads from combatant. CORRECT.
  - `validateForcedSwitch()` (line 610): `recalled.tempConditions || []` -- reads from combatant. CORRECT.
  - `canForcedSwitch()` in `useSwitching.ts` (line 153): `pokemon.tempConditions || []` -- reads from combatant. CORRECT.
- **Prior bug:** Before commit 8037b2dc, both `validateSwitch` and `validateForcedSwitch` read `tempConditions` from `recalled.entity` (the nested entity object), where it does not exist. This meant Trapped applied via tempConditions would silently pass validation. The fix correctly reads from the combatant level.
- **Status:** CORRECT (after fix)

### Bound Condition Applicability

- **Rule:** PTU defines "Bound" only in the context of Destiny Bond (`core/10-indices-and-reference.md` p.367, line 6339-6342): "All enemy targets in the burst become Bound to the user until the end of the user's next turn. If a Bound target causes the user to Faint through a Damaging Attack, the Bound target immediately faints after their attack is resolved." Destiny Bond's "Bound" does NOT prevent recall or switching. It is a revenge-faint mechanic, not a movement/recall restriction.
- **Implementation:** All Trapped checks in the codebase also check for 'Bound': `allConditions.includes('Trapped') || allConditions.includes('Bound')`. This appears in `validateSwitch` (line 429), `validateForcedSwitch` (line 612), `canForcedSwitch` in useSwitching.ts (line 155), and `recall.post.ts` (line 119).
- **Status:** NEEDS REVIEW -- see HIGH-001 below.

## Summary

The core fix (decree-039 compliance) is **rules-correct**. Roar's forced recall now properly checks for Trapped, matching both PTU RAW and the decree ruling. The implementation correctly:

1. Blocks recall while allowing the shift movement to proceed
2. Checks both `statusConditions` (persistent conditions like those from Vortex moves) and `tempConditions` (turn-scoped conditions applied during combat) for the Trapped condition
3. Returns a clear error message citing decree-039
4. Provides client-side pre-validation in `canForcedSwitch()` matching the server-side logic
5. Does not inadvertently bypass Trapped for standard voluntary switches (the existing `validateSwitch` check was also fixed for the tempConditions data source)

The tempConditions data source fix (commit 8037b2dc) is critical -- without it, any Trapped condition stored as a tempCondition would be invisible to the validation. This was a pre-existing bug that affected both standard and forced switch paths.

## Rulings

**RULING-001: Trapped blocks Roar recall -- CONFIRMED CORRECT per decree-039.**
PTU p.247 states Trapped prevents recall. Roar's text (p.406) contains no Trapped bypass language. Per the "explicit exception" precedent established in decree-039, Trapped applies. The shift movement from Roar still occurs (Trapped restricts recall, not movement).

**RULING-002: Vortex keyword is the primary source of Trapped in combat.**
Moves like Infestation, Fire Spin, Magma Storm, Whirlpool, Sand Tomb, and Wrap apply the Vortex keyword, which makes the target "Slowed, Trapped" (`core/10-indices-and-reference.md` p.340, line 3523). This is the most common way Trapped appears, and the code correctly catches it whether stored in statusConditions or tempConditions.

## Verdict

**APPROVED** -- The implementation correctly enforces decree-039. Roar's forced recall is properly blocked by the Trapped condition. All PTU-referenced bypass moves (U-Turn, Baton Pass, Volt Switch, Parting Shot, Round Trip) are correctly excluded from the forced-switch path because they use different mechanics (self-recall, not opponent-forced recall).

Two non-blocking issues are noted below. Neither affects the correctness of the Trapped-blocks-Roar mechanic under review.

## Issues Found

### HIGH-001: "Bound" condition check has no PTU basis for blocking recall

**Location:** `app/server/services/switching.service.ts` lines 429, 612; `app/composables/useSwitching.ts` line 155; `app/server/api/encounters/[id]/recall.post.ts` line 119

**Problem:** All Trapped checks also check for `allConditions.includes('Bound')`. However, PTU's "Bound" status (from Destiny Bond, p.367) does NOT prevent recall or switching. Destiny Bond's Bound effect means "If a Bound target causes the user to Faint, the Bound target immediately faints" -- it is a revenge-faint mechanic. There is no PTU text stating Bound restricts movement or recall.

The Trapped condition is defined at p.247: "A Pokemon or Trainer that is Trapped cannot be recalled." No such text exists for Bound. Ghost types are immune to Trapped (p.247) and Stuck (p.247), but there is no "Bound" immunity mentioned because Bound is not a movement-restricting condition.

**Impact:** If a Pokemon is Bound by Destiny Bond but NOT Trapped, the current code would incorrectly prevent its recall. This is a false positive that could block legal switches.

**Recommendation:** Either (a) remove the `'Bound'` check entirely, or (b) create a decree-need ticket to clarify whether "Bound" was intended as a house rule synonym for a specific Trapped-like condition (e.g., from Grapple mechanics or a custom implementation). This is not a decree-039 violation since decree-039 only addresses Roar vs Trapped, but it is a rules correctness issue in the broader Trapped check.

**Severity:** HIGH -- could incorrectly block legal switches when Destiny Bond's Bound is active.

### MEDIUM-001: recall.post.ts still reads tempConditions from entity (pre-existing bug)

**Location:** `app/server/api/encounters/[id]/recall.post.ts` line 117

**Problem:** The standalone recall endpoint reads tempConditions from the entity:
```typescript
const tempConditions: string[] = (pokemon.entity as { tempConditions?: string[] })?.tempConditions || []
```
This is the same bug that commit 8037b2dc fixed in `switching.service.ts`. The entity object (Pokemon/HumanCharacter) does not have a `tempConditions` field -- it lives on the Combatant. This means a Pokemon with Trapped in `tempConditions` could be recalled via the standalone recall endpoint despite being Trapped.

**Impact:** The standalone recall path (used for recall-only actions without a replacement send-out) silently ignores Trapped conditions stored in tempConditions.

**Recommendation:** Fix line 117 to read from `pokemon.tempConditions || []` instead of `(pokemon.entity as { tempConditions?: string[] })?.tempConditions || []`. This is the exact same pattern applied in commit 8037b2dc to the switching service. A follow-up ticket should be created.

**Severity:** MEDIUM -- affects a less common code path (standalone recall vs full switch), but still allows a rule-violating action.
