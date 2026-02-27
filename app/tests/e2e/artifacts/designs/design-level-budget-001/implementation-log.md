# Implementation Log

## Implementation Log

### P0 — Initial Implementation (2026-02-21)

Commits: `902b518`, `6a4f6a1`, `ca5243f`, `171f9f5`, `97bff99`

Steps 1-5 implemented. Budget utility, composable, BudgetIndicator, and modal extensions.

### P0 — Review Fixes (2026-02-21)

Addressed code-review-124 (CHANGES_REQUIRED) and rules-review-114 HIGH-1:

| Commit | Fix |
|--------|-----|
| `9f43e79` | M2: Renamed `baselineXpPerPlayer` to `levelBudgetPerPlayer` |
| `107cc67` | M1/HIGH-1: Fixed playerCount to count human trainers only |
| `1c4a6cc` | H2: Extracted difficulty colors to `_difficulty.scss` mixin |
| `6fcd1d7` | C1: Wired budgetInfo prop in `pages/gm/scenes/[id].vue` |
| `65e5b77` | C1: Added manual party input to GenerateEncounterModal |
| `05f5847` | H1: Updated `app-surface.md` with budget system files |

P0 status: **complete** (all review issues addressed).

### P0 — Re-review Fix (2026-02-23)

| Commit | Fix |
|--------|-----|
| `5d17b5f` | C1: Fixed `characterType === 'pc'` to `'player'` (code-review-134 / rules-review-124) |

### P1 — Significance Multiplier (2026-02-23)

Commits: `5597a83`, `7423d69`, `67123c1`, `0f1919a`, `cb182fd`, `b2966fc`

Steps 6-9 from design spec implemented:
- Prisma: added `significanceTier` column (migration needed post-merge)
- Types: extended Encounter interface/service with significanceTier
- StartEncounterModal: significance tier radio selector (5 PTU presets)
- GenerateEncounterModal: compact significance selector (defaults to insignificant for wild)
- APIs: POST/PUT encounters accept and persist significanceTier
- Store/composable/pages: full pipeline from modal selection to DB persistence

P1 status: **complete** (ready for review).

