# Capture Domain — Gameplay Loops

# Tier 1: Session Workflows

## Workflow W1: Capture a Weakened Wild Pokemon During Combat

---
loop_id: capture-workflow-standard-capture
tier: workflow
domain: capture
gm_intent: Weaken a wild Pokemon during combat, throw a Poke Ball, and successfully capture it to add to a trainer's party
ptu_refs:
  - core/05-pokemon.md#Capturing Pokemon
  - core/05-pokemon.md#Calculating Capture Rates
  - core/07-combat.md#Standard Actions
  - core/07-combat.md#Making Attacks
app_features:
  - utils/captureRate.ts (calculateCaptureRate, attemptCapture, getCaptureDescription)
  - server/api/capture/rate.post.ts
  - server/api/capture/attempt.post.ts
  - composables/useCapture.ts (getCaptureRate, attemptCapture, rollAccuracyCheck, calculateCaptureRateLocal)
  - components/encounter/CaptureRateDisplay.vue
  - components/encounter/CombatantCard.vue (captureRate computed, isWildPokemon)
  - server/api/encounters/[id]/damage.post.ts
  - server/api/encounters/[id]/move.post.ts
mechanics_exercised:
  - capture-rate-formula
  - hp-percentage-modifier
  - evolution-stage-modifier
  - level-modifier
  - capture-attempt-roll
  - trainer-level-subtraction
  - critical-accuracy-bonus
  - post-capture-ownership
  - poke-ball-accuracy
sub_workflows:
  - capture-workflow-multi-attempt-retry
---

### GM Context
During a wild encounter, a player decides to capture a Pokemon rather than knock it out. This is the most common capture scenario — it happens whenever the party encounters a desirable wild Pokemon. The GM needs to coordinate damage to weaken the target, preview the capture rate to assess viability, then adjudicate the Poke Ball throw and capture roll.

### Preconditions
- A wild encounter is active with at least one wild Pokemon on the enemies side
- The wild Pokemon has `ownerId: null` (unowned)
- A player trainer exists with at least one Pokemon in the encounter
- The wild Pokemon's HP is above 0 (fainted Pokemon cannot be captured)

### Workflow Steps
1. **[Setup]** Wild encounter is underway (from combat domain W1). Wild Pokemon is on the enemies side. GM has served the encounter to Group View.
2. **[Action]** Player's Pokemon uses a damaging move against the wild Pokemon to weaken it. GM executes via `POST /api/encounters/:id/move` and `POST /api/encounters/:id/damage`.
3. **[Mechanic: damage-formula]** Damage reduces wild Pokemon's HP but does not knock it out (HP > 0). GM monitors HP percentage.
4. **[Mechanic: capture-rate-preview]** [FEASIBLE] GM views the capture rate displayed on the CombatantCard in the encounter UI. The `CombatantCard` computes `captureRate` via `calculateCaptureRateLocal()` using the Pokemon's current stats (level, currentHp, maxHp, statusConditions, injuries). The `CaptureRateDisplay` component shows the rate, difficulty label, and modifier breakdown.
5. **[Action]** Player declares a capture attempt on their turn. Throwing a Poke Ball is a **Standard Action**.
6. **[Mechanic: poke-ball-accuracy]** [FEASIBLE] Player rolls accuracy for the Poke Ball throw — it is an AC 6 Status Attack with range = 4 + Athletics Rank. The composable provides `rollAccuracyCheck()` which rolls 1d20. GM determines hit: `roll >= 6 + targetSpeedEvasion`. Natural 1 always misses, natural 20 always hits (and grants critical capture bonus).
7. **[Mechanic: capture-rate-formula]** [FEASIBLE] On hit, GM requests capture rate calculation via `POST /api/capture/rate` with `{ pokemonId }`. Server looks up the Pokemon's level, currentHp, maxHp, statusConditions, injuries, shiny status, and species evolution data. Formula:
   - Base: 100
   - Level modifier: -(level × 2)
   - HP modifier: >75% = -30, <=75% = -15, <=50% = 0, <=25% = +15, exactly 1 HP = +30
   - Evolution modifier: 2+ remaining = +10, 1 remaining = 0, final form = -10
   - Rarity: Shiny = -10, Legendary = -30
   - Status: Persistent +10 each, Volatile +5 each, Stuck/Trapped +10 each, Slowed +5
   - Injuries: +5 per injury
8. **[Mechanic: capture-attempt-roll]** [FEASIBLE] GM executes capture attempt via `POST /api/capture/attempt` with `{ pokemonId, trainerId, accuracyRoll }`. Server rolls 1d100, subtracts trainer level and modifiers. Success if modified roll <= capture rate. Natural 100 always captures.
9. **[Mechanic: critical-accuracy-bonus]** If accuracy roll was natural 20, +10 is added to the effective capture rate (equivalent to -10 on the capture roll per PTU rules).
10. **[Mechanic: post-capture-ownership]** [FEASIBLE] On successful capture, the API updates the Pokemon record: `ownerId` set to the trainer's ID, `origin` set to `'captured'`. The Pokemon is now owned by the trainer.
11. **[Bookkeeping]** GM removes the captured Pokemon from the encounter's enemy combatants (or the encounter ends if no enemies remain).
12. **[Done]** Pokemon is captured. It appears in the trainer's Pokemon list with origin `captured`. If no more wild Pokemon remain, GM can end the encounter.

