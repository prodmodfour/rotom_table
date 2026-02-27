---
review_id: code-review-080
trigger: orchestrator-routed
target_tickets: [ptu-rule-059]
reviewed_commits: [1428217, c5610a2, 043e890, 97a6a4e]
verdict: APPROVED_WITH_ISSUES
reviewed_at: 2026-02-20T00:00:00Z
reviewer: senior-reviewer
---

## Scope

Review of ptu-rule-059 (Scene-frequency move enforcement) implementation across 8 files:
- `app/utils/moveFrequency.ts` (216 lines) -- core pure utility
- `app/server/api/encounters/[id]/move.post.ts` -- frequency validation before execution
- `app/server/api/encounters/[id]/next-scene.post.ts` -- scene counter reset endpoint
- `app/server/api/encounters/[id]/start.post.ts` -- scene reset on encounter start
- `app/server/api/encounters/[id]/end.post.ts` -- scene reset on encounter end
- `app/components/encounter/GMActionModal.vue` -- UI for disabled exhausted moves
- `app/types/character.ts` -- `lastTurnUsed` field addition
- `app/tests/unit/utils/moveFrequency.test.ts` -- 39 unit tests

## Issues Found

### HIGH

**H1: Mutation in `move.post.ts` line 113 -- `pokemonEntity.moves` reassignment mutates the combatant entity**

```typescript
// Line 111-115
const pokemonEntity = actor.entity as { moves: Move[] }
const updatedMove = incrementMoveUsage(move, record.currentRound)
pokemonEntity.moves = pokemonEntity.moves.map((m, i) =>
  i === moveIndex ? updatedMove : m
)
```

`pokemonEntity` is a reference to `actor.entity`, which is a reference into the parsed `combatants` array. Reassigning `.moves` directly mutates the combatant's entity in place. The `incrementMoveUsage` call itself is immutable (returns a new Move), but the assignment `pokemonEntity.moves = ...` writes directly into the object that `actor.entity` points to. This is a pattern violation (coding-style.md: "ALWAYS create new objects, NEVER mutate").

That said, this mutation is intentional here because the combatants array is later serialized back to the DB on line 153-159. The server endpoint is not working with reactive Pinia state -- it is working with a freshly-parsed JSON array from the DB. So this is technically safe in this specific context (server-side, non-reactive, throwaway object), but it violates the project's universal immutability rule and sets a bad precedent.

**Recommendation:** Create a new entity object and replace the combatant's entity reference immutably, matching the pattern used in `end.post.ts` lines 64-69. This is not blocking but should be fixed for consistency.

---

**H2: `dbUpdates` array is awaited twice, causing already-resolved promises to be re-awaited**

In `move.post.ts`, `dbUpdates` is first `await Promise.all`-ed on line 106 (for damage syncs), then new promises are pushed on lines 119-124 (move usage sync), and `await Promise.all(dbUpdates)` is called again on line 130. The second `Promise.all` will include the already-resolved damage promises. While `Promise.all` on already-resolved promises is a no-op (not a bug), it obscures intent and suggests the developer thought only the new entries would be awaited.

**Recommendation:** Use a separate array for move usage DB updates, or clear the array between the two `await` calls.

---

### MEDIUM

**M1: Missing test -- `resetSceneUsage` does not verify that daily counters (`usedToday`) are preserved**

The review checklist item 3 specifically asks to verify that `resetSceneUsage` does not reset daily counters. The implementation is correct -- `resetSceneUsage` only zeroes `usedThisScene` and `lastTurnUsed`. But there is no test asserting that a Daily move's `usedToday` survives a scene reset. This is a critical invariant that should be covered.

**Recommendation:** Add a test:
```typescript
it('does not reset usedToday for daily-frequency moves', () => {
  const moves = [
    makeMove({ frequency: 'Daily x2', usedToday: 1, usedThisScene: 1 })
  ]
  const result = resetSceneUsage(moves)
  expect(result[0].usedToday).toBe(1)
  expect(result[0].usedThisScene).toBe(0)
})
```

---

**M2: `incrementMoveUsage` increments `usedThisScene` for Daily moves -- but `checkMoveFrequency` only checks `usedToday` for Daily moves**

In `incrementMoveUsage` (lines 185-189), Daily moves increment both `usedToday` and `usedThisScene`. However, in `checkMoveFrequency`, the Daily branch (lines 141-153) only checks `usedToday`, never `usedThisScene`. This means `usedThisScene` is tracked for Daily moves but never consumed for validation purposes. It is only useful for display or for the scene reset path, where it is zeroed on reset.

This is not a bug per se -- PTU Daily limits are per-day, not per-scene. But tracking `usedThisScene` on Daily moves without ever using it for anything is dead data that could confuse future developers.

**Recommendation:** Add a comment explaining why `usedThisScene` is tracked on Daily moves (presumably for scene-reset to zero it out so the counter resets visually without touching the daily limit). Or remove it if there is no consumer.

---

**M3: `start.post.ts` mutates combatant objects directly (lines 40-69)**

