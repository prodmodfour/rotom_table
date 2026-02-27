---
domain: healing
mapped_at: 2026-02-26T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 62
files_read: 26
---

# App Capabilities: Healing

## Summary
- Total capabilities: 62
- Types: api-endpoint(13), service-function(5), composable-function(9), store-action(4), component(4), utility(14), constant(3), websocket-event(1), prisma-field(9)
- Orphan capabilities: 0

---

## healing-C001: Character 30-Minute Rest API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/rest.post.ts:default`
- **Game Concept:** 30-minute rest HP recovery
- **Description:** Applies 30 minutes of rest to a human character, healing 1/16th max HP. Auto-resets daily counters if a new calendar day has started. Blocked at 5+ injuries, capped at 480 min/day, and capped at injury-reduced effective max HP.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C002: Character Extended Rest API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/extended-rest.post.ts:default`
- **Game Concept:** Extended rest (4+ hours) -- HP recovery, status clearing, AP restoration
- **Description:** Applies 8 rest periods (4 hours) of HP healing, clears persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned), restores all drained AP, clears all bound AP, and sets currentAp to full maxAp.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, clearedStatuses, apRestored, boundApCleared, restMinutesToday, restMinutesRemaining } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C003: Character Pokemon Center API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/pokemon-center.post.ts:default`
- **Game Concept:** Pokemon Center full healing for trainers
- **Description:** Restores HP to injury-reduced effective max, clears ALL status conditions, heals injuries (max 3/day). Calculates healing time (1hr base + 30min/injury, or 1hr/injury if 5+). Does NOT restore drained AP (exclusive to Extended Rest). Clears lastInjuryTime when all injuries healed.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, effectiveMaxHp, injuriesHealed, injuriesRemaining, clearedStatuses, apRestored: 0, healingTime, healingTimeDescription, atDailyInjuryLimit, injuriesHealedToday } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C004: Character Heal Injury API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/heal-injury.post.ts:default`
- **Game Concept:** Injury healing -- natural (24h timer) or drain AP (trainers only)
- **Description:** Heals one injury via natural healing (24h since last injury) or AP drain (costs 2 AP, increments drainedAp by 2, decrements currentAp by 2). Enforces daily limit of 3 injuries healed from all sources. Clears lastInjuryTime when all injuries are gone.
- **Inputs:** Character ID (URL param), `{ method: 'natural' | 'drain_ap' }` (body, defaults to 'natural')
- **Outputs:** `{ success, message, data: { injuriesHealed, injuries, drainedAp?, currentAp?, injuriesHealedToday } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C005: Character New Day API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/new-day.post.ts:default`
- **Game Concept:** Per-character daily counter reset with cascading Pokemon reset
- **Description:** Resets a single character's daily healing counters: restMinutesToday, injuriesHealedToday, drainedAp, boundAp all to 0, currentAp to calculateMaxAp(level). Also cascades to all linked Pokemon: resets their restMinutesToday and injuriesHealedToday, and calls resetDailyUsage on their moves JSON.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { restMinutesToday, injuriesHealedToday, drainedAp, boundAp, currentAp, lastRestReset, pokemonReset } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C006: Pokemon 30-Minute Rest API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/rest.post.ts:default`
- **Game Concept:** 30-minute rest HP recovery for Pokemon
- **Description:** Applies 30 minutes of rest to a Pokemon, healing 1/16th max HP. Same rules as character rest: blocked at 5+ injuries, capped at 480 min/day, capped at injury-reduced effective max HP.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C007: Pokemon Extended Rest API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/extended-rest.post.ts:default`
- **Game Concept:** Extended rest (4+ hours) for Pokemon -- HP recovery, status clearing, daily move restoration
- **Description:** Applies 8 rest periods of HP healing, clears persistent status conditions, resets daily move usage using rolling window rule (PTU Core p.252: only moves NOT used today are refreshed). Tracks restoredMoves vs skippedMoves. Also resets non-daily move usedToday counters and scene usage for refreshed moves.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, clearedStatuses, restoredMoves, skippedMoves, restMinutesToday, restMinutesRemaining } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C008: Pokemon Pokemon Center API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/pokemon-center.post.ts:default`
- **Game Concept:** Pokemon Center full healing for Pokemon
- **Description:** Full HP restoration to injury-reduced effective max, clears ALL status conditions, restores ALL move usage (usedToday and usedThisScene to 0 for all moves, no rolling window restriction), heals injuries (max 3/day). Calculates healing time. Clears lastInjuryTime when all injuries healed.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, effectiveMaxHp, injuriesHealed, injuriesRemaining, clearedStatuses, restoredMoves, healingTime, healingTimeDescription, atDailyInjuryLimit, injuriesHealedToday } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C009: Pokemon Heal Injury API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/heal-injury.post.ts:default`
- **Game Concept:** Natural injury healing for Pokemon (24h timer)
- **Description:** Heals one injury naturally after 24 hours since last injury. Enforces daily 3-injury limit. Pokemon do NOT have AP drain method (trainers only). Clears lastInjuryTime when all injuries are gone.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { injuriesHealed, injuries, injuriesHealedToday } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C010: Pokemon New Day API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/new-day.post.ts:default`
- **Game Concept:** Per-Pokemon daily counter reset
- **Description:** Resets a single Pokemon's daily healing counters: restMinutesToday and injuriesHealedToday to 0. Does NOT reset move usage (that is done by the character new-day or global new-day endpoints).
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { restMinutesToday, injuriesHealedToday, lastRestReset } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C011: Global New Day API

