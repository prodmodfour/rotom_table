---
review_id: rules-review-284
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-129
domain: combat
commits_reviewed:
  - 42dfca09
  - 67484b45
  - 8037b2dc
  - 02beecb7
  - 0caab34e
  - d8a20ea1
  - 931891bd
mechanics_verified:
  - trapped-blocks-recall
  - roar-forced-switch-trapped-interaction
  - bound-condition-removal
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Trapped
  - core/10-indices-and-reference.md#Roar
  - core/10-indices-and-reference.md#Vortex
reviewed_at: 2026-03-04T01:15:00Z
follows_up: rules-review-281
---

## Mechanics Verified

### 1. Trapped Blocks All Recall (Including Forced)

- **Rule:** "A Pokemon or Trainer that is Trapped cannot be recalled." (`core/07-combat.md` line 1728)
- **Decree:** Per decree-039, Roar's forced recall does NOT override the Trapped condition. The shift movement still occurs but the recall is blocked.
- **Implementation (server):** `validateForcedSwitch` in `switching.service.ts` (lines 603-613) now checks both `entity.statusConditions` and `combatant.tempConditions` for 'Trapped'. If found, returns `{ valid: false, error: 'Cannot recall Trapped Pokemon -- forced switch blocked (decree-039)' }`. The shift movement is noted as "handled by the caller" in the comment, correctly separating the movement from the recall mechanic.
- **Implementation (server, standard switch):** `validateSwitch` in `switching.service.ts` (lines 424-431) performs the same dual-source check for 'Trapped' on standard switches.
- **Implementation (server, recall-only):** `recall.post.ts` (lines 115-122) checks both `pokemon.entity.statusConditions` and `pokemon.tempConditions` for 'Trapped'.
- **Implementation (client):** `canForcedSwitch` in `useSwitching.ts` (lines 140-160) provides client-side pre-validation with the same dual-source check.
- **Status:** CORRECT

All four Trapped check locations (validateSwitch, validateForcedSwitch, recall.post.ts, canForcedSwitch) correctly:
1. Read `statusConditions` from `entity` (persistent conditions from the DB)
2. Read `tempConditions` from the `combatant` (combat-scoped temporary conditions)
3. Merge both arrays and check for 'Trapped'
4. Only check for 'Trapped' -- no phantom 'Bound' condition

### 2. Roar Move Mechanics

- **Rule:** "Targets hit by Roar immediately Shift away from the target using their highest usable movement capability, and towards their Trainer if possible. If the target is an owned Pokemon and ends this shift within 6 meters of their Poke Ball, they are immediately recalled to their Poke Ball." (`core/10-indices-and-reference.md` line 8855)
- **Decree:** Per decree-034, Roar uses its own 6m recall range; Whirlwind is a push, not a forced switch.
- **Decree:** Per decree-039, Roar's recall is blocked by Trapped. PTU deliberately enumerates which moves bypass Trapped (U-Turn, Baton Pass, Volt Switch, Parting Shot, Round Trip). Roar is not among them.
- **Implementation:** `validateForcedSwitch` blocks the recall when Trapped is present. The error message explicitly cites decree-039. The Suction Cups ability immunity to Roar (`core/10-indices-and-reference.md` line 2570) is a separate concern handled at the move resolution layer, not the switching validation layer -- this is architecturally correct.
- **Status:** CORRECT

### 3. Bound Condition Removal (decree-044)

- **Rule:** No PTU mechanic produces a condition called "Bound." Vortex inflicts Trapped (+ Slowed + tick damage). Bind/Wrap enhance Grapple but do not inflict Trapped. Grapple restricts shifting but does NOT block recall. (`core/07-combat.md`, `core/10-indices-and-reference.md#Vortex`)
- **Decree:** Per decree-044, remove 'Bound' from the switching system entirely. Only Trapped blocks recall.
- **Implementation:** All 'Bound' checks have been removed from:
  - `switching.service.ts` -- `validateSwitch` (was `includes('Trapped') || includes('Bound')`, now just `includes('Trapped')`)
  - `switching.service.ts` -- `validateForcedSwitch` (new code only checks 'Trapped')
  - `recall.post.ts` (was `includes('Trapped') || includes('Bound')`, now just `includes('Trapped')`)
  - `useSwitching.ts` -- `canForcedSwitch` (new code only checks 'Trapped')
- **Verification:** Searched the entire `app/` directory for 'Bound' in switching-related files -- zero matches remain. The only 'Bound' references in the codebase are for unrelated AP mechanics (boundAp) and utility functions (isFootprintInBounds).
- **Status:** CORRECT

### 4. tempConditions Source Correctness

