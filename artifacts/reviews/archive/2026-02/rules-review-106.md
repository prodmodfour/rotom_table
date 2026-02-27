---
review_id: rules-review-106
target: refactoring-056
trigger: refactoring
verdict: PASS
reviewed_commits:
  - 1940e7a
  - f55eb5b
reviewed_files:
  - app/server/services/encounter-generation.service.ts
  - app/server/api/encounter-tables/[id]/generate.post.ts
  - app/types/habitat.ts
  - app/tests/unit/services/encounterGeneration.test.ts
date: 2026-02-20
reviewer: game-logic-reviewer
---

## PTU Rules Verification Report

### Scope

- [x] Spawn count calculation from density tiers (app-defined homebrew)
- [x] Level range assignment for generated Pokemon
- [x] Species diversity enforcement algorithm
- [x] Weighted random species selection
- [x] Per-entry level override vs table-level fallback

### Prior Art

This review builds on the findings from **rules-review-060**, which established that the density tier system (`sparse`, `moderate`, `dense`, `abundant`), `DENSITY_RANGES`, `densityMultiplier`, and `MAX_SPAWN_COUNT` are **entirely app-defined homebrew**. PTU 1.05 does not define density tiers, spawn count ranges, or density multipliers. The refactoring in `refactoring-056` extracts existing logic into a testable service without changing any game mechanics. This review verifies that the extraction preserved correctness and that the mechanics remain internally consistent and compatible with PTU design intent.

Additionally, **design-density-significance-001** documents the known divergence: PTU encounter sizing is based on a level budget (avg Pokemon level x 2 x number of trainers), not density-derived spawn counts. The density-based system is a GM convenience tool for random encounter generation that exists alongside (not instead of) the PTU level-budget approach. The design has a P0 plan to separate density from spawn count in a future implementation.

### Mechanics Verified

#### 1. Density Tier Spawn Counts

- **Rule (app-defined homebrew):** `DENSITY_RANGES` in `app/types/habitat.ts` defines: sparse (2-4), moderate (4-8), dense (8-12), abundant (12-16). `MAX_SPAWN_COUNT` is derived as the maximum across all tier maxima = 16. These are not PTU-defined values.
- **PTU reference:** PTU 1.05 Chapter 11 (p.473) prescribes the level-budget method for encounter building. The example uses 6 Pokemon for an everyday encounter (120 total levels / 6 = 20 each). PTU also advises (p.473): "It's usually better to use a moderate number of foes than go in either extreme." The Swarm Template (p.476) abstracts 12+ Pokemon as a single entity, suggesting 12+ individual combatants is unusual. The app's density ranges (2-16) align with this general guidance.
- **Implementation:** `calculateSpawnCount()` computes a random count within the scaled density range. Override clamping ensures `[1, MAX_SPAWN_COUNT]`. The formula `Math.floor(randomFn() * (scaledMax - scaledMin + 1)) + scaledMin` correctly produces a uniform integer in `[scaledMin, scaledMax]`. The `scaledMin = Math.min(rawMin, scaledMax)` clamping (from bug-027 fix) prevents inverted ranges.
- **Status:** CORRECT
- **Notes:** The homebrew density system is a reasonable GM convenience tool. It does not conflict with PTU rules because PTU does not prescribe spawn count formulas. The `MAX_SPAWN_COUNT` of 16 is a practical cap consistent with PTU's Swarm Template guidance (12+ Pokemon warrant abstraction). The default fallback to `moderate` density when the field is falsy is a safe defensive measure.

#### 2. Level Range Assignment

- **Rule (PTU, p.473):** The GM distributes a total level budget across enemy Pokemon. The example: "The GM splits this six ways and stats up an encounter with six Level 20 Pokemon." PTU does not specify per-species level ranges within a single encounter -- the GM picks levels based on the budget and desired difficulty distribution.
- **Implementation:** The service uses a `levelMin`/`levelMax` range (either entry-specific or table-default) and generates a uniform random integer within that range via `Math.floor(randomFn() * (entryLevelMax - entryLevelMin + 1)) + entryLevelMin`. Entry-specific ranges override the table default via null-coalescing: `selected.levelMin ?? levelMin`.
- **Status:** CORRECT
- **Notes:** This is a reasonable automation of the GM's level selection process. PTU's level-budget approach assumes the GM manually distributes levels, but a random range within a GM-defined band is a valid convenience tool. The entry-specific override allows the GM to set different level ranges for different species (e.g., evolved forms at higher levels), which aligns with PTU's worked examples showing mixed-level encounters (two L40 + four L25). The uniform distribution within the range is a neutral choice -- PTU specifies no distribution preference.

#### 3. Weighted Random Species Selection

