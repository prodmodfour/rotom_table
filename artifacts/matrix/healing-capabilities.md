# Healing Domain -- Capability Catalog

> **Generated:** 2026-03-05
> **Domain:** healing
> **Source files read:** 32 files across server/api, server/services, server/utils, composables, stores, components, constants, utils
> **Capability count:** 78 (healing-C001 through healing-C078)

---

## Prisma Model Fields (Healing-Related)

### healing-C001
- **cap_id:** healing-C001
- **name:** HumanCharacter.currentHp
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter model
- **game_concept:** Trainer HP tracking
- **description:** Tracks current hit points for human characters. Modified by rest healing, Pokemon Center, combat healing, and items.
- **inputs:** Integer value
- **outputs:** Persisted HP state
- **accessible_from:** gm, player (read via API), api-only (write)

### healing-C002
- **cap_id:** healing-C002
- **name:** HumanCharacter.maxHp
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter model
- **game_concept:** Maximum HP for effective max calculation
- **description:** Derived max HP used as the ceiling for all healing operations. Effective max is reduced by injuries (10% per injury).
- **inputs:** Integer value
- **outputs:** Base for getEffectiveMaxHp calculation
- **accessible_from:** gm, player (read)

### healing-C003
- **cap_id:** healing-C003
- **name:** HumanCharacter.injuries
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter model
- **game_concept:** Injury count (reduces effective max HP by 10% each)
- **description:** Number of injuries. At 5+, rest healing is blocked. Each reduces effective max HP by 10%. Healed naturally (24h), via Pokemon Center (max 3/day), or by draining AP.
- **inputs:** Integer (0-10)
- **outputs:** Injury count
- **accessible_from:** gm, player (read)

### healing-C004
- **cap_id:** healing-C004
- **name:** HumanCharacter.restMinutesToday
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter model
- **game_concept:** Daily rest healing time cap (max 480 min = 8 hours)
- **description:** Tracks cumulative rest minutes used today. Caps at 480 minutes. Reset on new day.
- **inputs:** Integer
- **outputs:** Used rest time
- **accessible_from:** gm (via HealingTab)

### healing-C005
- **cap_id:** healing-C005
- **name:** HumanCharacter.injuriesHealedToday
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter model
- **game_concept:** Daily injury healing limit (max 3/day from all sources)
- **description:** Tracks injuries healed today. Limits Pokemon Center and natural injury healing to 3 total per day.
- **inputs:** Integer
- **outputs:** Daily injury healing count
- **accessible_from:** gm (via HealingTab)

### healing-C006
- **cap_id:** healing-C006
- **name:** HumanCharacter.lastInjuryTime
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter model
- **game_concept:** Natural injury healing timer (24 hours since last injury)
- **description:** Timestamp of when the last injury was received. Must be 24+ hours ago for natural healing eligibility.
- **inputs:** DateTime or null
- **outputs:** Timer for canHealInjuryNaturally check
- **accessible_from:** gm (via HealingTab)

### healing-C007
- **cap_id:** healing-C007
- **name:** HumanCharacter.lastRestReset
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter model
- **game_concept:** Daily counter reset tracking
- **description:** Timestamp of the last daily counter reset. Used by shouldResetDailyCounters to determine if a new calendar day has started.
- **inputs:** DateTime or null
- **outputs:** Calendar day check
- **accessible_from:** api-only

### healing-C008
- **cap_id:** healing-C008
- **name:** HumanCharacter.drainedAp
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter model
- **game_concept:** Drained AP (restored by Extended Rest only)
- **description:** AP drained by trainer abilities or injury healing (2 AP per injury healed). Restored only by Extended Rest or new day. Not restored by Pokemon Center.
- **inputs:** Integer
- **outputs:** Drained AP count
- **accessible_from:** gm (via HealingTab)

### healing-C009
- **cap_id:** healing-C009
- **name:** HumanCharacter.boundAp
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter model
- **game_concept:** Bound AP (off-limits until binding effect ends, decree-016)
- **description:** AP bound by active effects (e.g., Stratagems). Persists through Extended Rest and new day. Released at scene end.
- **inputs:** Integer
- **outputs:** Bound AP count
- **accessible_from:** gm (via HealingTab)

### healing-C010
- **cap_id:** healing-C010
- **name:** HumanCharacter.currentAp
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter model
- **game_concept:** Current AP pool
- **description:** Available action points. Restored at scene end (minus drained and bound). Drained AP restored by Extended Rest. Formula: maxAp - boundAp - drainedAp.
- **inputs:** Integer
- **outputs:** Available AP
- **accessible_from:** gm (via HealingTab)

### healing-C011
- **cap_id:** healing-C011
- **name:** Pokemon.currentHp / maxHp / injuries / restMinutesToday / injuriesHealedToday / lastInjuryTime / lastRestReset
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — Pokemon model
- **game_concept:** Pokemon healing tracking fields (mirror of HumanCharacter fields)
- **description:** Same healing-related fields as HumanCharacter: currentHp, maxHp, injuries, restMinutesToday, injuriesHealedToday, lastInjuryTime, lastRestReset. All function identically for rest, Pokemon Center, and injury healing.
- **inputs:** Various integers/dates
- **outputs:** Healing state
- **accessible_from:** gm, player (read via API)

---

## Utility Functions (Pure Logic)

### healing-C012
- **cap_id:** healing-C012
- **name:** getEffectiveMaxHp
- **type:** utility
- **location:** `app/utils/restHealing.ts` — getEffectiveMaxHp()
- **game_concept:** Injury-reduced effective max HP (PTU Core Ch.9)
- **description:** Calculates effective maximum HP after injury reduction: floor(maxHp * (10 - injuries) / 10). Used as the ceiling for all HP healing operations.
- **inputs:** maxHp (number), injuries (number)
- **outputs:** Effective max HP (number)
- **accessible_from:** gm, player (used in components and server)

### healing-C013
- **cap_id:** healing-C013
- **name:** calculateRestHealing
- **type:** utility
- **location:** `app/utils/restHealing.ts` — calculateRestHealing()
- **game_concept:** 30-minute rest HP healing (1/16th max HP per period)
- **description:** Calculates HP healed from one 30-minute rest period. Heals 1/16th of real max HP (minimum 1 per decree-029), capped at effective max. Blocked if 5+ injuries or 480+ minutes rested today.
- **inputs:** { currentHp, maxHp, injuries, restMinutesToday }
- **outputs:** { hpHealed, canHeal, reason? }
- **accessible_from:** api-only (used by rest endpoints)

### healing-C014
- **cap_id:** healing-C014
- **name:** canHealInjuryNaturally
- **type:** utility
- **location:** `app/utils/restHealing.ts` — canHealInjuryNaturally()
- **game_concept:** 24-hour natural injury healing check
- **description:** Returns true if 24+ hours have passed since the last injury was received. Used as precondition for natural injury healing.
- **inputs:** lastInjuryTime (Date | null)
- **outputs:** boolean
- **accessible_from:** api-only (used by heal-injury endpoints)