- **Type:** api-endpoint
- **Location:** `server/api/game/new-day.post.ts:default`
- **Game Concept:** Global daily counter reset for all entities
- **Description:** Resets daily healing counters for ALL Pokemon (restMinutesToday, injuriesHealedToday via bulk updateMany + individual move JSON reset via resetDailyUsage) and ALL Characters (restMinutesToday, injuriesHealedToday, drainedAp, boundAp to 0, currentAp to calculateMaxAp per level). Uses level-grouped batch transaction for characters.
- **Inputs:** None
- **Outputs:** `{ success, message, data: { pokemonReset, pokemonMovesReset, charactersReset, timestamp } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C012: Calculate Rest Healing

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculateRestHealing`
- **Game Concept:** 30-minute rest HP calculation formula
- **Description:** Pure function that calculates HP healed from a 30-minute rest. Healing amount is 1/16th of REAL maxHp (min 1), capped at injury-reduced effective max HP. Returns canHeal=false if injuries >= 5, restMinutesToday >= 480, or already at effective max HP.
- **Inputs:** `{ currentHp, maxHp, injuries, restMinutesToday }`
- **Outputs:** `{ hpHealed, canHeal, reason? }`
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false

## healing-C013: Should Reset Daily Counters

- **Type:** utility
- **Location:** `utils/restHealing.ts:shouldResetDailyCounters`
- **Game Concept:** Daily rest counter reset detection
- **Description:** Checks if a new calendar day has started since lastReset. Returns true if lastReset is null or a different calendar day from now.
- **Inputs:** `lastReset: Date | null`
- **Outputs:** `boolean`
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false

## healing-C014: Can Heal Injury Naturally

- **Type:** utility
- **Location:** `utils/restHealing.ts:canHealInjuryNaturally`
- **Game Concept:** Natural injury healing timer check (24h rule)
- **Description:** Returns true if 24+ hours have elapsed since lastInjuryTime. Returns false if lastInjuryTime is null (no injury to heal, or no timestamp recorded).
- **Inputs:** `lastInjuryTime: Date | null`
- **Outputs:** `boolean`
- **Accessible From:** `api-only` (used by server endpoints and client getRestHealingInfo)
- **Orphan:** false

## healing-C015: Calculate Pokemon Center Time

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculatePokemonCenterTime`
- **Game Concept:** Pokemon Center healing duration calculation
- **Description:** Calculates healing time: 1hr base + 30min per injury (or 1hr per injury if 5+). Returns breakdown and formatted human-readable description.
- **Inputs:** `injuries: number`
- **Outputs:** `{ baseTime, injuryTime, totalTime, timeDescription }`
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false

## healing-C016: Calculate Pokemon Center Injury Healing

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculatePokemonCenterInjuryHealing`
- **Game Concept:** Pokemon Center injury healing with daily cap
- **Description:** Calculates how many injuries can be healed at Pokemon Center given the daily 3-injury limit from all sources. Returns injuries actually healed, remaining injuries, and whether at daily limit.
- **Inputs:** `{ injuries, injuriesHealedToday }`
- **Outputs:** `{ injuriesHealed, remaining, atDailyLimit }`
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false

## healing-C017: Get Statuses to Clear

- **Type:** utility
- **Location:** `utils/restHealing.ts:getStatusesToClear`
- **Game Concept:** Extended rest persistent status condition identification
- **Description:** Filters status conditions to find which ones would be cleared by extended rest (persistent conditions: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned).
- **Inputs:** `statusConditions: string[]`
- **Outputs:** `string[]` (persistent conditions present)
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false

## healing-C018: Clear Persistent Status Conditions

- **Type:** utility
- **Location:** `utils/restHealing.ts:clearPersistentStatusConditions`
- **Game Concept:** Extended rest persistent status removal
- **Description:** Returns a new array with all persistent conditions removed (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned). Immutable -- does not mutate input.
- **Inputs:** `statusConditions: string[]`
- **Outputs:** `string[]` (remaining non-persistent conditions)
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false

## healing-C019: Get Rest Healing Info

- **Type:** utility
- **Location:** `utils/restHealing.ts:getRestHealingInfo`
- **Game Concept:** Healing status display data aggregation
- **Description:** Computes a full RestHealingInfo object for UI display: canRestHeal, restMinutesRemaining, hpPerRest, injury natural heal timing, daily injury remaining count.
- **Inputs:** `{ maxHp, injuries, restMinutesToday, lastInjuryTime, injuriesHealedToday }`
- **Outputs:** `RestHealingInfo` interface (canRestHeal, restMinutesRemaining, hpPerRest, injuries, canHealInjuryNaturally, hoursSinceLastInjury, hoursUntilNaturalHeal, injuriesHealedToday, injuriesRemainingToday)
- **Accessible From:** `gm` (via composable wrapper)
- **Orphan:** false

