---
review_id: rules-review-185
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: refactoring-087, refactoring-088, ptu-rule-117, ux-009, ux-010
domain: vtt-grid, combat, character-lifecycle, encounter-tables
commits_reviewed:
  - c76cb8e
  - 05a2cda
  - e8da88a
  - 83264fb
  - b3a032c
mechanics_verified:
  - contest-stat-naming
  - type-status-immunities
  - significance-tiers
  - rough-terrain-accuracy
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/04-trainer-classes.md#Style Expert
  - core/07-combat.md#Type Immunities
  - core/07-combat.md#Persistent Afflictions
  - core/11-running-the-game.md#Significance Multiplier
reviewed_at: 2026-02-27T16:50:00Z
follows_up: null
---

## Mechanics Verified

### Contest Stat Naming (ptu-rule-117)

- **Rule:** "An advanced Contest competitor that specializes in one of the five Contest Stats: Beauty, Cool, Cute, Smart, and Tough." (`core/04-trainer-classes.md`, line 277-278). Confirmed again at line 2485: "When you take Style Expert, choose from Beauty, Cool, Cute, Smart, or Tough."
- **Implementation:** `BRANCHING_CLASS_SPECIALIZATIONS['Style Expert']` changed from `['Cool', 'Beautiful', 'Cute', 'Smart', 'Tough']` to `['Cool', 'Beauty', 'Cute', 'Smart', 'Tough']` in `app/constants/trainerClasses.ts:111`.
- **Status:** CORRECT. The PTU rulebook consistently uses the noun form "Beauty" as the Contest Stat name, not the adjective "Beautiful". The fix aligns with PTU RAW. Per decree-022, branching class specializations are stored as suffix strings (e.g., "Style Expert: Beauty"), so the canonical stat name must match exactly.

### Type-Based Status Immunities (ux-009)

- **Rule:** PTU p.239 (core/07-combat.md lines 1044-1055):
  - "Electric Types are immune to Paralysis"
  - "Fire Types are immune to Burn"
  - "Ghost Types cannot be Stuck or Trapped"
  - "Ice Types are immune to being Frozen"
  - "Poison and Steel Types are immune to Poison"
- **Implementation:** `StatusConditionsModal.vue` now displays IMMUNE tags proactively for all statuses the entity's types grant immunity to, regardless of checkbox state. The `getImmuneLabel()` function (line 117-120) calls `isImmuneToStatus()` which checks against `TYPE_STATUS_IMMUNITIES` in `typeStatusImmunity.ts`. The underlying immunity map matches PTU RAW exactly:
  - Electric -> Paralyzed
  - Fire -> Burned
  - Ghost -> Stuck, Trapped
  - Ice -> Frozen
  - Poison -> Poisoned, Badly Poisoned
  - Steel -> Poisoned, Badly Poisoned