### healing-C015
- **cap_id:** healing-C015
- **name:** calculatePokemonCenterTime
- **type:** utility
- **location:** `app/utils/restHealing.ts` — calculatePokemonCenterTime()
- **game_concept:** Pokemon Center healing time calculation
- **description:** Calculates healing duration: 1 hour base + 30 min/injury (or 1 hr/injury if 5+). Returns formatted time description.
- **inputs:** injuries (number)
- **outputs:** { baseTime, injuryTime, totalTime, timeDescription }
- **accessible_from:** api-only (used by pokemon-center endpoints)

### healing-C016
- **cap_id:** healing-C016
- **name:** calculatePokemonCenterInjuryHealing
- **type:** utility
- **location:** `app/utils/restHealing.ts` — calculatePokemonCenterInjuryHealing()
- **game_concept:** Pokemon Center injury healing with daily limit
- **description:** Calculates how many injuries can be healed by a Pokemon Center visit, respecting the 3/day limit from all sources.
- **inputs:** { injuries, injuriesHealedToday }
- **outputs:** { injuriesHealed, remaining, atDailyLimit }
- **accessible_from:** api-only (used by pokemon-center endpoints)

### healing-C017
- **cap_id:** healing-C017
- **name:** shouldResetDailyCounters
- **type:** utility
- **location:** `app/utils/restHealing.ts` — shouldResetDailyCounters()
- **game_concept:** Calendar day boundary detection
- **description:** Checks if a new calendar day has begun since the last reset. Returns true if the date strings differ, triggering counter resets.
- **inputs:** lastReset (Date | null)
- **outputs:** boolean
- **accessible_from:** api-only (used by all healing endpoints)

### healing-C018
- **cap_id:** healing-C018
- **name:** getStatusesToClear / clearPersistentStatusConditions
- **type:** utility
- **location:** `app/utils/restHealing.ts` — getStatusesToClear(), clearPersistentStatusConditions()
- **game_concept:** Extended Rest persistent status clearing (decree-038)
- **description:** Identifies and removes persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) using STATUS_CONDITION_DEFS category. Used during Extended Rest.
- **inputs:** statusConditions (string[])
- **outputs:** Cleared statuses list / filtered status array
- **accessible_from:** api-only (used by extended-rest endpoints)

### healing-C019
- **cap_id:** healing-C019
- **name:** isDailyMoveRefreshable
- **type:** utility
- **location:** `app/utils/restHealing.ts` — isDailyMoveRefreshable()
- **game_concept:** Daily move refresh rolling window (PTU Core p.252)
- **description:** Checks if a daily-frequency move is eligible for refresh during Extended Rest. Moves used today cannot be refreshed by tonight's rest; only moves used before today are eligible.
- **inputs:** lastUsedAt (string | null)
- **outputs:** boolean
- **accessible_from:** api-only (used by rest-healing.service)

### healing-C020
- **cap_id:** healing-C020
- **name:** calculateMaxAp
- **type:** utility
- **location:** `app/utils/restHealing.ts` — calculateMaxAp()
- **game_concept:** Max AP calculation (PTU Core p.221)
- **description:** Calculates maximum Action Points: 5 + floor(level / 5). Level 1 = 5 AP, Level 5 = 6 AP, Level 10 = 7 AP.
- **inputs:** level (number)
- **outputs:** maxAp (number)
- **accessible_from:** api-only (used by extended-rest, new-day endpoints)

### healing-C021
- **cap_id:** healing-C021
- **name:** calculateAvailableAp
- **type:** utility
- **location:** `app/utils/restHealing.ts` — calculateAvailableAp()
- **game_concept:** Available AP accounting for bound/drained
- **description:** Computes available AP: max(0, maxAp - boundAp - drainedAp).
- **inputs:** maxAp, boundAp, drainedAp
- **outputs:** availableAp (number)
- **accessible_from:** api-only

### healing-C022
- **cap_id:** healing-C022
- **name:** calculateSceneEndAp
- **type:** utility
- **location:** `app/utils/restHealing.ts` — calculateSceneEndAp()
- **game_concept:** Scene-end AP restoration (PTU Core p.221)
- **description:** Calculates AP at scene end: maxAp - drainedAp - boundAp. Drained AP persists until Extended Rest; bound AP released at scene end.
- **inputs:** level, drainedAp, boundAp
- **outputs:** restoredAp (number)
- **accessible_from:** api-only (used by scene.service)

### healing-C023
- **cap_id:** healing-C023
- **name:** getRestHealingInfo
- **type:** utility
- **location:** `app/utils/restHealing.ts` — getRestHealingInfo()
- **game_concept:** Healing status summary for UI display
- **description:** Produces a RestHealingInfo object with canRestHeal, restMinutesRemaining, hpPerRest, injury timers, and daily limits. Used by the HealingTab component for status display.
- **inputs:** { maxHp, injuries, restMinutesToday, lastInjuryTime, injuriesHealedToday }
- **outputs:** RestHealingInfo
- **accessible_from:** gm (via HealingTab component)

### healing-C024
- **cap_id:** healing-C024
- **name:** resetDailyUsage
- **type:** utility
- **location:** `app/utils/moveFrequency.ts` — resetDailyUsage()
- **game_concept:** Daily move usage counter reset (new day)
- **description:** Resets usedToday and lastUsedAt on all moves in a list. Used by new-day endpoints to clear yesterday's daily move usage. Returns a new array (no mutation).
- **inputs:** moves (Move[])
- **outputs:** Move[] with cleared daily counters
- **accessible_from:** api-only (used by new-day endpoints)

---

## Healing Item Catalog & Logic

### healing-C025
- **cap_id:** healing-C025
- **name:** HEALING_ITEM_CATALOG
- **type:** constant
- **location:** `app/constants/healingItems.ts` — HEALING_ITEM_CATALOG
- **game_concept:** PTU 1.05 healing item definitions (p.276)
- **description:** Read-only catalog of 14 healing items keyed by name. Four categories: restorative (Potion, Super Potion, Hyper Potion, Energy Powder, Energy Root), cure (Antidote, Paralyze Heal, Burn Heal, Ice Heal, Awakening, Full Heal, Heal Powder), combined (Full Restore), revive (Revive, Revival Herb). Includes cost, HP amount, conditions cured, repulsive flag.
- **inputs:** Item name (string key)
- **outputs:** HealingItemDef
- **accessible_from:** gm, player (shared constant)

