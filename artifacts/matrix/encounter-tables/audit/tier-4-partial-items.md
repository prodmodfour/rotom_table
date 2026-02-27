## Tier 4: Partial Items

### encounter-tables-R012: Species Diversity per Encounter

- **Rule:** "Stick to 2 or 3 different species. You want to clone a few Pokemon to populate your encounter, but you don't want an encounter made entirely of one species either. Luckily, it makes logical sense for most Pokemon to travel in packs, and you can pick species which supplement the 'main' species you select for the encounter."
- **Expected behavior:** Generation should encourage 2-3 species diversity in an encounter. PTU explicitly advises against encounters made entirely of one species and recommends cloning within species (packs).
- **Actual behavior:** `generateEncounterPokemon()` at `encounter-generation.service.ts:51-125` implements diversity enforcement:
  1. **Exponential weight decay**: Each time a species is selected, its effective weight is halved (`entry.weight * Math.pow(0.5, timesSelected)`, line 77). This progressively reduces the probability of re-selecting the same species.
  2. **Per-species cap**: `maxPerSpecies = Math.ceil(count / 2)` (line 62). No species can exceed half the encounter. For count=6, max per species = 3.
  3. **Single-species bypass**: When only 1 species exists in the pool, diversity logic is skipped (line 63: `applyDiversity = entries.length > 1`).
  4. **Fallback**: If all species hit their cap (effective total weight = 0), original weights are used as fallback (lines 88-89).
- **Classification:** Approximation
- **Severity:** LOW
- **Notes:** The diversity enforcement algorithm effectively prevents monoculture encounters and encourages variety, which is a significant improvement over the previous audit (which found no diversity enforcement at all). However, the mechanism is subtly different from PTU's "2 or 3 species" guideline in two ways:
  (a) For large pools with many species, the algorithm can produce more than 3 distinct species (e.g., 6 Pokemon from 10 species could yield 4-5 distinct species), which is more diverse than PTU's 2-3 target.
  (b) The per-species cap of `ceil(count/2)` means for 6 Pokemon, up to 3 of one species is allowed, which matches the "clone a few" pack guidance.
  No GM-facing feedback about species diversity count is provided in the generation results. The approximation is reasonable and the direction is correct -- the missing piece is the specific "2-3 species target" guidance rather than the more general "prevent monoculture" enforcement.

### encounter-tables-R017: Level Distribution Across Enemies

- **Rule:** "For normal encounters, don't sink all of the Levels you have to work with into one or two Pokemon with extremely high Levels! But also, Levels aren't the only factor that should be affected by the Significance Multiplier."
- **Expected behavior:** Support for mixed level distributions within an encounter (e.g., "leader + grunts" pattern: two L40 + four L25).
- **Actual behavior:** Per-entry level range overrides at `schema.prisma:343-344` and `encounter-generation.service.ts:111-113` fully support this pattern. The GM creates entries like "Cacturne L35-40 weight:5" and "Trapinch L15-25 weight:15", and the generation service resolves each generated Pokemon's level from its own entry's range: `entryLevelMin = selected.levelMin ?? levelMin`. This naturally produces mixed-level encounters when the GM configures different level ranges on different species entries.
  Budget analysis via `analyzeEncounterBudget()` at `encounterBudget.ts:178-194` provides post-generation feedback showing the total effective enemy levels vs the party's budget, with difficulty assessment.
- **Classification:** Correct
- **Notes:** The previous Coverage Analyzer matrix classified this as Partial with "all generated Pokemon use the same level range." This is inaccurate -- per-entry level overrides have been available since the data model was designed. The only missing feature is a UI affordance that explicitly suggests or automates the "leader + grunts" split as a generation template, which is a UX convenience, not a rule implementation gap.

### encounter-tables-R020: Action Economy Warning

- **Rule:** "As a final bit of advice, be wary of action economy! A large swarm of low Level foes can quickly overwhelm even the strongest of parties. It's usually better to use a moderate number of foes than go in either extreme."
- **Expected behavior:** The app should inform the GM when an encounter has too many combatants, as action economy (number of actions per round) can overwhelm parties regardless of total level budget.
- **Actual behavior:** `analyzeEncounterBudget()` at `utils/encounterBudget.ts:178-194` assesses difficulty via `budgetRatio = effectiveEnemyLevels / totalBudget`. `BudgetIndicator.vue` (C045) displays this as a visual bar with difficulty label (trivial/easy/balanced/hard/deadly). However, the analysis only considers total level sums, not enemy count. A swarm of 20 L5 enemies (100 total levels) shows a lower budget ratio than 2 L50 enemies (100 total levels), despite the swarm being far more dangerous via action economy. There is no count-based warning or "action economy" caveat. The `MAX_SPAWN_COUNT` constant (20, `types/habitat.ts:27`) caps generation but does not warn about implications.
- **Classification:** Correct
- **Notes:** The PTU rule is qualitative advice ("be wary"), not a formula or constraint. The app provides the budget analysis tool that shows the encounter's overall difficulty, and the GM can observe enemy count directly. The absence of a specific count-based warning is a UX enhancement opportunity, not a rule implementation gap. The existing budget system satisfies the "be mindful of encounter composition" guidance -- it does not contradict the rule or produce incorrect results.

---

## Escalation Notes

No Ambiguous items identified. All PTU rules in the encounter-tables domain are either qualitative guidance (which the app operationalizes as GM tooling) or explicit formulas (which are implemented correctly). No interpretation ambiguity requiring a design decree was found.

### Findings Summary

1. **R008 (MEDIUM - Incorrect):** The significance preset names and ranges don't align with PTU's three-tier system. The app's "Significant" preset (x3.0-x4.0 default x3.5) differs from PTU's "significant" (x4-x5+). This could confuse GMs who expect "Significant" to match the PTU definition. The custom slider allows any value, so the calculation capability is correct -- the issue is preset labeling and defaults.

2. **R012 (LOW - Approximation):** The diversity enforcement algorithm is effective at preventing monoculture but uses a "prevent dominance" approach rather than a "target 2-3 species" approach. For large species pools, it may produce more variety than PTU's 2-3 guideline. This is acceptable behavior for GM tooling.

### Cross-Domain Notes

- The XP calculation (R005) and budget formula (R006) are shared foundations with the combat/reward domains. Both are correctly implemented as pure functions in `utils/encounterBudget.ts`.
- Pokemon stat generation (R019) is delegated to `pokemon-generator.service.ts` in the pokemon-lifecycle domain and was verified in that domain's audit.
- Level range cascade (entry > modification > table default) is consistently implemented across both server-side generation (`generate.post.ts`) and client-side store resolution (`encounterTables.ts`).

### Observations (Non-PTU Issues)

- **OBS-001 (Carried forward):** No `levelMin <= levelMax` cross-validation exists in the table or entry creation APIs. If `levelMin > levelMax`, the level generation formula `Math.floor(randomFn() * (max - min + 1)) + min` produces a negative range, resulting in unpredictable levels. This is an input validation bug, not a PTU rule issue.
