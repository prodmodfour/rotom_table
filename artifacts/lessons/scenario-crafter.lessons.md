---
skill: scenario-crafter
last_analyzed: 2026-02-17T13:00:00
analyzed_by: retrospective-analyst
total_lessons: 7
domains_covered:
  - combat
  - capture
  - healing
---

# Lessons: Scenario Crafter

## Summary
Six lessons span three pipeline cycles (Tier 2, Tier 1, capture). The original three (STAB, learn levels, type effectiveness) were successfully applied in all Tier 1 and capture scenarios and have been **integrated as permanent mandatory process steps** in the Scenario Crafter skill (Step 2). Two Tier 1 patterns share a common root: assuming app behavior matches PTU rules without verifying against the actual implementation — now upgraded to systemic after appearing in capture domain as well. A sixth lesson addresses preserving test purpose when fixing flakiness.

---

## Lesson 1: Verify STAB eligibility for every attacker/move pair

- **Category:** missing-check
- **Severity:** high
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-15
- **Status:** resolved (integrated into Scenario Crafter Step 2 as mandatory STAB validation)

### Pattern
When selecting a Pokemon species and move for a scenario, the Scenario Crafter did not explicitly check whether the attacker's type(s) match the move's type. This caused two opposite failures: one scenario that intended to demonstrate no-STAB accidentally used a type-matching pair (Charmander/Ember), and another that should have applied STAB didn't (Geodude/Earthquake).

### Evidence
- `artifacts/verifications/combat-basic-special-001.verified.md`: STAB omission on Charmander/Ember
- `artifacts/verifications/combat-multi-target-001.verified.md`: Earthquake STAB missing for Geodude
- `git diff 978f1c7`: Replaced Charmander/Ember with Psyduck/Confusion; added STAB to Geodude/Earthquake
- **Tier 1 validation:** All 7 Tier 1 scenarios correctly applied this lesson — 8 attacker/move pairs checked, including 1 explicit no-STAB (Caterpie/Tackle)

### Recommendation
Add an explicit STAB check step to the Scenario Crafter process: after selecting the attacker species and move, compare the attacker's type list against the move's type. Annotate the scenario with either "STAB applies (+2 DB)" or "No STAB (type mismatch: [attacker types] vs [move type])". This check must happen before computing any damage derivation.

---

## Lesson 2: Verify move learn level against pokedex before assigning

- **Category:** data-lookup
- **Severity:** high
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-15
- **Status:** resolved (integrated into Scenario Crafter Step 2 as mandatory learn-level validation)

### Pattern
The Scenario Crafter assigned moves to Pokemon at levels below the actual learn level, assuming common moves (Water Gun, Earthquake) were available at L10 without consulting the pokedex files. Both instances required raising the Pokemon's level to match the move's actual learn level.

### Evidence
- `artifacts/verifications/combat-type-effectiveness-001.verified.md`: Water Gun not learnable at L10 (L13 actual)
- `artifacts/verifications/combat-multi-target-001.verified.md`: Earthquake unavailable at L10 (L34 actual)
- `git diff 978f1c7`: Squirtle L10→L13, Geodude L10→L34
- **Tier 1 validation:** All 7 Tier 1 scenarios correctly applied this lesson — 8 move/level pairs verified with pokedex citations

### Recommendation
Add a mandatory data-lookup step to the Scenario Crafter process: after selecting a species and move, open the species' pokedex file (`books/markdown/pokedexes/<gen>/<species>.md`) and verify the move's learn level. Set the Pokemon's level to at least that learn level. Include the learn-level source in the scenario file as a comment (e.g., "Earthquake learned at L34 per gen1/geodude.md").

---

## Lesson 3: Verify type effectiveness for every type pair in the scenario

- **Category:** data-lookup
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15
- **Status:** resolved (integrated into Scenario Crafter Step 2 as mandatory type-chart validation)

### Pattern
The Scenario Crafter incorrectly stated that Normal vs Rock/Ground = neutral (x1), when Rock actually resists Normal (x0.5). The final damage value happened to be correct (1) due to the minimum damage rule, masking the derivation error.

### Evidence
- `artifacts/verifications/combat-minimum-damage-001.verified.md`: Rock resists Normal, not neutral
- `git diff 978f1c7`: Corrected derivation chain: raw(-4) → min 1 → x0.5 → 0 → final min 1
- **Tier 1 validation:** All 7 Tier 1 scenarios correctly applied this lesson — 10 unique type matchups individually verified against type chart

### Recommendation
When a scenario involves type effectiveness, explicitly look up each type pair individually against the PTU type chart (core/10-indices-and-reference.md). For dual-type targets, check move type vs Type1 AND move type vs Type2 separately, then multiply. Do not assume "neutral" without verification.

---

## Lesson 4: Verify whether APIs produce deterministic output before assuming exact values

- **Category:** missing-check
- **Severity:** high
- **Domain:** combat, capture
- **Frequency:** systemic
- **First observed:** 2026-02-15 (Tier 1)
- **Status:** active

### Pattern
The Scenario Crafter wrote assertions with exact expected values for Pokemon created by non-deterministic endpoints. This pattern appeared across two domains:

**Combat (3 instances):**
- Wild-encounter and template-setup scenarios assumed deterministic HP from `generateAndCreatePokemon` (correction-002, correction-003)
- Capture-variant scenario assumed deterministic HP for wild-spawned Rattata (correction-004, superseded by correction-005)