### healing-C026
- **cap_id:** healing-C026
- **name:** HealingItemDef type
- **type:** constant
- **location:** `app/constants/healingItems.ts` — HealingItemDef interface
- **game_concept:** Healing item data schema
- **description:** Defines the shape of healing item data: name, category (restorative/cure/combined/revive), hpAmount, healToFull, healToPercent, curesConditions, curesAllPersistent, curesAllStatus, canRevive, repulsive, cost, description.
- **inputs:** N/A (type definition)
- **outputs:** N/A
- **accessible_from:** gm, player

### healing-C027
- **cap_id:** healing-C027
- **name:** getRestorativeItems / getCureItems
- **type:** utility
- **location:** `app/constants/healingItems.ts` — getRestorativeItems(), getCureItems()
- **game_concept:** Item filtering by category
- **description:** Filter functions returning only restorative (HP-healing) or cure (status-removal) items from the catalog.
- **inputs:** None
- **outputs:** HealingItemDef[]
- **accessible_from:** gm, player

### healing-C028
- **cap_id:** healing-C028
- **name:** resolveConditionsToCure
- **type:** utility
- **location:** `app/constants/healingItems.ts` — resolveConditionsToCure()
- **game_concept:** Cure resolution (which conditions an item removes)
- **description:** Pure function determining which conditions an item would cure on a target. Priority: curesAllStatus (all except Fainted/Dead) > curesAllPersistent (all persistent) > curesConditions (named list). Shared between client and server.
- **inputs:** item (HealingItemDef), targetConditions (StatusCondition[])
- **outputs:** StatusCondition[] to remove
- **accessible_from:** gm, player (shared)

---

## Server Services

### healing-C029
- **cap_id:** healing-C029
- **name:** applyHealingToEntity
- **type:** service-function
- **location:** `app/server/services/combatant.service.ts` — applyHealingToEntity()
- **game_concept:** Combat HP/TempHP/Injury healing
- **description:** Applies healing to a combatant's entity during encounters. Heals injuries first (to update effective max), then HP (capped at effective max), then grants Temp HP (max of old and new, no stacking). Auto-removes Fainted status when healed from 0 to >0 HP. Mutates entity.
- **inputs:** combatant (Combatant), options: { amount?, tempHp?, healInjuries? }
- **outputs:** HealResult: { newHp, newTempHp, newInjuries, hpHealed?, injuriesHealed?, tempHpGained?, faintedRemoved }
- **accessible_from:** gm (via encounter heal endpoint)

### healing-C030
- **cap_id:** healing-C030
- **name:** updateStatusConditions
- **type:** service-function
- **location:** `app/server/services/combatant.service.ts` — updateStatusConditions()
- **game_concept:** Status condition add/remove with CS auto-effects (decree-005)
- **description:** Adds and removes status conditions on a combatant. Auto-applies/reverses Combat Stage effects for Burn, Paralysis, Poison per decree-005. Used by healing items to cure conditions.
- **inputs:** combatant, addStatuses[], removeStatuses[]
- **outputs:** StatusChangeResult: { added, removed, current, stageChanges? }
- **accessible_from:** api-only (used by services)

### healing-C031
- **cap_id:** healing-C031
- **name:** validateItemApplication
- **type:** service-function
- **location:** `app/server/services/healing-item.service.ts` — validateItemApplication()
- **game_concept:** Pre-use item validation
- **description:** Validates whether a healing item can be applied to a target. Checks: item exists in catalog, revive items require Fainted target, non-revive items require non-Fainted target, HP items check effective max, cure items check for curable conditions, combined items check for any effect.
- **inputs:** itemName (string), target (Combatant)
- **outputs:** Error string or undefined (valid)
- **accessible_from:** api-only (used by applyHealingItem)

### healing-C032
- **cap_id:** healing-C032
- **name:** checkItemRange
- **type:** service-function
- **location:** `app/server/services/healing-item.service.ts` — checkItemRange()
- **game_concept:** P2 adjacency check for item use (PTU p.276)
- **description:** Checks if the item user is adjacent to the target (within 1m). Uses ptuDistanceTokensBBox for multi-cell token support (decree-002). Self-use and gridless play always return adjacent.
- **inputs:** userPosition, userTokenSize, targetPosition, targetTokenSize, isSelfUse
- **outputs:** { adjacent: boolean, distance: number }
- **accessible_from:** api-only (used by use-item endpoint)

### healing-C033
- **cap_id:** healing-C033
- **name:** findTrainerForPokemon
- **type:** service-function
- **location:** `app/server/services/healing-item.service.ts` — findTrainerForPokemon()
- **game_concept:** Inventory ownership resolution
- **description:** Finds the trainer combatant who owns a Pokemon combatant. Used for inventory resolution when a Pokemon receives or uses an item.
- **inputs:** combatants (Combatant[]), pokemonCombatant (Combatant)
- **outputs:** Trainer Combatant or undefined
- **accessible_from:** api-only

### healing-C034
- **cap_id:** healing-C034
- **name:** applyHealingItem
- **type:** service-function
- **location:** `app/server/services/healing-item.service.ts` — applyHealingItem()
- **game_concept:** Full healing item application (all categories)
- **description:** Applies a healing item's effects: validates, then dispatches to category-specific handlers (restorative: HP heal, cure: condition removal via updateStatusConditions, combined: cure then heal, revive: remove Fainted + set HP). Handles repulsive flag, healToFull, healToPercent.
- **inputs:** itemName (string), target (Combatant)
- **outputs:** ItemApplicationResult: { success, itemName, effects: { hpHealed?, conditionsCured?, revived?, repulsive? }, error? }
- **accessible_from:** gm (via use-item endpoint)

### healing-C035
- **cap_id:** healing-C035
- **name:** getEntityDisplayName
- **type:** service-function
- **location:** `app/server/services/healing-item.service.ts` — getEntityDisplayName()
- **game_concept:** Display name resolution for healing log messages
- **description:** Returns display name for a combatant (Pokemon nickname/species or character name). Used in item use results and WebSocket broadcasts.
- **inputs:** combatant (Combatant)
- **outputs:** Display name string
- **accessible_from:** api-only

### healing-C036
- **cap_id:** healing-C036
- **name:** refreshDailyMoves
- **type:** service-function
- **location:** `app/server/services/rest-healing.service.ts` — refreshDailyMoves()
- **game_concept:** Daily move refresh during Extended Rest (PTU Core p.252)
- **description:** Refreshes daily-frequency moves on a single Pokemon. Applies rolling window rule: moves used today are NOT refreshed. Also cleans up stale usedToday on non-daily moves for data hygiene.
- **inputs:** moves (Move[])
- **outputs:** { updatedMoves, restoredMoves, skippedMoves, cleanedNonDaily }
- **accessible_from:** api-only (used by extended-rest endpoints)