### PTU Rules Applied
- **Poke Ball as Standard Action**: "Throwing a Poke Ball to Capture a wild Pokemon" is listed as a Standard Action (core/07-combat.md, p228)
- **Poke Ball Accuracy**: "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll, with a range equal to 4 plus your Athletics Rank" (core/05-pokemon.md, p214)
- **Critical Capture**: "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll" (core/05-pokemon.md, p214)
- **Capture Roll**: "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features. If you roll under or equal to the Pokemon's Capture Rate, the Pokemon is Captured!" (core/05-pokemon.md, p214)
- **Natural 100**: "A natural roll of 100 always captures the target without fail" (core/05-pokemon.md, p214)
- **Cannot Capture Fainted**: "Pokemon reduced to 0 Hit Points or less cannot be captured. Poke Balls will simply fail to attempt to energize them" (core/05-pokemon.md, p214)

### Expected End State
- Captured Pokemon: `ownerId` = trainer ID, `origin` = `'captured'`
- Pokemon still has its current HP, status conditions, and injuries from combat (capture does not heal)
- Pokemon appears in the trainer's Pokemon list on the sheets page
- PokemonCard displays "Captured" origin badge in blue
- Capture attempt API response includes full breakdown: `captured: true`, `roll`, `modifiedRoll`, `captureRate`, `effectiveCaptureRate`, `difficulty`, `breakdown`
- If the encounter had only one enemy, GM can end the encounter

### Variations
- **Multi-attempt with retry**: Capture fails, player weakens further and retries → sub-workflow capture-workflow-multi-attempt-retry
- **Critical accuracy capture**: Natural 20 on accuracy gives +10 to effective capture rate, improving chances significantly
- **Natural 100 guaranteed capture**: Regardless of how negative the capture rate is, a natural 100 roll always succeeds
- **Multiple wild Pokemon**: Player captures one but others remain — encounter continues with remaining enemies

---

## Sub-Workflow: Multi-Attempt Capture with Improving Conditions

---
loop_id: capture-workflow-multi-attempt-retry
tier: workflow
domain: capture
gm_intent: Handle a failed capture attempt by improving conditions (lower HP, apply status) and retrying until the Pokemon is captured
ptu_refs:
  - core/05-pokemon.md#Calculating Capture Rates
  - core/07-combat.md#Status Afflictions
  - core/07-combat.md#Standard Actions
app_features:
  - utils/captureRate.ts (calculateCaptureRate, attemptCapture)
  - server/api/capture/rate.post.ts
  - server/api/capture/attempt.post.ts
  - server/api/encounters/[id]/damage.post.ts
  - server/api/encounters/[id]/status.post.ts
  - composables/useCapture.ts
  - components/encounter/CaptureRateDisplay.vue
mechanics_exercised:
  - capture-rate-formula
  - hp-percentage-modifier
  - status-condition-modifier
  - injury-modifier
  - stuck-slow-modifier
  - capture-attempt-roll
  - trainer-level-subtraction
  - capture-rate-improvement-feedback
sub_workflows: []
---

### GM Context
A player threw a Poke Ball but the capture roll failed. This is the most common capture scenario in practice — players rarely succeed on the first throw, especially against higher-level or evolved Pokemon. The party now needs to further weaken the target and apply status conditions to improve the capture rate before trying again.

### Preconditions
- A wild encounter is active
- A capture attempt has already failed (the wild Pokemon is still on the field, unowned, HP > 0)
- The player trainer has additional Poke Balls available

### Workflow Steps
1. **[Action]** First capture attempt fails. API returns `{ captured: false, roll, modifiedRoll, captureRate }`. The GM and player can see the capture rate and how close the roll was.
2. **[Action]** Player's Pokemon uses a damaging move to lower the wild Pokemon's HP further.
3. **[Mechanic: hp-percentage-modifier]** HP drops from >50% to <=25% range. The capture rate HP modifier improves from +0 to +15 (a +15 swing).
4. **[Action]** Another combatant uses a status-inflicting move. GM applies status via `POST /api/encounters/:id/status` — e.g., `add: ['Paralyzed']`.
5. **[Mechanic: status-condition-modifier]** Paralyzed is a Persistent condition → +10 to capture rate. The `CaptureRateDisplay` updates in real-time showing the improved rate.
6. **[Mechanic: injury-modifier]** If the damage dealt caused a Massive Damage injury (>= 50% maxHP), the injury adds +5 to capture rate. Multiple injuries stack.
7. **[Action]** GM re-checks the capture rate via the CombatantCard display or `POST /api/capture/rate`. Rate is now significantly higher (e.g., from 30 → 60).
8. **[Action]** On the trainer's next turn, player throws another Poke Ball (Standard Action). Accuracy roll, then capture roll.
9. **[Mechanic: capture-attempt-roll]** `POST /api/capture/attempt` — with the improved capture rate, the modified roll is more likely to succeed.
10. **[Done]** Capture succeeds on the retry. Pokemon linked to trainer with `origin: 'captured'`.