**Capture (0 new instances):**
- All capture scenarios correctly applied this lesson using explicit `POST /api/pokemon` with deterministic base stats

The pattern is now systemic — the same root cause ("assumed API output is deterministic") manifested in 3+ scenarios across 2 pipeline cycles before being addressed.

### Evidence
- `artifacts/reports/correction-002.md`: Wild-encounter Oddish HP varied due to random stat points
- `artifacts/reports/correction-003.md`: Template-setup Charmander HP varied (same root cause)
- `artifacts/reports/correction-004.md`: Capture-variant Rattata HP varied (same root cause)
- `artifacts/reports/correction-005.md`: Superseded correction-004 with query-then-compute pattern
- Capture domain scenarios: All used explicit creation — lesson applied successfully

### Recommendation
Before writing any assertion with an exact expected stat value, determine whether the API endpoint that creates the entity produces deterministic or non-deterministic output. For endpoints that use `generateAndCreatePokemon` (wild-spawn, template-load), stats will be non-deterministic. In these cases, either: (a) read actual stats from the API after creation and derive expected values dynamically, or (b) assert minimum bounds and relational properties (e.g., `currentHp = maxHp`, `maxHp >= base-only minimum`). Document which approach is used and why in the scenario file.

---

## Lesson 5: Distinguish between PTU rules the app enforces and rules left to the GM

- **Category:** missing-check
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15 (Tier 1)
- **Status:** active

### Pattern
The Scenario Crafter wrote an assertion expecting the status API to reject Paralysis on Pikachu (Electric type) based on PTU type immunity rules. The API is intentionally a GM tool that applies any valid status without type checking — an existing design decision already documented and tested in Tier 2 (`combat-status-conditions-001.spec.ts`). The scenario conflated "PTU says this should happen" with "the app enforces this."

### Evidence
- `artifacts/reports/correction-001.md`: Status-chain scenario assumed Electric immunity blocks Paralysis via API
- `git diff 2a4f84e`: Removed immunity assertion, reduced `ptu_assertions` from 9 to 8
- Existing test: `combat-status-conditions-001.spec.ts` lines 123-149 already validates that the status API is type-agnostic

### Recommendation
When writing an assertion about a PTU rule, explicitly determine whether the app enforces that rule at the API level or whether it's a GM responsibility. Check existing tests and service code for prior art. If the API is a GM tool (status application, damage application), assertions should test what the API actually does, not what PTU says should happen at the table. Annotate the scenario with the enforcement boundary: "App-enforced" or "GM-enforced (not in API)."

---

## Lesson 6: Preserve test purpose when fixing flakiness

- **Category:** process-gap
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-16 (Tier 1, capture-variant-001)
- **Status:** active

### Pattern
When capture-variant-001 failed due to non-deterministic wild-spawn stats, correction-004 replaced `wild-spawn` with explicit `POST /api/pokemon` creation — eliminating flakiness but also removing the wild-spawn flow from the test entirely. The scenario's name was "Wild Encounter Capture Variant" but it no longer tested wild encounters. Correction-005 superseded this with a query-then-compute pattern that preserved the wild-spawn flow while making assertions dynamic.

### Evidence
- `artifacts/reports/correction-004.md`: Replaced wild-spawn with explicit creation — stable but removes test purpose
- `artifacts/reports/correction-005.md`: Superseded correction-004 — keep wild-spawn, query actual stats, compute expected values dynamically
- Pipeline state: correction-004 superseded by correction-005

### Recommendation
When fixing a flaky test, evaluate whether the proposed fix removes the feature or flow being tested. If the fix eliminates the scenario's primary purpose (e.g., replacing wild-spawn with manual creation in a "wild encounter" test), find an alternative approach that preserves coverage. Prefer the query-then-compute pattern: keep the real API flow, read actual values after creation, derive expected values dynamically from actuals.

---

## Lesson 7: Always set `lastRestReset` when pre-loading daily counters via PUT

- **Category:** missing-check
- **Severity:** high
- **Domain:** healing
- **Frequency:** systemic (3 scenarios affected)
- **First observed:** 2026-02-18 (healing domain)
- **Status:** resolved (all 3 scenarios fixed)

### Pattern
When a scenario uses PUT to pre-load daily counter values (`restMinutesToday`, `injuriesHealedToday`) to test cap behavior, it must also set `lastRestReset` to a same-day timestamp. Without it, `lastRestReset` defaults to `null`, and healing endpoints call `shouldResetDailyCounters(null)` which returns `true` — resetting the counters to 0 before the healing logic executes. This silently invalidates the pre-loaded state.

### Evidence
- `artifacts/verifications/healing-daily-rest-cap-001.verified.md`: Test 1 restMinutesToday reset from 450→0 (1/3 assertions failed)
- `artifacts/verifications/healing-daily-injury-cap-001.verified.md`: Test 4 injuriesHealedToday reset from 3→0 (1/4 assertions failed)
- `artifacts/verifications/healing-workflow-injury-healing-cycle-001.verified.md`: injuriesHealedToday reset from 1→0, cascading through all phases (5/7 assertions failed)

### Recommendation
Whenever a scenario sets daily counters (`restMinutesToday`, `injuriesHealedToday`) via PUT to simulate mid-day state, always include `"lastRestReset": "<today's ISO timestamp>"` in the same PUT body. This prevents the auto-reset guard from discarding the pre-loaded values. This is analogous to Lesson 4 (non-deterministic API check) — the scenario must account for server-side guard logic, not just the field values.
