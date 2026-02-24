---
review_id: rules-review-139
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-001
domain: character-lifecycle
commits_reviewed:
  - 48d55fc
  - c6aeb4d
  - 1cd884d
mechanics_verified:
  - avatar-rendering (no game logic)
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - (none -- visual-only feature)
reviewed_at: 2026-02-24T10:15:00Z
follows_up: rules-review-136
---

## Scope

Feature-001 (B2W2 Trainer Sprites) fix cycle 2, addressing code-review-146 M1: `avatarBroken` ref not reset when the displayed entity changes in three reused components. The 3 fix commits add reset logic to existing watchers (or add new watchers) so that navigating between entities does not carry stale broken-avatar state.

The game logic reviewer's responsibility is to verify that **no PTU game mechanics were accidentally modified** across the 3 files touched by these commits.

## Mechanics Verified

### Avatar Rendering (Visual-Only)
- **Rule:** N/A -- no PTU mechanics involved
- **Implementation:** All 3 commits add exactly one statement (`avatarBroken.value = false`) to existing or new watchers that fire when the displayed entity changes. The changes are:
  - `CombatantDetailsPanel.vue` (line 210-212): New watcher on `props.combatant?.id` resets `avatarBroken` to `false`. No other logic in the watcher body.
  - `gm/characters/[id].vue` (line 361): Reset `avatarBroken` to `false` at the top of the existing `characterId` watcher, before calling `loadCharacter()`. The `loadCharacter()` call and its behavior are unchanged.
  - `CharacterModal.vue` (line 323): Reset `avatarBroken` to `false` inside the existing `props.character` watcher, alongside the existing `activeTab` and `editData` resets. No other changes to the watcher.
- **Status:** CORRECT

## Game Logic Regression Check

**Verification method:** Reviewed the full diff of all 3 fix commits (`git diff 48d55fc~1..1cd884d`). Total changes: 9 insertions, 2 deletions across 3 files. All changes are `avatarBroken.value = false` assignments and comment updates. No game logic files were modified.

| Game Logic File | Modified? |
|----------------|-----------|
| `composables/useCombat.ts` | No |
| `composables/useCapture.ts` | No |
| `composables/useMoveCalculation.ts` | No |
| `composables/useEntityStats.ts` | No |
| `composables/useRestHealing.ts` | No |
| `server/services/combatant.service.ts` | No |
| `server/services/pokemon-generator.service.ts` | No |
| `server/api/capture/*.ts` | No |
| `utils/captureRate.ts` | No |
| `utils/diceRoller.ts` | No |
| `constants/combatManeuvers.ts` | No |

**Files with game logic that were touched (avatar changes only):**

| File | Game Logic Present | Avatar Change Only? |
|------|-------------------|-------------------|
| `CombatantDetailsPanel.vue` | Combatant display, HP/stats/stages rendering | Yes -- added 5-line watcher (lines 209-212) that only resets `avatarBroken`. All HP logic (lines 230-257), stat display (lines 276-285), combat stages (lines 269-273), and status conditions (lines 154-166) are untouched. |
| `gm/characters/[id].vue` | Character stats display, healing tab, equipment, derived trainer capabilities | Yes -- added 1 line (line 361) resetting `avatarBroken` before the existing `loadCharacter()` call. All stat rendering (lines 114-145), derived stats (lines 344-349), healing tab (lines 238-245), and save logic (lines 409-425) are untouched. |
| `CharacterModal.vue` | Character editing, HP display, equipment, WebSocket broadcast | Yes -- added 1 line (line 323) resetting `avatarBroken` inside existing character watcher. All edit/save logic (lines 312-329), HP display (lines 69-74, 180-188), equipment handling (lines 332-351), and WebSocket broadcast (lines 345-351) are untouched. |

## Coverage Completeness Check

Verified that no other `avatarBroken`-using components have the stale-ref problem:

| Component | Uses `avatarBroken`? | Stale-ref risk? | Reason |
|-----------|---------------------|----------------|--------|
| `GMActionModal.vue` | Yes | No | Guarded by `v-if="actionModalCombatant && encounter"` -- destroyed on close, fresh instance on reopen |
| `VTTToken.vue` | Yes | No | Rendered in `v-for` with `:key="token.combatantId"` -- separate instance per combatant |
| `HumanCard.vue` | Yes | No | Rendered in `v-for` with `:key="human.id"` -- separate instance per character |
| `QuickCreateForm.vue` | Yes | No | Dedicated page component (`/gm/create`) -- not reused in-place |
| `CombatantDetailsPanel.vue` | Yes | **Fixed** | Watcher on `props.combatant?.id` added (commit `48d55fc`) |
| `CharacterModal.vue` | Yes | **Fixed** | Reset added to existing `props.character` watcher (commit `1cd884d`) |
| `gm/characters/[id].vue` | Yes | **Fixed** | Reset added to existing `characterId` watcher (commit `c6aeb4d`) |

All `avatarBroken`-using components are accounted for. The 3 fixed components were the only ones with stale-ref risk.

## Summary

All 3 fix commits are strictly scoped to avatar rendering state management -- resetting the `avatarBroken` reactive ref when the displayed entity changes. Each fix is a single `avatarBroken.value = false` statement placed in the correct watcher for the component's reuse pattern. Zero game logic code was modified. The fixes exactly match the suggestions in code-review-146 M1. No PTU mechanics are involved in this feature.

## Rulings

No PTU rulings required -- this feature does not implement or modify any game mechanics.

## Verdict

**APPROVED** -- No game logic regression. All changes are visual-only (avatar state reset). The 3 M1 fixes from code-review-146 are correctly implemented and complete. No other components have the stale-ref problem.

## Required Changes

None.
