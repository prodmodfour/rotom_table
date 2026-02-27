---
review_id: code-review-001
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-002
domain: capture
commits_reviewed:
  - ec11197
  - 71b6987
  - 4515dbb
  - 7c49daf
files_reviewed:
  - app/prisma/schema.prisma
  - app/prisma/seed.ts
  - app/server/api/capture/rate.post.ts
  - app/utils/captureRate.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun:
  - capture-mechanic-worked-examples-001
reviewed_at: 2026-02-16T02:00:00
---

## Review Scope

Fix for bug-002: SpeciesData seeder stored `evolutionStage=1` for all species, and `rate.post.ts` hardcoded `maxEvolutionStage = Math.max(3, evolutionStage)`. Both caused every Pokemon to get `evolutionModifier=+10` regardless of actual evolution position.

Four commits reviewed: initial fix (ec11197), word-boundary name matching (71b6987), species name regex broadening (4515dbb), Mega form stage fix (7c49daf).

## Issues

### CRITICAL

(none)

### HIGH

(none)

### MEDIUM

(none)

### Informational

1. **Nidoran name normalization mismatch** — `seed.ts:247,315`

   The name parser converts `NIDORAN (F)` → `Nidoran ♀` (via the `♀`/`♂` replacement at line 256-257), but the evolution block text says `Nidoran F` (no symbol). The evo-line comparison at line 315 compares `"nidoran ♀"` with `"nidoran f"` and fails. This causes `evolutionStage` to stay at the default `1`.

   **Impact: zero.** Both Nidoran♀ and Nidoran♂ are always stage 1 of their lines (Pichu-like base forms with 3-stage chains). The default `1` is correct. `maxEvolutionStage` is correctly computed as `3` from the numbered lines regardless of name matching. No other species is affected by the `♀`/`♂` transform.

   Not blocking — the output is provably correct for all existing species data.

## What Looks Good

- **Full evolution block parsing** (`seed.ts:302-318`): The regex correctly captures the multi-line evolution section and iterates all `N - SpeciesName` entries. This replaces the single-line regex that only ever captured stage 1.

- **Word-boundary name matching** (`seed.ts:315`): The `ltLC === nameLC || ltLC.startsWith(nameLC + ' ')` pattern correctly prevents prefix collisions like Kabuto matching Kabutops, while still matching names followed by evolution conditions (e.g., `"pikachu minimum 10"` starts with `"pikachu "`).

- **Species name regex broadening** (`seed.ts:247`): Adding `0-9`, `.`, `:`, `\u2019` (right curly quote) to the regex correctly handles Porygon2, Mr. Mime, Mime Jr., Type: Null, and Farfetch'd. Verified against actual pokedex file headers.

- **Mega form handling** (`seed.ts:321`): Using `maxEvolutionStage` instead of hardcoded `3` is correct — Mega forms of 2-stage lines (e.g., Mega Beedrill) will get the right stage.

- **Both rate.post.ts code paths updated** (lines 58 and 85): The fix covers both the `pokemonId` lookup path and the `species` name lookup path. No hardcoded `Math.max` remains.

- **deleteMany → upsert migration** (`seed.ts:452-468`): Switching from `deleteMany` + `create` to `upsert` prevents FK constraint violations from encounter table entries that reference SpeciesData. Good defensive change.

- **Schema default** (`schema.prisma`): `maxEvolutionStage Int @default(1)` is a sensible default — existing rows without the field get treated as single-stage (final form, modifier -10), which is more conservative than the old behavior (+10 for everything).

- **Commit granularity**: Four commits with clear, focused messages. Each regression fix is separate from the main fix. Good.

## Verdict

APPROVED — The fix correctly addresses both root causes from bug-002. The seeder now parses the full evolution block to determine both `evolutionStage` (per-species) and `maxEvolutionStage` (per-line), and the capture rate endpoint reads both from the database instead of guessing. Three follow-up regression fixes demonstrate thorough edge-case testing. No correctness, performance, or security issues found.

## Required Changes

(none)

## Scenarios to Re-run

- capture-mechanic-worked-examples-001: This is the scenario that originally failed with Pikachu (expected captureRate=70, got 80) and Hydreigon (expected captureRate=-15, got 5). After re-seeding with the fixed parser, both species should have correct `evolutionStage` and `maxEvolutionStage` values.
