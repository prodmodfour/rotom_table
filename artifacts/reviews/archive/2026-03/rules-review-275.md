---
review_id: rules-review-275
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-018
domain: scenes
commits_reviewed:
  - 524ad829
  - 9b7ba91d
  - 658bd73a
  - f71aee73
mechanics_verified:
  - weather-damage-hail
  - weather-damage-sandstorm
  - weather-type-immunity
  - weather-ability-immunity
  - weather-adjacent-ally-protection
  - weather-tick-timing
  - weather-tick-formula
  - weather-duration-decrement
  - weather-trainer-interaction
  - weather-faint-handling
  - weather-minimum-damage
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 2
ptu_refs:
  - "PTU p.342 — Hail effects (all non-Ice Type Pokemon lose a Tick)"
  - "PTU p.342 — Sandstorm effects (all non-Ground/Rock/Steel Type Pokemon lose a Tick)"
  - "PTU p.246 — Tick of Hit Points (1/10th max HP)"
  - "PTU p.311-335 — Ability descriptions (Ice Body, Snow Cloak, Snow Warning, Sand Veil, Sand Rush, Sand Force, Sand Stream, Desert Weather, Overcoat, Magic Guard, Permafrost)"
  - "PTU p.342 — Weather conditions last 5 rounds"
  - "decree-001 — Minimum 1 damage at both post-defense and final steps"
  - "decree-004 — Massive damage uses real HP lost after temp HP absorption"
reviewed_at: 2026-03-03T15:12:00+00:00
follows_up: null
---

## Decree Check

Scanned all 43 active decrees. Relevant to this domain:

- **decree-001** (minimum damage floor): Weather tick damage goes through `calculateDamage()` which enforces the dual minimum-1 floor. Weather tick itself uses `Math.max(1, Math.floor(maxHp / 10))` guaranteeing minimum 1. COMPLIANT.
- **decree-004** (massive damage uses real HP after temp HP): Weather damage is applied via `calculateDamage()` which implements decree-004's temp HP absorption logic. COMPLIANT.
- **decree-032** (Cursed tick only on Standard Action): Not directly relevant to weather, but weather damage is correctly separated from status tick damage and fires at a different lifecycle point (turn start vs turn end). No interaction issues. COMPLIANT.
- **decree-038** (Sleep persistence): Weather damage does not interact with Sleep status. No condition clearing occurs during weather tick processing. COMPLIANT.

No decree violations found.

---

## Mechanics Verified

### 1. Hail Damage Formula

- **Rule:** "While it is Hailing, all non-Ice Type Pokemon lose a Tick of Hit Points at the beginning of their turn." (PTU p.342)
- **Rule:** "A Tick of Hit Points is equal to 1/10th of a Pokemon or Trainer's Maximum Hit Points." (PTU p.246)
- **Implementation:** `weather-automation.service.ts:94` calls `calculateTickDamage(combatant.entity.maxHp)` which computes `Math.max(1, Math.floor(maxHp / 10))`. This is imported from `status-automation.service.ts:57`.
- **Status:** CORRECT. The formula matches PTU RAW. The design spec correctly identified that the ticket's original "1/16 max HP" was wrong and corrected it to 1/10th (a Tick).

### 2. Sandstorm Damage Formula

- **Rule:** "While it is Sandstorming, all non-Ground, Rock, or Steel Type Pokemon lose a Tick of Hit Points at the beginning of their turn." (PTU p.342)
- **Implementation:** Same `calculateTickDamage()` function. `weatherRules.ts:47` `isDamagingWeather()` correctly identifies both `'hail'` and `'sandstorm'` as damaging weather.
- **Status:** CORRECT. Same formula, correctly shared.

### 3. Hail Type Immunity

- **Rule:** "all non-Ice Type Pokemon" implies Ice-type Pokemon are immune (PTU p.342).
- **Implementation:** `weatherRules.ts:61` `HAIL_IMMUNE_TYPES = ['Ice']`. `isImmuneToHail()` at line 166-170 checks `getCombatantTypes()` against this list. `getCombatantTypes()` correctly reads `pokemon.types` (the `[PokemonType] | [PokemonType, PokemonType]` tuple from `character.ts:151`).
- **Status:** CORRECT. Dual-type Pokemon with Ice as either type will be immune.

### 4. Sandstorm Type Immunity

- **Rule:** "all non-Ground, Rock, or Steel Type Pokemon" implies those types are immune (PTU p.342).
- **Implementation:** `weatherRules.ts:64` `SANDSTORM_IMMUNE_TYPES = ['Ground', 'Rock', 'Steel']`. Same pattern as Hail.
- **Status:** CORRECT. Any Pokemon with at least one of these types is immune.

### 5. Hail Ability Immunity