### healing-C037
- **cap_id:** healing-C037
- **name:** refreshDailyMovesForOwnedPokemon
- **type:** service-function
- **location:** `app/server/services/rest-healing.service.ts` — refreshDailyMovesForOwnedPokemon()
- **game_concept:** Cascading daily move refresh (trainer Extended Rest refreshes owned Pokemon moves)
- **description:** When a trainer takes Extended Rest, refreshes daily moves on all their owned Pokemon. Iterates owned Pokemon, calls refreshDailyMoves, writes back to DB.
- **inputs:** characterId (string)
- **outputs:** DailyMoveRefreshResult[] per Pokemon
- **accessible_from:** api-only (used by character extended-rest)

### healing-C038
- **cap_id:** healing-C038
- **name:** syncHealingToDatabase
- **type:** service-function
- **location:** `app/server/services/entity-update.service.ts` — syncHealingToDatabase()
- **game_concept:** Persist healing changes to DB
- **description:** Convenience wrapper around syncEntityToDatabase for healing operations. Syncs currentHp, temporaryHp, injuries, and statusConditions back to the Pokemon or HumanCharacter table.
- **inputs:** combatant, currentHp, temporaryHp, injuries, statusConditions
- **outputs:** void (DB update)
- **accessible_from:** api-only

### healing-C039
- **cap_id:** healing-C039
- **name:** restoreSceneAp
- **type:** service-function
- **location:** `app/server/services/scene.service.ts` — restoreSceneAp()
- **game_concept:** Scene-end AP restoration (PTU Core p.221)
- **description:** Restores AP for all characters in a scene at scene end/activation. Unbinds bound AP, restores current AP to maxAp - drainedAp. Groups characters by (level, drainedAp) for batch DB updates.
- **inputs:** charactersJson (string)
- **outputs:** Number of characters restored
- **accessible_from:** api-only (used by scene activate/deactivate)

### healing-C040
- **cap_id:** healing-C040
- **name:** applySoulstealerHealing
- **type:** service-function
- **location:** `app/server/services/living-weapon-abilities.service.ts` — applySoulstealerHealing()
- **game_concept:** Soulstealer ability healing on KO (PTU p.305)
- **description:** Living Weapon ability: on faint = remove 1 injury + heal 25% max HP; on kill = remove all injuries + full heal. Scene-frequency (once per scene). Records usage in combatant.featureUsage.
- **inputs:** combatant (Combatant), isKill (boolean)
- **outputs:** { hpHealed, injuriesRemoved }
- **accessible_from:** api-only (triggered automatically during combat)

### healing-C041
- **cap_id:** healing-C041
- **name:** checkSoulstealer
- **type:** service-function
- **location:** `app/server/services/living-weapon-abilities.service.ts` — checkSoulstealer()
- **game_concept:** Soulstealer trigger eligibility check
- **description:** Checks if a Living Weapon Pokemon with the Soulstealer ability should trigger after causing a faint. Validates scene-frequency limit.
- **inputs:** attacker (Combatant), targetFainted (boolean)
- **outputs:** { triggered, isKill } or null
- **accessible_from:** api-only

---

## API Endpoints

### healing-C042
- **cap_id:** healing-C042
- **name:** POST /api/pokemon/:id/rest
- **type:** api-endpoint
- **location:** `app/server/api/pokemon/[id]/rest.post.ts`
- **game_concept:** 30-minute rest for Pokemon
- **description:** Applies one 30-minute rest period to a Pokemon. Heals 1/16th max HP (minimum 1). Blocked if 5+ injuries or 480+ minutes rested today. Auto-resets daily counters on new calendar day.
- **inputs:** Pokemon ID (URL param)
- **outputs:** { success, message, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }
- **accessible_from:** gm

### healing-C043
- **cap_id:** healing-C043
- **name:** POST /api/pokemon/:id/extended-rest
- **type:** api-endpoint
- **location:** `app/server/api/pokemon/[id]/extended-rest.post.ts`
- **game_concept:** Extended Rest for Pokemon (decree-018: 4-8 hours)
- **description:** Applies extended rest: iterates 30-min periods for chosen duration (4-8h), heals HP, clears persistent status conditions, refreshes daily-frequency moves (rolling window). Respects daily 8h rest cap.
- **inputs:** Pokemon ID, body: { duration?: 4-8 }
- **outputs:** { success, data: { duration, hpHealed, clearedStatuses, restoredMoves, skippedMoves, restMinutesToday } }
- **accessible_from:** gm

### healing-C044
- **cap_id:** healing-C044
- **name:** POST /api/pokemon/:id/pokemon-center
- **type:** api-endpoint
- **location:** `app/server/api/pokemon/[id]/pokemon-center.post.ts`
- **game_concept:** Pokemon Center healing for Pokemon
- **description:** Full HP restoration, clears ALL status conditions, restores all daily moves, heals injuries (max 3/day). Calculates healing time (1h base + 30min/injury or 1h/injury if 5+). Clears lastInjuryTime when all injuries healed.
- **inputs:** Pokemon ID
- **outputs:** { success, data: { hpHealed, effectiveMaxHp, injuriesHealed, injuriesRemaining, clearedStatuses, restoredMoves, healingTimeDescription } }
- **accessible_from:** gm

### healing-C045
- **cap_id:** healing-C045
- **name:** POST /api/pokemon/:id/heal-injury
- **type:** api-endpoint
- **location:** `app/server/api/pokemon/[id]/heal-injury.post.ts`
- **game_concept:** Natural injury healing for Pokemon (24h timer)
- **description:** Heals one injury naturally if 24+ hours since last injury. Checks daily limit (3/day). Clears lastInjuryTime when last injury removed.
- **inputs:** Pokemon ID
- **outputs:** { success, data: { injuriesHealed, injuries, injuriesHealedToday } }
- **accessible_from:** gm

### healing-C046
- **cap_id:** healing-C046
- **name:** POST /api/pokemon/:id/new-day
- **type:** api-endpoint
- **location:** `app/server/api/pokemon/[id]/new-day.post.ts`
- **game_concept:** Reset daily healing counters for a single Pokemon
- **description:** Resets restMinutesToday, injuriesHealedToday, and lastRestReset for one Pokemon.
- **inputs:** Pokemon ID
- **outputs:** { success, data: { restMinutesToday, injuriesHealedToday, lastRestReset } }
- **accessible_from:** gm

### healing-C047
- **cap_id:** healing-C047
- **name:** POST /api/characters/:id/rest
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/rest.post.ts`
- **game_concept:** 30-minute rest for character
- **description:** Identical to Pokemon rest. Heals 1/16th max HP per 30-minute period. Same injury and daily cap restrictions.
- **inputs:** Character ID
- **outputs:** { success, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }
- **accessible_from:** gm

### healing-C048
- **cap_id:** healing-C048
- **name:** POST /api/characters/:id/extended-rest
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/extended-rest.post.ts`
- **game_concept:** Extended Rest for character (decree-018: 4-8 hours)
- **description:** Character-specific extended rest: HP healing over 4-8h, clears persistent statuses, restores drained AP (bound AP preserved per decree-016), refreshes daily moves on ALL owned Pokemon via refreshDailyMovesForOwnedPokemon.
- **inputs:** Character ID, body: { duration?: 4-8 }
- **outputs:** { success, data: { duration, hpHealed, clearedStatuses, apRestored, boundAp, pokemonMoveRefresh[] } }
- **accessible_from:** gm

