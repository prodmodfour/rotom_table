---
review_id: rules-review-158
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ux-007
domain: vtt-grid
commits_reviewed:
  - e1521c9
mechanics_verified:
  - fog-of-war-visibility
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Blindness
  - core/07-combat.md#Total-Blindness
  - core/11-running-the-game.md#Dark-Caves
  - core/11-running-the-game.md#Use-The-Environment
reviewed_at: 2026-02-26T14:30:00Z
follows_up: null
---

## Note on refactoring-083

refactoring-083 is a pure SCSS/component refactoring (extracting shared styles to `_form-utilities.scss` and splitting `XpDistributionResults.vue` from `XpDistributionModal.vue`). No game mechanics were changed. XpDistributionModal.vue is confirmed at 798 lines (under the 800-line limit). No PTU rules are at risk from this change.

## Mechanics Verified

### 1. Fog-of-War Token Visibility — Own Tokens Always Visible

- **Rule:** PTU does not define a "fog of war" mechanic per se; it is a GM tool for managing information asymmetry on a tactical map. The closest PTU rules are the Blindness/Total Blindness conditions and the Dark Caves environmental rule. Under Total Blindness, "Pokémon or Trainers have no awareness of the map, and must declare any shifts as distance relative to them" (`core/07-combat.md`, page 249). Critically, even under Total Blindness, a character always knows their own position and can declare movement relative to themselves. Under the Dark Caves rule (`core/11-running-the-game.md`, page 470), visibility is impaired by darkness, but characters always know where they are — the penalty applies to perception of *other* targets, not self-awareness. In all PTU visibility scenarios, a player always knows the location of their own Trainer and Pokemon.

- **Implementation:** `usePlayerGridView.ts:81-98` — the `visibleTokens` computed property filters combatants based on fog state. The fix at line 89 adds `if (isOwnCombatant(c)) return true` before the fog state check. This means:
  - When fog is disabled: all tokens visible (line 88, unchanged)
  - Own combatants (trainer + owned Pokemon): always visible regardless of fog (line 89, new)
  - Other combatants in `revealed` cells: visible (line 92, unchanged)
  - Other combatants in `hidden` or `explored` cells: hidden (implicit, unchanged)

- **Status:** CORRECT — A player should always know where their own Trainer and Pokemon are on the map. No PTU rule removes self-awareness of position. The previous behavior (hiding own tokens in explored/hidden cells) was incorrect because it denied information the player inherently possesses. The fix correctly short-circuits the fog check for own combatants while preserving the information-hiding behavior for all other tokens.

### 2. Three-State Fog Model — Explored vs Revealed Distinction

- **Rule:** PTU's visibility model for Dark Caves (`core/11-running-the-game.md`, page 470) distinguishes between illuminated squares (no penalty) and unilluminated squares (cumulative -2 penalty per meter). This maps naturally to a three-state fog model: `revealed` (currently illuminated, full info), `explored` (previously seen but no longer illuminated, limited info), and `hidden` (never seen, no info). The "explored" state represents areas the party has passed through but is no longer actively observing — the GM retains control of what information persists.

- **Implementation:** The fog store (`fogOfWar.ts:4`) defines `FogState = 'hidden' | 'revealed' | 'explored'`. The `visibleTokens` filter only shows non-own tokens in `revealed` cells (line 92: `return state === 'revealed'`). Explored cells do not show enemy tokens — this is correct because "explored" means the area was seen before but is no longer actively observed, so real-time enemy positions should not be shown.

- **Status:** CORRECT — The explored-vs-revealed distinction correctly models the PTU concept that you only have current intelligence about areas you are actively observing. Own tokens bypass this because you always know where you are.

### 3. Ownership Detection Logic

- **Rule:** In PTU, a Trainer controls their own character and all Pokemon linked to that character. A player should have full awareness of all entities under their control.

- **Implementation:** `isOwnCombatant` (line 57-61) checks if the combatant's `entityId` matches the player's `characterId` or is included in the player's `pokemonIds` array. This covers both the Trainer token and all of the player's Pokemon tokens.

- **Status:** CORRECT — The ownership check is comprehensive. It covers the Trainer (direct `entityId === charId`) and all owned Pokemon (inclusion in `pokemonIds`). There is no scenario where a player's own entity would fail the ownership check unless `characterId` is null (which means the player hasn't identified yet, in which case showing no tokens is correct).

## Summary

The ux-007 fix correctly addresses a visibility bug where the player's own tokens were being hidden by the fog-of-war filter in explored/hidden cells. PTU rules consistently maintain that a character always knows their own position — even under Total Blindness (the most extreme PTU visibility condition), characters declare movement relative to themselves, implying self-position awareness. The fix adds a single-line short-circuit (`if (isOwnCombatant(c)) return true`) that preserves the correct fog behavior for all other tokens while ensuring own tokens are always visible. The three-state fog model (hidden/revealed/explored) correctly maps to PTU's illumination concepts, and the ownership detection logic is sound.

No design decrees apply to this domain.

## Rulings

No new rulings needed. The principle "players always know where their own entities are" is fundamental to PTU and does not require a decree.

## Verdict

**APPROVED** — The fix is correct and aligns with PTU visibility rules. No game mechanic issues found.

## Required Changes

None.