### PTU Rules Applied
- **HP Modifier Tiers**: "If the Pokemon is above 75% Hit Points, subtract 30...at 75% or lower, subtract 15...at 50% or lower, the Capture Rate is unmodified...at 25% or lower, add a total of +15...at exactly 1 Hit Point, add a total of +30" (core/05-pokemon.md, p214)
- **Status Bonus**: "Persistent Conditions add +10 to the Pokemon's Capture Rate; Injuries and Volatile Conditions add +5" (core/05-pokemon.md, p215)
- **Stuck/Slow Bonus**: "Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5" (core/05-pokemon.md, p215)
- **Injury Bonus**: "+5" per injury (core/05-pokemon.md, p215)

### Expected End State
- Capture rate increased by the cumulative modifiers applied between attempts
- Second (or subsequent) capture attempt succeeds due to improved odds
- All modifier contributions visible in the API response breakdown and CaptureRateDisplay tooltip
- Pokemon ownership transferred to trainer on success

### Variations
- **Status stacking**: Apply multiple statuses (Paralyzed + Confused) for cumulative bonus (+10 + +5 = +15 from status alone)
- **Stuck/Slow conditions**: Apply Stuck (+10) or Slow (+5) for additional capture rate improvement on top of status
- **Exactly 1 HP**: If the player uses a move that leaves the Pokemon at exactly 1 HP, the HP modifier jumps to +30 — the highest possible bonus
- **Accidental faint**: Player deals too much damage, Pokemon faints (0 HP) — capture becomes impossible. `canBeCaptured` returns false.
- **Many failed attempts**: Multiple failures with progressively better conditions — eventually succeeds or player runs out of Poke Balls

---

## Workflow W2: Capture Rate Assessment Driving Combat Strategy

---
loop_id: capture-workflow-rate-assessment
tier: workflow
domain: capture
gm_intent: Use the capture rate display to inform the party's combat strategy, deciding when to switch from attacking to capturing
ptu_refs:
  - core/05-pokemon.md#Calculating Capture Rates
app_features:
  - composables/useCapture.ts (calculateCaptureRateLocal)
  - components/encounter/CombatantCard.vue (captureRate computed, isWildPokemon)
  - components/encounter/CaptureRateDisplay.vue (difficulty label, breakdown tooltip)
  - utils/captureRate.ts (getCaptureDescription)
mechanics_exercised:
  - capture-rate-formula
  - hp-percentage-modifier
  - capture-difficulty-description
  - real-time-rate-update
sub_workflows: []
---

### GM Context
At the start of a wild encounter, a player announces they want to capture one of the wild Pokemon. The GM needs to assess the capture difficulty to advise the party. As combat progresses and the wild Pokemon takes damage and status conditions, the GM monitors the capture rate in real-time on the CombatantCard, informing the player when conditions are favorable for an attempt.

### Preconditions
- A wild encounter is active and served to Group View
- At least one wild Pokemon is present as an unowned enemy combatant
- The GM is viewing the encounter on the GM page

### Workflow Steps
1. **[Setup]** Wild encounter begins. The CombatantCard for each wild (unowned, enemy-side) Pokemon displays a `CaptureRateDisplay` widget. The initial capture rate is computed client-side via `calculateCaptureRateLocal()`.
2. **[Mechanic: capture-rate-formula]** Initial rate computed from: base 100 - (level × 2) + HP modifier (full HP → -30) + evolution modifier + rarity. For a Level 10 basic Pokemon at full HP: `100 - 20 - 30 + 10 = 60` ("Easy").
3. **[Mechanic: capture-difficulty-description]** The `getCaptureDescription()` function translates the rate to a human-readable label: Very Easy (>=80), Easy (>=60), Moderate (>=40), Difficult (>=20), Very Difficult (>=1), Nearly Impossible (<1).
4. **[Action]** GM communicates the difficulty to the player: "The Oddish is Level 13 — capture rate is 64, rated Easy." The party decides whether to attempt capture immediately or weaken first.
5. **[Action]** Party attacks the wild Pokemon, reducing its HP to <=50%.
6. **[Mechanic: real-time-rate-update]** The CombatantCard recomputes `captureRate` reactively as the combatant's HP changes. Rate improves from 60 → 75 as HP modifier shifts from -30 to 0.
7. **[Action]** A move inflicts Paralyzed on the wild Pokemon. Rate recomputes again: 75 → 85 ("Very Easy").
8. **[Done]** GM advises player that conditions are favorable. Player decides to attempt capture on their next turn (proceeding to W1 flow).

### PTU Rules Applied
- **Rate Visibility**: The GM calculates the capture rate privately using the PTU formula, then communicates difficulty to players. The app automates this calculation.
- **Formula**: "A Pokemon's Capture Rate depends on its Level, Hit Points, Status Afflictions, Evolutionary Stage, and Rarity" (core/05-pokemon.md, p214)

### Expected End State
- GM has a clear view of capture difficulty for all wild Pokemon in the encounter
- Rate updates in real-time as HP/status changes occur during combat
- GM can make informed decisions about when to advise the player to attempt capture
- Transitions naturally into W1 (capture attempt) when conditions are favorable

