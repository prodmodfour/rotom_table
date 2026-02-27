---
review_id: rules-review-085b
target: refactoring-041
trigger: follow-up-review
follows_up: rules-review-085
reviewed_commits:
  - ae9dbcb
verdict: PASS
reviewed_at: 2026-02-20
reviewer: game-logic-reviewer
---

## Rules Review: refactoring-041 Follow-Up (Trainer HP formula fix)

### Scope

Single commit (`ae9dbcb`) correcting `maxHp` from `165` to `170` in the `createMockCharacter` factory in `app/tests/unit/api/characters.test.ts`, and updating the inline comment to reference the Trainer formula instead of the Pokemon formula. This follow-up addresses the FAIL verdict from rules-review-085.

### PTU Reference

**Source:** PTU 1.05, Chapter 2 (Character Creation) line 309 and Chapter 7 (Combat) line 623

> Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10

### Verification

The mock character has `characterType: 'player'`, `level: 5`, and `hp: 50` (base HP stat). Applying the **Trainer** HP formula:

```
Trainer Hit Points = (Level x 2) + (HP stat x 3) + 10
                   = (5 x 2) + (50 x 3) + 10
                   = 10 + 150 + 10
                   = 170  <-- matches commit value
```

### Checklist

| Check | Result |
|-------|--------|
| `maxHp` value is `170` | Yes (was `165`) |
| Trainer formula used (`level * 2`), not Pokemon (`level * 1`) | Yes |
| Comment explicitly says "PTU Trainer formula" | Yes |
| Comment shows correct arithmetic: `10 + 150 + 10` | Yes |
| Matches production code (`index.post.ts` line 13: `level * 2 + hpStat * 3 + 10`) | Yes |

### Production Code Cross-Reference

`app/server/api/characters/index.post.ts` line 13:

```typescript
const computedMaxHp = level * 2 + hpStat * 3 + 10
```

With `level=5` and `hpStat=50`, this yields `170`, matching the updated mock.

### Verdict

**PASS** -- Both issues identified in rules-review-085 are resolved. The `maxHp` value is now `170` (correct Trainer formula), and the inline comment explicitly identifies the formula as the PTU Trainer formula with correct arithmetic. The mock is now consistent with PTU 1.05 rules and the production computation.
