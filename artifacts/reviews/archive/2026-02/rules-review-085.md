---
review_id: rules-review-085
target: refactoring-041
trigger: orchestrator-routed
reviewed_commits:
  - dc63907
verdict: FAIL
reviewed_at: 2026-02-20
reviewer: game-logic-reviewer
---

## Rules Review: refactoring-041 (Stale maxHp mock in characters.test.ts)

### Scope

Single commit (`dc63907`) adding `maxHp: 165` to the `createMockCharacter` factory in `app/tests/unit/api/characters.test.ts` and updating line 84 from `char.hp` to `char.maxHp`. The review verifies whether the hardcoded `maxHp` value is correct per PTU 1.05 rules.

### PTU Reference

**Source:** PTU 1.05, Chapter 2 (Character Creation), page 32 and Chapter 7 (Combat), page 198

From `books/markdown/core/02-character-creation.md` (line 309):
> Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10

From `books/markdown/core/07-combat.md` (lines 622-623):
> Pokemon Hit Points = Pokemon's Level + (HP stat x3) + 10
> Trainer Hit Points = Trainer's Level x2 + (HP stat x3) + 10

### Mock Character Values

From `createMockCharacter()` (lines 19-44 of the test file):

| Field | Value |
|-------|-------|
| `characterType` | `'player'` |
| `level` | `5` |
| `hp` (base HP stat) | `50` |

This is a **HumanCharacter** mock (uses `mockPrisma.humanCharacter`), with `characterType: 'player'`. It is explicitly a **Trainer**, not a Pokemon. The separate `createMockPokemon()` factory (lines 46-54) exists for Pokemon data.

### Formula Verification

The **Trainer** HP formula must be used:

```
Trainer Hit Points = Level x 2 + (HP stat x 3) + 10
                   = 5 x 2 + (50 x 3) + 10
                   = 10 + 150 + 10
                   = 170
```

The commit used the **Pokemon** HP formula instead:

```
Pokemon Hit Points = Level + (HP stat x 3) + 10
                   = 5 + (50 x 3) + 10
                   = 5 + 150 + 10
                   = 165  <-- value in commit
```

The commit message and resolution log both explicitly state `level + (baseHp * 3) + 10`, which is the Pokemon formula. The code comment on line 25 of the test file reads:

```typescript
maxHp: 165, // PTU formula: level + (baseHp * 3) + 10 = 5 + (50*3) + 10
```

This is incorrect. The `level` term should be `level * 2` for trainers.

### Production Code Confirmation

The actual character creation endpoint (`app/server/api/characters/index.post.ts`, lines 12-13) correctly uses the trainer formula:

```typescript
// PTU Trainer HP formula: Level * 2 + HP Stat * 3 + 10
const computedMaxHp = level * 2 + hpStat * 3 + 10
```

This confirms the production code is correct, but the test mock does not match it. With `level=5` and `hp=50`, the production endpoint would compute `maxHp = 170`.

### Required Fix

1. Change `maxHp: 165` to `maxHp: 170` in `createMockCharacter()`
2. Update the inline comment to read: `// PTU Trainer HP formula: (level * 2) + (baseHp * 3) + 10 = (5*2) + (50*3) + 10`

### Verdict

**FAIL** -- The mock uses `maxHp: 165`, computed via the Pokemon HP formula (`level + baseHp*3 + 10`). Since `createMockCharacter` models a `HumanCharacter` with `characterType: 'player'` (a Trainer), the correct PTU 1.05 formula is `level*2 + baseHp*3 + 10`, yielding `maxHp: 170`. The value is off by 5 (one `level` multiplier missing). The test will still pass mechanically because the mock data is self-consistent (the test reads from the mock, not from a real computation), but the mock encodes an incorrect PTU rule, defeating the purpose of the refactoring ticket which aimed to align test data with correct game logic.