### Variations
- **High-level target**: A Level 40+ fully-evolved Pokemon starts with a negative capture rate — GM warns the party that capture is Very Difficult even with optimal conditions
- **Shiny Pokemon**: Additional -10 modifier makes capture harder; party needs to apply more conditions
- **Multiple wild Pokemon**: GM compares capture rates across targets to identify the easiest capture

## Feasibility Summary

| Workflow Step | Status | Gap Type | Details |
|---------------|--------|----------|---------|
| W1.6: Poke Ball range (4 + Athletics Rank) | GAP | FEATURE_GAP | Range calculation not implemented; GM determines range manually |
| W1.8: Ball type modifier | GAP | FEATURE_GAP | API accepts `pokeBallType` param but does not apply any modifier; all balls treated as Basic Ball (+0) |
| W1.4/W2.4: Evolution stage in CombatantCard | GAP | FEATURE_GAP | CombatantCard hardcodes `evolutionStage: 1, maxEvolutionStage: 3` instead of looking up actual species evolution data |
| W1.7: Legendary detection | GAP | FEATURE_GAP | `rate.post.ts` hardcodes `isLegendary: false`; no legendary species lookup |
| W1.6/W2: Attempt Capture button in combat | GAP | UX_GAP | `CaptureRateDisplay` supports `showAttemptButton` prop but `CombatantCard` does not pass it; GM must use API directly |

---

# Tier 2: Mechanic Validations

## Mechanic M1: Capture Rate Base Calculation

---
loop_id: capture-mechanic-base-rate
tier: mechanic
domain: capture
ptu_refs:
  - core/05-pokemon.md#Calculating Capture Rates
app_features:
  - utils/captureRate.ts (calculateCaptureRate)
sub_loops: []
---

### Preconditions
- A wild Pokemon with a known level
- All other modifiers held at neutral (HP at 50%, one evolution remaining, not shiny, no statuses, no injuries)

### Steps
1. Calculate base capture rate: start with 100
2. Subtract Level × 2
3. Observe the rate with only the level modifier active

### PTU Rules Applied
- **Base Rate**: "First, begin with 100. Then subtract the Pokemon's Level x2" (core/05-pokemon.md, p214)

### Expected Outcomes
- Level 1: `100 - 2 = 98`
- Level 10: `100 - 20 = 80`
- Level 25: `100 - 50 = 50`
- Level 50: `100 - 100 = 0` (base rate reaches 0 at level 50)
- Level 80: `100 - 160 = -60` (negative base — capture requires significant modifiers to succeed)

### Edge Cases
- Level 0 Pokemon (theoretical): `100 - 0 = 100` (max base rate)
- Very high level (80+): Rate goes deeply negative — requires Natural 100 or massive positive modifiers
- Level is applied as `-(level * 2)` in `calculateCaptureRate()`; verified at `captureRate.ts:86`

---

## Mechanic M2: HP Percentage Modifier Thresholds

---
loop_id: capture-mechanic-hp-modifier
tier: mechanic
domain: capture
ptu_refs:
  - core/05-pokemon.md#Calculating Capture Rates
app_features:
  - utils/captureRate.ts (calculateCaptureRate, hpModifier logic lines 89-100)
sub_loops: []
---

### Preconditions
- A wild Pokemon with known currentHp and maxHp
- Other modifiers held constant to isolate HP effect

### Steps
1. Calculate HP percentage: `(currentHp / maxHp) * 100`
2. Apply the HP modifier based on the percentage tier
3. Verify correct tier boundary behavior

### PTU Rules Applied
- **HP Tiers**: "If the Pokemon is above 75% Hit Points, subtract 30...at 75% or lower, subtract 15...at 50% or lower, the Capture Rate is unmodified...at 25% or lower, add a total of +15...at exactly 1 Hit Point, add a total of +30" (core/05-pokemon.md, p214)
- **0 HP Restriction**: "Pokemon reduced to 0 Hit Points or less cannot be captured" (core/05-pokemon.md, p214)

### Expected Outcomes
- Pokemon at 100% HP (e.g., 50/50): hpModifier = -30
- Pokemon at exactly 75% HP (e.g., 37/50, rounding yields 74%): hpModifier depends on exact percentage
- Pokemon at 75% HP (e.g., 75/100): hpModifier = -15 (at or below 75%)
- Pokemon at 50% HP (e.g., 25/50): hpModifier = 0
- Pokemon at 25% HP (e.g., 12/50, percentage = 24%): hpModifier = +15
- Pokemon at exactly 1 HP: hpModifier = +30 (special case, checked before percentage tiers)
- Pokemon at 0 HP: `canBeCaptured = false`

### Edge Cases
- **Exactly 1 HP check takes priority**: In the code, `currentHp === 1` is checked first (line 90), before percentage tiers. A Pokemon with maxHp = 4 and currentHp = 1 has percentage = 25%, but the +30 modifier applies because 1 HP is checked first.
- **Boundary at 75%**: A Pokemon at exactly 75.0% HP gets -15 (<=75%), not -30 (>75%). The code uses `hpPercentage <= 75` at line 94.
- **Boundary at 50%**: Exactly 50.0% gets 0. Code uses `hpPercentage <= 50` at line 94.
- **Boundary at 25%**: Exactly 25.0% gets +15. Code uses `hpPercentage <= 25` at line 92.
- **High maxHp with 1 currentHp**: A Pokemon with maxHp = 200 and currentHp = 1 gets +30 (1 HP check), not +15 (<=25% check).

