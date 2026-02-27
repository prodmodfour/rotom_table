---
review_id: code-review-180
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ux-007
domain: vtt-grid
commits_reviewed:
  - e1521c9
files_reviewed:
  - app/composables/usePlayerGridView.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-26T15:05:00Z
follows_up: null
---

## Review Scope

First code review of the ux-007 fix: player's own tokens were hidden in explored fog cells. The fix adds one line to `usePlayerGridView.ts` that short-circuits the fog-of-war filter for the player's own combatants.

Commit `e1521c9`: `fix: show player's own tokens in explored fog cells`

1 file changed, 2 insertions, 1 deletion (JSDoc comment update + the filter line).

## Analysis

### The Bug

In `usePlayerGridView.ts`, the `visibleTokens` computed property filtered combatants by fog state. Before the fix, the filter logic was:

```typescript
.filter(c => {
  if (!fogStore.enabled) return true
  const pos = c.position!
  const state: FogState = fogStore.getCellState(pos.x, pos.y)
  return state === 'revealed'
})
```

This hid ALL tokens (including the player's own Trainer and Pokemon) in `hidden` and `explored` cells. While hiding enemy tokens in non-revealed cells is correct information asymmetry, hiding the player's own tokens denies information the player inherently possesses -- you always know where you and your Pokemon are.

### The Fix

The fix adds a single line before the fog state check:

```typescript
if (isOwnCombatant(c)) return true
```

This means:
- Fog disabled: all tokens visible (unchanged)
- Own combatants: always visible regardless of fog state (new)
- Other combatants in `revealed` cells: visible (unchanged)
- Other combatants in `hidden`/`explored` cells: hidden (unchanged)

### Correctness

1. **Filter ordering is correct.** The `isOwnCombatant` check runs after the `fogStore.enabled` check (both return `true`, so order does not affect logic) but before the fog state lookup. This is the minimal change -- no unnecessary fog state lookups for own tokens.

2. **`isOwnCombatant` is reliable.** Defined at lines 57-61, it checks `combatant.entityId === charId` (for the Trainer) or `pokemonIds.value.includes(combatant.entityId)` (for owned Pokemon). Both the character ID and Pokemon IDs come from the composable options, which are populated from the player identity store. The check covers both entity types (HumanCharacter + Pokemon) as required by the project checklist.

3. **No side effects.** The `isOwnCombatant` function is a pure boolean check with no mutations. Adding it to the filter chain has no side effects on stores, WebSocket state, or other computed properties.

4. **JSDoc updated.** The comment above `visibleTokens` was updated to document the new behavior: "Own tokens (trainer + Pokemon) are always visible regardless of fog."

5. **Design spec deviation is justified.** The original design spec (`design-player-view-integration-001.md`, line 342) states "Fog: explored cells | Dimmed, terrain visible, no tokens." The fix intentionally deviates from this for own tokens only. This is the correct resolution -- the design spec was written as a general rule about fog behavior without explicitly considering the own-token edge case. Hiding a player's own position is a usability bug, not an intentional design choice. The ux-007 ticket correctly identifies this gap.

6. **Information asymmetry preserved for enemies.** The fix does not change how enemy or allied tokens are filtered. Non-own tokens in explored cells are still hidden. The information asymmetry model remains intact -- the only change is that self-awareness is preserved.

### Edge Cases Considered

- **Player not identified (characterId is null):** `isOwnCombatant` returns `false`, so all tokens fall through to the normal fog filter. Correct -- if we don't know who the player is, we can't determine which tokens are "own."
- **Multi-size tokens:** Token size is applied after the filter (in the `.map` step). The fog check uses only the token's origin position (`c.position`). For multi-cell tokens, this means the fog state of the origin cell determines visibility. This is the pre-existing behavior and is unchanged by the fix.
- **All three fog states:** `hidden` = no non-own tokens, `explored` = no non-own tokens (dimmed terrain only), `revealed` = all tokens visible. Own tokens visible in all three. Correct.

## What Looks Good

1. **Minimal, surgical fix.** One line of logic added, one line of JSDoc updated. No unnecessary refactoring or scope creep.
2. **Correct placement in the filter chain.** The own-token check is positioned optimally -- after the fog-enabled check and before the expensive-by-comparison fog state lookup.
3. **Leverages existing ownership detection.** The `isOwnCombatant` helper was already battle-tested for token selection and move requests. Reusing it here is clean.
4. **Commit message is clear and descriptive.** `fix: show player's own tokens in explored fog cells` accurately describes the change.

## Verdict

**APPROVED** -- The fix is correct, minimal, and well-documented. Own tokens are always visible regardless of fog state, which matches the fundamental PTU principle that a player always knows the position of their own entities. Information asymmetry for non-own tokens is preserved. The rules review (rules-review-158) has independently verified the PTU alignment.

## Required Changes

None.