- **Rule:** Ice Body: "The user is not damaged by Hail." (PTU p.341, ability text at 10-indices p.1541-1543)
- **Rule:** Snow Cloak: "The user and allies adjacent to the user are not damaged by Hail." (PTU 10-indices p.2387-2388)
- **Rule:** Snow Warning: "As a static effect the user is not damaged by Hail." (PTU 10-indices p.2391-2392)
- **Rule:** Overcoat: "does not take damage from any Weather that would normally cause it to take damage." (PTU 10-indices p.1952-1954)
- **Implementation:** `weatherRules.ts:73-75` `HAIL_IMMUNE_ABILITIES = ['Ice Body', 'Snow Cloak', 'Snow Warning', 'Overcoat']`.
- **Status:** CORRECT. All four abilities that grant Hail immunity are listed.

### 6. Sandstorm Ability Immunity

- **Rule:** Sand Veil: "The user and allies adjacent to the user are not damaged by the Sandstorm." (PTU 10-indices p.2255-2256)
- **Rule:** Sand Rush: "the user is immune to damage from Sandstorms." (PTU 10-indices p.2245-2246)
- **Rule:** Sand Force: "the user is immune to damage from Sandstorms." (PTU 10-indices p.2240-2241)
- **Rule:** Desert Weather: "The user is immune to Sandstorm Damage" (PTU 10-indices p.1108)
- **Rule:** Sand Stream: "As a static effect, the user is not damaged by Sandstorm." (PTU 10-indices p.2250-2251)
- **Rule:** Overcoat: "does not take damage from any Weather" (PTU 10-indices p.1952-1954)
- **Implementation:** `weatherRules.ts:85-87` `SANDSTORM_IMMUNE_ABILITIES = ['Sand Veil', 'Sand Rush', 'Sand Force', 'Desert Weather', 'Overcoat']`.
- **Status:** INCORRECT -- **Sand Stream is missing.** See HIGH-001.

### 7. Adjacent Ally Protection (Snow Cloak / Sand Veil)

- **Rule:** Snow Cloak: "adjacent allies are not damaged" by Hail (PTU p.342, ability text p.2387).
- **Rule:** Sand Veil: "allies adjacent to the user are not damaged by the Sandstorm" (PTU 10-indices p.2255-2256).
- **Implementation:** `weatherRules.ts:89-93` defines `HAIL_ADJACENT_PROTECTION = ['Snow Cloak']` and `SANDSTORM_ADJACENT_PROTECTION = ['Sand Veil']`. The adjacency check at lines 181-204 (Hail) and 241-263 (Sandstorm) uses Chebyshev distance (dx <= 1 && dy <= 1 && dx + dy > 0), which correctly models "adjacent" as the 8 surrounding cells.
- **Implementation also checks:** `ally.side !== combatant.side` to skip enemies (line 184/244) -- correct, "allies" means same side.
- **Status:** CORRECT. The adjacency check correctly implements 1-cell Chebyshev distance for 8-directional adjacency. Same-side filtering is correct.

### 8. Weather Tick Timing (Turn Start)

- **Rule:** "at the beginning of their turn" (PTU p.342 for both Hail and Sandstorm).
- **Implementation:** In `next-turn.post.ts:440-505`, weather tick processing occurs AFTER the turn index has advanced (line 226: `currentTurnIndex++`) and after round/phase transitions, but BEFORE the response is returned. The weather tick targets `turnOrder[currentTurnIndex]` -- the INCOMING combatant whose turn is starting.
- **Contrast with status ticks:** Status ticks (Burn/Poison/Cursed) are processed at lines 162-213 BEFORE advancing the turn index, applying to the OUTGOING combatant whose turn just ended. This correctly separates turn-end and turn-start effects.
- **Declaration phase skip:** Line 446 checks `currentPhase !== 'trainer_declaration'` -- weather damage does NOT fire during League Battle declaration phase, which is correct since declaration is not a real turn.
- **Status:** CORRECT. Weather damage fires at the correct lifecycle point.

### 9. Damage Application Pipeline

- **Implementation:** Weather tick damage flows through the standard damage pipeline:
  1. `calculateTickDamage()` computes raw tick amount (1/10 max HP, min 1)
  2. `calculateDamage()` from `combatant.service.ts` applies temp HP absorption, injury markers, massive damage checks (decree-004)
  3. `applyDamageToEntity()` updates HP, temp HP, injuries on the entity
  4. Faint handling via `applyFaintStatus()` if fainted
  5. Mount auto-dismount via `clearMountOnFaint()` if applicable
  6. Database sync via `syncEntityToDatabase()`
