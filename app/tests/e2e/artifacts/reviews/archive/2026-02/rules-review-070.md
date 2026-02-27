---
review_id: rules-review-070
trigger: orchestrator-routed
target_tickets: [ptu-rule-059]
reviewed_commits: [65612c3, 9dd73e2]
verdict: APPROVED_WITH_NOTES
reviewed_at: 2026-02-20T02:49:00Z
reviewer: game-logic-reviewer
---

## Scope

Review of ptu-rule-059: Scene-frequency move enforcement implementation. Verified all frequency types (At-Will, EOT, Scene/Scene x2/Scene x3, Daily/Daily x2/Daily x3, Static) against the PTU 1.05 ruleset, specifically:

- `books/markdown/core/10-indices-and-reference.md` p.337-338 (definitive frequency definitions)
- `books/markdown/core/07-combat.md` p.247 (Suppressed condition)
- `books/markdown/core/07-combat.md` p.252 (Extended Rest / Pokemon Center daily frequency restoration)

Files reviewed:
- `app/utils/moveFrequency.ts` (all frequency checking logic)
- `app/server/api/encounters/[id]/move.post.ts` (enforcement point)
- `app/server/api/encounters/[id]/end.post.ts` (encounter end reset)
- `app/server/api/encounters/[id]/start.post.ts` (encounter start reset)
- `app/server/api/encounters/[id]/next-scene.post.ts` (scene boundary reset)
- `app/tests/unit/utils/moveFrequency.test.ts` (39 unit tests)
- `app/types/combat.ts` (MoveFrequency type definition)
- `app/types/character.ts` (Move interface with tracking fields)

## Mechanics Verified

### 1. At-Will -- PASS
- **PTU p.337**: "At-Will means your Pokemon can perform the attack as often as it'd like"
- **Code**: `checkMoveFrequency` returns `{ canUse: true }` immediately for At-Will.
- **Tests**: Single test confirms always-allowed. Correct.

### 2. EOT (Every Other Turn) -- PASS
- **PTU p.337**: "EOT is an abbreviation for Every Other Turn, and it means your Pokemon can perform the move once every other turn."
- **PTU glossary p.441**: "if you did it last round, you can't do it this round"
- **Code**: `checkMoveFrequency` blocks when `currentRound <= lastTurnUsed + 1`. Used on round 3 -> blocked on round 3 and 4, allowed on round 5.
- **Tests**: 4 tests cover: never used, consecutive turn block, skip-a-turn allow, same-turn block.
- **Note**: PTU says EOT outside of battle means "10 seconds of rest." This is irrelevant for the encounter system (combat only). Correct to ignore.

### 3. Scene frequency (Scene, Scene x2, Scene x3) -- PASS WITH NOTES
- **PTU p.337**: "Scene X: This Frequency means this Move can be performed X times per Scene. Moves that simply have the Scene Frequency without a number can be performed once a Scene."
- **Code**: `getSceneLimit` returns 1/2/3 correctly. `checkMoveFrequency` compares `usedThisScene` against the limit.
- **Tests**: 6 tests cover all variants, boundary conditions, and undefined handling.
- **ISSUE (MEDIUM)**: PTU p.337 adds: "Moves that can be used multiple times a Scene can still only be used **Every Other Turn** within a Scene and not on consecutive turns." This means Scene x2 and Scene x3 moves are subject to an implicit EOT restriction. The current implementation does NOT enforce this -- a Scene x2 move could be used on round 1 and round 2 back-to-back. See Issue #1 below.

### 4. Daily frequency (Daily, Daily x2, Daily x3) -- PASS WITH NOTES
- **PTU p.337**: "Daily is the lowest Frequency. This Move's Frequency is only refreshed by an Extended Rest, or by a visit to the Pokemon Center."
- **Code**: `getDailyLimit` returns 1/2/3. `checkMoveFrequency` compares `usedToday` against the limit.
- **Tests**: 4 tests cover all Daily variants.
- **ISSUE (MEDIUM)**: PTU p.337 adds: "Moves that can be used multiple times Daily can still only be used **once a Scene** and not multiple times within the same Scene." This means Daily x2 and Daily x3 moves are limited to 1 use per scene (even though the daily total allows more). The current implementation does NOT enforce this -- a Daily x2 move could theoretically be used twice in the same scene as long as the daily total has not been exhausted. See Issue #2 below.
- **Note on Daily tracking**: `incrementMoveUsage` correctly increments both `usedToday` and `usedThisScene` for Daily moves, and `resetSceneUsage` resets `usedThisScene` at scene boundaries. However, without the per-scene cap check in `checkMoveFrequency`, the `usedThisScene` counter on daily moves is tracked but never enforced.

### 5. Static -- PASS
- **PTU p.337**: "Static, like with Features, means this Move has some effect that is always granted to the user, as long as they know this Move."
- **Code**: `checkMoveFrequency` returns `{ canUse: false, reason: 'Static moves cannot be actively used' }`.
- **Tests**: 1 test confirms blocking. Correct.

### 6. Suppressed condition -- NOT IMPLEMENTED (noted in comments only)
- **PTU p.247**: "While Suppressed, Pokemon and Trainers cannot benefit from PP Ups, and have the frequency of their Moves lowered; At-Will Moves become EOT, and EOT and Scene x2 Moves become Scene."
- **Code**: A doc comment in `moveFrequency.ts` (lines 11-12) references the Suppressed downgrade, but no actual implementation exists. `checkMoveFrequency` does not accept or inspect status conditions.
- **Verdict**: This is correctly listed as out-of-scope for ptu-rule-059 (which covers basic frequency enforcement). The Suppressed downgrade should be a separate ticket. The comment accurately documents the rule for future implementation.

