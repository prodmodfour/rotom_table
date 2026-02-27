---
review_id: rules-review-044
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-004, bug-005
domain: pokemon-lifecycle
commits_reviewed:
  - 8ab68ec
  - 89ebb9e
mechanics_verified:
  - capture-rate-evolution-modifier
  - ability-assignment-basic-only
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Calculating Capture Rates
  - core/05-pokemon.md#Abilities
reviewed_at: 2026-02-19T16:30:00Z
---

## Review Scope

Reviewed two bug-fix commits for PTU rule correctness:

- **8ab68ec** (bug-004): Capture attempt endpoint now reads `maxEvolutionStage` from species data instead of hardcoding `Math.max(3, evolutionStage)`.
- **89ebb9e** (bug-005): `pickRandomAbility()` now restricts selection pool to Basic Abilities only, using a new `numBasicAbilities` field on SpeciesData.

## Mechanics Verified

### Capture Rate — Evolution Stage Modifier

- **Rule:** "If the Pokemon has two evolutions remaining, add +10 to the Pokemon's Capture Rate. If the Pokemon has one evolution remaining, don't change the Capture Rate. If the Pokemon has no evolutions remaining, subtract 10 from the Pokemon's Capture Rate." (`core/05-pokemon.md`, lines 1727-1729)
- **Implementation:** Commit 8ab68ec changed `attempt.post.ts:53` from `Math.max(3, evolutionStage)` to `speciesData?.maxEvolutionStage || evolutionStage`. The `calculateCaptureRate()` utility computes `evolutionsRemaining = maxEvolutionStage - evolutionStage` and applies +10/+0/-10 accordingly.
- **Status:** CORRECT
- **Verification against rulebook examples:**
  - Caterpie (stage 1, max 3): `remaining = 2` → +10. Rulebook example: "Two Evolutions (+10)" for Caterpie. Match.
  - Pikachu (stage 2, max 3): `remaining = 1` → +0. Rulebook example: "One Evolution (+0)". Match.
  - Hydreigon (stage 3, max 3): `remaining = 0` → -10. Rulebook example: "No Evolutions (-10)". Match.
  - Tauros (stage 1, max 1): `remaining = 0` → -10. Single-stage Pokemon correctly penalized.
- **Consistency:** Now matches the rate preview endpoint (`rate.post.ts:57-58`) which already read `speciesData.maxEvolutionStage`. Both endpoints produce identical evolution modifiers.
- **Fallback behavior:** When speciesData is null, `maxEvolutionStage` defaults to `evolutionStage`, producing `evolutionsRemaining = 0` → -10 (conservative default). Acceptable — unknown species are treated as fully evolved.

### Ability Assignment — Basic Abilities Only

- **Rule:** "All Pokemon are born with a single Ability, chosen from their Basic Abilities." (`core/05-pokemon.md`, line 406). "At Level 20, a Pokemon gains a Second Ability, which may be chosen from its Basic or Advanced Abilities." (line 411-412)
- **Implementation:** Commit 89ebb9e added `numBasicAbilities` param to `pickRandomAbility()`. Selection pool is now `Math.min(numBasicAbilities, abilityNames.length)` instead of hardcoded `Math.min(2, abilityNames.length)`. Schema stores `numBasicAbilities` per species; seed parses Basic Ability entries separately and counts them.
- **Status:** CORRECT
- **Verification against pokedex data:**
  - Caterpie: 1 Basic Ability (Shield Dust). `numBasicAbilities = 1` → pool size 1 → always picks Shield Dust. Previously had 50% chance of selecting Run Away (Advanced). Fixed.
  - Zubat: 2 Basic Abilities (Inner Focus, Infiltrator). `numBasicAbilities = 2` → pool size 2 → picks either basic. Was already correct by coincidence; now explicitly correct.
  - Tauros: 2 Basic Abilities (Intimidate, Anger Point). `numBasicAbilities = 2` → pool size 2 → correct.
- **Seed parsing:** Basic Ability regex (`/Basic Ability \d:\s*([^\n]+)/gi`) runs first, counts matches into `numBasicAbilities`. Advanced and High patterns run second. Order in stored array matches: basics first, then advanced, then high. This ordering is essential for the pool-size approach to work correctly.
- **Fallback behavior:** If `numBasicAbilities = 0` (bad data), falls back to full ability list. Reasonable safety net — avoids crash, and in practice every species has >= 1 basic ability.
- **Default value:** Schema default is `@default(2)`, which is correct for the majority of species. Species with 1 or 3+ basic abilities need a re-seed for accurate counts — documented in the ticket.

## Summary

- Mechanics checked: 2
- Correct: 2
- Incorrect: 0
- Needs review: 0

## Rulings

None required — both fixes are straightforward applications of unambiguous PTU rules.

## Verdict

APPROVED — Both commits correctly implement PTU 1.05 rules. The capture rate evolution modifier now reads species data instead of assuming 3-stage lines, and ability assignment is properly restricted to Basic Abilities at generation time.

## Required Changes

None.