---

## Mechanic M3: Evolution Stage Modifier

---
loop_id: capture-mechanic-evolution-stage
tier: mechanic
domain: capture
ptu_refs:
  - core/05-pokemon.md#Calculating Capture Rates
app_features:
  - utils/captureRate.ts (calculateCaptureRate, evolutionModifier logic lines 103-112)
  - server/api/capture/rate.post.ts (evolution stage lookup from speciesData)
sub_loops: []
---

### Preconditions
- A wild Pokemon with known evolution stage and max evolution stage
- `evolutionStage` = current stage in evolution line (1, 2, or 3)
- `maxEvolutionStage` = total stages in the evolution line (1, 2, or 3)

### Steps
1. Calculate evolutions remaining: `maxEvolutionStage - evolutionStage`
2. Apply modifier based on remaining evolutions

### PTU Rules Applied
- **Two evolutions remaining**: "add +10 to the Pokemon's Capture Rate" (core/05-pokemon.md, p214)
- **One evolution remaining**: "don't change the Capture Rate" (core/05-pokemon.md, p214)
- **No evolutions remaining**: "subtract 10 from the Pokemon's Capture Rate" (core/05-pokemon.md, p214)

### Expected Outcomes
- Bulbasaur (stage 1, max 3, remaining 2): evolutionModifier = +10
- Ivysaur (stage 2, max 3, remaining 1): evolutionModifier = 0
- Venusaur (stage 3, max 3, remaining 0): evolutionModifier = -10
- Pikachu (stage 1, max 2, remaining 1): evolutionModifier = 0
- Raichu (stage 2, max 2, remaining 0): evolutionModifier = -10

### Edge Cases
- **Single-stage Pokemon** (e.g., Tauros, stage 1, max 1, remaining 0): evolutionModifier = -10 (final form)
- **CombatantCard hardcodes stage 1/3**: The `CombatantCard.vue` component passes `evolutionStage: 1, maxEvolutionStage: 3` regardless of actual species data. This means the client-side rate display always shows +10 for evolution. The server-side `rate.post.ts` looks up actual species data but defaults to `Math.max(3, evolutionStage)` for maxEvolutionStage — also potentially inaccurate for 2-stage lines. [FEATURE_GAP]

---

## Mechanic M4: Status Condition Modifiers

---
loop_id: capture-mechanic-status-modifiers
tier: mechanic
domain: capture
ptu_refs:
  - core/05-pokemon.md#Calculating Capture Rates
  - core/07-combat.md#Status Afflictions
app_features:
  - utils/captureRate.ts (calculateCaptureRate, PERSISTENT_CONDITIONS, VOLATILE_CONDITIONS, STUCK_CONDITIONS, SLOW_CONDITIONS)
sub_loops: []
---

### Preconditions
- A wild Pokemon with one or more status conditions applied
- Status conditions are from the `StatusCondition` type

### Steps
1. For each status condition, classify it as Persistent, Volatile, Stuck/Trapped, or Slow
2. Apply the corresponding modifier
3. Sum all status-related modifiers

### PTU Rules Applied
- **Persistent**: "Persistent Conditions add +10 to the Pokemon's Capture Rate" (core/05-pokemon.md, p215)
- **Volatile**: "Injuries and Volatile Conditions add +5" (core/05-pokemon.md, p215)
- **Stuck/Slow**: "Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5" (core/05-pokemon.md, p215)

### Expected Outcomes

**Persistent Conditions (+10 each):**
- Burned: +10
- Frozen: +10
- Paralyzed: +10
- Poisoned: +10
- Badly Poisoned: +10
- Asleep: +10 (see note below)

**Volatile Conditions (+5 each):**
- Confused: +5
- Flinched: +5
- Infatuated: +5
- Cursed: +5
- Disabled: +5
- Enraged: +5
- Suppressed: +5

**Special Conditions (stack with the above):**
- Stuck: +10
- Trapped: +10
- Slowed: +5

**Combination examples:**
- Paralyzed + Confused: +10 + +5 = +15 total status modifier
- Burned + Stuck: +10 (Burned) + +10 (Stuck) = +20 total
- Poisoned + Cursed + Slowed: +10 + +5 + +5 = +20 total

### Edge Cases
- **Asleep classification**: The code (`captureRate.ts:18`) classifies `Asleep` as a Persistent Condition (+10). However, PTU core rules (07-combat.md) list Sleep under Volatile Afflictions. If Sleep should be Volatile, it would contribute +5 instead of +10. The app follows its own classification. [RULES_NOTE: Potential discrepancy — Sleep classified as Persistent in app vs Volatile in combat chapter. The capture chapter (05-pokemon.md) does not individually list which statuses are Persistent vs Volatile for capture purposes.]
- **Stuck stacks with status**: A Pokemon that is both Paralyzed and Stuck gets +10 (Persistent) + +10 (Stuck) = +20. Stuck is not a status condition per se but has its own separate modifier.
- **Fainted is in StatusCondition type but not in any capture modifier list**: Fainted Pokemon have `canBeCaptured = false` — the status check is never reached.
- **Duplicate statuses**: PTU allows multiple statuses simultaneously. Each unique condition adds its modifier independently.