- **Rule:** N/A (data model correctness, not PTU rule). `tempConditions` is defined on the `Combatant` interface (`types/encounter.ts` line 49), not on `Pokemon` or `HumanCharacter` entities.
- **Previous issue (code-review-308 HIGH-001):** `recall.post.ts` was reading `pokemon.entity.tempConditions` instead of `pokemon.tempConditions`. Since `tempConditions` does not exist on the entity type, this would always resolve to `undefined`, meaning Trapped in tempConditions would be silently ignored.
- **Implementation:** All four locations now correctly read `tempConditions` from the combatant:
  - `switching.service.ts` `validateSwitch`: `recalled.tempConditions` (line 427)
  - `switching.service.ts` `validateForcedSwitch`: `recalled.tempConditions` (line 610)
  - `recall.post.ts`: `pokemon.tempConditions` (line 118)
  - `useSwitching.ts` `canForcedSwitch`: `pokemon.tempConditions` (line 153)
- **Status:** CORRECT

## Code-Review-308 Issue Resolution Verification

### HIGH-001: tempConditions read from entity instead of combatant
- **Fixed in:** commit 02beecb7 (recall.post.ts) and commit 8037b2dc (switching.service.ts)
- **Verification:** All Trapped checks now read `tempConditions` from the combatant object. The `entity` cast for tempConditions has been completely removed. Code comments explain the correct data source: "Note: tempConditions lives on the combatant, not the entity."
- **Verdict:** RESOLVED

### MEDIUM-001: app-surface.md not updated with canForcedSwitch
- **Fixed in:** commit d8a20ea1
- **Verification:** The useSwitching listing in app-surface.md now reads `(getBenchPokemon, canSwitch, canFaintedSwitch, canForcedSwitch pre-validation, executeSwitch, executeRecall, executeRelease)` -- canForcedSwitch is present.
- **Verdict:** RESOLVED

### MEDIUM-002: Dead 'Bound' condition checks
- **Fixed in:** commit 0caab34e, per decree-044
- **Verification:** All `includes('Bound')` checks removed from switching.service.ts, recall.post.ts. Test file `switching.service.test.ts` contains zero 'Bound' references -- no `as any` casts needed. Decree-044 provides the authoritative ruling that 'Bound' has no PTU basis.
- **Verdict:** RESOLVED

## Test Coverage Assessment

The test file `switching.service.test.ts` (411 lines) covers:
- Trapped in `statusConditions` blocks forced switch (decree-039 cited in assertion)
- Trapped in `tempConditions` blocks forced switch
- Non-Trapped conditions allow forced switch
- Multiple non-Trapped conditions allow forced switch
- Existing validations (inactive encounter, missing trainer, fainted release) still work
- Standard switch blocked by Trapped
- Standard switch allowed when not Trapped

Tests correctly use the `tempConditions` property on `makeCombatant` (not on `makePokemonEntity`), confirming the data model fix is reflected in test code.

## Regression Check

- **Standard switch:** `validateSwitch` still has Trapped check at step 3b. No regression.
- **Fainted switch:** `validateFaintedSwitch` does not check Trapped, which is correct -- a fainted Pokemon's recall is a special case (the Pokemon is already incapacitated). Trapped is a combat condition that prevents voluntary/forced recall of conscious Pokemon.
- **Recall-only:** `recall.post.ts` has Trapped check in the validation loop. No regression.
- **Forced switch flow in switch.post.ts:** The comment on line 89 was updated from "skips Trapped" to "checks Trapped per decree-039." The `validateForcedSwitch` call correctly passes through. No regression.
- **canSwitchedPokemonBeCommanded:** Unchanged, still correctly handles League restriction exemptions for forced switches. No regression.
- **applyRecallSideEffects:** Unchanged, clears volatile conditions on recall. No regression.

## Summary

All three code-review-308 issues (1 HIGH, 2 MEDIUM) are fully resolved in this fix cycle. The implementation correctly enforces decree-039 (Trapped blocks Roar's forced recall) and decree-044 (remove phantom Bound condition) across all four code paths: server-side standard switch validation, server-side forced switch validation, server-side recall-only validation, and client-side forced switch pre-validation. The tempConditions data source bug is fixed in all locations. No regressions detected. Test coverage is adequate for the mechanics involved.

## Rulings

1. **Trapped check on fainted switch:** `validateFaintedSwitch` does not check for Trapped. This is acceptable -- a fainted Pokemon is being removed from play, and the Trapped condition's purpose is to prevent a conscious Pokemon from escaping battle. PTU does not explicitly address this edge case, but the intent of Trapped (prevent escape) does not apply to removing an incapacitated Pokemon. No decree-need filed.

2. **Ghost type immunity to Trapped:** The switching code does not check Ghost type immunity to Trapped. This is correct -- type immunity is enforced at condition application time (`typeStatusImmunity.ts`), not at recall time. A Ghost type should never have Trapped in the first place. If one somehow did (data corruption), the defensive check at recall time would still correctly block the recall, which is the safe behavior.

## Verdict

**APPROVED** -- All mechanics verified correct. All code-review-308 issues resolved. No regressions. Decree-039 and decree-044 faithfully implemented.