### 7. Scene reset behavior -- PASS
- **PTU**: Scene-frequency moves refresh at scene boundaries. Daily moves do NOT refresh at scene boundaries.
- **Code**:
  - `resetSceneUsage` resets `usedThisScene` and `lastTurnUsed` to 0. Does NOT touch `usedToday`.
  - Called at encounter start (`start.post.ts`), encounter end (`end.post.ts`), and scene transition (`next-scene.post.ts`).
- **Tests**: 5 tests cover reset mechanics, immutability, and reference identity.
- **Correct**: Daily `usedToday` is preserved across scenes. Only `usedThisScene` and `lastTurnUsed` reset.

### 8. Daily frequency restoration -- NOT IN SCOPE (correctly deferred)
- **PTU p.252**: Extended Rest and Pokemon Center restore daily-frequency moves.
- **Code**: `useRestHealing` composable and the `/api/game/new-day` endpoint handle daily resets elsewhere. Not part of this ticket.

### 9. Frequency type completeness -- PASS
- **PTU p.337**: Five levels of Move frequency: At-Will, EOT, Scene X, Daily X, Static.
- **MoveFrequency type**: `'At-Will' | 'EOT' | 'Scene' | 'Scene x2' | 'Scene x3' | 'Daily' | 'Daily x2' | 'Daily x3' | 'Static'`
- All five categories covered. No PTU-defined frequency type is missing.

### 10. Trainer move frequency -- LOW CONCERN
- **Code**: `move.post.ts` only looks for moves on Pokemon combatants (line 39: `if (actor.type === 'pokemon')`). Trainer moves (from Martial Artist, Tumbler, etc.) are not frequency-checked.
- **Verdict**: This is acceptable for now since trainer combat features are not yet implemented in the session helper. When trainer move support is added, frequency enforcement should be extended to trainer combatants as well.

## Issues Found

### Issue #1: Scene x2/x3 moves missing implicit EOT restriction (MEDIUM)
- **PTU p.337**: "Moves that can be used multiple times a Scene can still only be used Every Other Turn within a Scene and not on consecutive turns."
- **Impact**: A Scene x2 move like Dragon Dance can currently be used on round 1 and round 2 consecutively. Per RAW, it should be blocked on round 2 and only allowed again on round 3.
- **Fix**: In `checkMoveFrequency`, when checking scene-frequency moves with limit > 1, also apply the EOT check (`lastTurnUsed` validation). Additionally, `incrementMoveUsage` should set `lastTurnUsed` for scene-frequency moves (currently only set for pure EOT moves).
- **Scope**: The implicit EOT for Scene x2/x3 is a refinement. Scene x1 is already implicitly "once total" so EOT is irrelevant. Only Scene x2 and Scene x3 are affected.

### Issue #2: Daily x2/x3 moves missing per-scene cap (MEDIUM)
- **PTU p.337**: "Moves that can be used multiple times Daily can still only be used once a Scene and not multiple times within the same Scene."
- **Impact**: A Daily x2 move could be used twice in one scene if the daily total allows it. Per RAW, each scene should only allow 1 use, with the second use available in a different scene.
- **Fix**: In `checkMoveFrequency`, when checking daily-frequency moves with limit > 1, also check `usedThisScene >= 1` as a per-scene cap. The `usedThisScene` counter is already incremented for Daily moves in `incrementMoveUsage`, so the tracking data is present -- only the validation check is missing.
- **Note**: For Daily x1, this is moot (the daily limit of 1 already caps it).

### Issue #3: Suppressed condition not enforced (LOW -- out of scope)
- Documented in code comments. No implementation. Acceptable for this ticket scope. Should be tracked as a separate ticket.

## Test Coverage Assessment

- **39 unit tests** covering all exported functions: parsing, type checking, validation, usage tracking, and scene reset.
- **Immutability**: Explicitly tested -- original objects are never mutated.
- **Edge cases**: Undefined tracking fields handled via `?? 0` fallback.
- **Missing tests for Issue #1**: No test verifying that Scene x2 is blocked on consecutive turns.
- **Missing tests for Issue #2**: No test verifying that Daily x2 is blocked when used twice in the same scene.

## Code Quality Notes

- Pure functional approach with no side effects -- good.
- Immutable update patterns throughout -- spread operator used correctly.
- The `moveFrequency.ts` module is well-organized into clear sections (parsing, validation, tracking).
- `move.post.ts` correctly validates BEFORE execution and increments AFTER execution.
- Scene reset is correctly wired into all three lifecycle hooks (start, end, next-scene).
- The `end.post.ts` endpoint syncs move reset to the DB for all Pokemon combatants, including ones that did not change -- minor inefficiency but not incorrect.

## Verdict

**APPROVED_WITH_NOTES**

The core implementation is sound and correctly handles the five PTU frequency types at their basic level. All 39 tests pass. The architecture (pure utility + server enforcement + lifecycle resets) is well-designed and follows project patterns.

Two MEDIUM issues remain that represent missing PTU refinements:
1. Scene x2/x3 implicit EOT restriction (consecutive turn blocking)
2. Daily x2/x3 per-scene cap (once per scene)

Both issues affect edge cases in multi-use frequency moves. They do not affect Scene x1 (the most common scene frequency) or Daily x1 (the most common daily frequency), since those are already capped at 1 use. The implementation is safe to ship as-is with these noted for follow-up.

**Recommendation**: File a follow-up ticket for Issue #1 and Issue #2 as a P2 refinement. These are rule-correctness gaps, not regressions, and only matter when a Pokemon has a Scene x2+, Scene x3, Daily x2+, or Daily x3 move.
