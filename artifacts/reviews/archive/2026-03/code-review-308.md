---
review_id: code-review-308
review_type: code
reviewer: senior-reviewer
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
  - 240a3448
files_reviewed:
  - app/server/services/switching.service.ts
  - app/composables/useSwitching.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/tests/unit/services/switching.service.test.ts
  - app/server/api/encounters/[id]/recall.post.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-03-03T19:30:00Z
follows_up: null
---

## Review Scope

First review of the ptu-rule-129 fix: Roar's forced recall must respect the Trapped condition per decree-039. Six ptu-rule-129 commits plus one pre-existing Living Weapon commit (240a3448) that touched switch.post.ts.

**Core change:** Added a Trapped/Bound condition check to `validateForcedSwitch` (step 3b) in `switching.service.ts`, mirroring the existing check in `validateSwitch`. Added client-side `canForcedSwitch()` in `useSwitching.ts` for GM UI pre-validation. Updated comment in `switch.post.ts`. Fixed `tempConditions` data source from `entity` to `combatant` in both validate functions. Added 10 unit tests.

**Decrees checked:** decree-039 (Roar blocked by Trapped -- primary), decree-034 (Roar uses own 6m range; Whirlwind is push), decree-033 (fainted switch on turn only), decree-038 (condition behavior decoupling). No violations found. Implementation correctly follows decree-039 ruling.

## Issues

### HIGH

**HIGH-001: `recall.post.ts` reads `tempConditions` from entity instead of combatant (pre-existing bug, same pattern this fix corrected)**

File: `app/server/api/encounters/[id]/recall.post.ts`, line 117

The developer fixed this exact bug in `switching.service.ts` (commit 8037b2dc) for both `validateSwitch` and `validateForcedSwitch`, correctly changing `recalled.entity.tempConditions` to `recalled.tempConditions`. However, `recall.post.ts` has the identical bug at line 117:

```typescript
const tempConditions: string[] = (pokemon.entity as { tempConditions?: string[] })?.tempConditions || []
```

This should be:
```typescript
const tempConditions: string[] = pokemon.tempConditions || []
```

Per the `Combatant` type definition (`app/types/encounter.ts`, line 49), `tempConditions` lives on the Combatant interface, not on the entity (Pokemon/HumanCharacter). `pokemon.entity.tempConditions` will always be `undefined`, meaning any Trapped condition stored in `tempConditions` will be silently missed during standalone recall validation.

The developer is already in this code domain and already made this exact fix in two places. Requiring this fix now per the review philosophy ("if the developer is already in the code and the fix is straightforward, require it now").

**Action required:** Fix line 117 of `recall.post.ts` to read `pokemon.tempConditions` instead of `(pokemon.entity as { tempConditions?: string[] })?.tempConditions`.

### MEDIUM

**MEDIUM-001: `app-surface.md` not updated with new `canForcedSwitch` function**

File: `.claude/skills/references/app-surface.md`, line 192

The switching system entry lists `canSwitch, canFaintedSwitch` but not the new `canForcedSwitch`. While this is a reference file rather than source code, keeping it accurate prevents future skills from missing the function when analyzing the switching system.

**Action required:** Add `canForcedSwitch` to the useSwitching composable entry in `app-surface.md`.

**MEDIUM-002: Checking for `'Bound'` condition that does not exist in the `StatusCondition` type**

Files: `switching.service.ts` (lines 429, 612), `useSwitching.ts` (line 155), `recall.post.ts` (line 119), `switching.service.test.ts` (line 187 uses `as any` cast)

All Trapped checks also check for `allConditions.includes('Bound')`. However, `'Bound'` is not a member of the `StatusCondition` type union (`app/types/combat.ts`, line 52-57). In PTU, moves like Bind inflict the `Trapped` condition, not a separate `Bound` condition. The `'Bound'` string can never appear in `statusConditions` or `tempConditions` arrays because the type system does not allow it.

This is a pre-existing pattern (already present in `validateSwitch` and `recall.post.ts` before this fix), and the new code correctly mirrors that pattern. The test at line 187 explicitly uses `as any` to bypass the type checker, which confirms the type mismatch.

This is defensive dead code -- harmless but misleading. It suggests there is a `Bound` status condition in the game when there is not. Consider removing the `'Bound'` check from all locations, or if `Bound` is intended as a future condition, add it to the `StatusCondition` union type. File a follow-up ticket.

**Action required:** File a follow-up ticket to either remove the `'Bound'` condition check or add it to the type system, depending on whether it represents a planned future condition.

## What Looks Good

1. **Decree-039 compliance is correct.** The Trapped check in `validateForcedSwitch` (step 3b) exactly mirrors the existing pattern in `validateSwitch` (step 3b). Both read `statusConditions` from the entity and `tempConditions` from the combatant. The error message correctly references decree-039. Per decree-039, Roar does NOT override Trapped, and the implementation blocks the recall while allowing the shift movement to proceed (handled by the caller, not by the validation function).

2. **tempConditions data source fix (8037b2dc) is correct and important.** The Combatant type definition places `tempConditions` on the combatant wrapper, not on the inner entity. The fix correctly changes both `validateSwitch` and `validateForcedSwitch` to read from `recalled.tempConditions`. The added inline comment ("Note: tempConditions lives on the combatant, not the entity") prevents future regression.

3. **Client-side `canForcedSwitch()` mirrors server-side validation.** The composable function uses the same condition checking pattern: reads `statusConditions` from entity, reads `tempConditions` from combatant, combines them, checks for Trapped/Bound. Returns `{ allowed, reason }` matching the existing `canSwitch`/`canFaintedSwitch` signatures.

4. **Test coverage is thorough.** 10 tests covering: Trapped in statusConditions blocks forced switch, Bound in statusConditions blocks forced switch, Trapped in tempConditions blocks forced switch, non-Trapped allows forced switch, other conditions (Burned/Confused/Slowed) do not block, inactive encounter rejection, missing trainer rejection, fainted release rejection, and standard switch Trapped verification. Both `validateForcedSwitch` and `validateSwitch` are tested for Trapped behavior.

5. **Commit granularity is appropriate.** Each commit addresses a single concern: docs update, core fix, comment update, client-side validation, tempConditions fix, tests. This is the correct granularity per project guidelines.

6. **Living Weapon auto-disengage (240a3448) is clean.** The commit follows the existing pattern from `recall.post.ts` (Duplicate Code Path Check). It reconstructs wield relationships, clears wield on removal, and replaces the combatants array with the cleaned version. All downstream references (turn order insertion, immediate-act detection) correctly use `cleanedRemovalResult` instead of `removalResult`.

## Verdict

**CHANGES_REQUIRED**

The core fix for decree-039 is correct and well-tested. However, the identical `tempConditions` bug that was fixed in `switching.service.ts` still exists in `recall.post.ts`. Since the developer already made this exact fix in two parallel locations and is actively working in this code domain, this must be fixed before approval to avoid leaving a known-broken code path.

## Required Changes

1. **[HIGH-001]** Fix `recall.post.ts` line 117: change `(pokemon.entity as { tempConditions?: string[] })?.tempConditions` to `pokemon.tempConditions`. Add the same inline comment as in `switching.service.ts`.

2. **[MEDIUM-001]** Update `.claude/skills/references/app-surface.md` line 192: add `canForcedSwitch` to the useSwitching composable listing.

3. **[MEDIUM-002]** File a follow-up ticket for the `'Bound'` condition check cleanup (remove dead checks or add to type system). Not blocking this review, but must be tracked.
