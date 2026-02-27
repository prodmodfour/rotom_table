---
review_id: code-review-041
review_type: code
reviewer: senior-reviewer
trigger: ptu-rule-fix
target_report: ptu-rule-033
domain: pokemon-generation
commits_reviewed:
  - a467f14
  - 4a618db
files_reviewed:
  - app/prisma/seed.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun: []
reviewed_at: 2026-02-18T16:00:00
---

## Review Scope

Fix for ptu-rule-033: Alternate-form Pokemon (107 species including Hoopa Confined/Unbound, Deoxys formes, Rotom appliances, regional variants) were never seeded because the name-detection regex in `parsePokedexContent()` required the entire header line to be ALL CAPS. Actual pokedex files use ALL CAPS for the species name but Title Case for form descriptors (e.g. `HOOPA Confined`, `DEOXYS Attack Forme`, `ZYGARDE 10% Forme`).

## Issues

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

## What Looks Good

- **Correct root cause identification.** The developer traced the bug to the exact regex at seed.ts:254 and understood why mixed-case lines were rejected. The fix log documents the root cause clearly.
- **Regex fix is sound.** Old regex: `/^[A-Z][A-Z0-9\s\-\(\).:'É\u2019]+$/` — required ALL CAPS for the entire line. New regex: `/^[A-Z][A-Z0-9\-\(\).:'É\u2019]+(?:\s+[A-Za-z0-9,%\s\-\(\).:'É\u2019]+)?$/` — requires ALL CAPS for the first word group (species name), allows mixed-case for an optional form descriptor. I verified this against actual file headers:
  - `HOOPA Confined` (gen6/hoopa-confined.md) — match ✓
  - `DEOXYS   Attack Forme` (gen3/deoxys-attack.md) — match ✓ (multi-space handled by `\s+` delimiter)
  - `GIRATINA  Origin Forme` (gen4/giratina-origin.md) — match ✓
  - `ROTOM Normal Form` (gen4/rotom-normal.md) — match ✓
  - `ZYGARDE 10% Forme` (gen7/zygarde-10.md) — match ✓ (new `%` in charset handles this)
  - `MELOETTA  Step Form` (gen5/meloetta-step.md) — match ✓
  - `TYPE: NULL` (gen7/type-null.md) — match ✓ (colon in first group, space + NULL in second)
  - Simple names (`PIKACHU`, `HO-OH`, `MR. MIME`) — match ✓ (optional group simply doesn't match)
  - Non-Pokemon lines (`Base Stats:`, `Appliance Forms`) — correctly rejected (lowercase first char fails `^[A-Z][A-Z0-9...]` first group)
- **Name normalization handles all formats.** The existing `.split(' ').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')` correctly title-cases multi-word forms: "DEOXYS Attack Forme" → "Deoxys Attack Forme", "ZYGARDE 10% Forme" → "Zygarde 10% Forme".
- **Dedup logic is safe.** `seenNames` uses `pokemonName.toUpperCase()` — "HOOPA" vs "HOOPA CONFINED" are distinct keys. No false collisions between base forms and their alternates. Verified: rotom.md → "Rotom" and rotom-normal.md → "Rotom Normal Form" coexist.
- **Minimal, focused diff.** 1 file, 3 lines changed (+1 comment, +1 regex line replacing old). Second commit is just ticket documentation. Clean commit messages.
- **Thorough verification in fix log.** Developer confirmed 889 → 993 species, checked all ticket examples with correct types/stats, and tested edge cases (Zygarde %, Galar forms, Farfetch'd).

## Verdict

APPROVED — The regex fix correctly handles mixed-case alternate-form headers while maintaining the ALL CAPS requirement for the species name. All 107 new species are parseable. No regressions to base-form parsing. No scenarios to re-run — this is seed-time data, not runtime behavior; the developer's species count verification (889 → 993) is sufficient.

## Tickets Filed

- **ptu-rule-037** (LOW): "HP:" matches the name-detection regex as a false positive. Pre-existing issue (not introduced by this fix), but latent risk if a pokedex file ever has a missing name line. Filed rather than dismissed as "non-blocking."

## Scenarios to Re-run

None — seed-only fix. Species count verification already performed by the developer (889 → 993 with all ticket examples confirmed).