---

## Mechanic M5: Rarity and Injury Modifiers

---
loop_id: capture-mechanic-rarity-injury
tier: mechanic
domain: capture
ptu_refs:
  - core/05-pokemon.md#Calculating Capture Rates
app_features:
  - utils/captureRate.ts (calculateCaptureRate, shinyModifier, legendaryModifier, injuryModifier)
sub_loops: []
---

### Preconditions
- A wild Pokemon with known shiny status, legendary status, and injury count

### Steps
1. Check if the Pokemon is Shiny → -10
2. Check if the Pokemon is Legendary → -30
3. Count injuries → +5 per injury
4. Sum all modifiers

### PTU Rules Applied
- **Shiny**: "Shiny Pokemon subtract 10 from the Pokemon's Capture Rate" (core/05-pokemon.md, p215)
- **Legendary**: "Legendary Pokemon subtract 30 from the Pokemon's Capture Rate" (core/05-pokemon.md, p215)
- **Injuries**: "Injuries...add +5" each (core/05-pokemon.md, p215)

### Expected Outcomes
- Normal Pokemon, 0 injuries: shinyModifier = 0, legendaryModifier = 0, injuryModifier = 0
- Shiny Pokemon: shinyModifier = -10
- Legendary Pokemon: legendaryModifier = -30
- Shiny Legendary: shinyModifier = -10, legendaryModifier = -30 (total -40 from rarity)
- Pokemon with 1 injury: injuryModifier = +5
- Pokemon with 3 injuries: injuryModifier = +15
- Shiny with 2 injuries: -10 + +10 = net 0 from rarity+injuries

### Edge Cases
- **Legendary detection not implemented**: `rate.post.ts` hardcodes `isLegendary: false`. The rate calculation utility supports it, but the API endpoint never passes `true`. [FEATURE_GAP]
- **Injuries partially offset rarity penalty**: A Shiny Pokemon with 2 injuries has -10 + +10 = 0 net modifier, effectively canceling the Shiny penalty.
- **High injury count**: 5+ injuries = heavily injured per PTU rules. Each still adds +5 (25+ total from injuries).

---

## Mechanic M6: Capture Attempt Roll

---
loop_id: capture-mechanic-attempt-roll
tier: mechanic
domain: capture
ptu_refs:
  - core/05-pokemon.md#Capturing Pokemon
app_features:
  - utils/captureRate.ts (attemptCapture)
  - server/api/capture/attempt.post.ts
sub_loops:
  - capture-mechanic-critical-accuracy
  - capture-mechanic-natural-hundred
---

### Preconditions
- Capture rate has been calculated for a target Pokemon
- Trainer has hit the Pokemon with a Poke Ball (accuracy check passed)
- Trainer level is known

### Steps
1. Roll 1d100 (range 1-100)
2. Subtract trainer's level from the roll
3. Subtract any additional modifiers (equipment, features, ball type)
4. Compare modified roll to the capture rate
5. Success if modified roll <= capture rate

### PTU Rules Applied
- **Roll Mechanic**: "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features" (core/05-pokemon.md, p214)
- **Success Condition**: "If you roll under or equal to the Pokemon's Capture Rate, the Pokemon is Captured!" (core/05-pokemon.md, p214)

### Expected Outcomes
- Capture rate 60, trainer level 5, roll 50: `modifiedRoll = 50 - 5 = 45`. 45 <= 60 → **captured**
- Capture rate 60, trainer level 5, roll 80: `modifiedRoll = 80 - 5 = 75`. 75 > 60 → **not captured**
- Capture rate 30, trainer level 10, roll 25: `modifiedRoll = 25 - 10 = 15`. 15 <= 30 → **captured**
- Capture rate -15, trainer level 4, roll 1: `modifiedRoll = 1 - 4 = -3`. -3 <= -15 → **not captured**

### Edge Cases
- **Negative capture rate**: Rate can go negative for high-level/evolved/legendary Pokemon. Only natural 100 or very low rolls with high modifiers can succeed.
- **Trainer level subtracted, not added**: Higher trainer level makes the modified roll lower, which is beneficial (easier to be <= capture rate). This is correct — experienced trainers are better at capturing.
- **Ball type modifiers**: The `modifiers` parameter accepts a number but `pokeBallType` is currently unused. Ball modifiers (Great Ball -10, Ultra Ball -15, etc.) should subtract from the roll. [FEATURE_GAP]

### Sub-Loop: Critical Accuracy Bonus

---
loop_id: capture-mechanic-critical-accuracy
tier: mechanic
domain: capture
ptu_refs:
  - core/05-pokemon.md#Capturing Pokemon
app_features:
  - utils/captureRate.ts (attemptCapture, criticalHit parameter)
  - server/api/capture/attempt.post.ts (accuracyRoll === 20 detection)
sub_loops: []
---

#### Preconditions
- Player rolled a natural 20 on the Poke Ball accuracy check

#### Steps
1. `accuracyRoll` of 20 passed to `POST /api/capture/attempt`
2. Server detects `accuracyRoll === 20` → sets `criticalHit = true`
3. `attemptCapture()` adds +10 to `effectiveCaptureRate` (mathematically equivalent to subtracting 10 from the capture roll)
4. Modified roll compared against the boosted effective capture rate