### healing-C049
- **cap_id:** healing-C049
- **name:** POST /api/characters/:id/pokemon-center
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/pokemon-center.post.ts`
- **game_concept:** Pokemon Center healing for character
- **description:** Full HP, all status cleared, injuries healed (max 3/day). Does NOT restore drained AP (that is Extended Rest only). Calculates healing time.
- **inputs:** Character ID
- **outputs:** { success, data: { hpHealed, effectiveMaxHp, injuriesHealed, clearedStatuses, apRestored: 0, healingTimeDescription } }
- **accessible_from:** gm

### healing-C050
- **cap_id:** healing-C050
- **name:** POST /api/characters/:id/heal-injury
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/heal-injury.post.ts`
- **game_concept:** Character injury healing (natural or AP drain)
- **description:** Two methods: 'natural' (24h timer) or 'drain_ap' (drain 2 AP to heal 1 injury). Both respect daily 3/day limit. AP drain increases drainedAp and decreases currentAp.
- **inputs:** Character ID, body: { method?: 'natural' | 'drain_ap' }
- **outputs:** { success, data: { injuriesHealed, injuries, drainedAp?, currentAp?, injuriesHealedToday } }
- **accessible_from:** gm

### healing-C051
- **cap_id:** healing-C051
- **name:** POST /api/characters/:id/new-day
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/new-day.post.ts`
- **game_concept:** Reset daily counters for a character and owned Pokemon
- **description:** Resets restMinutesToday, injuriesHealedToday, drainedAp for the character. Restores currentAp to maxAp - boundAp. Also resets counters and daily move usage for all owned Pokemon.
- **inputs:** Character ID
- **outputs:** { success, data: { restMinutesToday, drainedAp, boundAp, currentAp, pokemonReset } }
- **accessible_from:** gm

### healing-C052
- **cap_id:** healing-C052
- **name:** POST /api/game/new-day
- **type:** api-endpoint
- **location:** `app/server/api/game/new-day.post.ts`
- **game_concept:** Global new day reset (all entities)
- **description:** Bulk resets all Pokemon (restMinutesToday, injuriesHealedToday, daily moves) and all characters (same + drainedAp, currentAp). Bound AP preserved per decree-016. Uses transaction for characters.
- **inputs:** None
- **outputs:** { success, data: { pokemonReset, pokemonMovesReset, charactersReset, timestamp } }
- **accessible_from:** gm

### healing-C053
- **cap_id:** healing-C053
- **name:** POST /api/encounters/:id/heal
- **type:** api-endpoint
- **location:** `app/server/api/encounters/[id]/heal.post.ts`
- **game_concept:** Direct combat healing (HP, Temp HP, injuries)
- **description:** GM-initiated combat healing. Applies HP healing, Temp HP, and/or injury healing via applyHealingToEntity. Syncs to DB. Handles Living Weapon faint recovery (refreshes wielder's equipment bonuses).
- **inputs:** Encounter ID, body: { combatantId, amount?, tempHp?, healInjuries? }
- **outputs:** { success, data: Encounter, healResult: { combatantId, hpHealed?, newHp, ... } }
- **accessible_from:** gm

### healing-C054
- **cap_id:** healing-C054
- **name:** POST /api/encounters/:id/use-item
- **type:** api-endpoint
- **location:** `app/server/api/encounters/[id]/use-item.post.ts`
- **game_concept:** Combat healing item use with full P2 action economy
- **description:** Complete healing item workflow: validates item category, handles target refusal, turn validation (must be user's turn or held action), self-use detection, adjacency check (PTU p.276), action cost enforcement (Standard for others, Full-Round for self), Medic Training edge check, target action forfeit, inventory check + consumption, applies item via applyHealingItem, Living Weapon faint recovery, DB sync, WebSocket broadcast.
- **inputs:** Encounter ID, body: { itemName, userId, targetId, targetAccepts?, skipInventory? }
- **outputs:** { success, data: Encounter, itemResult: { itemName, userName, targetName, hpHealed?, conditionsCured?, revived?, refused, actionCost, targetForfeitsActions, inventoryConsumed, remainingQuantity? } }
- **accessible_from:** gm

### healing-C055
- **cap_id:** healing-C055
- **name:** POST /api/encounters/:id/breather
- **type:** api-endpoint
- **location:** `app/server/api/encounters/[id]/breather.post.ts`
- **game_concept:** Take a Breather (PTU p.245) — combat recovery action
- **description:** Full Action: resets combat stages, removes Temp HP, cures volatile conditions + Slowed/Stuck (not Cursed). Standard: Tripped + Vulnerable. Assisted: Tripped + 0 Evasion. Heavy Armor speed CS preserved. Re-applies persistent status CS effects (decree-005). Reorders initiative if speed CS changed.
- **inputs:** Encounter ID, body: { combatantId, assisted? }
- **outputs:** { success, data: Encounter, breatherResult: { stagesReset, tempHpRemoved, conditionsCured, trippedApplied, vulnerableApplied, assisted } }
- **accessible_from:** gm, player (via request)

### healing-C056
- **cap_id:** healing-C056
- **name:** POST /api/encounters/:id/end — condition clearing + scene-move reset
- **type:** api-endpoint
- **location:** `app/server/api/encounters/[id]/end.post.ts`
- **game_concept:** Encounter-end condition clearing and move reset
- **description:** When encounter ends: clears conditions with clearsOnEncounterEnd flag (decree-038), resets combat stages to defaults, resets scene-frequency move usage for Pokemon. Syncs all changes to DB.
- **inputs:** Encounter ID
- **outputs:** Updated encounter
- **accessible_from:** gm

### healing-C057
- **cap_id:** healing-C057
- **name:** POST /api/scenes/:id/deactivate — AP restoration
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/deactivate.post.ts`
- **game_concept:** Scene-end AP restoration
- **description:** When a scene is deactivated, calls restoreSceneAp to restore AP for all characters in the scene. Unbinds bound AP, restores current AP.
- **inputs:** Scene ID
- **outputs:** Updated scene + AP restoration count
- **accessible_from:** gm

