---
review_id: rules-review-035
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-002
domain: csv-import
commits_reviewed:
  - 3896a22
  - c79f8d8
mechanics_verified:
  - csv-capability-cell-mapping
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - books/markdown/pokedexes/gen7/vulpix-alola.md#Capability List
  - books/markdown/pokedexes/gen1/vulpix.md#Capability List
reviewed_at: 2026-02-18T23:50:00
---

## Review Scope

Re-review of commit 3896a22 (corrected CSV capability row indices by -1) and c79f8d8 (ticket fix log updates). This follows rules-review-034 which returned CHANGES_REQUIRED because all row indices were off by +1. The developer applied the exact corrections prescribed in that review.

## Verification Method

Two independent verification approaches:

1. **Value verification** — parsed values for sabre.csv (Alolan Vulpix) compared against PTU pokedex data
2. **Structural verification** — CSV label columns (col 12, 14, 16) adjacent to value columns (col 13, 15, 17) confirm each capability reads from the correct row, independent of any specific Pokemon's values

## Mechanics Verified

### CSV Capability Cell Mapping

- **Rule:** PTU pokedex for Alolan Vulpix (`books/markdown/pokedexes/gen7/vulpix-alola.md`) lists: "Overland 4, Swim 2, Jump 1/2, Power 2, Freezer, Naturewalk (Mountain, Tundra), Tracker, Underdog". No Sky, Burrow, or Levitate listed (= 0).
- **Implementation:** Code reads capabilities from rows 31-33, cols 12-17 (labels in even cols, values in odd cols).
- **Status:** CORRECT
- **Severity:** n/a

#### Structural Proof (Pokemon-independent)

The PTU character sheet CSV places capability **labels** in even columns and **values** in odd columns. The label at `(row, col)` identifies what `(row, col+1)` contains:

```
rows[31]: col 12="Overland"  col 13=val  col 14="Levitate"  col 15=val  col 16="Power"  col 17=val
rows[32]: col 12="Sky"       col 13=val  col 14="Burrow"    col 15=val  col 16="Weight" col 17=val
rows[33]: col 12="Swim"      col 13=val  col 14="Jump(H/L)" col 15=val  col 16="Size"   col 17=val
```

Every code reference reads from the cell immediately right of its matching label:

| Code variable | Cell read | Label at col-1 | Match |
|---|---|---|---|
| `overland` | `(31, 13)` | "Overland" at (31, 12) | Yes |
| `levitate` | `(31, 15)` | "Levitate" at (31, 14) | Yes |
| `power` | `(31, 17)` | "Power" at (31, 16) | Yes |
| `sky` | `(32, 13)` | "Sky" at (32, 12) | Yes |
| `burrow` | `(32, 15)` | "Burrow" at (32, 14) | Yes |
| `swim` | `(33, 13)` | "Swim" at (33, 12) | Yes |
| `jump` | `(33, 15)` | "Jump (H/L)" at (33, 14) | Yes |

This proof is independent of the test Pokemon's values — it verifies that the **label/value pairing** is structurally correct for any CSV exported from the PTU character sheet.

#### Value Verification (sabre.csv — Alolan Vulpix)

| Capability | Cell | Raw CSV content | parseNumber result | Fallback | Final value | PTU expected | Result |
|---|---|---|---|---|---|---|---|
| overland | (31,13) | "4" | 4 | — | **4** | 4 | CORRECT |
| swim | (33,13) | "2" | 2 | — | **2** | 2 | CORRECT |
| sky | (32,13) | "--" | 0 | — | **0** | 0 (not listed) | CORRECT |
| burrow | (32,15) | "--" | 0 | — | **0** | 0 (not listed) | CORRECT |
| levitate | (31,15) | "--" | 0 | — | **0** | 0 (not listed) | CORRECT |
| power | (31,17) | "2" | 2 | — | **2** | 2 | CORRECT |
| jump.high | (33,15) | "1/2" split→"1" | 1 | — | **1** | 1 (Jump 1/2) | CORRECT |
| jump.long | (33,15) | "1/2" split→"2" | 2 | — | **2** | 2 (Jump 1/2) | CORRECT |

8/8 correct. All values match PTU pokedex data for Alolan Vulpix.

#### Regression Check vs. Previous Commit

The previous commit (3d7413b) read from rows 32/33/34. The fix shifts all indices by -1 to rows 31/32/33. Checking the three fields that rules-review-034 flagged as regressions:

| Field | Old cell (3d7413b) | Old content | New cell (3896a22) | New content | Result |
|---|---|---|---|---|---|
| swim | (34,13) | "" (Naturewalk row) → 0 | (33,13) | "2" → **2** | Fixed |
| burrow | (33,15) | "1/2" (Jump cell) → **12** | (32,15) | "--" → **0** | Fixed (catastrophic bug resolved) |
| jump | (34,15) | "" (Naturewalk row) → default 1/1 | (33,15) | "1/2" → **1/2** | Fixed |

All three regressions from commit 3d7413b are resolved.

#### Code Comment Accuracy

The inline comment now reads:
```
//   Row 31: Overland | val | Levitate | val | Power | val
//   Row 32: Sky      | val | Burrow   | val | Weight| val
//   Row 33: Swim     | val | Jump H/L | val | Size  | val
```

This matches the actual CSV layout exactly.

### Commit c79f8d8 (ticket fix logs)

Documentation-only commit updating ticket fix logs with the commit hash 3896a22. No logic changes, no PTU impact.

## Summary

- Mechanics checked: 1 (CSV capability cell mapping — 8 individual fields)
- Correct: 8/8
- Incorrect: 0
- Needs review: 0

## Verdict

APPROVED — The fix correctly shifts all capability row indices by -1, matching the actual PTU character sheet CSV layout. Verified via both structural label matching (Pokemon-independent) and value comparison against PTU pokedex data for Alolan Vulpix. All three regressions from the previous commit (swim, burrow, jump) are resolved. The catastrophic burrow=12 bug from "1/2" parsing is eliminated. Tickets bug-001, bug-002, and ptu-rule-030 can be closed.