#### PTU Rules Applied
- **Critical Capture**: "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll" (core/05-pokemon.md, p214)

#### Expected Outcomes
- Capture rate 50 + crit bonus: effectiveCaptureRate = 60
- Roll 55, trainer level 5, effectiveCaptureRate 60: `modifiedRoll = 55 - 5 = 50`. 50 <= 60 → captured (would have failed without crit)

### Sub-Loop: Natural 100

---
loop_id: capture-mechanic-natural-hundred
tier: mechanic
domain: capture
ptu_refs:
  - core/05-pokemon.md#Capturing Pokemon
app_features:
  - utils/captureRate.ts (attemptCapture, naturalHundred check)
sub_loops: []
---

#### Preconditions
- Player rolls exactly 100 on the 1d100 capture roll

#### Steps
1. Roll result is 100
2. `naturalHundred` flag set to true
3. Capture succeeds regardless of modified roll vs capture rate

#### PTU Rules Applied
- **Guaranteed Capture**: "A natural roll of 100 always captures the target without fail" (core/05-pokemon.md, p214)

#### Expected Outcomes
- Even with capture rate -60 (deeply negative), natural 100 succeeds
- `naturalHundred: true` in the response indicates this was a guaranteed capture
- This is the only way to capture very high-level legendary Pokemon with negative capture rates

---

## Mechanic M7: Cannot Capture Fainted Pokemon

---
loop_id: capture-mechanic-cannot-capture-fainted
tier: mechanic
domain: capture
ptu_refs:
  - core/05-pokemon.md#Calculating Capture Rates
app_features:
  - utils/captureRate.ts (calculateCaptureRate, canBeCaptured check at line 77)
  - server/api/capture/attempt.post.ts (early return when canBeCaptured is false)
sub_loops: []
---

### Preconditions
- A wild Pokemon has been reduced to 0 HP (fainted)

### Steps
1. Capture rate is calculated — `canBeCaptured = currentHp > 0` → `false`
2. If capture attempt is made via API, server calculates rate and sees `canBeCaptured: false`
3. API returns `{ success: false, data: { captured: false, reason: 'Pokemon is at 0 HP...' } }`
4. No capture roll is made

### PTU Rules Applied
- **Cannot Capture at 0 HP**: "Pokemon reduced to 0 Hit Points or less cannot be captured. Poke Balls will simply fail to attempt to energize them" (core/05-pokemon.md, p214)
- **Safety Mechanism**: "The energizing process is too dangerous for seriously injured Pokemon and is thus halted by a failsafe built into all Poke Balls" (core/09-gear-and-items.md, p271)

### Expected Outcomes
- `calculateCaptureRate({ currentHp: 0, ... })` returns `{ canBeCaptured: false, ... }`
- `POST /api/capture/attempt` for a fainted Pokemon returns failure with reason string
- No roll is made — the attempt is rejected before the dice
- The `CaptureRateDisplay` shows dimmed styling and "(Fainted)" suffix for 0 HP Pokemon

### Edge Cases
- **Exactly 0 HP**: `canBeCaptured = currentHp > 0` → 0 is not > 0 → false. Correct.
- **Negative HP**: The app floors HP at 0, so negative HP shouldn't occur. But if it did, `canBeCaptured` would still be false.
- **Capture Specialist's Catch Combo**: PTU has a feature that allows capturing fainted Pokemon: "you may immediately throw a Poke Ball against the triggering Wild Pokemon, and it may be Captured even though it is knocked out. Calculate Capture Rate as if the target had 1 HP" (core/04-trainer-classes.md, p795). This is NOT implemented in the app. [FEATURE_GAP — Capture Specialist class features]

---

## Mechanic M8: Post-Capture State Update

---
loop_id: capture-mechanic-post-capture-update
tier: mechanic
domain: capture
ptu_refs:
  - core/05-pokemon.md#Capturing Pokemon
app_features:
  - server/api/capture/attempt.post.ts (prisma.pokemon.update on success)
  - types/character.ts (PokemonOrigin includes 'captured')
  - components/character/PokemonCard.vue (origin badge display)
sub_loops: []
---

### Preconditions
- A capture attempt has succeeded (roll result indicates capture)

### Steps
1. Server updates the Pokemon record in the database:
   - `ownerId` set to the capturing trainer's ID
   - `origin` set to `'captured'`
2. API response includes the updated Pokemon object with new `ownerId` and `origin`
3. Pokemon now appears in the trainer's Pokemon list

### PTU Rules Applied
- **Ownership Transfer**: Once captured, the Pokemon is registered to the trainer's Poke Ball and becomes their Pokemon (core/05-pokemon.md, Poke Ball registration rules)

### Expected Outcomes
- Pokemon DB record: `ownerId = trainerId`, `origin = 'captured'`
- Pokemon's currentHp, statusConditions, injuries, and stats are preserved (capture does not heal)
- `PokemonCard` component displays "Captured" badge with blue styling
- Trainer's `pokemon` relation now includes this Pokemon
- If captured during an encounter, the Pokemon should be removed from the encounter's enemy combatants by the GM