- **Rule (PTU, p.443-445):** PTU describes habitat design in terms of relative rarity -- common species are more numerous, rare species appear less often. The Pokedex is "arranged roughly in order from common to rare" (p.444). Ecosystems follow food chain principles where "producers...are the most populous" and "the higher up you go on the food chain, the rarer a species becomes" (p.444). PTU does not prescribe a weighted random algorithm, but weighted selection mirrors the intended rarity distribution.
- **Implementation:** Classic cumulative-weight selection. Total weight is summed, a random value in `[0, totalWeight)` is generated, and entries are iterated with cumulative subtraction until the threshold is crossed. Each species' selection probability equals `weight / totalWeight` (before diversity adjustment).
- **Status:** CORRECT
- **Notes:** The weighted random algorithm correctly implements the probabilistic model. The `random <= 0` check (inclusive of zero) ensures the first entry can be selected when `randomFn()` returns exactly 0. The iteration is deterministic (first-match wins for ties), which is standard. The algorithm faithfully translates the `RARITY_WEIGHTS` concept (common=10, uncommon=5, rare=3, very-rare=1, legendary=0.1) into proportional selection probabilities.

#### 4. Species Diversity Enforcement (Exponential Decay + Per-Species Cap)

- **Rule (PTU, p.474):** "Stick to 2 or 3 different species. You want to clone a few Pokemon to populate your encounter, but you don't want an encounter made entirely of one species either. Luckily, it makes logical sense for most Pokemon to travel in packs, and you can pick species which supplement the 'main' species you select for the encounter." PTU does not specify an exact diversity algorithm but clearly states the design intent: encounters should have multiple species, not be dominated by a single one.
- **Implementation:** Two diversity mechanisms work together:
  1. **Exponential decay:** Each time a species is selected, its effective weight is multiplied by `0.5^timesSelected`. This progressively reduces the probability of re-selecting the same species without eliminating it. After 1 selection: 50% weight. After 2: 25%. After 3: 12.5%.
  2. **Per-species cap:** `Math.ceil(count / 2)` hard-limits any species to at most half the encounter (rounded up). For a 6-Pokemon encounter, no species can exceed 3.
  3. **Single-species bypass:** When only 1 species exists in the pool, diversity is skipped entirely. This is correct -- a Zubat cave should produce all Zubats.
  4. **Fallback guard:** If all species hit their cap simultaneously (mathematically unreachable with `ceil(count/2)` and 2+ species, but defensively coded), original weights are restored.
- **Status:** CORRECT
- **Notes:** The diversity system faithfully implements PTU's design intent from p.474. The exponential decay allows a dominant species to appear frequently while still giving rarer species a fair chance -- this models the "travel in packs" behavior PTU describes (a main species with supplementary species). The `ceil(count/2)` cap prevents degenerate outcomes where a 100:1 weight ratio produces a monoculture. The single-species bypass is essential for locations with only one species (e.g., Magikarp-only fishing spots). The fallback guard, while theoretically unreachable, is a correct defensive measure that prevents infinite loops.

### PTU Compliance Assessment

The encounter generation service operates in a domain where PTU provides **design guidelines** rather than **mechanical formulas**. Specifically:

1. **Spawn count:** PTU uses the level-budget method (p.473). The app's density-based system is homebrew, documented as such in `rules-review-060` and `design-density-significance-001`. It does not conflict with PTU because PTU does not prohibit automated spawn count selection.

2. **Level assignment:** PTU's level-budget approach assumes manual GM distribution. The app's random-in-range approach is a valid automation that respects GM-defined bounds.

3. **Species selection:** PTU describes encounter composition qualitatively ("2 or 3 different species," "stick to species which supplement the main species"). The weighted random + diversity enforcement algorithm translates this guidance into a quantitative system.

4. **Species diversity:** PTU's guidance (p.474) is the strongest directive here. The implementation's dual mechanism (decay + cap) directly addresses the stated goals: encounters should not be monocultures, and a main species should be supplemented by others. The `ceil(count/2)` cap is more generous than PTU's "2 or 3 species" suggestion but appropriate for the app's wider range of encounter sizes (2-16 Pokemon).

No PTU rules are violated. The homebrew systems are internally consistent and aligned with PTU design intent.

### Summary

- Mechanics checked: 4
- Correct: 4
- Incorrect: 0

### Verdict

**PASS** -- The encounter generation service correctly implements weighted random species selection with diversity enforcement. The density-based spawn count system is app-defined homebrew (not PTU-mandated), internally consistent, and previously verified in rules-review-060. Level range assignment uses a reasonable random-in-range approach with proper entry-specific overrides. The species diversity algorithm (exponential decay + per-species cap) faithfully implements PTU's qualitative guidance from Chapter 11 p.474 about encounter composition. The extraction from the API endpoint into a testable service preserved all existing behavior without introducing any mechanical changes.