- **Minimum damage (decree-001):** The tick itself is always >= 1 from `calculateTickDamage()`. The `calculateDamage()` function handles further damage pipeline steps. Since weather tick is flat HP damage (not attack-defense), the decree-001 dual floor is not directly relevant here (it applies to attack damage rolls), but the tick minimum of 1 is correct per PTU definition.
- **Status:** CORRECT. The existing damage infrastructure is properly reused.

### 10. Trainer Weather Damage

- **Rule:** PTU p.342 says "all non-Ice Type Pokemon" for Hail and "all non-Ground, Rock, or Steel Type Pokemon" for Sandstorm. This refers to Pokemon specifically.
- **Implementation:** `getCombatantTypes()` returns `[]` for trainers (no types), meaning trainers fail the type immunity check and take weather damage. The spec notes this is a deliberate design decision for Full Contact battles.
- **Status:** NEEDS REVIEW. The RAW text says "Pokemon," not "all combatants." Trainers taking weather damage in Full Contact is a reasonable gameplay interpretation but not strictly RAW. However, the design spec explicitly acknowledges this decision and provides rationale (PTU p.472 "tax the party" intent). This is an acceptable design decision, not a bug. If the ruling ever becomes contested, a decree-need ticket should be filed. Accepted as-is for now.

### 11. Weather Duration Decrement

- **Rule:** "Weather Conditions last 5 rounds." (PTU p.342)
- **Implementation:** `decrementWeather()` at `next-turn.post.ts:844-857` decrements duration at round end. Manual weather (duration 0, source 'manual') is exempt from decrement. Duration decrements only for non-manual sources. When duration reaches 0, weather is cleared.
- **Status:** CORRECT. Duration management follows PTU rules.

---

## Issues

### HIGH-001: Sand Stream Missing from Sandstorm Immune Abilities

**Severity:** HIGH (missing mechanic -- ability immunity not applied)

**Rule:** "The Weather changes to a Sandstorm for 5 rounds. As a static effect, the user is not damaged by Sandstorm." (PTU 10-indices-and-reference.md, p.2247-2251, Ability: Sand Stream)

**Problem:** `SANDSTORM_IMMUNE_ABILITIES` in `weatherRules.ts:85-87` does not include `'Sand Stream'`. A Pokemon with Sand Stream that sets up Sandstorm via its ability will take its own Sandstorm damage, which contradicts the PTU ability text.

**Impact:** Any Pokemon with Sand Stream (e.g., Tyranitar, Hippowdon) would incorrectly take Sandstorm damage every turn. This is a gameplay-affecting bug for commonly-used Pokemon.

**Fix:** Add `'Sand Stream'` to the `SANDSTORM_IMMUNE_ABILITIES` array in `weatherRules.ts`.

**File:** `app/utils/weatherRules.ts:85-87`

### HIGH-002: Magic Guard Missing from Weather Immunity

**Severity:** HIGH (missing mechanic -- ability immunity not applied)

**Rule:** "The user is immune to damage and Hit Point loss from Hazards, Weather, Status Afflictions, Vortexes, Recoil, Hay Fever, Iron Barbs, Rough Skin, and Leech Seed. Defensive." (PTU 10-indices-and-reference.md, p.1770-1775, Ability: Magic Guard)

**Problem:** Magic Guard explicitly grants immunity to Weather damage, but it is not listed in either `HAIL_IMMUNE_ABILITIES` or `SANDSTORM_IMMUNE_ABILITIES` in `weatherRules.ts`. A Pokemon with Magic Guard (e.g., Clefable, Alakazam, Reuniclus) would incorrectly take weather damage.

**Impact:** Any Magic Guard Pokemon would take weather damage it should be immune to. Magic Guard is a commonly used competitive ability.

**Fix:** Add `'Magic Guard'` to both `HAIL_IMMUNE_ABILITIES` and `SANDSTORM_IMMUNE_ABILITIES` arrays in `weatherRules.ts`.

**File:** `app/utils/weatherRules.ts:73-75` and `weatherRules.ts:85-87`

### MEDIUM-001: Permafrost Damage Reduction Not Handled

**Severity:** MEDIUM (edge case not handled)

**Rule:** "whenever the user would lose a Tick of Hit Points due to an effect such as Sandstorm or the Burn Status condition, subtract 5 from the amount of Hit Points lost. Defensive." (PTU 10-indices-and-reference.md, p.1993-1997, Ability: Permafrost)

**Problem:** Permafrost does not make the user immune to weather damage but reduces the tick damage by 5. The current implementation applies the full tick amount without checking for Permafrost. A Pokemon with Permafrost (e.g., Aurorus) would take full weather tick damage instead of tick - 5.

**Impact:** Permafrost is a niche ability (limited to the Aurorus line), so the practical impact is low, but it is a missing mechanic that explicitly mentions Sandstorm by name in the ability text.

**Note:** This could reasonably be deferred to P1/P2 as it requires a damage reduction mechanism not present in the current tick pipeline. However, it should be tracked.