### Edge Cases
- **Pokemon retains combat state**: Capture does NOT heal the Pokemon. It keeps whatever HP, statuses, and injuries it had at the moment of capture. (The Heal Ball is a special ball that heals on capture — not currently implemented.)
- **No automatic encounter removal**: The `attempt.post.ts` endpoint only updates ownership — it does not remove the Pokemon from an active encounter's combatant list. The GM must do this manually or end the encounter.
- **Re-capture prevention**: PTU states "Poke Balls fail to activate against owned Pokemon already registered to a Trainer and Ball" (core/09-gear-and-items.md, p271). The app does not currently enforce this check — the API would happily "re-capture" an already-owned Pokemon. [FEATURE_GAP — no owned Pokemon capture prevention]

---

## Mechanic M9: Worked Example Verification

---
loop_id: capture-mechanic-worked-examples
tier: mechanic
domain: capture
ptu_refs:
  - core/05-pokemon.md#Calculating Capture Rates (worked examples)
app_features:
  - utils/captureRate.ts (calculateCaptureRate)
sub_loops: []
---

### Preconditions
- Formula is fully implemented
- Worked examples from the PTU rulebook are used as test vectors

### Steps
1. Compute capture rate for each PTU worked example
2. Compare result to the rulebook's stated answer

### PTU Rules Applied
- **Example 1**: "A level 10 Pikachu that is at 70% Hit Points and Confused would have a Capture Rate of 70. Math: Level (+80), Health (-15), One Evolution (+0), Confused (+5)" (core/05-pokemon.md, p215)
- **Example 2**: "A Shiny level 30 Caterpie that is at 40% Hit Points and has one injury would have a Capture Rate of 45. Math: Level (+40), Health (+0), Two Evolutions (+10), Shiny (-10), Injury (+5)" (core/05-pokemon.md, p215)
- **Example 3**: "A level 80 Hydreigon that is at exactly 1 Hit Point, and is Burned, Poisoned, and has one Injury would have a Capture Rate of -15. Math: Level (-60), Health (+30), No Evolutions (-10), Burned (+10), Poisoned (+10), Injury (+5)" (core/05-pokemon.md, p215)

### Expected Outcomes

**Example 1 — Level 10 Pikachu, 70% HP, Confused:**
```
base: 100
levelModifier: -(10 × 2) = -20     → net 80
hpModifier: 70% is <=75%  = -15    → net 65
evolutionModifier: Pikachu has 1 evolution remaining (Raichu) = 0 → net 65
statusModifier: Confused (Volatile) = +5 → net 70
Result: 70 ✓
```

**Example 2 — Shiny Level 30 Caterpie, 40% HP, 1 injury:**
```
base: 100
levelModifier: -(30 × 2) = -60     → net 40
hpModifier: 40% is <=50%  = 0      → net 40
evolutionModifier: Caterpie has 2 evolutions remaining (Metapod, Butterfree) = +10 → net 50
shinyModifier: -10                  → net 40
injuryModifier: 1 × 5 = +5         → net 45
Result: 45 ✓
```

**Example 3 — Level 80 Hydreigon, exactly 1 HP, Burned + Poisoned + 1 injury:**
```
base: 100
levelModifier: -(80 × 2) = -160    → net -60
hpModifier: exactly 1 HP = +30     → net -30
evolutionModifier: Hydreigon has 0 evolutions remaining (final form) = -10 → net -40
statusModifier: Burned (+10) + Poisoned (+10) = +20 → net -20
injuryModifier: 1 × 5 = +5         → net -15
Result: -15 ✓
```

All three worked examples match the PTU rulebook answers.

---

## Tier 1 Mechanic Coverage Verification

The following mechanics are exercised by at least one Tier 1 workflow:

| Mechanic | Covered By |
|----------|-----------|
| Capture rate formula (base + level) | W1, W1-sub, W2 |
| HP percentage modifier | W1, W1-sub, W2 |
| Evolution stage modifier | W1, W2 |
| Status condition modifier | W1-sub, W2 |
| Injury modifier | W1-sub |
| Rarity modifier (shiny/legendary) | W2 (variation) |
| Stuck/Slow modifier | W1-sub |
| Capture attempt roll (1d100) | W1, W1-sub |
| Trainer level subtraction | W1, W1-sub |
| Critical accuracy bonus | W1 (variation) |
| Natural 100 guaranteed capture | W1-sub (variation) |
| Cannot capture fainted Pokemon | W1-sub (variation) |
| Post-capture ownership transfer | W1, W1-sub |
| Poke Ball accuracy (AC 6) | W1, W1-sub |
| Capture difficulty description | W2 |
| Real-time rate update | W2 |

**Uncovered by workflows (remain Tier 2 only):** Worked example verification (M9) — this is a formula validation, not a GM task. All other mechanics are naturally exercised through the workflows.

**Not implemented in app (FEATURE_GAP):**
- Ball type modifiers (Great Ball -10, Ultra Ball -15, etc.)
- Legendary detection
- Accurate evolution stage lookup in CombatantCard
- Capture Specialist class features (Catch Combo, Snare, etc.)
- Poke Ball range calculation (4 + Athletics Rank)
- Owned Pokemon re-capture prevention