The `forEach` loop on line 40 directly mutates each combatant (`c.hasActed = false`, `c.actionsRemaining = 2`, etc.) and also directly mutates `entity.moves` on line 59. The `end.post.ts` endpoint uses the immutable `.map()` pattern to create new objects, which is the correct approach. `start.post.ts` should follow the same pattern.

This is the same class of violation as H1 -- safe in server context, but inconsistent with project rules and with the adjacent `end.post.ts` file.

---

**M4: No frequency enforcement for HumanCharacter moves (trainers/NPCs)**

All frequency checking in `move.post.ts` is gated behind `actor.type === 'pokemon'` (line 39). If trainers or NPCs ever gain moves with frequency restrictions (PTU trainers can have Features that act like moves), they will bypass enforcement entirely. The `checkMoveFrequency` utility itself is type-agnostic -- the restriction is only in the API endpoint.

**Recommendation:** File a forward-looking ticket if trainer Features with frequencies are planned. Not blocking for current scope.

---

### LOW

**L1: `end.post.ts` unconditionally syncs all Pokemon move data on encounter end (lines 114-122)**

The sync loop at line 114 pushes a `prisma.pokemon.update` for every Pokemon combatant, even if no move data actually changed. The condition-change check on line 107 is separate. Compare to `next-scene.post.ts` which correctly checks `resetMoves.every((m, i) => m === moves[i])` before pushing a DB update. This means encounter end will issue unnecessary DB writes for Pokemon whose moves had no scene usage.

---

**L2: Redundant equality check in `next-scene.post.ts` line 41**

```typescript
if (resetMoves === moves || resetMoves.every((m, i) => m === moves[i])) {
```

`resetSceneUsage` always returns a new array (via `.map()`), so `resetMoves === moves` will always be `false`. The reference check is dead code. Only the `.every()` check does useful work.

---

## What Looks Good

1. **`moveFrequency.ts` is excellent.** Clean pure functions, proper separation of concerns (parsing, validation, tracking, reset), well-documented with JSDoc, and consistent with the project's utility pattern. 216 lines is well within the 800-line cap. Every function returns new objects. The `FrequencyCheckResult` interface provides clear, descriptive error messages.

2. **All PTU frequency types are handled.** At-Will, EOT, Scene/x2/x3, Daily/x2/x3, and Static are all covered with correct logic. The EOT check (`currentRound <= lastUsed + 1`) is precisely correct per PTU rules.

3. **`resetSceneUsage` correctly preserves daily counters.** The function only zeroes `usedThisScene` and `lastTurnUsed`. The `usedToday` field is untouched, which is exactly right -- daily limits persist across scenes.

4. **GM modal integration is clean.** `isMoveExhausted` and `getMoveDisabledReason` delegate to the pure utility. The CSS class `move-btn--exhausted` with `opacity: 0.4` and `text-decoration: line-through` makes exhausted moves visually distinct. The `title` attribute provides the reason on hover. The `disabled` attribute on the button prevents click.

5. **DB persistence is thorough.** Move usage is synced to the Pokemon DB record in `move.post.ts`, `start.post.ts`, `end.post.ts`, and `next-scene.post.ts`. This means frequency state survives server restarts and is consistent between the encounter's combatant JSON and the Pokemon's own record.

6. **39 unit tests cover all frequency types.** The test file has clear sections matching the utility's structure, uses a `makeMove` factory for clean setup, and tests edge cases (undefined `usedThisScene`, same-turn EOT block, reference identity for unchanged objects).

7. **Type definitions are well-placed.** Adding `lastTurnUsed`, `usedThisScene`, `usedToday`, and `lastUsedAt` as optional fields on the `Move` interface is the right design -- backward compatible with existing data, and the utility handles `undefined` via `?? 0`.

8. **Error handling in `move.post.ts` is correct.** The 400 error for exhausted moves re-throws with the status code, bypassing the generic 500 catch. The error message includes the move name and the specific reason from `checkMoveFrequency`.

## New Tickets Filed

**Ticket: ptu-rule-059-cleanup (MEDIUM)**
- Fix mutation in `move.post.ts` lines 111-115: create a new entity object instead of reassigning `.moves` on the existing reference
- Fix mutation in `start.post.ts` lines 40-69: use `.map()` pattern matching `end.post.ts`
- Separate `dbUpdates` arrays in `move.post.ts` for damage vs move-usage syncs
- Add missing test: `resetSceneUsage` preserves `usedToday` on Daily moves
- Remove dead reference check in `next-scene.post.ts` line 41
- Add guard in `end.post.ts` to skip Pokemon move sync when no moves changed

## Verdict

**APPROVED_WITH_ISSUES**

The core implementation is solid. `moveFrequency.ts` is a textbook pure utility -- clean, well-tested, and correct for all PTU frequency types. The integration across 4 server endpoints and the GM modal is thorough and ensures persistence.

The issues found are consistency violations (mutation in server code) and a missing test case, not correctness bugs. The H1/H2 items should be fixed in a follow-up cleanup pass before moving to the next feature domain. None of the issues are blocking because the server-side mutation targets disposable parsed JSON, not reactive state.
