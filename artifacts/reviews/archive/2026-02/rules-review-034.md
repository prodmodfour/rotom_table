---
review_id: rules-review-034
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-002
domain: csv-import
commits_reviewed:
  - 3d7413b
  - 1b3fa17
mechanics_verified:
  - csv-capability-cell-mapping
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 0
ptu_refs:
  - books/markdown/pokedexes/gen1/vulpix.md#Capability List
reviewed_at: 2026-02-18T23:30:00
---

## Review Scope

Bug-fix review of commit 3d7413b (CSV capability cell references for swim, sky, burrow, levitate, power, jump) and 1b3fa17 (ticket closures for bug-001, bug-002, ptu-rule-030). Verified cell references against actual exported PTU CSV (`to_import/sabre.csv`, Alolan Vulpix) and PTU pokedex data.

## Mechanics Verified

### CSV Capability Cell Mapping

- **Rule:** PTU pokedex entry for Vulpix lists "Overland 4, Swim 2, Jump 1/2, Power 2" (`books/markdown/pokedexes/gen1/vulpix.md`). The exported PTU character sheet CSV places capabilities in a 3-row grid starting at row 31 (0-indexed), cols 12-17 (labels in even cols, values in odd cols).
- **Implementation:** The code comment and cell references use rows 32-34. Every row index is off by +1 from the actual CSV layout.
- **Status:** INCORRECT
- **Severity:** CRITICAL

**Actual CSV layout** (verified from `to_import/sabre.csv`):
```
Row 30: "Capabilities" (header)
Row 31: Overland | 4  | Levitate | -- | Power  | 2
Row 32: Sky      | -- | Burrow   | -- | Weight | --
Row 33: Swim     | 2  | Jump H/L | 1/2| Size   | --
Row 34: Naturewalk: | (empty) ...
```

**Code comment claims** (WRONG):
```
Row 32: Overland | val | Levitate | val | Power | val
Row 33: Sky      | val | Burrow   | val | Weight| val
Row 34: Swim     | val | Jump H/L | val | Size  | val
```

**Cell-by-cell comparison** (sabre.csv / Alolan Vulpix):

| Capability | Code reads | Cell content | Parsed | Correct cell | Correct value | Result |
|------------|-----------|-------------|--------|-------------|--------------|--------|
| overland | (32,13) | "--" (Sky val) | 0 → default **5** | (31,13) | "4" → **4** | **WRONG** |
| swim | (34,13) | "" (Naturewalk row) | 0 | (33,13) | "2" → **2** | **WRONG** |
| sky | (33,13) | "2" (Swim val) | **2** | (32,13) | "--" → **0** | **WRONG** |
| burrow | (33,15) | "1/2" (Jump val) | **12** | (32,15) | "--" → **0** | **WRONG** |
| levitate | (32,15) | "--" (Burrow val) | 0 | (31,15) | "--" → 0 | OK (coincidence) |
| power | (32,17) | "--" (Weight val) | 0 → default **1** | (31,17) | "2" → **2** | **WRONG** |
| jump H | (34,15) | "" (Naturewalk row) | default **1** | (33,15) | "1/2"→ **1** | OK (coincidence) |
| jump L | (34,15) | "" (Naturewalk row) | default **1** | (33,15) | "1/2"→ **2** | **WRONG** |

**After fix: 2/8 correct** (both by coincidence — reading wrong cells that happen to have matching values).

**Regression analysis** — The fix made things worse. Before the fix (old code), 5/8 were correct:
- swim (33,13)=2 was **correct**, moved to (34,13)=empty — **now wrong**
- burrow (32,15)="--"=0 was **correct**, moved to (33,15)="1/2"=12 — **now catastrophically wrong**
- jump (33,15)="1/2" was **correct**, moved to (34,15)=empty — **now wrong**
- sky (33,13)=2 was wrong (same as swim) — **still wrong** (now reads swim's value by design instead of by accident)

**Especially dangerous:** `burrow` now reads the Jump cell "1/2", and `parseNumber("1/2")` strips the "/" to get "12" → parseInt = **12**. Any Pokemon with a Jump value will get a wildly inflated burrow speed.

## Summary
- Mechanics checked: 1 (CSV capability cell mapping — 8 individual fields)
- Correct: 0 (2 coincidentally correct due to both cells containing "--" or matching defaults)
- Incorrect: 1 (all row indices off by +1)
- Needs review: 0

## Verdict
CHANGES_REQUIRED — All capability row indices are off by +1. The actual CSV layout starts at row 31, not row 32. The fix introduces regressions in swim, burrow, and jump (were correct before, now wrong). Burrow is catastrophically wrong (reads "1/2" → 12).

## Required Changes

1. **Fix all row indices by subtracting 1.** The correct mapping is:
```typescript
// PTU sheet capability layout (cols 12-17, labels in even cols, values in odd):
//   Row 31: Overland | val | Levitate | val | Power | val
//   Row 32: Sky      | val | Burrow   | val | Weight| val
//   Row 33: Swim     | val | Jump H/L | val | Size  | val
const capabilities = {
  overland: parseNumber(getCell(rows, 31, 13)) || 5,
  swim: parseNumber(getCell(rows, 33, 13)) || 0,
  sky: parseNumber(getCell(rows, 32, 13)) || 0,
  burrow: parseNumber(getCell(rows, 32, 15)) || 0,
  levitate: parseNumber(getCell(rows, 31, 15)) || 0,
  power: parseNumber(getCell(rows, 31, 17)) || 1,
  jump: {
    high: parseNumber(getCell(rows, 33, 15)?.split('/')[0] || '1'),
    long: parseNumber(getCell(rows, 33, 15)?.split('/')[1] || '1')
  }
}
```

2. **Verify with sabre.csv.** After the fix, the parsed capabilities for Alolan Vulpix should be: `overland=4, swim=2, sky=0, burrow=0, levitate=0, power=2, jump={high:1, long:2}`.

3. **Re-open bug-001, bug-002, ptu-rule-030** — they are not actually fixed.
