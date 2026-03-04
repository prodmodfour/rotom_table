---
ticket: ptu-rule-129
priority: P3
severity: MEDIUM
status: in-progress
domain: combat
source: decree-039
created_at: 2026-03-01
---

# ptu-rule-129: Roar's forced recall must respect the Trapped condition

## Problem

The current forced switch implementation allows Roar to recall a Trapped Pokemon. Per decree-039, Roar does NOT override Trapped — only moves with explicit text (U-Turn, Baton Pass, Volt Switch, Parting Shot) and trainer features (Round Trip) can bypass Trapped.

When Roar hits a Trapped target, the shift movement should still occur (Trapped restricts recall, not movement), but the 6m recall check should fail because the Pokemon cannot be recalled.

## Expected Behavior

1. Roar hits a Trapped Pokemon
2. The Pokemon shifts away using its highest movement capability (this still happens)
3. If the Pokemon ends within 6m of its Poke Ball, the recall is **blocked** because the Pokemon is Trapped
4. The Pokemon remains on the field at its new position

## Files to Modify

- `app/composables/useSwitching.ts` — forced switch validation must check for Trapped
- `app/server/api/encounter/switch.post.ts` — server-side validation must also check Trapped for forced switches

## Acceptance Criteria

- [x] Roar cannot recall a Trapped Pokemon
- [x] Roar's shift movement still applies to Trapped Pokemon
- [x] U-Turn, Baton Pass, Volt Switch, Parting Shot still bypass Trapped (if implemented)
- [x] Unit tests cover Trapped + Roar interaction

## Resolution Log

### Commits

1. `74872921` — fix: block forced switch recall for Trapped Pokemon (decree-039)
   - `app/server/services/switching.service.ts`: Added Trapped/Bound check to `validateForcedSwitch` (step 3b), matching existing check in `validateSwitch`
2. `1d05cf63` — fix: update switch endpoint comment to reflect Trapped check for forced switches
   - `app/server/api/encounters/[id]/switch.post.ts`: Updated comment from "skips Trapped" to "checks Trapped per decree-039"
3. `0e486df3` — feat: add canForcedSwitch client-side validation for Trapped check
   - `app/composables/useSwitching.ts`: Added `canForcedSwitch()` function for client-side pre-validation
4. `55773295` — fix: read tempConditions from combatant, not entity, in Trapped checks
   - `app/server/services/switching.service.ts`: Fixed both `validateSwitch` and `validateForcedSwitch` to read `tempConditions` from combatant (where it lives) instead of entity
5. `81c5c0d5` — test: add unit tests for Trapped + forced switch interaction (decree-039)
   - `app/tests/unit/services/switching.service.test.ts`: 10 tests covering Trapped/Bound in statusConditions and tempConditions, non-Trapped Pokemon, and existing forced switch validations

### Files Changed

- `app/server/services/switching.service.ts` — Core fix: Trapped check in `validateForcedSwitch`, tempConditions source fix in both validation functions
- `app/server/api/encounters/[id]/switch.post.ts` — Comment update
- `app/composables/useSwitching.ts` — New `canForcedSwitch()` client-side validation
- `app/tests/unit/services/switching.service.test.ts` — New test file (10 tests)

### Duplicate Code Path Check

Searched for all Trapped checks across the codebase:
1. `switching.service.ts:validateSwitch` — Already had Trapped check (fixed tempConditions source)
2. `switching.service.ts:validateForcedSwitch` — Was missing Trapped check (FIXED)
3. `recall.post.ts` lines 115-121 — Has its own inline Trapped check (reads from entity, not combatant tempConditions — pre-existing, not in scope for this ticket)
4. `useSwitching.ts` — Client-side validation added via `canForcedSwitch()`

Note: recall.post.ts has a similar tempConditions source issue (reads from entity instead of combatant), but that is a separate concern from this ticket's scope (forced switch Trapped check).

### Fix Cycle (code-review-308 + decree-044)

6. `02beecb7` — fix: read tempConditions from combatant, not entity, in recall.post.ts
   - `app/server/api/encounters/[id]/recall.post.ts`: Fixed HIGH-001 from code-review-308. Changed `(pokemon.entity as { tempConditions?: string[] })?.tempConditions` to `pokemon.tempConditions`. Added inline comment matching switching.service.ts pattern.
7. `0caab34e` — fix: remove dead 'Bound' condition checks from switching system (decree-044)
   - `app/server/services/switching.service.ts`: Removed `|| allRecalledConditions.includes('Bound')` from validateSwitch and validateForcedSwitch
   - `app/composables/useSwitching.ts`: Removed `|| allConditions.includes('Bound')` from canForcedSwitch
   - `app/tests/unit/services/switching.service.test.ts`: Removed `['Bound'] as any` test case
8. `d8a20ea1` — docs: add canForcedSwitch to useSwitching listing in app-surface.md
   - `.claude/skills/references/app-surface.md`: Added canForcedSwitch to useSwitching composable listing (MEDIUM-001)