### healing-C058
- **cap_id:** healing-C058
- **name:** POST /api/scenes/:id/activate — AP restoration for previous scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/activate.post.ts`
- **game_concept:** Scene transition AP restoration
- **description:** When activating a new scene, if there's a currently active scene, restores AP for characters in the previously active scene before switching.
- **inputs:** Scene ID
- **outputs:** Updated scene
- **accessible_from:** gm

---

## Composables

### healing-C059
- **cap_id:** healing-C059
- **name:** useRestHealing — rest
- **type:** composable-function
- **location:** `app/composables/useRestHealing.ts` — rest()
- **game_concept:** Client-side 30-minute rest action
- **description:** Calls POST /api/pokemon/:id/rest or /api/characters/:id/rest. Returns result with success/message.
- **inputs:** type ('pokemon' | 'character'), id (string)
- **outputs:** RestResult | null
- **accessible_from:** gm (via HealingTab)

### healing-C060
- **cap_id:** healing-C060
- **name:** useRestHealing — extendedRest
- **type:** composable-function
- **location:** `app/composables/useRestHealing.ts` — extendedRest()
- **game_concept:** Client-side Extended Rest action
- **description:** Calls POST /api/pokemon/:id/extended-rest or /api/characters/:id/extended-rest with duration parameter.
- **inputs:** type, id, duration (number, default 4)
- **outputs:** RestResult | null
- **accessible_from:** gm (via HealingTab)

### healing-C061
- **cap_id:** healing-C061
- **name:** useRestHealing — pokemonCenter
- **type:** composable-function
- **location:** `app/composables/useRestHealing.ts` — pokemonCenter()
- **game_concept:** Client-side Pokemon Center action
- **description:** Calls POST /api/pokemon/:id/pokemon-center or /api/characters/:id/pokemon-center.
- **inputs:** type, id
- **outputs:** RestResult | null
- **accessible_from:** gm (via HealingTab)

### healing-C062
- **cap_id:** healing-C062
- **name:** useRestHealing — healInjury
- **type:** composable-function
- **location:** `app/composables/useRestHealing.ts` — healInjury()
- **game_concept:** Client-side injury healing action
- **description:** Calls POST /api/pokemon/:id/heal-injury or /api/characters/:id/heal-injury with method ('natural' or 'drain_ap').
- **inputs:** type, id, method
- **outputs:** RestResult | null
- **accessible_from:** gm (via HealingTab)

### healing-C063
- **cap_id:** healing-C063
- **name:** useRestHealing — newDay / newDayGlobal
- **type:** composable-function
- **location:** `app/composables/useRestHealing.ts` — newDay(), newDayGlobal()
- **game_concept:** Client-side daily counter reset
- **description:** newDay calls POST /api/pokemon/:id/new-day or /api/characters/:id/new-day. newDayGlobal calls POST /api/game/new-day for all entities.
- **inputs:** type, id (for single) or none (for global)
- **outputs:** RestResult | null
- **accessible_from:** gm (via HealingTab)

### healing-C064
- **cap_id:** healing-C064
- **name:** useRestHealing — getHealingInfo / formatRestTime
- **type:** composable-function
- **location:** `app/composables/useRestHealing.ts` — getHealingInfo(), formatRestTime()
- **game_concept:** Healing status display helpers
- **description:** getHealingInfo wraps getRestHealingInfo utility for component use (date conversion). formatRestTime formats minutes as "Xh Ym" string.
- **inputs:** Entity healing params / minutes
- **outputs:** RestHealingInfo / formatted string
- **accessible_from:** gm (via HealingTab)

### healing-C065
- **cap_id:** healing-C065
- **name:** useHealingItems — getApplicableItems
- **type:** composable-function
- **location:** `app/composables/useHealingItems.ts` — getApplicableItems()
- **game_concept:** Context-aware item filtering for combat UI
- **description:** Filters the healing item catalog to items that would have an effect on the target. Fainted targets only see revives; active targets see restoratives (if HP < max), cures (if has curable conditions), combined (if not full HP or has conditions). Supports category filter parameter.
- **inputs:** target (Combatant), allowedCategories? (HealingItemCategory[])
- **outputs:** HealingItemDef[]
- **accessible_from:** gm (via UseItemModal)

### healing-C066
- **cap_id:** healing-C066
- **name:** useHealingItems — useItem
- **type:** composable-function
- **location:** `app/composables/useHealingItems.ts` — useItem()
- **game_concept:** Client-side combat item use action
- **description:** Executes item use via encounterStore.useItem. Supports targetAccepts (for refusal) and skipInventory (GM override).
- **inputs:** itemName, userId, targetId, targetAccepts?, skipInventory?
- **outputs:** Item result (from store)
- **accessible_from:** gm (via UseItemModal)

### healing-C067
- **cap_id:** healing-C067
- **name:** useHealingItems — getItemsByCategory
- **type:** composable-function
- **location:** `app/composables/useHealingItems.ts` — getItemsByCategory()
- **game_concept:** Category-grouped item listing
- **description:** Groups all catalog items by category (restorative, cure, combined, revive). Used for organized display in the UseItemModal.
- **inputs:** None
- **outputs:** Record<HealingItemCategory, HealingItemDef[]>
- **accessible_from:** gm

---

## Store Actions

### healing-C068
- **cap_id:** healing-C068
- **name:** encounterStore.healCombatant
- **type:** store-action
- **location:** `app/stores/encounter.ts` — healCombatant()
- **game_concept:** Encounter healing store action
- **description:** Delegates to useEncounterCombatActions.healCombatant. Calls POST /api/encounters/:id/heal with combatantId, amount, tempHp, healInjuries. Updates encounter state on success.
- **inputs:** combatantId, amount?, tempHp?, healInjuries?
- **outputs:** Updated encounter state
- **accessible_from:** gm (via encounter components)

### healing-C069
- **cap_id:** healing-C069
- **name:** encounterStore.useItem
- **type:** store-action
- **location:** `app/stores/encounter.ts` — useItem()
- **game_concept:** Encounter item use store action
- **description:** Delegates to useEncounterCombatActions.useItem. Calls POST /api/encounters/:id/use-item. Returns item result with healing details, action economy info, inventory consumption.
- **inputs:** itemName, userId, targetId, options?: { targetAccepts?, skipInventory? }
- **outputs:** Item result + updated encounter
- **accessible_from:** gm (via UseItemModal)

### healing-C070
- **cap_id:** healing-C070
- **name:** encounterCombat.removeInjury
- **type:** store-action
- **location:** `app/stores/encounterCombat.ts` — removeInjury()
- **game_concept:** Direct injury removal in encounter
- **description:** Calls DELETE /api/encounters/:id/injury with combatantId. Updates encounter state.
- **inputs:** encounterId, combatantId
- **outputs:** Updated encounter
- **accessible_from:** gm

### healing-C071
- **cap_id:** healing-C071
- **name:** encounterCombat.takeABreather
- **type:** store-action
- **location:** `app/stores/encounterCombat.ts` — takeABreather()
- **game_concept:** Take a Breather store action
- **description:** Calls POST /api/encounters/:id/breather with combatantId and optional assisted flag. Updates encounter state.
- **inputs:** encounterId, combatantId, assisted?
- **outputs:** Updated encounter
- **accessible_from:** gm, player (via request)

---

## Components

### healing-C072
- **cap_id:** healing-C072
- **name:** HealingTab
- **type:** component
- **location:** `app/components/common/HealingTab.vue`
- **game_concept:** Out-of-combat healing UI panel
- **description:** Full healing management panel for a single entity (Pokemon or character). Shows current HP, injuries, rest time, daily limits, drained AP. Provides buttons for: Rest (30 min), Extended Rest (4-8h with duration input), Pokemon Center, Natural Injury Healing, Drain AP (character only), New Day. Uses useRestHealing composable for all API calls.
- **inputs:** entityType ('pokemon' | 'character'), entityId, entity (Pokemon | HumanCharacter)
- **outputs:** Emits 'healed' event on successful healing
- **accessible_from:** gm (rendered in `/gm/characters/:id` and `/gm/pokemon/:id` pages)

### healing-C073
- **cap_id:** healing-C073
- **name:** UseItemModal
- **type:** component
- **location:** `app/components/encounter/UseItemModal.vue`
- **game_concept:** Combat healing item selection and application modal
- **description:** Full-featured modal for using healing items in combat. Features: target selector, grouped item display by category (restorative/cure/combined/revive), P2 action cost display (Standard vs Full-Round), range/adjacency status, Medic Training indicator, inventory quantity display with out-of-stock handling, GM Mode toggle (skip inventory), target refuse button, result/error display. Uses useHealingItems composable.
- **inputs:** userId (combatant ID)
- **outputs:** Emits 'close' and 'itemUsed' events
- **accessible_from:** gm (opened from CombatantGmActions)

### healing-C074
- **cap_id:** healing-C074
- **name:** PlayerHealingPanel
- **type:** component
- **location:** `app/components/player/PlayerHealingPanel.vue`
- **game_concept:** Player-facing combat healing actions
- **description:** Combat healing panel for players. Two tabs: Take a Breather (with assisted option if adjacent ally) and Use Item (lists healing items from trainer inventory, allows target selection). Uses usePlayerCombat composable for requests (sent to GM for approval).
- **inputs:** None (uses injection-based player identity)
- **outputs:** Emits 'request-sent' and 'cancel' events
- **accessible_from:** player (rendered inside PlayerCombatActions)

### healing-C075
- **cap_id:** healing-C075
- **name:** CombatantGmActions — Use Item button
- **type:** component
- **location:** `app/components/encounter/CombatantGmActions.vue`
- **game_concept:** GM-initiated item use trigger
- **description:** Contains the "Use Item" button that opens UseItemModal for a specific combatant. Part of the GM encounter action controls.
- **inputs:** combatant (from parent)
- **outputs:** Opens UseItemModal
- **accessible_from:** gm

### healing-C076
- **cap_id:** healing-C076
- **name:** WeatherEffectIndicator (healing abilities)
- **type:** component
- **location:** `app/components/encounter/WeatherEffectIndicator.vue`
- **game_concept:** Weather ability healing preview
- **description:** Displays weather ability effects (including healing) for the current combatant: Ice Body (heal in Hail), Rain Dish (heal in Rain), Sun Blanket (heal in Sun). Shows the expected 1/10th max HP healing amount. Used for combat UI preview.
- **inputs:** weather, combatant
- **outputs:** Visual indicator
- **accessible_from:** gm, group

---

## WebSocket Events

### healing-C077
- **cap_id:** healing-C077
- **name:** heal_applied WebSocket event
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'heal_applied'
- **game_concept:** Real-time healing sync
- **description:** WebSocket event relayed from server to clients when healing is applied to a combatant. Enables Group View and Player View to see healing results in real time.
- **inputs:** Heal event data from server
- **outputs:** Broadcast to encounter room
- **accessible_from:** gm, group, player

### healing-C078
- **cap_id:** healing-C078
- **name:** item_used WebSocket broadcast
- **type:** websocket-event
- **location:** `app/server/api/encounters/[id]/use-item.post.ts` — broadcastToEncounter
- **game_concept:** Real-time item use notification
- **description:** Broadcast after successful item use: itemName, userName, targetName, effects (hpHealed, conditionsCured, revived, repulsive), actionCost, targetForfeitsActions, inventoryConsumed, remainingQuantity.
- **inputs:** Item use result data
- **outputs:** Broadcast to encounter room
- **accessible_from:** gm, group, player

---

## Capability Chains

### Chain 1: Out-of-Combat Rest Healing (30 min)
```
HealingTab (component, GM) -> useRestHealing.rest() (composable) -> POST /api/pokemon/:id/rest OR /api/characters/:id/rest (endpoint) -> calculateRestHealing() (utility) -> Prisma update (DB)
```
**Accessible from:** gm only

### Chain 2: Out-of-Combat Extended Rest
```
HealingTab (component, GM) -> useRestHealing.extendedRest() (composable) -> POST /api/pokemon/:id/extended-rest OR /api/characters/:id/extended-rest (endpoint) -> calculateRestHealing() (utility, iterated) + clearPersistentStatusConditions() + refreshDailyMoves() / refreshDailyMovesForOwnedPokemon() (service) -> Prisma update (DB)
```
**Accessible from:** gm only

### Chain 3: Out-of-Combat Pokemon Center
```
HealingTab (component, GM) -> useRestHealing.pokemonCenter() (composable) -> POST /api/pokemon/:id/pokemon-center OR /api/characters/:id/pokemon-center (endpoint) -> calculatePokemonCenterTime() + calculatePokemonCenterInjuryHealing() + getEffectiveMaxHp() (utilities) -> Prisma update (DB)
```
**Accessible from:** gm only

### Chain 4: Out-of-Combat Injury Healing
```
HealingTab (component, GM) -> useRestHealing.healInjury() (composable) -> POST /api/pokemon/:id/heal-injury OR /api/characters/:id/heal-injury (endpoint) -> canHealInjuryNaturally() (utility) -> Prisma update (DB)
```
**Accessible from:** gm only

### Chain 5: New Day Reset (individual)
```
HealingTab (component, GM) -> useRestHealing.newDay() (composable) -> POST /api/pokemon/:id/new-day OR /api/characters/:id/new-day (endpoint) -> calculateMaxAp() + resetDailyUsage() (utilities) -> Prisma update (DB)
```
**Accessible from:** gm only

### Chain 6: New Day Reset (global)
```
HealingTab (component, GM) -> useRestHealing.newDayGlobal() (composable) -> POST /api/game/new-day (endpoint) -> calculateMaxAp() + resetDailyUsage() (utilities) -> Prisma updateMany + individual updates (DB)
```
**Accessible from:** gm only

### Chain 7: Combat Direct Healing (HP/TempHP/Injury)
```
CombatantCard/CombatantGmActions (component, GM) -> encounterStore.healCombatant() (store) -> useEncounterCombatActions.healCombatant() (composable) -> POST /api/encounters/:id/heal (endpoint) -> applyHealingToEntity() (service) + syncHealingToDatabase() (service) -> Prisma update (DB)
```
**Accessible from:** gm only

### Chain 8: Combat Healing Item Use (Full P2)
```
CombatantGmActions (component, GM) -> UseItemModal (component) -> useHealingItems.useItem() (composable) -> encounterStore.useItem() (store) -> useEncounterCombatActions.useItem() (composable) -> POST /api/encounters/:id/use-item (endpoint) -> validateItemApplication() + checkItemRange() + applyHealingItem() + syncEntityToDatabase() (services) -> Prisma update (DB) + WebSocket broadcast (item_used)
```
**Accessible from:** gm only (UseItemModal is in CombatantGmActions)

### Chain 9: Player Combat Healing Item Request
```
PlayerCombatActions (component, player) -> PlayerHealingPanel (component) -> usePlayerCombat.requestHealingItem() (composable) -> WebSocket player_action -> GM receives request -> GM executes via Chain 8
```
**Accessible from:** player (request) -> gm (execution)

### Chain 10: Take a Breather
```
CombatantGmActions (component, GM) OR PlayerHealingPanel (component, player) -> encounterCombat.takeABreather() (store) / usePlayerCombat.requestBreather() -> POST /api/encounters/:id/breather (endpoint) -> createDefaultStageModifiers() + reapplyActiveStatusCsEffects() + syncEntityToDatabase() (services) -> Prisma update (DB)
```
**Accessible from:** gm (direct), player (via request)

### Chain 11: Weather Ability Healing (Automated)
```
POST /api/encounters/:id/next-turn (endpoint) -> applyWeatherAbilityEffects() (turn-helpers) -> WEATHER_ABILITY_EFFECTS (constant: Ice Body/Rain Dish/Sun Blanket healing) -> applyHealingToEntity() (service) -> syncEntityToDatabase() -> WebSocket broadcast (status_tick)
```
**Accessible from:** gm (triggered by next turn)

### Chain 12: Weather Status Cure (Automated)
```
POST /api/encounters/:id/next-turn (endpoint) -> Hydration/Leaf Guard check -> updateStatusConditions() (service) -> syncEntityToDatabase() -> WebSocket broadcast
```
**Accessible from:** gm (triggered by next turn)

### Chain 13: Soulstealer Healing (Automated)
```
Damage/KO flow -> checkSoulstealer() (service) -> applySoulstealerHealing() (service) -> entity mutation -> syncEntityToDatabase()
```
**Accessible from:** gm (triggered automatically on KO)

### Chain 14: Scene-End AP Restoration
```
POST /api/scenes/:id/deactivate OR /api/scenes/:id/activate (endpoint) -> restoreSceneAp() (service) -> calculateSceneEndAp() (utility) -> Prisma updateMany (DB)
```
**Accessible from:** gm only

### Chain 15: Encounter-End Condition Clearing + Move Reset
```
POST /api/encounters/:id/end (endpoint) -> clearEncounterEndConditions() + resetSceneUsage() -> syncEntityToDatabase() -> Prisma update (DB)
```
**Accessible from:** gm only

---

## Accessibility Summary

| Access Level | Capabilities |
|---|---|
| **gm-only** | healing-C042 through healing-C053 (all REST endpoints), healing-C059 through healing-C064 (rest composable), healing-C068-C070 (store actions), healing-C072 (HealingTab), healing-C073 (UseItemModal), healing-C075 (CombatantGmActions Use Item) |
| **gm + player** | healing-C055 (breather endpoint — player via request), healing-C071 (takeABreather store), healing-C074 (PlayerHealingPanel), healing-C077 (heal_applied WS event) |
| **gm + group + player** | healing-C077 (heal_applied WS), healing-C078 (item_used WS), healing-C076 (WeatherEffectIndicator, gm+group) |
| **shared (gm + player)** | healing-C025 (HEALING_ITEM_CATALOG), healing-C026-C028 (item types/filters), healing-C012 (getEffectiveMaxHp) |
| **api-only** | healing-C013-C022 (utility functions), healing-C024 (resetDailyUsage), healing-C029-C041 (service functions) |

---

## Orphan Capabilities

No orphan capabilities detected. All service functions and utilities are called by at least one API endpoint. All API endpoints are reachable from at least one composable or component. The weather ability healing and Soulstealer healing are automatically triggered during combat flow.

---

## Missing Subsystems

### 1. Player Out-of-Combat Healing Interface
- **subsystem:** No player-facing UI for out-of-combat rest, extended rest, Pokemon Center, or injury healing
- **actor:** player
- **ptu_basis:** PTU Core Ch.9 describes rest healing as player-initiated actions during downtime. Players should be able to rest their Pokemon and characters without GM proxy.
- **impact:** Players must ask the GM to perform all out-of-combat healing via the GM view's HealingTab. This creates a bottleneck where every rest, Pokemon Center visit, or injury healing request must go through the GM, slowing downtime play.

### 2. Player Pokemon Healing/Status View
- **subsystem:** No player-visible display of their Pokemon's healing status (rest minutes used, injury timers, daily limits)
- **actor:** player
- **ptu_basis:** Players need to know their Pokemon's healing state to make informed decisions about resting, visiting Pokemon Centers, or continuing to adventure.
- **impact:** Players cannot see how much rest time remains, whether natural injury healing is available, or how many injuries have been healed today. They must ask the GM for this information.

### 3. Max Potion Item
- **subsystem:** Max Potion (heals to full HP) is absent from HEALING_ITEM_CATALOG
- **actor:** gm
- **ptu_basis:** PTU p.276 lists Max Potion as a standard healing item that heals to full HP. It is a commonly-used tier between Hyper Potion and Full Restore.
- **impact:** GMs must use the direct heal endpoint as a workaround instead of the item system for full-HP healing without status cure. The Full Restore item exists but also cures conditions.

### 4. Lemonade / Moomoo Milk / Berry Items
- **subsystem:** Several PTU healing items are not in the catalog (Lemonade, Moomoo Milk, Fresh Water, Soda Pop, various Berries)
- **actor:** gm
- **ptu_basis:** PTU Ch.9 lists additional restorative items beyond the core potion line, and berries have healing properties.
- **impact:** Limited item variety compared to the full PTU catalog. GMs can use direct healing as a workaround but lose item-tracking and inventory management benefits.

### 5. Multi-Entity Pokemon Center Batch Healing
- **subsystem:** No batch Pokemon Center endpoint to heal an entire party (trainer + all Pokemon) in one action
- **actor:** gm
- **ptu_basis:** In tabletop PTU, visiting a Pokemon Center heals the entire party. Currently requires individual API calls per entity.
- **impact:** GM must click Pokemon Center individually for each Pokemon and the trainer character, which is tedious for a party of 6+ Pokemon. The HealingTab only works on one entity at a time.
