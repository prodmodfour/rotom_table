---
review_id: code-review-046
review_type: code
reviewer: senior-reviewer
trigger: ptu-rule-fix
target_report: ptu-rule-039
domain: pokemon-generation
commits_reviewed:
  - 38daeeb
  - d5319a8
  - 08e2d6e
  - 8427c18
files_reviewed:
  - app/prisma/seed.ts
  - books/markdown/pokedexes/gen7/oricorio.md
  - books/markdown/pokedexes/gen7/oricorio-pompom.md
  - books/markdown/pokedexes/gen7/oricorio-pau.md
  - books/markdown/pokedexes/gen7/oricorio-sensu.md
  - books/markdown/pokedexes/gen6/pumpkaboo.md
  - books/markdown/pokedexes/gen6/pumpkaboo-small.md
  - books/markdown/pokedexes/gen6/pumpkaboo-large.md
  - books/markdown/pokedexes/gen6/pumpkaboo-super.md
  - books/markdown/pokedexes/gen6/gourgeist.md
  - books/markdown/pokedexes/gen6/gourgeist-small.md
  - books/markdown/pokedexes/gen6/gourgeist-large.md
  - books/markdown/pokedexes/gen6/gourgeist-super.md
  - books/markdown/pokedexes/gen5/darmanitan-zen.md
  - books/markdown/pokedexes/gen5/darmanitan.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun:
  - pokemon-lifecycle-workflow-wild-spawn-001
reviewed_at: 2026-02-19T22:00:00
---

## Review Scope

Four seed parsing fixes grouped under ptu-rule-039: Type: Null name collision, Oricorio per-form types, Pumpkaboo/Gourgeist Average-form default stats, and Darmanitan Zen Mode as a separate entry. One code change (`seed.ts`) and 13 pokedex data files (1 modified base + 12 new split files).

## Status Table

| Fix | Commit | Status |
|-----|--------|--------|
| Type: Null parser fix | 38daeeb | Verified |
| Oricorio per-form split files | d5319a8 | Verified |
| Pumpkaboo/Gourgeist Average stats | 08e2d6e | Verified |
| Darmanitan Zen Mode | 8427c18 | Verified |

## Verification Performed

### Commit 1 — Type: Null parser fix (38daeeb)

Restricts type regex matching to the `Basic Information` section via:
```js
const basicInfoSection = pageText.match(/Basic Information[\s\S]*?(?=Evolution:|Size Information|Breeding|$)/i)?.[0] || pageText
```

- **Correctness:** Traced through `type-null.md` — name header `TYPE: NULL` is above `Basic Information`, so the restricted section only sees `Type: Normal` on line 29. Previously the full-page regex matched `TYPE: NULL` first. Fix is correct.
- **Backward compatibility:** Fallback `|| pageText` ensures files without a "Basic Information" header still parse (no regressions for all other species).
- **Regex edge cases:** Lazy `[\s\S]*?` with lookahead stops at first `Evolution:`, `Size Information`, or `Breeding` header. `$` is end-of-string fallback for files missing those headers. All section boundary combinations verified against standard pokedex format.
- **Comment quality:** Clear explanation of the "why" (Type: Null name collision). Good.

### Commit 2 — Oricorio per-form split files (d5319a8)

- Base `oricorio.md` type changed from `Special / Flying (see Forme Change)` to `Fire / Flying` (Baile default). No other fields modified.
- 3 new form files: `oricorio-pompom.md` (Electric/Flying), `oricorio-pau.md` (Psychic/Flying), `oricorio-sensu.md` (Ghost/Flying).
- Stats identical across all forms (HP 8, Atk 7, Def 7, SpA 10, SpDef 7, Spd 9) — consistent with Oricorio's form change only affecting type.
- Form files follow established Rotom split-file pattern from ptu-rule-036 (no move lists in form files; learnset inherited conceptually from base).
- All 4 files have complete parseable structure: Page header, name, stats, Basic Information, Evolution, Size, Breeding, Capabilities, Skills.

### Commit 3 — Pumpkaboo/Gourgeist Average stats (08e2d6e)

- **Pumpkaboo base:** Restructured to place Average stats (HP 5, Atk 7, Def 7, SpA 4, SpDef 5, Spd 5) in standard position. Old multi-form stat block at bottom removed. Cross-verified against old file's Average line.
- **Gourgeist base:** Same treatment. Average stats (HP 7, Atk 9, Def 12, SpA 6, SpDef 8, Spd 8) promoted to top. Old multi-form block removed. Cross-verified against old file's Average line.
- **Split files created:** pumpkaboo-small/large/super, gourgeist-small/large/super. Spot-checked Pumpkaboo Small (HP 4) and Gourgeist Small (HP 6) against old file's form blocks — matches.
- **Whitespace cleanup:** Both base files had tab characters replaced with spaces and trailing whitespace removed. No functional impact, improves consistency.

### Commit 4 — Darmanitan Zen Mode (8427c18)

- New `darmanitan-zen.md` with Fire/Psychic typing and defensive stat spread (HP 11, Atk 3, Def 11, SpA 14, SpDef 11, Spd 6).
- Stats and type verified against source `darmanitan.md` lines 100-127 — exact match.
- Capabilities correctly differentiated from Standard Mode: Zen uses Levitate 6 + Telekinetic + Telepath (psychic/immobile); Standard uses Overland 7 + Naturewalk + Power 8 (physical/mobile).
- Abilities shared with Standard Mode (Sheer Force, Flame Body, Inner Focus, Flash Fire, Zen Mode) — correct, abilities belong to the Pokemon entity, not the form.

### File Discovery

Confirmed `seedSpecies()` reads all `.md` files from gen directories via `fs.readdirSync(dirPath).filter(f => f.endsWith('.md'))` (seed.ts:468). No lookup file update required. All 12 new files will be automatically discovered.

### Duplicate Check

`seenNames` uses case-insensitive full names. "Darmanitan Zen Mode" vs "Darmanitan", "Oricorio Pom-pom" vs "Oricorio" — all unique. No collisions.

## Issues

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

## What Looks Good

- Parser fix is minimal and targeted — 2 lines changed with proper fallback. No over-engineering.
- Split file pattern is now well-established (Deoxys → Rotom → Oricorio/Pumpkaboo/Gourgeist/Darmanitan). Consistent approach across all alternate-form Pokemon.
- Commit granularity is correct — 4 separate commits for 4 separate issues within the same ticket.
- Each commit message clearly explains the fix.
- Pumpkaboo/Gourgeist restructuring correctly removes the ambiguous multi-form stat block and promotes Average to the parseable position.
- Ticket Fix Log is thorough — documents all 4 commits, all 15 files, and verification claim.

## Verdict

APPROVED — All 4 commits are clean. The parser fix handles backward compatibility correctly. Split files follow the established pattern. Data accuracy deferred to Game Logic Reviewer. Ready for rules-review-043.

## Scenarios to Re-run

- `pokemon-lifecycle-workflow-wild-spawn-001`: Verify the 12 new form entries (Oricorio x3, Pumpkaboo x3, Gourgeist x3, Darmanitan Zen x1, plus corrected base entries) can be spawned from species lookup with correct types and stats.