**File:** `app/utils/weatherRules.ts` (new constant needed), `app/server/services/weather-automation.service.ts` (damage reduction logic)

### MEDIUM-002: Weather Tick Comment Says "1/10 max HP" but Code Comment Says "1/16"

**Severity:** MEDIUM (documentation inconsistency)

**Problem:** The `weatherRules.ts` header comment at line 7 correctly says "Tick = 1/10th max HP (PTU p.246)" and the formula display at `weather-automation.service.ts:105` correctly says "1/10 max HP." However, the original feature-018 ticket at `artifacts/tickets/in-progress/feature/feature-018.md:33` still says "1/16 max HP damage." While the design spec `_index.md:63-71` includes a correction note, the ticket body itself was not updated and could cause confusion for future developers.

**Impact:** No code impact (implementation is correct), but the ticket's PTU Rules section is misleading.

**Fix:** Update `feature-018.md` line 33 to read "1/10 max HP" (a Tick) instead of "1/16 max HP."

**File:** `artifacts/tickets/in-progress/feature/feature-018.md:33`

---

## Design Spec Adherence

The implementation closely follows `design-weather-001/spec-p0.md` with one notable deviation:

- **Spec:** `getCombatantTypes()` accesses `pokemon.type1` and `pokemon.type2` (spec-p0.md lines 106-108).
- **Implementation:** `getCombatantTypes()` correctly accesses `pokemon.types` which is `[PokemonType] | [PokemonType, PokemonType]` per `character.ts:151`.
- **Assessment:** The implementation is CORRECT. The design spec had a stale data model reference. The actual Pokemon type uses a `types` tuple, not `type1`/`type2` fields.

All other spec requirements are faithfully implemented:
- Pure utility functions in `weatherRules.ts` (Section A)
- Separate weather-automation service (Section B)
- Turn-start weather tick in `next-turn.post.ts` (Section C)
- Move log entry for weather damage
- WebSocket broadcast using `status_tick` event type
- Declaration phase exclusion
- Faint handling, mount auto-dismount, defeated enemy tracking

---

## Positive Findings

1. **Correct tick formula:** The design spec caught and corrected the ticket's "1/16" error to the correct "1/10" (PTU Tick definition). The implementation matches PTU RAW.

2. **Clean separation of concerns:** Weather damage at turn START vs status ticks at turn END are handled at different lifecycle points in the same endpoint, matching PTU rules exactly.

3. **Proper reuse of calculateTickDamage():** Instead of duplicating the tick calculation, the weather service imports it from `status-automation.service.ts`. Single source of truth.

4. **Proper reuse of calculateDamage() pipeline:** Weather damage flows through the standard damage pipeline (temp HP absorption, injury markers, massive damage) rather than bypassing it. This ensures decree-001 and decree-004 compliance automatically.

5. **Comprehensive immunity system:** Type checks, personal ability checks, and adjacent ally protection are all implemented with clear separation and case-insensitive ability name matching.

6. **Declaration phase handling:** Correctly excluded from weather damage processing in League Battles.

---

## Summary

The P0 implementation of weather damage automation is largely correct and well-structured. The core mechanics (tick formula, type immunities, turn-start timing, damage pipeline integration) are all correct per PTU RAW. Two HIGH-severity issues need to be fixed before approval:

1. **Sand Stream** is missing from `SANDSTORM_IMMUNE_ABILITIES` -- a Pokemon that creates Sandstorm via its own ability will incorrectly take its own weather damage.
2. **Magic Guard** is missing from both weather immunity lists -- a widely-used ability that explicitly grants Weather damage immunity.

Both are straightforward additions to the constant arrays in `weatherRules.ts`.

---

## Verdict

**CHANGES_REQUIRED**

Fix HIGH-001 (Sand Stream) and HIGH-002 (Magic Guard) before proceeding to P1.

MEDIUM-001 (Permafrost) can be tracked as a P1/P2 item. MEDIUM-002 (ticket text) is a documentation fix.

---

## Required Changes

1. **[HIGH-001]** Add `'Sand Stream'` to `SANDSTORM_IMMUNE_ABILITIES` in `app/utils/weatherRules.ts:85-87`.
2. **[HIGH-002]** Add `'Magic Guard'` to both `HAIL_IMMUNE_ABILITIES` (line 73-75) and `SANDSTORM_IMMUNE_ABILITIES` (line 85-87) in `app/utils/weatherRules.ts`.
3. **[MEDIUM-002]** Update `artifacts/tickets/in-progress/feature/feature-018.md` line 33 to say "1/10 max HP" instead of "1/16 max HP".
4. **[MEDIUM-001]** Create a tracking note for Permafrost weather damage reduction as a P1/P2 item in the design spec or ticket.