- **Status:** CORRECT. The change only affects display visibility (removing two guard clauses that hid the IMMUNE tag when the status wasn't checked or was already applied). The immunity logic itself is unchanged and was verified correct in previous reviews. Per decree-012, the server enforces immunities with a GM override flag; the client IMMUNE tag is informational and does not prevent GM overrides (the "Force Apply (GM Override)" button is still available when immune statuses are checked). The proactive display is a UX improvement that does not alter game logic.

### Significance Tier Boundaries (ux-010)

- **Rule:** PTU Core p.460 (core/11-running-the-game.md lines 2857-2879): "The Significance Multiplier should range from x1 to about x5." Specific ranges:
  - Insignificant: "x1 to x1.5"
  - Everyday: "about x2 or x3"
  - Significant: "x4 to x5 depending on their significance"
  - Higher: "x5 or even higher!"
- **Implementation:** The `SIGNIFICANCE_PRESETS` array in `encounterBudget.ts` defines tier boundaries. The fix changed:
  - Significant: `{ min: 4.0, max: 5.0 }` -> `{ min: 4.0, max: 4.99 }`
  - Climactic: `{ min: 5.0, max: 7.0 }` -> `{ min: 5.0, max: 6.99 }`
- **Status:** CORRECT. PTU RAW defines significance as a continuous spectrum with approximate guidelines, not rigid tier boundaries. The tier system is a tool-level convenience feature (not a PTU rule), so exact boundary placement is a design decision, not a rules question. The fix resolves a genuine ambiguity where x5.0 mapped to both Significant and Climactic tiers simultaneously. The chosen split (Significant tops at 4.99, Climactic starts at 5.0) is consistent with PTU's guidance that x5 is at the top of the "significant" range and should transition to the next tier. No decree governs this area.

### Rough Terrain Accuracy Penalty — allCombatants Parameter (refactoring-088)

- **Rule:** PTU p.231 (core/07-combat.md): "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." Per decree-003: "Squares occupied by enemies always count as Rough Terrain."
- **Implementation:** `useMoveCalculation` signature changed `allCombatants` from optional to required. The `combatantsOnGrid` computed property previously fell back to `targets.value` when the optional param was not provided, which could miss enemy-occupied cells outside the target list. Now callers must explicitly provide the full combatant list.
- **Status:** CORRECT in principle. The change improves correctness by ensuring the rough terrain penalty can detect all enemy-occupied cells, not just target cells.

**Observation (MEDIUM):** The existing caller `MoveTargetModal.vue` (line 288) passes `targetsRef` as both `targets` and `allCombatants`: `useMoveCalculation(moveRef, actorRef, targetsRef, targetsRef)`. This means `allCombatants` still only contains the targets, not all combatants in the encounter. This is a pre-existing issue not introduced by this commit (previously it fell back to `targets.value` anyway), but the refactoring was described as fixing this gap. The caller should pass all encounter combatants, not just targets, for decree-003 enemy-occupied rough terrain to work correctly for non-target enemies along the line of sight. Filed as observation, not blocking.

### Terrain Migration Test Split (refactoring-087)

- **Rule:** N/A (code health only, no game mechanics involved)
- **Implementation:** Extracted `migrateLegacyCell` tests (~86 lines, 7 tests) from `terrain.test.ts` (811 lines) into `terrain-migration.test.ts`. Remaining file at 773 lines.
- **Status:** N/A for rules review. Test coverage preserved; all 7 migrated tests verify the same assertions. Import path `~/stores/terrain` is correct. No game logic changes.

## Summary

All five changes are rules-correct. The key PTU mechanics verified:

1. **Contest stat "Beauty"** matches PTU RAW exactly (not "Beautiful"). Five canonical contest stats confirmed: Beauty, Cool, Cute, Smart, Tough.
2. **Type-immunity IMMUNE tags** now display proactively in the StatusConditionsModal. The underlying immunity map matches PTU p.239 exactly. The GM override path (decree-012) remains intact.
3. **Significance tier boundaries** are a tool convenience layer, not PTU rules. The overlap fix at x5.0 and x7.0 is logically sound and consistent with PTU's approximate guidelines.
4. **allCombatants required parameter** improves the API contract for rough terrain penalty correctness per decree-003, though the existing caller still passes targets only (pre-existing issue).

## Rulings

- **ptu-rule-117:** "Beauty" is the canonical PTU contest stat name. The adjective form "Beautiful" was incorrect. Fix verified against PTU Core Chapter 4 (pp. 277-278, 2485-2486).
- **ux-009:** Proactive IMMUNE tag display is a pure UX improvement. No PTU rule requires or prohibits showing immunities before a status is selected. Per decree-012, enforcement happens server-side; client display is informational.
- **ux-010:** PTU says significance ranges "from x1 to about x5" with "x5 or even higher." The tool's Climactic (5-7) and Legendary (7-10) tiers are GM convenience extensions beyond PTU RAW. No ruling needed -- these are tool features, not rule implementations.

## Verdict

**APPROVED** -- all changes are rules-correct.

## Required Changes

None. One medium-severity observation noted (MoveTargetModal.vue passes targets as allCombatants), but this is a pre-existing issue not introduced by the reviewed commits and does not block approval.
