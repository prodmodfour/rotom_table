## Tier 5: Partial Items -- Present Portion

### R014: Ability 20 Milestone Detection

- **Rule:** "At Level 20, a Pokemon gains a Second Ability."
- **Expected behavior:** Level-up system reports the level 20 ability milestone.
- **Actual behavior:** `checkLevelUp()` at `levelUpCheck.ts:67-69`: `if (level === 20) { abilityMilestone = 'second' }`. Reported in level-up results. `PokemonLevelUpPanel` displays it (per matrix).
- **Classification:** Correct (detection present)
- **Notes:** The milestone is detected and reported. No UI exists for the GM to assign the ability from the species' Basic/Advanced list. Manual edit via PUT required.

### R015: Ability 40 Milestone Detection

- **Rule:** "At Level 40, a Pokemon gains a Third Ability."
- **Expected behavior:** Level-up system reports the level 40 ability milestone.
- **Actual behavior:** `checkLevelUp()` at `levelUpCheck.ts:70-72`: `if (level === 40) { abilityMilestone = 'third' }`. Reported in level-up results.
- **Classification:** Correct (detection present)

### R017: Move Limit at Generation (6 Moves)

- **Rule:** "Pokemon may learn a maximum of 6 Moves from all sources combined."
- **Expected behavior:** Generation limits to 6 moves. Manual edits should enforce the limit.
- **Actual behavior:** `selectMovesFromLearnset()` at `pokemon-generator.service.ts:471-473`: `.slice(-6)` limits to 6 moves. PUT endpoint (`pokemon/[id].put.ts`) allows saving any number of moves with no validation.
- **Classification:** Approximation
- **Severity:** LOW
- **Notes:** Generation path correctly limits to 6. The lack of enforcement on manual edits is the gap. PTU does note "certain Abilities and Features may allow a Pokemon to bypass this limit", so no hard enforcement may be intentional.

### R027: Stat Point Reporting (+1/Level)

- **Rule:** "First, it gains +1 Stat Point."
- **Expected behavior:** Level-up detection reports +1 stat point per level gained.
- **Actual behavior:** `checkLevelUp()` at `levelUpCheck.ts:78`: `statPointsGained: 1` for each level. `summarizeLevelUps()` sums them into `totalStatPoints`.
- **Classification:** Correct (detection present)
- **Notes:** Stat points are reported but not auto-allocated. GM must manually allocate via the Pokemon sheet.

### R028: New Move Detection

- **Rule:** "Check its Pokedex Entry to see if [the Pokemon] learned any Moves that Level."
- **Expected behavior:** Level-up detection reports moves available at the new level.
- **Actual behavior:** `checkLevelUp()` at `levelUpCheck.ts:60-62`: `const newMoves = learnset.filter(entry => entry.level === level).map(entry => entry.move)`. Reports all moves at exactly this level.
- **Classification:** Correct (detection present)
- **Notes:** Moves are reported but not auto-added. GM must manually add via the Pokemon sheet.

### R064: Capabilities Stored

- **Rule:** "Certain Moves can grant Capabilities or boost existing Capabilities. These bonuses are lost if the Move is ever forgotten."
- **Expected behavior:** Capabilities stored on Pokemon, linked to moves that grant them.
- **Actual behavior:** Capabilities stored as JSON on Pokemon (from species data). No linkage between moves and capability grants. If a capability-granting move is forgotten, the capability persists until manually removed.
- **Classification:** Approximation
- **Severity:** LOW
- **Notes:** This is a data integrity gap. The app stores capabilities but does not track their source (species vs. move-granted). GM must manually remove move-granted capabilities when forgetting moves.

### R066: Mega Stone Held Item

- **Rule:** "First, the Pokemon must be holding a special type of Held Item called a Mega Stone."
- **Expected behavior:** Held item field can store Mega Stone name.
- **Actual behavior:** Pokemon model has `heldItem` field (String, nullable). Generator accepts optional `heldItem` in generated data. Can store any string including Mega Stone names.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Notes:** The held item field exists and can store a Mega Stone name. No Mega Evolution trigger, stat changes, or constraint enforcement exists. This is a storage-only approximation of the full Mega Evolution system.

---

## Incorrect Items

### R022: Tutor Points -- Initial Value

- **Rule:** "Each Pokemon, upon hatching, starts with a single precious Tutor Point."
- **Expected behavior:** Newly generated Pokemon should have tutor points = 1 + floor(level / 5) based on their level. A level 1 Pokemon gets 1 tutor point.
- **Actual behavior:** `generatePokemonData()` does not compute tutor points. `createPokemonRecord()` at `pokemon-generator.service.ts:201`: `experience: 0` -- no tutor points field is set. The `createdPokemonToEntity()` at line 312: `tutorPoints: 0`. Prisma schema defaults `tutorPoints` to 0. A newly created Pokemon starts with 0 tutor points regardless of level.
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Notes:** Level-up tutor point gains are correctly handled by `checkLevelUp()` and applied during XP distribution. But the base tutor point (1 for hatching) and catch-up tutor points (for Pokemon generated at levels > 1) are missing from the generation pipeline. A level 20 wild Pokemon should have 1 (initial) + 4 (levels 5, 10, 15, 20) = 5 tutor points, but starts with 0. The `xp-distribute` and `add-experience` endpoints only add tutor points for levels gained after creation, not retroactively for the creation level.

---

## Escalation Notes

### R022: Tutor Points Not Set at Generation

- **Impact:** All generated Pokemon (wild spawns, template loads, etc.) start with 0 tutor points regardless of level. A level 30 wild Pokemon should have 7 tutor points (1 initial + 6 from levels 5-30) but has 0.
- **Recommendation:** MEDIUM-severity ticket. The `generatePokemonData()` or `createPokemonRecord()` function should compute initial tutor points as `1 + floor(level / 5)` for levels >= 5, or just `1` for levels < 5.

### R017: Move Limit Not Enforced on Manual Edits

- **Impact:** GM can save a Pokemon with more than 6 moves via the PUT endpoint. While PTU allows some abilities to bypass this limit, having no validation means data entry errors go undetected.
- **Recommendation:** LOW-severity ticket. Add optional validation (warning, not blocking) on the PUT endpoint.

### R064: Move-Granted Capabilities Not Tracked

- **Impact:** Capabilities persist even when their granting move is forgotten. This is a rare scenario and the GM can manually fix it.
- **Recommendation:** LOW-severity ticket. Quality-of-life improvement.
