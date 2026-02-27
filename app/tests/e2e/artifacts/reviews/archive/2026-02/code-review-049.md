---
review_id: code-review-049
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-004, bug-005
domain: pokemon-lifecycle
commits_reviewed:
  - 8ab68ec
  - 89ebb9e
files_reviewed:
  - app/server/api/capture/attempt.post.ts
  - app/server/api/capture/rate.post.ts
  - app/prisma/schema.prisma
  - app/prisma/seed.ts
  - app/server/services/pokemon-generator.service.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun:
  - pokemon-lifecycle-workflow-capture-001
  - pokemon-lifecycle-ability-assignment-001
  - pokemon-lifecycle-workflow-wild-spawn-001
reviewed_at: 2026-02-20T00:30:00
---

## Review Scope

Two P1 bug fixes in the pokemon-lifecycle domain:
- **bug-004** (8ab68ec): Capture attempt endpoint hardcoded `maxEvolutionStage = Math.max(3, evolutionStage)` instead of reading from species data. Made 1- and 2-stage Pokemon up to 20 points easier to capture.
- **bug-005** (89ebb9e): `pickRandomAbility()` picked from the first 2 entries in the flat ability array regardless of basic/advanced classification. Species with only 1 Basic Ability had a 50% chance of getting an Advanced Ability assigned at spawn.

## Bug-004 Analysis (8ab68ec)

**Fix:** 1 file, 1 line — `Math.max(3, evolutionStage)` → `speciesData?.maxEvolutionStage || evolutionStage`.

Verified against `rate.post.ts` (the correct reference implementation):
- `rate.post.ts:57-58`: reads `speciesData.evolutionStage` and `speciesData.maxEvolutionStage` inside a null guard
- `attempt.post.ts:52-53`: uses `speciesData?.maxEvolutionStage || evolutionStage` with optional chaining + fallback

The fallback semantics differ slightly (rate defaults to 1 via initialization; attempt defaults to `evolutionStage` which itself defaults to 1) but produce identical results: when no species data exists, both endpoints compute `evolutionsRemaining = 0` → -10 penalty (conservative default). When species data exists, both read the stored value. Consistent.

## Bug-005 Analysis (89ebb9e)

**Fix:** 4 files — schema field, seed parser, generator function, ticket update.

### Schema (`schema.prisma:247`)
`numBasicAbilities Int @default(2)` — correct default. The majority of Pokemon have 2 basic abilities. Existing records get this via the migration default. A re-seed populates accurate per-species counts.

### Seed (`seed.ts:292-315`)
Basic abilities are now parsed in a dedicated loop with an explicit counter, then advanced/high abilities are parsed separately. Verified against `books/markdown/pokedexes/gen1/caterpie.md`: 1 Basic Ability (Shield Dust), 3 Advanced Abilities (Run Away, Silk Threads, Stench), 1 High Ability (Suction Cups). The new parser would correctly set `numBasicAbilities = 1`.

Regex flag handling is correct — each regex object is used in a single while loop, so `lastIndex` state doesn't leak between patterns. The `!abilities.includes(ability)` dedup check is preserved.

### Generator (`pokemon-generator.service.ts:418-423`)
```typescript
const basicCount = Math.min(numBasicAbilities, abilityNames.length)
const pool = basicCount > 0 ? basicCount : abilityNames.length
```

Edge case trace:
| Case | numBasicAbilities | abilityNames.length | basicCount | pool | Result |
|------|-------------------|---------------------|------------|------|--------|
| Caterpie (1 basic) | 1 | 5 | 1 | 1 | Index 0 only (Shield Dust) |
| Zubat (2 basic) | 2 | 5 | 2 | 2 | Index 0-1 (Inner Focus, Infiltrator) |
| No species data | 2 (default) | 0 | 0 | early return [] | Correct |
| numBasicAbilities=0 (bad data) | 0 | N | 0 | N (full list) | Safe fallback |
| More basic than total | 3 | 2 | 2 | 2 | Clamped correctly |

All edge cases handled. The `numBasicAbilities = 2` default in the generator (line 92) is only reached when `speciesData` is null, and in that case `abilityNames` is also `[]`, so the early return fires — the default is never actually used in a selection. Clean.

### Data migration note
The ticket correctly documents that existing DB records get `numBasicAbilities = 2` via the schema default. Until a re-seed, 1-basic species still have the old behavior. This is acceptable — the code fix is architecturally correct, and the data update is a re-seed operation. No follow-up ticket needed since re-seeding is a standard deployment step for this local SQLite project.

## Issues

### CRITICAL
None.

### HIGH
None.

### MEDIUM
None.

## What Looks Good

- **Bug-004 is surgical**: 1 line changed, correct fallback, matches the existing rate endpoint pattern. Minimal blast radius.
- **Bug-005 approach is sound**: Option A (data model fix with `numBasicAbilities` field) is the right call over Option B (restructuring the abilities JSON). It touches 4 files with minimal surface area and doesn't require migrating every consumer of the abilities array.
- **Seed parser separation is clean**: The basic/advanced parsing split is explicit and easy to follow. The counter increment is co-located with the push, so they can't drift apart.
- **Generator edge cases are handled defensively**: The `basicCount > 0` guard prevents division-by-zero and falls back to the full list rather than crashing. The `Math.min` clamp prevents out-of-bounds access.
- **Commit granularity is correct**: One commit per bug fix, each self-contained. Commit messages are descriptive with root cause and impact.
- **Ticket Fix Logs updated**: Both tickets have accurate fix documentation.

## Verdict

APPROVED — Both fixes are correct, minimal, and well-documented. Bug-004 is a 1-line parity fix. Bug-005 is a clean data model extension that correctly restricts ability selection to basic abilities per PTU rules. No issues found.

## Required Changes

None.

## Scenarios to Re-run

- `pokemon-lifecycle-workflow-capture-001` — validates capture rate formula uses correct species data
- `pokemon-lifecycle-ability-assignment-001` — validates abilities assigned from basic pool only
- `pokemon-lifecycle-workflow-wild-spawn-001` — validates wild spawn exercises the corrected ability path
