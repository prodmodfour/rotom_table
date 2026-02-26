---
review_id: rules-review-154
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ux-004
domain: player-view
commits_reviewed:
  - e3facc8
  - dabee52
  - a9fb82b
  - fd35f50
mechanics_verified:
  - enemy-hp-display-masking
  - information-asymmetry-tiers
  - fainted-state-consistency
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Hit-Points
  - core/07-combat.md#Injuries
reviewed_at: 2026-02-26T05:25:00Z
follows_up: null
---

## Mechanics Verified

### Enemy HP Display Masking (roundToDisplayTier)

- **Rule:** PTU 1.05 does not mandate HP hiding from players. This is a design-choice feature for information asymmetry. The relevant PTU context is that HP is tracked precisely on character sheets, and injury markers fire at exact thresholds: "50% of a target's maximum Hit Points, or when a target is brought to 0% or less of their maximum Hit Points, 0%, -50%, -100%, and every -50% after that" (`core/07-combat.md#Injuries`).
- **Implementation:** `roundToDisplayTier()` in `usePlayerGridView.ts` (line 124-132) and duplicated in `GridCanvas.vue` (line 173-181) snaps a raw HP percentage to one of six tiers: 100, 75, 50, 25, 10, or 0. The thresholds use midpoint rounding: >=88 -> 100, >=63 -> 75, >=38 -> 50, >=25 -> 25, >0 -> 10, <=0 -> 0.
- **Analysis:** The tier boundaries are internally consistent. The 10% "critical" tier is a good design choice -- it prevents a living enemy (e.g., 1 HP) from displaying as 0% (fainted). The midpoint thresholds (88, 63, 38) are correct for nearest-25% rounding. Edge cases verified:
  - `percentage = 0` -> 0 (fainted). Correct.
  - `percentage = 1` -> 10 (critical but alive). Correct.
  - `percentage = 24` -> 10 (critical). Correct.
  - `percentage = 25` -> 25. Correct.
  - `percentage = 88` -> 100 (rounds up). Correct.
  - `percentage = 100` -> 100. Correct.
  - `percentage < 0` (negative HP from overkill) -> 0 (fainted). Correct.
- **Status:** CORRECT

### Information Asymmetry Tiers (Own / Allied / Enemy)

- **Rule:** Design spec mandates: Own = full info, Allied = name + exact HP, Enemy = name + HP percentage only.
- **Implementation:** `getDisplayHpOverride()` in `GridCanvas.vue` (line 188-204) returns `undefined` for own tokens (checked via `isOwnTokenCheck`), `undefined` for allied tokens (side === 'players' or 'allies'), and a rounded percentage for enemies. When `displayHpOverride` is `undefined`, `VTTToken.vue` falls through to exact HP calculation (line 159-169).
- **Analysis:** The ownership check correctly identifies the player's character and their Pokemon. The side check correctly exempts all players/allies combatants from rounding. Only `side === 'enemies'` combatants receive the rounded override. This matches the design spec's three-tier information model.
- **Status:** CORRECT

### Fainted State Consistency

- **Rule:** In PTU, a Pokemon/Trainer at 0 HP or below is fainted/unconscious.
- **Implementation:** `isFainted` in `VTTToken.vue` (line 172-175) reads `entity.value.currentHp <= 0` directly, independent of `displayHpOverride`. The CSS class `vtt-token--fainted` applies opacity 0.5 and grayscale filter.
- **Analysis:** This is correct -- `isFainted` uses the real HP value, not the masked display. A fainted enemy will show both the 0% bar AND the fainted visual styling (dimmed/greyed). An enemy at 1% HP will show a 10% bar but NOT appear fainted. There is no state where the visual fainted indicator contradicts the HP bar display.
- **Status:** CORRECT

## Summary

The HP masking implementation is internally consistent and does not misrepresent game state in any mechanically significant way. PTU does not define rules about HP hiding from players, so this is purely a UI design choice. The display tier logic is sound: the six tiers (100/75/50/25/10/0) give players a coarse read of enemy health without revealing exact values, and the 10% critical tier prevents the misleading case of a living enemy appearing fainted.

The `isFainted` computed property correctly reads real HP, not the masked display, so fainted visual styling always matches actual game state.

GroupGridCanvas does not pass `playerMode` to GridCanvas, so Group View continues showing exact HP bars for all combatants. The GM view (VTTContainer) also does not pass `playerMode`. IsometricCanvas does not use VTTToken. All non-player views are confirmed unaffected.

## Rulings

**R1 (INFORMATIONAL): Duplicated `roundToDisplayTier` function.** The same function exists in both `usePlayerGridView.ts` (line 124-132) and `GridCanvas.vue` (line 173-181). While both copies are identical today, this is a DRY violation that could lead to tier drift if one copy is updated without the other. This is a code quality concern (Senior Reviewer domain), not a game logic issue. The comment in GridCanvas ("Matches the tiers in usePlayerGridView.roundToDisplayTier") partially mitigates this by documenting the relationship.

**R2 (MEDIUM): PTU injury markers may leak precise HP information.** PTU injury markers fire at exact HP thresholds: 50%, 0%, -50%, -100%. If the injury system displays these markers on enemy tokens in player mode, a player could deduce that an enemy crossed a specific threshold even though the HP bar shows a rounded tier. For example, an enemy at 49% HP would show a 50% bar, but the 50% injury marker would reveal that HP dropped below 50%. This is outside the scope of ux-004 (which only addresses the HP bar) but should be tracked as a follow-up ticket if injury markers are ever displayed on tokens in player mode. Currently, VTTToken does not display injury markers, so this is a future concern only.

## Verdict

**APPROVED** -- No critical or high issues. The rounding logic is correct and internally consistent. The one medium issue (R2) is a theoretical future concern about injury markers, not a defect in the current implementation.

## Required Changes

None. The implementation is correct as shipped.
