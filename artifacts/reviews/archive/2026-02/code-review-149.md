---
review_id: code-review-149
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-001
domain: character-lifecycle
commits_reviewed:
  - 48d55fc
  - c6aeb4d
  - 1cd884d
files_reviewed:
  - app/components/group/CombatantDetailsPanel.vue
  - app/components/character/CharacterModal.vue
  - app/pages/gm/characters/[id].vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-24T00:15:00Z
follows_up: code-review-146
---

## Review Scope

Re-review of feature-001 P0 fix cycle 2. The previous review (code-review-146) was CHANGES_REQUIRED with one actionable issue: M1 (MEDIUM) -- `avatarBroken` ref not reset when entity changes in three reused components. The developer applied 3 targeted commits, one per affected file. This review verifies all M1 fixes are correct and complete.

## Previous Issue Resolution

### M1: avatarBroken ref not reset when entity changes -- RESOLVED

All three files now reset `avatarBroken.value = false` at the correct point in their entity-change lifecycle.

**CombatantDetailsPanel.vue** (commit `48d55fc`): Added a standalone watcher on `props.combatant?.id` that resets `avatarBroken` to `false`. Verified at line 210-212. The watcher uses the optional chaining form `props.combatant?.id`, which correctly handles the `null` combatant case (returns `undefined`, no crash). The watcher fires whenever the combatant ID changes, which is exactly when the group encounter view advances turns. The `avatarBroken` reset happens before the new combatant's `resolvedHumanAvatarUrl` computed re-evaluates, because Vue processes watchers synchronously before the next render. Fix is correct.

**gm/characters/[id].vue** (commit `c6aeb4d`): Added `avatarBroken.value = false` as the first statement in the existing `characterId` watcher (line 361), before the `await loadCharacter()` call. Verified at lines 360-363. Resetting before the async load is the correct order -- the avatar URL computed will immediately re-evaluate with `avatarBroken = false` and the new character's `avatarUrl`, so the `<img>` tag renders with the new URL. If the new URL also fails, the `@error` handler will set `avatarBroken = true` again. The watcher comment was also updated to explain why the reset is needed ("Nuxt reuses the page component"). Fix is correct.

**CharacterModal.vue** (commit `1cd884d`): Added `avatarBroken.value = false` in the existing `props.character` watcher (line 323), between the `activeTab` reset and the `editData` spread. Verified at lines 321-325. The watcher comment was updated from "Reset tab when character changes" to "Reset tab and avatar state when character changes". The placement is correct -- it runs whenever the parent swaps the `character` prop without unmounting the modal. Even though the `v-if` guard on the parent means most character swaps will destroy/recreate the component, the watcher exists specifically for the case where the parent directly updates the prop. Fix is correct and defensive.

## Completeness Check: Other avatarBroken Users

Verified that no other `avatarBroken` users have the stale-ref problem:

| Component | Reuse Pattern | Stale Risk? |
|-----------|--------------|-------------|
| `HumanCard.vue` | v-for with `:key="human.id"` -- each card is a distinct instance for one human | No -- Vue creates/destroys per key |
| `GMActionModal.vue` | Guarded by `v-if="actionModalCombatant && encounter"` -- destroyed on close, recreated on open | No -- fresh instance per open |
| `VTTToken.vue` | v-for with `:key="token.combatantId"` -- one instance per combatant on the grid | No -- each token is a fixed combatant |
| `QuickCreateForm.vue` | Create flow -- single entity, no prop swapping | No -- always fresh |

The `brokenAvatars` Set pattern (used in `InitiativeTracker.vue` and `PlayerLobbyView.vue`) is inherently immune to this problem because it tracks broken state per entity ID rather than using a single boolean.

All `avatarBroken` users are accounted for. No additional watchers needed.

## Regression Check

- No game logic files were modified. All three commits are strictly scoped to avatar rendering state management.
- File sizes are well within limits: CombatantDetailsPanel.vue (757 lines), CharacterModal.vue (537 lines), gm/characters/[id].vue (704 lines).
- No new dependencies, no template changes, no style changes. Each commit adds only the minimal watcher reset.
- Commit messages are well-written with clear descriptions of the bug scenario and the fix rationale.
- Commit granularity is correct: one commit per file, each addressing one specific instance of the same M1 issue.

## What Looks Good

1. **Exact match to prescribed fixes.** The developer implemented precisely what code-review-146 specified -- no scope creep, no unnecessary additions. The watcher patterns match the review's suggested code blocks line-for-line.

2. **Correct execution order.** In `gm/characters/[id].vue`, the reset happens before `await loadCharacter()`, which is the right order -- it allows the avatar to attempt loading with the new character's URL immediately, rather than briefly showing the letter-initial fallback during the async load.

3. **Comment updates.** All three files have updated watcher comments explaining the purpose of the reset. The CombatantDetailsPanel watcher has its own dedicated comment ("Reset broken state when the displayed combatant changes"), and the other two watchers have amended comments reflecting the expanded scope.

4. **Defensive correctness.** The CharacterModal fix is defensive -- the `v-if` guard means most uses will destroy/recreate the component, but the watcher handles the edge case where the parent swaps the prop without unmounting. This is the right approach: handle both paths rather than relying on one.

## Verdict

**APPROVED**

All three M1 fixes from code-review-146 are correctly implemented. No regressions introduced. No new issues found. The `avatarBroken` stale-ref problem is fully resolved across all affected components. The remaining M2 from code-review-146 (GMActionModal at 809 lines) was informational only and is tracked by refactoring-075.

## Required Changes

None.