## healing-C020: Composable -- rest()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:rest`
- **Game Concept:** Client-side 30-minute rest action
- **Description:** Calls `POST /api/pokemon/:id/rest` or `POST /api/characters/:id/rest` depending on entity type. Manages loading/error state.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null` (success, message, data)
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C021: Composable -- extendedRest()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:extendedRest`
- **Game Concept:** Client-side extended rest action
- **Description:** Calls `POST /api/.../extended-rest` for the given entity type.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C022: Composable -- pokemonCenter()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:pokemonCenter`
- **Game Concept:** Client-side Pokemon Center healing action
- **Description:** Calls `POST /api/.../pokemon-center` for the given entity type.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C023: Composable -- healInjury()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:healInjury`
- **Game Concept:** Client-side injury healing action
- **Description:** Calls `POST /api/.../heal-injury` with method parameter ('natural' or 'drain_ap').
- **Inputs:** `type: 'pokemon' | 'character', id: string, method: 'natural' | 'drain_ap'`
- **Outputs:** `RestResult | null`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C024: Composable -- newDay()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:newDay`
- **Game Concept:** Client-side per-entity daily reset action
- **Description:** Calls `POST /api/.../new-day` for a single Pokemon or Character.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C025: Composable -- newDayGlobal()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:newDayGlobal`
- **Game Concept:** Client-side global daily reset action
- **Description:** Calls `POST /api/game/new-day` to reset all entities' daily counters at once.
- **Inputs:** None
- **Outputs:** `RestResult | null`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C026: Composable -- getHealingInfo()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:getHealingInfo`
- **Game Concept:** Client-side healing status computation
- **Description:** Wrapper around `getRestHealingInfo()` utility that converts string dates to Date objects for the underlying pure function.
- **Inputs:** `{ maxHp, injuries, restMinutesToday, lastInjuryTime: Date|string|null, injuriesHealedToday }`
- **Outputs:** `RestHealingInfo`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C027: Composable -- formatRestTime()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:formatRestTime`
- **Game Concept:** Rest time display formatting
- **Description:** Formats rest minutes as human-readable "Xh Ym" string.
- **Inputs:** `minutes: number`
- **Outputs:** `string` (e.g., "4h 30m", "30m", "8h")
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C028: Encounter Heal Combatant API

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/heal.post.ts:default`
- **Game Concept:** In-combat healing (HP, temp HP, injuries)
- **Description:** Applies healing to a combatant during an encounter. Supports HP healing (capped at injury-reduced effective maxHp via getEffectiveMaxHp), temp HP granting (keeps whichever is higher, does NOT stack per PTU), and injury healing. Removes Fainted status if healed from 0 HP. Syncs changes to entity database record.
- **Inputs:** Encounter ID (URL param), `{ combatantId, amount?, tempHp?, healInjuries? }` (body)
- **Outputs:** `{ success, data: Encounter, healResult: { combatantId, hpHealed?, tempHpGained?, injuriesHealed?, newHp, newTempHp, newInjuries, faintedRemoved } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C029: Encounter Take a Breather API

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/breather.post.ts:default`
- **Game Concept:** Take a Breather -- PTU Full Action (p.245)
- **Description:** Resets all combat stages to 0 (respects Heavy Armor speed CS default), removes temp HP, cures all volatile status conditions (except Cursed which requires GM adjudication) plus Slowed and Stuck. Applies Tripped and Vulnerable as temporary conditions until next turn. Marks standard+shift actions as used. Logs to move log with reminder about required shift movement.
- **Inputs:** Encounter ID (URL param), `{ combatantId }` (body)
- **Outputs:** `{ success, data: Encounter, breatherResult: { combatantId, stagesReset, tempHpRemoved, conditionsCured, trippedApplied, vulnerableApplied } }`
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C030: Apply Healing to Entity (Service)

- **Type:** service-function
- **Location:** `server/services/combatant.service.ts:applyHealingToEntity`
- **Game Concept:** Core in-combat healing logic
- **Description:** Heals injuries first (so effective max HP reflects post-heal count), then applies HP healing (capped at getEffectiveMaxHp using post-heal injury count), grants temp HP (keeps whichever is higher per PTU, does NOT stack), and removes Fainted status if healing from 0 HP. Mutates combatant entity in-place.
- **Inputs:** `combatant: Combatant, options: { amount?, tempHp?, healInjuries? }`
- **Outputs:** `HealResult { hpHealed?, tempHpGained?, injuriesHealed?, newHp, newTempHp, newInjuries, faintedRemoved }`
- **Accessible From:** `api-only`
- **Orphan:** false

## healing-C031: Sync Healing to Database (Service)

- **Type:** service-function
- **Location:** `server/services/entity-update.service.ts:syncHealingToDatabase`
- **Game Concept:** Persist healing changes from encounter to entity DB record
- **Description:** Syncs currentHp, temporaryHp, injuries, and statusConditions from encounter combatant back to the underlying Pokemon or HumanCharacter database record via syncEntityToDatabase.
- **Inputs:** `combatant: Combatant, currentHp, temporaryHp, injuries, statusConditions`
- **Outputs:** `Promise<void>`
- **Accessible From:** `api-only`
- **Orphan:** false

## healing-C032: Sync Damage to Database (Service)

- **Type:** service-function
- **Location:** `server/services/entity-update.service.ts:syncDamageToDatabase`
- **Game Concept:** Persist damage and injury changes from encounter to entity DB record
- **Description:** Syncs currentHp, temporaryHp, injuries, statusConditions, and lastInjuryTime (if injury gained) to underlying DB record. Relevant to healing because injuries tracked here affect rest/healing logic and the 24h natural healing timer.
- **Inputs:** `combatant, newHp, newTempHp, newInjuries, statusConditions, injuryGained`
- **Outputs:** `Promise<void>`
- **Accessible From:** `api-only`
- **Orphan:** false

## healing-C033: Calculate Damage (Injury Mechanics)

- **Type:** service-function
- **Location:** `server/services/combatant.service.ts:calculateDamage`
- **Game Concept:** Damage to injury tracking (massive damage + HP marker crossings)
- **Description:** Calculates damage with PTU injury mechanics: temp HP absorbs first, massive damage (50%+ maxHp) = 1 injury, HP marker crossings (50%, 0%, -50%, -100%) = 1 injury each. Sets lastInjuryTime when injuries gained. Foundational for the healing system -- determines injury state.
- **Inputs:** `damage, currentHp, maxHp, temporaryHp, currentInjuries`
- **Outputs:** `DamageResult { finalDamage, tempHpAbsorbed, hpDamage, newHp, newTempHp, injuryGained, massiveDamageInjury, markerInjuries, markersCrossed, totalNewInjuries, newInjuries, fainted }`
- **Accessible From:** `api-only`
- **Orphan:** false

## healing-C034: Create Default Stage Modifiers (Service)

- **Type:** service-function
- **Location:** `server/services/combatant.service.ts:createDefaultStageModifiers`
- **Game Concept:** Stage modifier reset (used by Take a Breather)
- **Description:** Creates a default stage modifiers object with all stages at 0. Used by Take a Breather to reset combat stages. Heavy Armor speed CS override is applied in the breather endpoint, not here.
- **Inputs:** None
- **Outputs:** `StageModifiers` (all zeroes)
- **Accessible From:** `api-only`
- **Orphan:** false

## healing-C035: Store -- healCombatant()

- **Type:** store-action
- **Location:** `stores/encounter.ts:healCombatant`
- **Game Concept:** Store action for in-combat healing
- **Description:** Calls `POST /api/encounters/:id/heal` with combatantId, amount, tempHp, healInjuries. Updates encounter state with response.
- **Inputs:** `combatantId, amount, tempHp, healInjuries`
- **Outputs:** Updates `this.encounter` with healed encounter state
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C036: Store -- takeABreather()

- **Type:** store-action
- **Location:** `stores/encounterCombat.ts:takeABreather`
- **Game Concept:** Store action for Take a Breather maneuver
- **Description:** Calls `POST /api/encounters/:id/breather` with combatantId. Returns updated encounter data.
- **Inputs:** `encounterId, combatantId`
- **Outputs:** `Encounter` (updated)
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C037: Store -- addInjury()

- **Type:** store-action
- **Location:** `stores/encounterCombat.ts:addInjury`
- **Game Concept:** Manual injury addition during encounter
- **Description:** Calls `POST /api/encounters/:id/injury` with combatantId and source description. Returns updated encounter.
- **Inputs:** `encounterId, combatantId, source`
- **Outputs:** `Encounter` (updated)
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C038: Store -- removeInjury()

- **Type:** store-action
- **Location:** `stores/encounterCombat.ts:removeInjury`
- **Game Concept:** Manual injury removal during encounter
- **Description:** Calls `DELETE /api/encounters/:id/injury` with combatantId. Returns updated encounter.
- **Inputs:** `encounterId, combatantId`
- **Outputs:** `Encounter` (updated)
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C039: Composable -- handleHeal()

- **Type:** composable-function
- **Location:** `composables/useEncounterActions.ts:handleHeal`
- **Game Concept:** Orchestrates in-combat healing with undo/redo support
- **Description:** Captures undo snapshot with descriptive label (e.g. "Healed X (5 HP, 1 injury)"), calls `encounterStore.healCombatant()`, refreshes undo/redo state, and broadcasts the update via WebSocket.
- **Inputs:** `combatantId, amount, tempHp?, healInjuries?`
- **Outputs:** Side effects: encounter state updated, snapshot captured, broadcast sent
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C040: HealingTab Component

- **Type:** component
- **Location:** `components/common/HealingTab.vue`
- **Game Concept:** Healing UI for character/Pokemon sheets
- **Description:** Displays healing status (current HP, injuries, rest today, HP per rest, injuries healed today, drained AP for characters, natural injury timer) and action buttons: Rest 30min, Extended Rest, Pokemon Center, Natural Injury Heal, Drain AP (character only), New Day. Shows result messages (success/error). Calls `useRestHealing` composable for all actions. Emits `healed` event for parent page data refresh.
- **Inputs:** Props: `entityType ('pokemon'|'character'), entityId, entity`
- **Outputs:** Emits `healed` event when any healing action completes
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C041: Character Sheet Healing Tab Page

- **Type:** component
- **Location:** `pages/gm/characters/[id].vue` (healing tab section)
- **Game Concept:** Character sheet healing integration
- **Description:** Renders `<HealingTab>` with `entity-type="character"` in the character sheet's "Healing" tab. Reloads character data on `@healed` event via `loadCharacter()`.
- **Inputs:** Character data from page load
- **Outputs:** Displays HealingTab, triggers `loadCharacter()` on heal
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C042: Pokemon Sheet Healing Tab Page

- **Type:** component
- **Location:** `pages/gm/pokemon/[id].vue` (healing tab section)
- **Game Concept:** Pokemon sheet healing integration
- **Description:** Renders `<HealingTab>` with `entity-type="pokemon"` in the Pokemon sheet's "Healing" tab. Reloads Pokemon data on `@healed` event via `loadPokemon()`.
- **Inputs:** Pokemon data from page load
- **Outputs:** Displays HealingTab, triggers `loadPokemon()` on heal
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C043: GM Layout Advance Day Button

- **Type:** component
- **Location:** `layouts/gm.vue:handleAdvanceDay`
- **Game Concept:** Global new day UI trigger
- **Description:** "Advance Day" button in the GM header bar with sun icon. Shows confirmation dialog asking if user wants to reset daily healing limits for all entities, then calls `newDayGlobal()` from `useRestHealing`. Displays loading state ("Advancing...") and success alert with server message.
- **Inputs:** User click + confirmation
- **Outputs:** Calls global new day API, shows alert on success
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C044: Persistent Status Conditions Constant

- **Type:** constant
- **Location:** `constants/statusConditions.ts:PERSISTENT_CONDITIONS`
- **Game Concept:** Status conditions cleared by extended rest
- **Description:** Array of persistent conditions: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned. Used by `clearPersistentStatusConditions()` and `getStatusesToClear()`.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Accessible From:** `api-only` (imported by server endpoints and utilities)
- **Orphan:** false

## healing-C045: Volatile Status Conditions Constant

- **Type:** constant
- **Location:** `constants/statusConditions.ts:VOLATILE_CONDITIONS`
- **Game Concept:** Status conditions cleared by Take a Breather
- **Description:** Array of volatile conditions: Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed. Used by breather endpoint to determine cured conditions (all except Cursed).
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Accessible From:** `api-only` (imported by server endpoints)
- **Orphan:** false

## healing-C046: Breather Cured Conditions Constant

- **Type:** constant
- **Location:** `server/api/encounters/[id]/breather.post.ts:BREATHER_CURED_CONDITIONS`
- **Game Concept:** Full set of conditions cleared by Take a Breather
- **Description:** Combines VOLATILE_CONDITIONS (minus Cursed) + Slowed + Stuck. Per PTU 1.05 p.245, Take a Breather cures all volatile conditions plus Slowed and Stuck. Cursed excluded because the app does not track curse sources.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Accessible From:** `api-only`
- **Orphan:** false

## healing-C047: WebSocket heal_applied Event

- **Type:** websocket-event
- **Location:** `server/routes/ws.ts` (case 'heal_applied') and `types/api.ts:WebSocketEvent`
- **Game Concept:** Real-time healing broadcast to Group View
- **Description:** When healing is applied to a combatant, the `heal_applied` event is broadcast to all clients in the same encounter room. Relayed by the WS server to all peers except sender.
- **Inputs:** Event from GM client after healing action
- **Outputs:** Broadcast to all encounter-room clients (Group View, other GMs)
- **Accessible From:** `gm`, `group`
- **Orphan:** false

---

## Prisma Fields (Healing Tracking)

## healing-C048: HumanCharacter Healing Fields

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:HumanCharacter`
- **Game Concept:** Character rest and healing state persistence
- **Description:** Fields: `lastInjuryTime` (DateTime?, 24h timer), `restMinutesToday` (Int, max 480), `injuriesHealedToday` (Int, max 3), `lastRestReset` (DateTime?, daily counter reset), `drainedAp` (Int, restored by extended rest), `boundAp` (Int, off-limits until binding effect ends), `currentAp` (Int, restored at scene end minus drained and bound), `injuries` (Int), `temporaryHp` (Int), `currentHp` (Int), `maxHp` (Int), `statusConditions` (JSON string).
- **Inputs:** Updated by healing API endpoints
- **Outputs:** Read by healing API endpoints and composables
- **Accessible From:** `gm`, `api-only`
- **Orphan:** false

## healing-C049: Pokemon Healing Fields

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Pokemon`
- **Game Concept:** Pokemon rest and healing state persistence
- **Description:** Fields: `lastInjuryTime` (DateTime?, 24h timer), `restMinutesToday` (Int, max 480), `injuriesHealedToday` (Int, max 3), `lastRestReset` (DateTime?, daily counter reset), `injuries` (Int), `temporaryHp` (Int), `currentHp` (Int), `maxHp` (Int), `statusConditions` (JSON string), `moves` (JSON string with usedToday/usedThisScene/lastUsedAt tracking). Note: Pokemon do NOT have `drainedAp`, `boundAp`, or `currentAp`.
- **Inputs:** Updated by healing API endpoints
- **Outputs:** Read by healing API endpoints and composables
- **Accessible From:** `gm`, `api-only`
- **Orphan:** false

## healing-C050: Pokemon Type Healing Fields

- **Type:** prisma-field
- **Location:** `types/character.ts:Pokemon`
- **Game Concept:** Client-side Pokemon healing type definition
- **Description:** TypeScript interface fields: `restMinutesToday`, `lastInjuryTime: string | null`, `injuriesHealedToday`. Used by HealingTab and composables for type safety.
- **Inputs:** Populated from API responses
- **Outputs:** Used by components and composables
- **Accessible From:** `gm`
- **Orphan:** false

## healing-C051: HumanCharacter Type Healing Fields

- **Type:** prisma-field
- **Location:** `types/character.ts:HumanCharacter`
- **Game Concept:** Client-side character healing type definition
- **Description:** TypeScript interface fields: `restMinutesToday`, `lastInjuryTime: string | null`, `injuriesHealedToday`, `drainedAp`, `boundAp`, `currentAp`. Used by HealingTab and composables.
- **Inputs:** Populated from API responses
- **Outputs:** Used by components and composables
- **Accessible From:** `gm`
- **Orphan:** false

---

## New Utility Functions (Added Post-Initial Mapping)

## healing-C052: Get Effective Max HP

- **Type:** utility
- **Location:** `utils/restHealing.ts:getEffectiveMaxHp`
- **Game Concept:** Injury-reduced effective max HP calculation (PTU Core Chapter 9)
- **Description:** Computes injury-reduced effective max HP. Each injury reduces max HP by 1/10th, capped at 10 injuries. Example: 50 maxHp with 3 injuries = floor(50 * 7/10) = 35. Used by rest healing, Pokemon Center, and in-combat healing to cap HP recovery.
- **Inputs:** `maxHp: number, injuries: number`
- **Outputs:** `number` (effective max HP)
- **Accessible From:** `api-only` (imported by server endpoints and combatant service)
- **Orphan:** false

## healing-C053: Is Daily Move Refreshable

- **Type:** utility
- **Location:** `utils/restHealing.ts:isDailyMoveRefreshable`
- **Game Concept:** Daily move refresh eligibility for Extended Rest (PTU Core p.252)
- **Description:** Checks if a daily-frequency move is eligible for Extended Rest refresh. Per PTU: "Daily-Frequency Moves are regained during an Extended Rest if the Move hasn't been used since the previous day." A move used today cannot be refreshed by tonight's Extended Rest.
- **Inputs:** `lastUsedAt: string | null | undefined`
- **Outputs:** `boolean` (true if eligible for refresh)
- **Accessible From:** `api-only` (used by Pokemon extended-rest endpoint)
- **Orphan:** false

## healing-C054: Calculate Max AP

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculateMaxAp`
- **Game Concept:** Trainer max Action Points calculation (PTU Core p.221)
- **Description:** Calculates max AP for a trainer: 5 AP + 1 more for every 5 Trainer Levels. Level 1 = 5 AP, Level 5 = 6 AP, Level 10 = 7 AP, Level 15 = 8 AP.
- **Inputs:** `level: number`
- **Outputs:** `number` (max AP)
- **Accessible From:** `api-only` (used by extended-rest, new-day endpoints)
- **Orphan:** false

## healing-C055: Calculate Available AP

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculateAvailableAp`
- **Game Concept:** Available AP accounting for bound and drained AP (PTU Core p.221)
- **Description:** Calculates available AP: max AP minus bound AP minus drained AP, with floor of 0. Bound AP remains off-limits until binding effect ends; drained AP remains unavailable until Extended Rest.
- **Inputs:** `maxAp: number, boundAp: number, drainedAp: number`
- **Outputs:** `number` (available AP, minimum 0)
- **Accessible From:** `api-only`
- **Orphan:** false

## healing-C056: Calculate Scene End AP

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculateSceneEndAp`
- **Game Concept:** AP restoration at scene end (PTU Core p.221)
- **Description:** Calculates available AP after scene-end restoration. Per PTU: AP is completely regained at the end of each Scene, but drained AP remains unavailable until Extended Rest and bound AP remains until binding effect ends.
- **Inputs:** `level: number, drainedAp: number, boundAp?: number`
- **Outputs:** `number` (AP at scene end)
- **Accessible From:** `api-only`
- **Orphan:** false

## healing-C057: Reset Daily Move Usage

- **Type:** utility
- **Location:** `utils/moveFrequency.ts:resetDailyUsage`
- **Game Concept:** New day move usage counter reset
- **Description:** Resets daily move usage counters on all moves in a list. Clears `usedToday` to 0 and removes `lastUsedAt`. Used by character new-day and global new-day endpoints. Returns a new array (no mutation).
- **Inputs:** `moves: Move[]`
- **Outputs:** `Move[]` (with daily counters reset)
- **Accessible From:** `api-only` (used by new-day endpoints)
- **Orphan:** false

## healing-C058: Reset Scene Move Usage

- **Type:** utility
- **Location:** `utils/moveFrequency.ts:resetSceneUsage`
- **Game Concept:** Scene end move usage counter reset
- **Description:** Resets scene-frequency usage on all moves: `usedThisScene` to 0 and `lastTurnUsed` to 0. Used when a scene/encounter ends. Returns a new array (no mutation).
- **Inputs:** `moves: Move[]`
- **Outputs:** `Move[]` (with scene counters reset)
- **Accessible From:** `api-only`
- **Orphan:** false

---

## RestHealingInfo Type

## healing-C059: RestHealingInfo Interface

- **Type:** prisma-field
- **Location:** `utils/restHealing.ts:RestHealingInfo`
- **Game Concept:** Healing status display data structure
- **Description:** TypeScript interface defining the shape of healing status data for UI display: canRestHeal, restMinutesRemaining, hpPerRest, injuries, canHealInjuryNaturally, hoursSinceLastInjury, hoursUntilNaturalHeal, injuriesHealedToday, injuriesRemainingToday.
- **Inputs:** N/A (type definition)
- **Outputs:** Used by getRestHealingInfo and getHealingInfo composable
- **Accessible From:** `gm` (via composable)
- **Orphan:** false

## healing-C060: HealResult Interface

- **Type:** prisma-field
- **Location:** `server/services/combatant.service.ts:HealResult`
- **Game Concept:** In-combat healing result data structure
- **Description:** TypeScript interface for the result of applyHealingToEntity: newHp, newTempHp, newInjuries, faintedRemoved, plus optional hpHealed, tempHpGained, injuriesHealed.
- **Inputs:** N/A (type definition)
- **Outputs:** Returned by applyHealingToEntity, propagated to API response
- **Accessible From:** `api-only`
- **Orphan:** false

## healing-C061: HealOptions Interface

- **Type:** prisma-field
- **Location:** `server/services/combatant.service.ts:HealOptions`
- **Game Concept:** In-combat healing request parameters
- **Description:** TypeScript interface for healing options passed to applyHealingToEntity: amount (HP), tempHp, healInjuries. All optional.
- **Inputs:** N/A (type definition)
- **Outputs:** Used as parameter type for applyHealingToEntity
- **Accessible From:** `api-only`
- **Orphan:** false

## healing-C062: Equipment Speed CS Override in Breather

- **Type:** utility
- **Location:** `server/api/encounters/[id]/breather.post.ts` (Heavy Armor check) + `utils/equipmentBonuses.ts:computeEquipmentBonuses`
- **Game Concept:** Heavy Armor speed CS default for Take a Breather reset (PTU p.293)
- **Description:** When Take a Breather resets combat stages, Heavy Armor causes speed CS to reset to -1 instead of 0. The breather endpoint checks if the combatant is human, computes equipment bonuses via `computeEquipmentBonuses`, and applies `speedDefaultCS` to the default stage modifiers.
- **Inputs:** `combatant.entity.equipment`
- **Outputs:** Modified default stage modifiers with speed CS override
- **Accessible From:** `api-only`
- **Orphan:** false

---

## Capability Chains

### Chain 1: Character 30-Minute Rest
1. `healing-C040` (component: HealingTab -- handleRest) -> 2. `healing-C020` (composable: rest()) -> 3. `healing-C001` (api: characters/:id/rest) -> 4. `healing-C013` (utility: shouldResetDailyCounters) -> 5. `healing-C012` (utility: calculateRestHealing) -> 6. `healing-C052` (utility: getEffectiveMaxHp) -> 7. `healing-C048` (prisma: HumanCharacter update)
**Breaks at:** complete

### Chain 2: Pokemon 30-Minute Rest
1. `healing-C042` (component: Pokemon sheet healing tab) -> 2. `healing-C040` (component: HealingTab -- handleRest) -> 3. `healing-C020` (composable: rest()) -> 4. `healing-C006` (api: pokemon/:id/rest) -> 5. `healing-C013` (utility: shouldResetDailyCounters) -> 6. `healing-C012` (utility: calculateRestHealing) -> 7. `healing-C052` (utility: getEffectiveMaxHp) -> 8. `healing-C049` (prisma: Pokemon update)
**Breaks at:** complete

### Chain 3: Character Extended Rest
1. `healing-C040` (component: HealingTab -- handleExtendedRest) -> 2. `healing-C021` (composable: extendedRest()) -> 3. `healing-C002` (api: characters/:id/extended-rest) -> 4. `healing-C012` (utility: calculateRestHealing, 8x loop) -> 5. `healing-C017` (utility: getStatusesToClear) -> 6. `healing-C018` (utility: clearPersistentStatusConditions) -> 7. `healing-C054` (utility: calculateMaxAp) -> 8. `healing-C048` (prisma: update HP, status, drainedAp=0, boundAp=0, currentAp=maxAp)
**Breaks at:** complete

### Chain 4: Pokemon Extended Rest
1. `healing-C040` (component: HealingTab -- handleExtendedRest) -> 2. `healing-C021` (composable: extendedRest()) -> 3. `healing-C007` (api: pokemon/:id/extended-rest) -> 4. `healing-C012` (utility: calculateRestHealing, 8x loop) -> 5. `healing-C017` (utility: getStatusesToClear) -> 6. `healing-C018` (utility: clearPersistentStatusConditions) -> 7. `healing-C053` (utility: isDailyMoveRefreshable -- rolling window check) -> 8. `healing-C049` (prisma: update HP, status, moves)
**Breaks at:** complete

### Chain 5: Character Pokemon Center
1. `healing-C040` (component: HealingTab -- handlePokemonCenter) -> 2. `healing-C022` (composable: pokemonCenter()) -> 3. `healing-C003` (api: characters/:id/pokemon-center) -> 4. `healing-C015` (utility: calculatePokemonCenterTime) -> 5. `healing-C016` (utility: calculatePokemonCenterInjuryHealing) -> 6. `healing-C052` (utility: getEffectiveMaxHp) -> 7. `healing-C048` (prisma: full HP, clear status, heal injuries)
**Breaks at:** complete

### Chain 6: Pokemon Pokemon Center
1. `healing-C040` (component: HealingTab -- handlePokemonCenter) -> 2. `healing-C022` (composable: pokemonCenter()) -> 3. `healing-C008` (api: pokemon/:id/pokemon-center) -> 4. `healing-C015` (utility: calculatePokemonCenterTime) -> 5. `healing-C016` (utility: calculatePokemonCenterInjuryHealing) -> 6. `healing-C052` (utility: getEffectiveMaxHp) -> 7. `healing-C049` (prisma: full HP, clear status, heal injuries, restore all moves)
**Breaks at:** complete

### Chain 7: Character Natural Injury Healing
1. `healing-C040` (component: HealingTab -- handleHealInjury('natural')) -> 2. `healing-C023` (composable: healInjury()) -> 3. `healing-C004` (api: characters/:id/heal-injury) -> 4. `healing-C014` (utility: canHealInjuryNaturally) -> 5. `healing-C013` (utility: shouldResetDailyCounters) -> 6. `healing-C048` (prisma: update injuries, injuriesHealedToday)
**Breaks at:** complete

### Chain 8: Character AP Drain Injury Healing
1. `healing-C040` (component: HealingTab -- handleHealInjury('drain_ap')) -> 2. `healing-C023` (composable: healInjury()) -> 3. `healing-C004` (api: characters/:id/heal-injury with method='drain_ap') -> 4. `healing-C013` (utility: shouldResetDailyCounters) -> 5. `healing-C048` (prisma: update injuries, drainedAp, currentAp, injuriesHealedToday)
**Breaks at:** complete

### Chain 9: Pokemon Natural Injury Healing
1. `healing-C040` (component: HealingTab -- handleHealInjury('natural')) -> 2. `healing-C023` (composable: healInjury()) -> 3. `healing-C009` (api: pokemon/:id/heal-injury) -> 4. `healing-C014` (utility: canHealInjuryNaturally) -> 5. `healing-C013` (utility: shouldResetDailyCounters) -> 6. `healing-C049` (prisma: update injuries, injuriesHealedToday)
**Breaks at:** complete

### Chain 10: Per-Entity New Day Reset
1. `healing-C040` (component: HealingTab -- handleNewDay) -> 2. `healing-C024` (composable: newDay()) -> 3. `healing-C005` or `healing-C010` (api: characters/:id/new-day or pokemon/:id/new-day) -> 4. `healing-C054` (utility: calculateMaxAp, for character) -> 5. `healing-C057` (utility: resetDailyUsage, for character's Pokemon) -> 6. `healing-C048`/`healing-C049` (prisma: reset counters)
**Breaks at:** complete

### Chain 11: Global New Day Reset
1. `healing-C043` (component: GM Layout Advance Day button) -> 2. `healing-C025` (composable: newDayGlobal()) -> 3. `healing-C011` (api: game/new-day) -> 4. `healing-C057` (utility: resetDailyUsage for all Pokemon) -> 5. `healing-C054` (utility: calculateMaxAp per character level) -> 6. `healing-C048` + `healing-C049` (prisma: updateMany on both models)
**Breaks at:** complete

### Chain 12: In-Combat Healing
1. `healing-C039` (composable: useEncounterActions.handleHeal) -> 2. `healing-C035` (store: encounter.healCombatant) -> 3. `healing-C028` (api: encounters/:id/heal) -> 4. `healing-C030` (service: applyHealingToEntity) -> 5. `healing-C052` (utility: getEffectiveMaxHp) -> 6. `healing-C031` (service: syncHealingToDatabase) -> 7. `healing-C047` (websocket: heal_applied broadcast)
**Breaks at:** complete

### Chain 13: Take a Breather
1. (composable: useEncounterActions maneuver routing) -> 2. `healing-C036` (store: encounterCombat.takeABreather) -> 3. `healing-C029` (api: encounters/:id/breather) -> 4. `healing-C034` (service: createDefaultStageModifiers) -> 5. `healing-C062` (utility: Heavy Armor speed CS override) -> 6. `healing-C046` (constant: BREATHER_CURED_CONDITIONS) -> 7. DB sync via encounter update
**Breaks at:** complete

### Chain 14: Injury from Damage (Foundation for Healing)
1. Damage action -> 2. `healing-C033` (service: calculateDamage -- injury detection) -> 3. `healing-C032` (service: syncDamageToDatabase -- sets lastInjuryTime) -> 4. `healing-C048`/`healing-C049` (prisma: injuries, lastInjuryTime)
**Breaks at:** complete

### Chain 15: Healing Status Display
1. `healing-C041`/`healing-C042` (pages: character/Pokemon sheet) -> 2. `healing-C040` (component: HealingTab) -> 3. `healing-C026` (composable: getHealingInfo) -> 4. `healing-C019` (utility: getRestHealingInfo) -> 5. `healing-C014` (utility: canHealInjuryNaturally) -> 6. `healing-C052` (utility: getEffectiveMaxHp, via hpPerRest calculation)
**Breaks at:** complete

---

## Accessibility Summary

| View | Capabilities | Notes |
|------|-------------|-------|
| `gm` | C001-C011 (all APIs), C019-C027 (all composables), C035-C043 (all stores + components), C047-C051 (WS + types) | Full healing control on character/Pokemon sheets and encounter healing |
| `group` | C047 (heal_applied WS event) | Receives healing broadcasts to update encounter display |
| `player` | None | No healing actions available from player view |
| `api-only` | C012-C018, C030-C034, C044-C046, C052-C062 | Pure utilities, service functions, constants, and type definitions |

---

## Missing Subsystems

1. **Player-initiated healing** -- Players cannot trigger rest, extended rest, Pokemon Center, or injury healing from the player view. All healing is GM-only. A player requesting healing must verbally ask the GM.

2. **Batch healing** -- No batch rest/heal endpoint exists. To rest an entire party, the GM must click rest on each character and each Pokemon individually. A "rest all party" bulk action would streamline this.

3. **Pokemon Center for party** -- No single-action "Pokemon Center the whole party" endpoint. Each character and Pokemon must be individually Pokemon-Center healed.

4. **Scene-end AP restoration** -- The utility `calculateSceneEndAp` exists (healing-C056) but no endpoint or UI triggers it. When a scene ends or encounter ends, AP is not automatically restored per PTU rules.

5. **Extended Rest daily move rolling window feedback** -- The Pokemon extended-rest API returns `skippedMoves` (moves that were not refreshed because they were used today), but the HealingTab UI does not display this information to the user.

6. **Healing from player view** -- The HealingTab component only appears on GM character/Pokemon sheets. No equivalent exists in the player view for self-service healing.

7. **Automatic daily counter reset** -- Daily counters are only reset when an endpoint explicitly checks via `shouldResetDailyCounters` or when the GM clicks "Advance Day". There is no automatic time-based reset at midnight.
