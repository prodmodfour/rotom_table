---
last_updated: 2026-03-05T22:40:00
updated_by: slave-collector (matrix-1772736514)
---

# Matrix Ecosystem State

## Domain Progress

| Domain | Rules | Capabilities | Matrix | Impl Audit | Browser Audit | Coverage |
|--------|-------|-------------|--------|------------|---------------|----------|
| combat | done (135) | FRESH (s120) | FRESH (s121) | FRESH (s121) — 96 items | **FRESH** — 25 present, 2 absent, 1 unreachable, 74 untestable | 74.8% |
| capture | done (33) | FRESH (s120) | FRESH (s121) | FRESH (s121) — 31 items | **FRESH** — 10 present, 0 absent, 49 untestable | 96.9% |
| healing | done (42) | FRESH (s120) | FRESH (s121) | FRESH (s121) — 37 items | STALE — slave failed to run | 66.7% |
| pokemon-lifecycle | done (68) | FRESH (s120) | FRESH (s121) | FRESH (s121) — 40 items | STALE — slave failed to run | 68.6% |
| character-lifecycle | done (68) | FRESH (s120) | FRESH (s121) | FRESH (s121) — 57 items | **FRESH** — 20 present, 1 absent, 15 error, 52 untestable | 86.1% |
| encounter-tables | done (27) | FRESH (s120) | FRESH (s121) | FRESH (s121) — 19 items | **FRESH** — 14 present, 7 absent, 5 error, 9 untestable | 77.5% |
| scenes | done (42) | FRESH (s120) | FRESH (s121) | FRESH (s121) — 25 items | **FRESH** — 12 present, 0 absent, 42 untestable | 70.0% |
| vtt-grid | done (42) | FRESH (s120) | FRESH (s121) | FRESH (s121) — 33 items | **FRESH** — 17 present, 0 absent, 23 untestable | 83.3% |
| player-view | done (207) | FRESH (s120) | FRESH (s121) | FRESH (s121) — 130 items | **FRESH** — 21 present, 1 absent, 67 untestable | 64.7% |

## Browser Audit Summary (plan matrix-1772736514)

7 of 9 domains browser-audited. 2 slaves (healing, pokemon-lifecycle) stuck in initializing — never ran.

### Aggregate Browser-Testable Results

| Metric | Count |
|--------|-------|
| Total checked | 300 |
| Present | 119 (39.7%) |
| Absent | 11 (3.7%) |
| Error | 20 (6.7%) |
| Unreachable | 1 (0.3%) |
| Untestable | 316 (server-side only) |

### Root-Cause Defects Found

| Bug | Severity | Domains | Capabilities Blocked |
|-----|----------|---------|---------------------|
| bug-064: SCSS $spacing-xs undefined | HIGH | character-lifecycle, combat | 17 |
| bug-065: Missing upload-simple.svg | HIGH | encounter-tables | 3+ |
| bug-066: EncounterTableTableEditor name mismatch | HIGH | encounter-tables | 8 |
| bug-067: PlayerPokemonCard expansion crash | MEDIUM | player-view | 2 |

### Clean Domains (no issues)

- capture (10/10 present)
- scenes (12/12 present)
- vtt-grid (17/17 present)

## Recommended Next Steps

1. Fix bug-064 (SCSS $spacing-xs) — unblocks 17 capabilities across character-lifecycle + combat
2. Fix bug-065 + bug-066 (encounter-tables) — unblocks encounter table editor entirely
3. Fix bug-067 (PlayerPokemonCard) — unblocks Pokemon detail view for players
4. Re-run browser audit for healing and pokemon-lifecycle domains (slaves 2, 3 never executed)
5. Continue with implementation audit M2 tickets (8 incorrect items from prior audit)
