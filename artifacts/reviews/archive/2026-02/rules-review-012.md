---
review_id: rules-review-012
target: refactoring-010
type: rules-review
verdict: APPROVED
reviewer: game-logic-reviewer
date: 2026-02-16T23:45:00
reviewed_commits:
  - 96fd6e2
  - 11ad0ff
  - 0a5d6ba
  - 6d67ac4
mechanics_verified:
  - size-to-token-mapping
  - pokedex-size-parsing
  - capabilities-json-storage
  - token-size-derivation
ptu_references:
  - "core/07-combat.md lines 400-406: Size-based grid footprint"
  - "core/05-pokemon.md line 141: Size Information definition"
scenarios_to_rerun: []
---

## Summary

PTU rules verification for refactoring-010 (Pokemon size capability seeding and VTT token sizing). 4 commits, 4 mechanics verified. All implementations match PTU 1.05 rules.

## Mechanics Verified

### 1. Size-to-Token Mapping

- **Rule:** PTU 1.05, Chapter 7 — Combat (`core/07-combat.md` lines 400-406): "A combatant's footprint on a grid is determined by their Size. Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4"
- **Implementation:** `sizeToTokenSize()` in `grid-placement.service.ts:28-42` — switch statement maps Small→1, Medium→1, Large→2, Huge→3, Gigantic→4, default→1
- **Status:** CORRECT
- **Notes:** The function existed before this refactoring (from refactoring-002). Now it receives real data instead of `undefined`. The default→1 fallback is safe (treats unknown as Medium). The PTU rulebook also mentions optional non-square shapes for serpentine Pokemon (e.g., Steelix as 8x2), but the square defaults are the standard rule and the correct baseline implementation.

### 2. PTU Size Categories

- **Rule:** PTU 1.05 defines exactly 5 size classes: Small, Medium, Large, Huge, Gigantic. These appear in every species' "Size Information" section in the pokedex.
- **Implementation:** Seed regex `(Small|Medium|Large|Huge|Gigantic)` captures exactly these 5 values. Case-insensitive match with normalization to title case.
- **Status:** CORRECT
- **Cross-checked against 7 species files:**
  - Pikachu (gen1): `Height : 1' 4" / 0.4m (Small)` → Small
  - Onix (gen1): `Height : 28' 10" / 8.8m (Huge)` → Huge
  - Steelix (gen2): `Height : 30' 2" / 9.2m (Gigantic)` → Gigantic
  - Snorlax (gen1): `Height : 6' 11" / 2.1m (Large)` → Large
  - Garchomp (gen4): `Height : 6' 3" / 1.9m (Large)` → Large
  - Wailord (gen3): `Height : 47' 7" / 14.5m (Gigantic)` → Gigantic
  - Mudsdale (gen7): `Height: 8' 2" / 2.5m (Large)` → Large (no space before colon, handled by `\s*`)

### 3. Capabilities JSON Storage

- **Rule:** Size is a species-level property in PTU — each species has a fixed size class. It's defined in the pokedex entry under "Size Information."
- **Implementation:** `createPokemonRecord()` stores `size: data.size` inside the capabilities JSON blob (`pokemon-generator.service.ts:193`). The `combatants.post.ts:44-45` path reads `capabilities.size` from this DB record and passes it to `sizeToTokenSize()`.
- **Status:** CORRECT
- **Notes:** Size is correctly stored as a species-level property (derived from SpeciesData at generation time). The capabilities JSON in the DB record is the persistence layer; the combatant entity type in memory does not carry `size` (it uses `tokenSize` instead). These are correctly kept as separate data models.

### 4. Token Size Derivation Paths

- **Rule:** All Pokemon should have their grid footprint determined by their species' PTU size class.
- **Implementation:** Two derivation paths exist, both now producing correct values:
  1. **buildPokemonCombatant path** (wild-spawn, from-scene, template-load): `sizeToTokenSize(data.size)` at `pokemon-generator.service.ts:287`
  2. **combatants.post.ts path** (add existing Pokemon to encounter): `sizeToTokenSize(capabilities.size)` at `combatants.post.ts:45` — reads from DB record
- **Status:** CORRECT
- **Notes:** Both paths use the same `sizeToTokenSize()` function with the same input data (just sourced differently). The default fallback for unpopulated size (`undefined`) returns 1, which is Medium — a safe degradation for any edge case.

## Errata Check

Searched `books/markdown/errata-2.md` for size, token, footprint, and all size class names. No errata corrections found for the size-to-token mapping rule.

## Pre-Existing Issues

**Evasion cap (already tracked):** `buildPokemonCombatant` lines 307-309 compute evasions without the PTU-mandated +6 cap (`Math.min(6, ...)`). This is pre-existing, not introduced by these commits, and is already tracked in `refactoring-012.md` (PTU-INCORRECT, P2).

## Summary

- Mechanics checked: 4
- Correct: 4
- Incorrect: 0
- Needs review: 0

## Verdict

**APPROVED** — All 4 mechanics match PTU 1.05 rules. The size-to-token mapping is exactly per the rulebook (Chapter 7, lines 400-406). The seed regex correctly captures all 5 PTU size classes from pokedex source files across generational formatting variants. Both token size derivation paths produce correct results. No errata corrections apply.
