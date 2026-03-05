# Combat Domain -- Application Capabilities

> Generated: 2026-03-05 | Source: deep-read of all combat source files
> Stale-since note: Re-mapped to include sessions 12-26 + session 119 changes (equipment P0-P2, League battle, flanking, status automation, sprint action, Permafrost, Snow Boots, fainted recall exemption)

## Individual Capabilities

---

### combat-C001: Combat Stage Multiplier Table
- **type**: constant
- **location**: `app/utils/damageCalculation.ts` -> `STAGE_MULTIPLIERS`
- **game_concept**: PTU Combat Stages (-6 to +6)
- **description**: Lookup table mapping combat stage values to stat multipliers. Positive stages: +20%/stage, negative stages: -10%/stage.
- **inputs**: Stage value (-6 to +6)
- **outputs**: Multiplier (0.4 to 2.2)
- **accessible_from**: gm, group, player

### combat-C002: Apply Stage Modifier
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` -> `applyStageModifier()`
- **game_concept**: PTU stat modification via combat stages
- **description**: Applies combat stage multiplier to a base stat. Clamps stage to -6/+6, floors result.
- **inputs**: baseStat (number), stage (number)
- **outputs**: Modified stat value (number)
- **accessible_from**: gm, group, player

### combat-C003: Apply Stage Modifier With Bonus
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` -> `applyStageModifierWithBonus()`
- **game_concept**: PTU Focus item bonus (p.295) applied after combat stages
- **description**: Applies stage modifier then adds a flat post-stage bonus (e.g., Focus +5). PTU p.295: bonus applied AFTER stages.
- **inputs**: baseStat, stage, postStageBonus
- **outputs**: Modified stat with bonus (number)
- **accessible_from**: gm, group, player

### combat-C004: STAB Check
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` -> `hasSTAB()`
- **game_concept**: Same Type Attack Bonus (PTU p.790-793)
- **description**: Checks if the move's type matches any of the attacker's types for STAB (+2 DB). Weapon moves are excluded (PTU p.287).
- **inputs**: moveType (string), attackerTypes (string[])
- **outputs**: boolean
- **accessible_from**: gm, group, player

### combat-C005: Set Damage Lookup
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` -> `getSetDamage()`
- **game_concept**: PTU Damage Base chart (p.921-985)
- **description**: Looks up the average set damage value for a given Damage Base (1-28).
- **inputs**: DB value (number)
- **outputs**: Set damage average (number)
- **accessible_from**: gm, group, player

### combat-C006: Weather Damage Modifier
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` -> `getWeatherDamageModifier()`
- **game_concept**: Rain/Sun modify Fire/Water DB by +/-5 (PTU pp.341-342)
- **description**: Calculates weather modifier to Damage Base. Rain: Water +5, Fire -5. Sun: Fire +5, Water -5.
- **inputs**: weather (string|null), moveType (string)
- **outputs**: DB modifier (-5, 0, or +5)
- **accessible_from**: gm, group, player

### combat-C007: Full 9-Step Damage Formula
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` -> `calculateDamage()`
- **game_concept**: PTU full damage calculation (07-combat.md:834-847)
- **description**: Implements the complete PTU 9-step damage formula: DB -> weather modifier -> STAB -> set damage lookup -> critical -> attack stat -> defense stat + DR -> ability damage bonus -> type effectiveness -> min 1. Returns detailed breakdown.
- **inputs**: DamageCalcInput (attacker types/stat/stage, move type/DB/class, target types/stat/stage, weather, crits, DR, ability bonus, move keywords)
- **outputs**: DamageCalcResult with finalDamage and full breakdown
- **accessible_from**: gm, group, player

### combat-C008: Evasion Calculation
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` -> `calculateEvasion()`
- **game_concept**: PTU two-part evasion system (07-combat.md:594-657)
- **description**: Calculates evasion from stage-modified stat (Part 1: floor(modifiedStat/5), cap 6) plus bonus evasion from moves/effects (Part 2: additive, -6 to +6). Total clamped to min 0. Accounts for Focus item stat bonus applied after CS.
- **inputs**: baseStat, combatStage, evasionBonus, statBonus
- **outputs**: Total evasion value (number)
- **accessible_from**: gm, group, player

### combat-C009: Accuracy Threshold
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` -> `calculateAccuracyThreshold()`
- **game_concept**: PTU accuracy check threshold (07-combat.md:624-657)
- **description**: Calculates d20 threshold needed to hit: moveAC + min(9, evasion) - accuracyStage + environmentPenalty. Min 1.
- **inputs**: moveAC, attackerAccuracyStage, defenderEvasion, environmentPenalty
- **outputs**: Accuracy threshold (number)
- **accessible_from**: gm, group, player

### combat-C010: Damage Base Chart (Composable)
- **type**: composable-function
- **location**: `app/composables/useDamageCalculation.ts` -> `useDamageCalculation()`
- **game_concept**: PTU Damage Base chart with rolled/set variants
- **description**: Provides getSetDamage (average), getDamageRoll (dice string), and getSetDamageByType (min/avg/max) for DB values 1-28.
- **inputs**: DB value
- **outputs**: Set damage or dice string
- **accessible_from**: gm, group, player

### combat-C011: HP Marker Crossing Detection
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `countMarkersCrossed()`
- **game_concept**: PTU injury from HP markers (07-combat.md:1849-1852)
- **description**: Counts HP thresholds crossed between previousHp and newHp. Markers at 50%, 0%, -50%, -100%, etc. of REAL maxHp (not injury-reduced). Each crossing = 1 injury.
- **inputs**: previousHp, newHp, realMaxHp
- **outputs**: { count, markers[] }
- **accessible_from**: gm (server-side only, called via API)

### combat-C012: Combat Damage Application
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `calculateDamage()`
- **game_concept**: PTU damage with temp HP, massive damage, marker injuries
- **description**: Full damage pipeline: temp HP absorbs first, massive damage check (50%+ maxHp), HP marker crossings, faint detection. Returns DamageResult with all tracking fields.
- **inputs**: damage, currentHp, maxHp, temporaryHp, currentInjuries
- **outputs**: DamageResult (finalDamage, hpDamage, injuries, fainted, etc.)
- **accessible_from**: gm (server-side)

### combat-C013: Apply Damage to Entity
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `applyDamageToEntity()`
- **game_concept**: PTU damage application with faint handling
- **description**: Applies DamageResult to a combatant's entity, updating HP, tempHP, injuries. Auto-applies faint status on HP=0 (clears P/V conditions, reverses CS effects per decree-005).
- **inputs**: combatant, damageResult
- **outputs**: void (mutates combatant entity)
- **accessible_from**: gm (server-side)

### combat-C014: Faint Status Application
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `applyFaintStatus()`
- **game_concept**: PTU p.248 faint condition handling
- **description**: Applies Fainted status, clearing conditions with clearsOnFaint flag and reversing their CS effects (decree-005, decree-038, decree-047). Other-category conditions preserved on faint.
- **inputs**: combatant
- **outputs**: void (mutates combatant entity)
- **accessible_from**: gm (server-side)

### combat-C015: Combat Healing
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `applyHealingToEntity()`
- **game_concept**: PTU HP healing with injury-reduced max HP
- **description**: Heals HP (capped at injury-reduced effective max), grants temp HP (keep-whichever-is-higher per PTU), heals injuries. Auto-removes Fainted on 0->positive HP transition.
- **inputs**: combatant, HealOptions (amount, tempHp, healInjuries)
- **outputs**: HealResult
- **accessible_from**: gm (server-side)

### combat-C016: Status Condition Update
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `updateStatusConditions()`
- **game_concept**: PTU status condition add/remove with CS auto-application
- **description**: Adds/removes status conditions on a combatant. Per decree-005: auto-applies CS effects for Burn (-2 Def), Paralysis (-4 Spe), Poison/Badly Poisoned (-2 SpDef) on add, reverses on remove. Source-tracked in stageSources.
- **inputs**: combatant, addStatuses[], removeStatuses[]
- **outputs**: StatusChangeResult (added, removed, current, stageChanges)
- **accessible_from**: gm (server-side)

### combat-C017: Stage Modifier Update
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `updateStageModifiers()`
- **game_concept**: PTU combat stage changes (-6 to +6)
- **description**: Applies delta or absolute stage changes to a combatant. Clamps to -6/+6. Supports all 7 stats: atk, def, spA, spD, spe, accuracy, evasion.
- **inputs**: combatant, changes (Record<stat, value>), isAbsolute
- **outputs**: StageChangeResult (per-stat previous/change/current)
- **accessible_from**: gm (server-side)

### combat-C018: Status CS Auto-Application
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `applyStatusCsEffects()`
- **game_concept**: Burn/Paralysis/Poison inherent CS effects (decree-005)
- **description**: Applies the inherent CS effect for a status condition (e.g., Burn -> -2 Def CS). Records the actual delta in stageSources for clean reversal on cure. Respects -6/+6 bounds.
- **inputs**: combatant, condition
- **outputs**: void (mutates combatant stageModifiers and stageSources)
- **accessible_from**: gm (server-side)

### combat-C019: Status CS Reversal
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `reverseStatusCsEffects()`
- **game_concept**: Reversing CS effects when status is cured (decree-005)
- **description**: Reverses the CS delta tracked in stageSources when a status condition is cured. Only reverses the actual applied delta (may differ from nominal if stage was near bound).
- **inputs**: combatant, condition
- **outputs**: void (mutates combatant stageModifiers and stageSources)
- **accessible_from**: gm (server-side)

### combat-C020: Re-apply Active Status CS Effects
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `reapplyActiveStatusCsEffects()`
- **game_concept**: Post-Breather CS re-application for persistent conditions
- **description**: Clears all stageSources then re-applies CS effects from all active status conditions. Used after Take a Breather resets stages to 0 -- Burn/Paralysis/Poison CS effects must persist through breather.
- **inputs**: combatant
- **outputs**: void (mutates combatant)
- **accessible_from**: gm (server-side)

### combat-C021: Combatant Builder
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `buildCombatantFromEntity()`
- **game_concept**: PTU combat entry with initiative, evasion, equipment
- **description**: Constructs a full Combatant wrapper from a Pokemon or HumanCharacter entity. Calculates initiative from speed (with equipment bonuses), resets stages for combat entry, applies Heavy Armor speed default CS, Focus stat bonuses, shield evasion bonus, and pre-existing status CS effects.
- **inputs**: BuildCombatantOptions (entityType, entityId, entity, side, initiativeBonus, position, tokenSize)
- **outputs**: Combatant with all combat state initialized
- **accessible_from**: gm (server-side)

### combat-C022: Initiative Recalculation
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` -> `calculateCurrentInitiative()`
- **game_concept**: Dynamic initiative from Speed CS changes (decree-006)
- **description**: Recalculates a combatant's initiative from current CS-modified Speed stat, accounting for Focus speed bonus and Living Weapon equipment overlay.
- **inputs**: combatant, wieldRelationships (optional)
- **outputs**: New initiative value (number)
- **accessible_from**: gm (server-side)

### combat-C023: Initiative Sorting with Roll-Off
- **type**: service-function
- **location**: `app/server/services/encounter.service.ts` -> `sortByInitiativeWithRollOff()`
- **game_concept**: PTU initiative tie-breaking with d20 roll-off
- **description**: Sorts combatants by initiative (descending or ascending). Tied combatants get d20 roll-offs, re-rolled until all unique.
- **inputs**: combatants[], descending flag
- **outputs**: Sorted combatant array
- **accessible_from**: gm (server-side)

### combat-C024: Initiative Reorder After Speed Change
- **type**: service-function
- **location**: `app/server/services/encounter.service.ts` -> `reorderInitiativeAfterSpeedChange()`
- **game_concept**: Dynamic turn reordering on Speed CS change (decree-006)
- **description**: Recalculates initiative for all combatants, re-sorts unacted combatants while preserving acted positions. Handles League Battle (separate trainer/pokemon orders) and Full Contact (single order).
- **inputs**: combatants, currentTurnOrder, currentTurnIndex, battleType, trainerTurnOrder, pokemonTurnOrder, currentPhase
- **outputs**: InitiativeReorderResult (changed flag, new turn orders, adjusted index)
- **accessible_from**: gm (server-side)

### combat-C025: Encounter Load/Parse
- **type**: service-function
- **location**: `app/server/services/encounter.service.ts` -> `loadEncounter()`
- **game_concept**: Encounter state retrieval
- **description**: Loads encounter from DB, parses combatants JSON. Throws 404 if not found.
- **inputs**: encounter ID
- **outputs**: { record, combatants[] }
- **accessible_from**: gm (server-side)

### combat-C026: Encounter Response Builder
- **type**: service-function
- **location**: `app/server/services/encounter.service.ts` -> `buildEncounterResponse()`
- **game_concept**: Encounter state serialization for API response
- **description**: Builds standardized ParsedEncounter from DB record + combatants. Parses all JSON fields (turnOrder, declarations, switchActions, pendingActions, holdQueue, moveLog, defeatedEnemies). Reconstructs wield relationships. Parses environment preset.
- **inputs**: EncounterRecord, combatants[], optional overrides
- **outputs**: ParsedEncounter
- **accessible_from**: gm, group, player (via API response)

### combat-C027: Tick Damage Calculation
- **type**: service-function
- **location**: `app/server/services/status-automation.service.ts` -> `calculateTickDamage()`
- **game_concept**: PTU tick = 1/10 max HP (p.246)
- **description**: Calculates 1 tick of HP damage: floor(maxHp / 10), minimum 1.
- **inputs**: maxHp
- **outputs**: Tick damage (number)
- **accessible_from**: gm (server-side)

### combat-C028: Badly Poisoned Damage
- **type**: service-function
- **location**: `app/server/services/status-automation.service.ts` -> `calculateBadlyPoisonedDamage()`
- **game_concept**: PTU Badly Poisoned escalation (p.247)
- **description**: Calculates escalating Badly Poisoned damage: 5 * 2^(round-1). Round 1: 5, Round 2: 10, Round 3: 20, etc.
- **inputs**: escalationRound
- **outputs**: Damage amount (number)
- **accessible_from**: gm (server-side)

### combat-C029: Turn-End Tick Damage Entries
- **type**: service-function
- **location**: `app/server/services/status-automation.service.ts` -> `getTickDamageEntries()`
- **game_concept**: Burn/Poison/Badly Poisoned/Cursed tick damage at turn end
- **description**: Determines tick damage for a combatant at turn end. Burn/Poison always fire. Badly Poisoned supersedes Poison with escalating damage. Cursed fires only if Standard Action was taken (decree-032). Skips fainted combatants.
- **inputs**: combatant, standardActionTaken
- **outputs**: TickDamageEntry[] (condition, damage, formula)
- **accessible_from**: gm (server-side)

### combat-C030: Weather Tick Damage
- **type**: service-function
- **location**: `app/server/services/weather-automation.service.ts` -> `getWeatherTickForCombatant()`
- **game_concept**: Hail/Sandstorm damage at turn start (PTU pp.341-342)
- **description**: Calculates weather tick damage (1/10 max HP) at turn start. Checks type immunity (Ice for Hail, Ground/Rock/Steel for Sandstorm), ability immunity (Ice Body, Snow Cloak, Sand Veil, Overcoat, Magic Guard, etc.), and Permafrost damage reduction (-5, min 1 per decree-001).
- **inputs**: combatant, weather, allCombatants
- **outputs**: { shouldApply, tick: WeatherTickResult | null }
- **accessible_from**: gm (server-side)

### combat-C031: Weather Ability Effects
- **type**: service-function
- **location**: `app/server/services/weather-automation.service.ts` -> `getWeatherAbilityEffects()`
- **game_concept**: Weather ability healing/damage (Ice Body, Rain Dish, Solar Power, Dry Skin, etc.)
- **description**: Gets weather-triggered ability effects at turn start or turn end. Ice Body/Rain Dish heal 1/16 max HP. Solar Power deals 1/8 max HP damage. Dry Skin heals in rain, damages in sun. Desert Weather provides Sand Force + heals in sandstorm.
- **inputs**: combatant, weather, timing ('turn_start'|'turn_end')
- **outputs**: WeatherAbilityResult[]
- **accessible_from**: gm (server-side)

### combat-C032: AoO Eligibility Check
- **type**: service-function
- **location**: `app/server/services/out-of-turn.service.ts` -> `canUseAoO()`
- **game_concept**: Attack of Opportunity eligibility (PTU p.241)
- **description**: Checks if a combatant can use AoO: not fainted, no blocking conditions (Asleep/Flinched/Paralyzed), once per round, has grid position.
- **inputs**: combatant
- **outputs**: { allowed, reason? }
- **accessible_from**: gm (server-side)

### combat-C033: AoO Trigger Detection
- **type**: service-function
- **location**: `app/server/services/out-of-turn.service.ts` -> `detectAoOTriggers()`
- **game_concept**: All 5 PTU AoO trigger types (p.241)
- **description**: Detects valid AoO opportunities from an action. Supports: shift_away (with previous position check), ranged_attack (no adjacent target), stand_up, maneuver_other (excludes maneuver targets), retrieve_item. Returns OutOfTurnAction per eligible adjacent enemy reactor.
- **inputs**: AoODetectionParams (actor, triggerType, combatants, round, positions, etc.)
- **outputs**: OutOfTurnAction[]
- **accessible_from**: gm (server-side)

### combat-C034: AoO Resolution
- **type**: service-function
- **location**: `app/server/services/out-of-turn.service.ts` -> `resolveAoOAction()`
- **game_concept**: AoO accept/decline resolution
- **description**: Resolves a pending AoO action. On accept: marks reactor's aooUsed. On decline: status -> declined. Returns new arrays (immutable).
- **inputs**: pendingActions, combatants, actionId, accepted
- **outputs**: { updatedActions, updatedCombatants }
- **accessible_from**: gm (server-side)

### combat-C035: Hold Action
- **type**: service-function
- **location**: `app/server/services/out-of-turn.service.ts` -> `canHoldAction()`, `applyHoldAction()`, `releaseHeldAction()`
- **game_concept**: PTU Hold Action (p.227)
- **description**: Hold action system: validates (not acted, not fainted, once per round), applies hold (marks acted, adds to holdQueue), releases (restores full action economy). HoldUntilInitiative is an absolute initiative value (decree-006).
- **inputs**: combatant, holdUntilInitiative
- **outputs**: Updated combatant and holdQueueEntry
- **accessible_from**: gm (server-side)

### combat-C036: Priority Actions
- **type**: service-function
- **location**: `app/server/services/out-of-turn.service.ts` -> `canUsePriority()`, `applyStandardPriority()`, `applyLimitedPriority()`, `applyAdvancedPriority()`
- **game_concept**: PTU Priority Actions (p.228) -- Standard, Limited, Advanced
- **description**: Three Priority variants: Standard (full turn immediately), Limited (only Standard Action consumed, rest of turn at normal initiative), Advanced (can use after acting, forfeits next round if already acted). All once per round. Cannot use while holding.
- **inputs**: combatant, variant
- **outputs**: Updated combatant
- **accessible_from**: gm (server-side)

### combat-C037: Interrupt Actions
- **type**: service-function
- **location**: `app/server/services/out-of-turn.service.ts` -> `canUseInterrupt()`, `createInterruptAction()`, `applyInterruptUsage()`
- **game_concept**: PTU Interrupt Actions (p.228-229)
- **description**: Interrupt framework: once per round. Creates pending action for GM resolution. In League Battles, switched-in Pokemon (canBeCommanded=false) forfeit next round turn when using Interrupt (PTU p.229 + spec F3).
- **inputs**: combatant, triggerId, triggerType, isLeagueBattle
- **outputs**: OutOfTurnAction or updated combatant
- **accessible_from**: gm (server-side)

### combat-C038: Intercept Melee Detection
- **type**: service-function
- **location**: `app/server/services/intercept.service.ts` -> `detectInterceptMelee()`
- **game_concept**: Intercept Melee (PTU p.242, R116)
- **description**: Detects eligible melee intercept opportunities when an ally is hit. Checks: ally of target, within movement range, Full Action available, move can miss, attacker adjacent to target. Pokemon loyalty checks (3+ for trainer, 6 for any ally). Speed check for Priority/Interrupt moves.
- **inputs**: InterceptMeleeDetectionParams (targetId, attackerId, move, combatants, round)
- **outputs**: OutOfTurnAction[]
- **accessible_from**: gm (server-side)

### combat-C039: Intercept Ranged Detection
- **type**: service-function
- **location**: `app/server/services/intercept.service.ts` -> `detectInterceptRanged()`
- **game_concept**: Intercept Ranged (PTU p.242, R117)
- **description**: Detects ranged intercept opportunities. Checks line of attack (center-to-center for multi-tile), movement range to any cell on the line, single-target only, move can miss. Uses same loyalty/speed checks as melee.
- **inputs**: InterceptRangedDetectionParams (targetId, attackerId, move, combatants, round)
- **outputs**: OutOfTurnAction[]
- **accessible_from**: gm (server-side)

### combat-C040: Intercept Melee Resolution
- **type**: service-function
- **location**: `app/server/services/intercept.service.ts` -> `resolveInterceptMelee()`
- **game_concept**: Intercept Melee success/failure resolution
- **description**: Resolves melee intercept. DC = 3 * distance. Success: push ally 1m away, interceptor shifts to ally's old position, takes hit. Failure: shift floor(skillCheck/3) meters toward target. Consumes Full Action + Interrupt.
- **inputs**: combatants, interceptorId, targetId, attackerId, skillCheck
- **outputs**: { updatedCombatants, interceptSuccess, distanceMoved, dcRequired, positions }
- **accessible_from**: gm (server-side)

### combat-C041: Intercept Ranged Resolution
- **type**: service-function
- **location**: `app/server/services/intercept.service.ts` -> `resolveInterceptRanged()`
- **game_concept**: Intercept Ranged success/failure resolution
- **description**: Resolves ranged intercept. Max shift = floor(skillCheck/2). If reaches target square, takes attack instead. Uses diagonal cost (decree-002). Consumes Full Action + Interrupt.
- **inputs**: combatants, interceptorId, targetSquare, skillCheck
- **outputs**: { updatedCombatants, interceptSuccess, distanceMoved, reachedTarget }
- **accessible_from**: gm (server-side)

### combat-C042: Struggle Attack Stats
- **type**: service-function
- **location**: `app/server/services/out-of-turn.service.ts` -> `getStruggleAttackStats()`
- **game_concept**: PTU Struggle Attack (p.240)
- **description**: Returns Struggle Attack stats based on Combat skill. Default: AC 4, DB4 (set 11). Expert+: AC 3, DB5 (set 13). Only trainers can have Expert Combat skill.
- **inputs**: combatant
- **outputs**: { ac, setDamage, isExpert }
- **accessible_from**: gm (server-side)

### combat-C043: Disengage Action
- **type**: service-function
- **location**: `app/server/services/out-of-turn.service.ts` (used via API endpoint)
- **game_concept**: Disengage (PTU p.241) -- Shift without provoking AoO
- **description**: Marks a combatant as disengaged for the current turn, preventing shift_away AoO triggers. Consumes Shift Action.
- **inputs**: combatant
- **outputs**: Updated combatant with disengaged=true
- **accessible_from**: gm (server-side)

### combat-C044: Pending Action Lifecycle
- **type**: service-function
- **location**: `app/server/services/out-of-turn.service.ts` -> `expirePendingActions()`, `autoDeclineFaintedReactor()`, `cleanupResolvedActions()`
- **game_concept**: Out-of-turn action queue management
- **description**: Manages pending action lifecycle: expire at round end, auto-decline fainted reactors, clean up resolved/declined/expired from previous rounds.
- **inputs**: pendingActions, round/faintedCombatantId
- **outputs**: Updated pendingActions array
- **accessible_from**: gm (server-side)

### combat-C045: Pokemon Switch Validation
- **type**: service-function
- **location**: `app/server/services/switching.service.ts` -> `validateSwitch()`
- **game_concept**: PTU Pokemon switching rules (p.229)
- **description**: 10-step validation chain: encounter active, trainer exists, recalled Pokemon exists, Trapped check (prevents recall), ownership verified, released Pokemon exists/not fainted/not in encounter. Separate action availability check.
- **inputs**: encounter state, trainerId, recallCombatantId, releaseEntityId, releasedPokemonRecord
- **outputs**: SwitchValidationResult { valid, error? }
- **accessible_from**: gm (server-side)

### combat-C046: Recall Range Check
- **type**: service-function
- **location**: `app/server/services/switching.service.ts` -> `checkRecallRange()`
- **game_concept**: Poke Ball recall beam range (PTU p.229, 8m)
- **description**: Checks if trainer is within 8m Poke Ball range. League Battles: always in range. Gridless: assume in range. Uses ptuDiagonalDistance (decree-002).
- **inputs**: trainerPosition, pokemonPosition, isLeagueBattle
- **outputs**: { inRange, distance }
- **accessible_from**: gm (server-side)

### combat-C047: Combatant Removal from Turn Order
- **type**: service-function
- **location**: `app/server/services/switching.service.ts` -> `removeCombatantFromEncounter()`
- **game_concept**: Remove combatant from all turn orders
- **description**: Removes combatant from combatants array and all turn orders (main, trainer, pokemon). Adjusts currentTurnIndex if needed. Returns new immutable arrays.
- **inputs**: combatants, turnOrders, currentTurnIndex, combatantId
- **outputs**: RemovalResult (updated arrays and index)
- **accessible_from**: gm (server-side)

### combat-C048: Initiative Insertion for Released Pokemon
- **type**: service-function
- **location**: `app/server/services/switching.service.ts` -> `insertIntoTurnOrder()`
- **game_concept**: Released Pokemon initiative placement (PTU p.229)
- **description**: Inserts new combatant into turn order at correct initiative position. Only among unacted combatants. League mode: pokemonTurnOrder only (decree-021). Full Contact with canActImmediately: inserted as next-to-act (Section K).
- **inputs**: newCombatant, allCombatants, turnOrders, currentTurnIndex, battleType, currentPhase, canActImmediately
- **outputs**: TurnOrderInsertResult
- **accessible_from**: gm (server-side)

### combat-C049: Fainted Switch Validation
- **type**: service-function
- **location**: `app/server/services/switching.service.ts` -> `validateFaintedSwitch()`
- **game_concept**: PTU fainted Pokemon switch as Shift Action (p.229)
- **description**: Validates fainted switch: recalled must be fainted, must be trainer's turn, trainer must have Shift Action available.
- **inputs**: recalledCombatant, trainerCombatant, encounter, trainerId
- **outputs**: SwitchValidationResult
- **accessible_from**: gm (server-side)

### combat-C050: Forced Switch Validation
- **type**: service-function
- **location**: `app/server/services/switching.service.ts` -> `validateForcedSwitch()`
- **game_concept**: Forced switch from moves like Roar (PTU p.229)
- **description**: Validates forced switch: no action cost, no turn check, but Trapped check applies (decree-039: Roar does NOT override Trapped). Whirlwind is a push, not a forced switch (decree-034).
- **inputs**: encounter, trainerId, recallCombatantId, releaseEntityId, releasedPokemonRecord
- **outputs**: SwitchValidationResult
- **accessible_from**: gm (server-side)

### combat-C051: League Switch Command Restriction
- **type**: service-function
- **location**: `app/server/services/switching.service.ts` -> `canSwitchedPokemonBeCommanded()`
- **game_concept**: League Battle switch restriction (PTU p.229)
- **description**: Determines if switched-in Pokemon can be commanded this round. Non-League: always yes. Fainted switch: exempt. Forced switch: exempt. Standard League switch: cannot be commanded.
- **inputs**: isLeagueBattle, isFaintedSwitch, isForcedSwitch
- **outputs**: boolean
- **accessible_from**: gm (server-side)

### combat-C052: Recall Side Effects
- **type**: service-function
- **location**: `app/server/services/switching.service.ts` -> `applyRecallSideEffects()`
- **game_concept**: PTU recall clears volatile conditions, temp HP, stages (p.247-248)
- **description**: Applies recall side-effects to a Pokemon's DB record: clears recall-cleared conditions (volatiles, Stuck, Slowed, Tripped, Vulnerable), resets temp HP to 0, resets combat stages.
- **inputs**: entityId
- **outputs**: void (DB write)
- **accessible_from**: gm (server-side)

### combat-C053: Recall+Release Pair Detection
- **type**: service-function
- **location**: `app/server/services/switching.service.ts` -> `checkRecallReleasePair()`
- **game_concept**: PTU p.229: separate recall + release = switch for League restriction
- **description**: Detects when a trainer has performed both a recall and release this round. Combined actions count as a Switch for League restriction. Cannot recall and release the same Pokemon in one round. Fainted switch is exempt.
- **inputs**: switchActions, trainerId, round
- **outputs**: { countsAsSwitch, recalledEntityIds, releasedEntityIds, isFaintedSwitch }
- **accessible_from**: gm (server-side)

### combat-C054: Mount Execution
- **type**: service-function
- **location**: `app/server/services/mounting.service.ts` -> `executeMount()`
- **game_concept**: PTU Mounting (p.218, p.306-307)
- **description**: Validates and executes mount action. Checks: rider is human, mount is Pokemon with Mountable capability, capacity not full, same side, adjacency, no blocking conditions (Fainted/Stuck/Frozen). Determines action cost (Standard or free with Mounted Prowess). Applies movement modifiers. Rider moves to mount's position. Applies Ride as One evasion sharing.
- **inputs**: combatants, riderId, mountId, skipCheck, weather
- **outputs**: MountResult (updatedCombatants, actionCost, checkRequired)
- **accessible_from**: gm (server-side)

### combat-C055: Dismount Execution
- **type**: service-function
- **location**: `app/server/services/mounting.service.ts` -> `executeDismount()`
- **game_concept**: PTU Dismounting
- **description**: Dismounts rider, finding adjacent empty cell. Restores Ride as One evasion values. Handles forced dismount (faint auto-dismount).
- **inputs**: combatants, riderId, forced, gridWidth, gridHeight
- **outputs**: DismountResult (updatedCombatants, riderPosition)
- **accessible_from**: gm (server-side)

### combat-C056: Faint Auto-Dismount
- **type**: service-function
- **location**: `app/server/services/mounting.service.ts` -> `clearMountOnFaint()`
- **game_concept**: PTU auto-dismount when mount/rider faints
- **description**: Clears mount state on faint. When mount faints: auto-dismounts rider with position placement. When rider faints: clears both mount states. Restores Ride as One evasion.
- **inputs**: combatants, faintedId, gridWidth, gridHeight
- **outputs**: { combatants, dismounted }
- **accessible_from**: gm (server-side)

### combat-C057: Mount Movement Reset
- **type**: service-function
- **location**: `app/server/services/mounting.service.ts` -> `resetMountMovement()`
- **game_concept**: Mount movement pool reset per round
- **description**: Resets movementRemaining for all active mount pairs based on mount's modifier-adjusted speed. Movement modifiers (Slowed, Speed CS, Sprint) applied from mount's conditions.
- **inputs**: combatants, weather
- **outputs**: Updated combatants array
- **accessible_from**: gm (server-side)

### combat-C058: Ride as One Evasion Sharing
- **type**: service-function
- **location**: `app/server/services/mounting.service.ts` -> `applyRideAsOneEvasion()`, `restoreRideAsOneEvasion()`
- **game_concept**: Ride as One feature (PTU p.103)
- **description**: Shares speed evasion between rider and mount. If different: both use higher. If same: both get +1. Stores originals for restoration on dismount.
- **inputs**: combatants, riderId, mountId
- **outputs**: Updated combatants array
- **accessible_from**: gm (server-side)

### combat-C059: Living Weapon Engage
- **type**: service-function
- **location**: `app/server/services/living-weapon.service.ts` -> `engageLivingWeapon()`
- **game_concept**: Living Weapon engagement (PTU pp.305-306)
- **description**: Validates and executes Living Weapon engage (Standard Action). Checks: wielder is human, weapon is Pokemon with Living Weapon capability, same side, not already wielding/wielded, adjacency. Per decree-043: Combat Skill Rank gates weapon move access, not engagement.
- **inputs**: combatants, wieldRelationships, wielderId, weaponId
- **outputs**: EngageResult (combatants, wieldRelationships, relationship, wielder, weapon)
- **accessible_from**: gm (server-side)

### combat-C060: Living Weapon Disengage
- **type**: service-function
- **location**: `app/server/services/living-weapon.service.ts` -> `disengageLivingWeapon()`
- **game_concept**: Living Weapon disengagement (Swift Action)
- **description**: Disengages a Living Weapon from either wielder or weapon side. Clears wield flags on both combatants and removes relationship. Cleans up wieldMovementUsed.
- **inputs**: combatants, wieldRelationships, combatantId
- **outputs**: DisengageResult (combatants, wieldRelationships, removedRelationship)
- **accessible_from**: gm (server-side)

### combat-C061: Living Weapon Equipment Overlay
- **type**: service-function
- **location**: `app/server/services/living-weapon.service.ts` -> `getEffectiveEquipmentBonuses()`
- **game_concept**: Living Weapon replaces weapon equipment slot
- **description**: Single integration point for equipment bonuses with Living Weapon overlay. Checks wield relationships and merges Living Weapon into equipment slots before computing bonuses. Replaces direct computeEquipmentBonuses() calls.
- **inputs**: wieldRelationships, combatant
- **outputs**: EquipmentCombatBonuses (DR, evasion, stat bonuses, speed CS, conditional DR/speed penalties)
- **accessible_from**: gm (server-side)

### combat-C062: Living Weapon Move Injection
- **type**: service-function
- **location**: `app/server/services/living-weapon.service.ts` -> `getEffectiveMoveList()`, `getGrantedWeaponMoves()`
- **game_concept**: Living Weapon grants weapon moves (PTU p.306)
- **description**: Injects weapon moves into a wielded Pokemon's move list, filtered by wielder's Combat skill rank. Adept moves need Adept Combat, Master moves need Master Combat (decree-043). Weapon moves cannot benefit from STAB (PTU p.287).
- **inputs**: wieldRelationships, combatants, combatant
- **outputs**: Move[] (base moves + weapon moves)
- **accessible_from**: gm (server-side)

### combat-C063: Living Weapon Faint State
- **type**: service-function
- **location**: `app/server/services/living-weapon.service.ts` -> `updateWieldFaintedState()`
- **game_concept**: Fainted Living Weapons usable as inanimate equipment (PTU p.305)
- **description**: Updates wield relationship fainted state. Fainted weapons are still usable as equipment but lose ability effects.
- **inputs**: wieldRelationships, weaponCombatantId, isFainted
- **outputs**: Updated wieldRelationships
- **accessible_from**: gm (server-side)

### combat-C064: Grid Placement Service
- **type**: service-function
- **location**: `app/server/services/grid-placement.service.ts` -> `findPlacementPosition()`, `sizeToTokenSize()`
- **game_concept**: Auto-placement of combatant tokens on VTT grid
- **description**: Finds available grid positions by side (players, allies, enemies). Two-pass: side area first, then full grid. Handles multi-cell tokens (Large=2x2, Huge=3x3, Gigantic=4x4). Maps PTU size to token size.
- **inputs**: occupiedCells, side, tokenSize, gridWidth, gridHeight
- **outputs**: Position { x, y }
- **accessible_from**: gm (server-side)

### combat-C065: Healing Item Service
- **type**: service-function
- **location**: `app/server/services/healing-item.service.ts` -> `validateItemApplication()`, `applyHealingItem()`, `checkItemRange()`
- **game_concept**: PTU healing items (Potion, Full Restore, Revive, status cures, etc.)
- **description**: Complete healing item pipeline: validation (category-specific rules), adjacency check (1m range, multi-cell token support), application (HP restore, status cure with CS reversal, revive, combined items, repulsive flag).
- **inputs**: itemName, target combatant; userPosition/targetPosition for range
- **outputs**: ItemApplicationResult { success, effects }
- **accessible_from**: gm (server-side)

### combat-C066: Equipment Bonuses Computation
- **type**: utility
- **location**: `app/utils/equipmentBonuses.ts` -> `computeEquipmentBonuses()`
- **game_concept**: PTU equipment combat bonuses (p.286-295)
- **description**: Computes aggregate combat bonuses from all equipped items: DR, evasion bonus (shields), stat bonuses (Focus -- one at a time, priority by slot), speed default CS (Heavy Armor = -1), conditional DR (Helmet vs crits), conditional speed penalties (Snow Boots).
- **inputs**: EquipmentSlots
- **outputs**: EquipmentCombatBonuses
- **accessible_from**: gm, group, player

### combat-C067: Weather Rules Constants
- **type**: constant
- **location**: `app/utils/weatherRules.ts`
- **game_concept**: PTU weather effects (pp.341-342)
- **description**: Defines weather damage rules: DAMAGING_WEATHER (hail/sandstorm), type immunities (HAIL_IMMUNE_TYPES, SANDSTORM_IMMUNE_TYPES), ability immunities (Ice Body, Snow Cloak, Sand Veil, Overcoat, Magic Guard, etc.), damage reduction abilities (Permafrost: -5), weather ability effects (healing/damage by ability and timing), adjacency-based immunities (Snow Cloak/Sand Veil protect adjacent allies).
- **inputs**: N/A (constants)
- **outputs**: Type/ability arrays, WeatherAbilityEffect definitions
- **accessible_from**: gm, group, player

### combat-C068: Status Condition Definitions
- **type**: constant
- **location**: `app/constants/statusConditions.ts` -> `STATUS_CONDITION_DEFS`
- **game_concept**: PTU status conditions with behavior flags (decree-038)
- **description**: Master definition of all 20 status conditions with independent behavior flags: clearsOnRecall, clearsOnEncounterEnd, clearsOnFaint. Derived arrays for recall-cleared, encounter-end-cleared, faint-cleared conditions. CS effects for Burn/Paralysis/Poison. Zero-evasion conditions (Vulnerable, Frozen, Asleep). Tick damage conditions.
- **inputs**: N/A (constants)
- **outputs**: StatusConditionDef records, derived arrays
- **accessible_from**: gm, group, player

### combat-C069: Combat Maneuver Definitions
- **type**: constant
- **location**: `app/constants/combatManeuvers.ts` -> `COMBAT_MANEUVERS`
- **game_concept**: PTU combat maneuvers (Push, Trip, Grapple, Disarm, Dirty Trick, Sprint, Disengage, Intercept, Breather)
- **description**: Defines all combat maneuvers with action type, AC, icon, short description, AoO provocation trigger, and target requirements. Includes standard (Push/Trip/Grapple/Disarm/Dirty Trick), shift (Disengage), full (Breather/Assisted Breather), and interrupt (Intercept Melee/Ranged).
- **inputs**: N/A (constants)
- **outputs**: Maneuver[]
- **accessible_from**: gm, group, player

### combat-C070: AoO Trigger Definitions
- **type**: constant
- **location**: `app/constants/aooTriggers.ts` -> `AOO_TRIGGER_MAP`
- **game_concept**: PTU AoO trigger types (p.241)
- **description**: Maps 5 AoO trigger types to check contexts: shift_away (movement), ranged_attack (attack), stand_up (status_change), maneuver_other (maneuver), retrieve_item (item_action). Also defines Struggle Attack constants (AC 4, DB4/DB5 for expert).
- **inputs**: N/A (constants)
- **outputs**: Trigger info records
- **accessible_from**: gm, group, player

### combat-C071: Flanking Detection
- **type**: composable-function
- **location**: `app/composables/useFlankingDetection.ts`
- **game_concept**: PTU Flanking (p.232): -2 evasion when flanked
- **description**: Reactive composable that computes flanking status for all combatants. Uses checkFlankingMultiTile for full multi-tile token support (Large needs 3 foes, Huge needs 4, Gigantic needs 5). Foes must be adjacent but NOT adjacent to each other. Watches position/side changes. Decree-040: flanking applied after evasion cap.
- **inputs**: Reactive combatant array from encounter store
- **outputs**: FlankingMap (combatantId -> FlankingStatus)
- **accessible_from**: gm, group (client-side VTT rendering)

### combat-C072: Flanking Geometry
- **type**: utility
- **location**: `app/utils/flankingGeometry.ts` -> `checkFlankingMultiTile()`, `FLANKING_EVASION_PENALTY`
- **game_concept**: PTU flanking geometry calculation
- **description**: Pure function for multi-tile flanking detection. Counts adjacent enemy cells, checks non-adjacency between attackers. FLANKING_EVASION_PENALTY = -2. Server-side usage in calculate-damage.post.ts for accuracy.
- **inputs**: target position/size, combatant array
- **outputs**: FlankingStatus { isFlanked, flankerIds }
- **accessible_from**: gm, group, player

### combat-C073: Type Effectiveness
- **type**: utility
- **location**: `app/utils/typeChart.ts` -> `TYPE_CHART`, `getTypeEffectiveness()`
- **game_concept**: PTU type effectiveness multipliers
- **description**: Full type chart with 18x18 effectiveness grid. getTypeEffectiveness handles dual-typing (multiplies both). Labels: super effective, not very effective, immune.
- **inputs**: moveType, targetTypes[]
- **outputs**: Multiplier (0, 0.25, 0.5, 1, 2, 4)
- **accessible_from**: gm, group, player

### combat-C074: Type-Status Immunity
- **type**: utility
- **location**: `app/utils/typeStatusImmunity.ts`
- **game_concept**: PTU type-based status immunities (e.g., Fire immune to Burn)
- **description**: Checks if a Pokemon's type grants immunity to a status condition. Used by status.post.ts with GM override (decree-012).
- **inputs**: Pokemon types, status condition
- **outputs**: boolean (immune or not)
- **accessible_from**: gm (server-side via API)

### combat-C075: Injury Mechanics
- **type**: utility
- **location**: `app/utils/injuryMechanics.ts` -> `checkHeavilyInjured()`, `applyHeavilyInjuredPenalty()`, `checkDeath()`
- **game_concept**: PTU Heavily Injured penalty (p.250) and death check
- **description**: Checks if combatant is Heavily Injured (5+ injuries) for turn-end HP penalty. Applies 10% max HP damage. Checks death condition.
- **inputs**: combatant
- **outputs**: Injury state checks and HP penalty application
- **accessible_from**: gm (server-side)

### combat-C076: Movement Modifiers
- **type**: utility
- **location**: `app/utils/movementModifiers.ts` -> `applyMovementModifiers()`
- **game_concept**: PTU movement-modifying conditions (Stuck, Slowed, Speed CS, Sprint)
- **description**: Applies movement-modifying conditions to a base movement speed. Stuck: 0. Tripped: 0 (must stand). Slowed: half. Speed CS: additive half-stage bonus (min 2). Sprint: +50%.
- **inputs**: combatant, baseSpeed, weather
- **outputs**: Modified movement speed
- **accessible_from**: gm, group, player

### combat-C077: PTU Grid Distance
- **type**: utility
- **location**: `app/utils/gridDistance.ts` -> `ptuDiagonalDistance()`, `ptuDistanceTokensBBox()`
- **game_concept**: PTU alternating diagonal movement cost (decree-002)
- **description**: Calculates PTU grid distance with alternating diagonal cost (1m, 2m, 1m...). ptuDistanceTokensBBox handles multi-tile token edge-to-edge distance.
- **inputs**: dx/dy or token positions+sizes
- **outputs**: Distance in meters
- **accessible_from**: gm, group, player

### combat-C078: Adjacency Utilities
- **type**: utility
- **location**: `app/utils/adjacency.ts` -> `areAdjacent()`, `getAdjacentEnemies()`, `wasAdjacentBeforeMove()`
- **game_concept**: PTU adjacency (1m) for AoO, melee, mounting, intercept
- **description**: Multi-tile token adjacency detection. areAdjacent checks edge-to-edge contact. getAdjacentEnemies finds all adjacent enemies. wasAdjacentBeforeMove checks pre-move adjacency for shift_away AoO.
- **inputs**: Positions and token sizes
- **outputs**: boolean or Combatant[]
- **accessible_from**: gm, group, player

### combat-C079: Combat Side Detection
- **type**: utility
- **location**: `app/utils/combatSides.ts` -> `isEnemySide()`
- **game_concept**: PTU friend/foe determination
- **description**: Determines if two combat sides are enemies. Players and Allies are friendly. Enemies are hostile to both.
- **inputs**: Two CombatSide values
- **outputs**: boolean
- **accessible_from**: gm, group, player

### combat-C080: Line of Attack
- **type**: utility
- **location**: `app/utils/lineOfAttack.ts` -> `getLineOfAttackCellsMultiTile()`, `canReachLineOfAttack()`
- **game_concept**: Intercept Ranged line of attack (PTU p.242)
- **description**: Calculates cells along the attack path for ranged intercept detection. Center-to-center for multi-tile tokens. canReachLineOfAttack checks if interceptor's movement range covers any cell on the line.
- **inputs**: Attacker/target positions and sizes; interceptor position and speed
- **outputs**: Cell array; { canReach } boolean
- **accessible_from**: gm (server-side)

### combat-C081: Experience Calculation
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts`
- **game_concept**: PTU XP from defeated enemies (p.460-461)
- **description**: Calculates XP from defeated enemies based on levels and significance multiplier (decree-030: capped at x5). Handles player count distribution and boss encounter bonuses.
- **inputs**: Defeated enemies list, significance multiplier, player count
- **outputs**: XpCalculationResult with breakdown
- **accessible_from**: gm (via API)

### combat-C082: Encounter Budget
- **type**: utility
- **location**: `app/utils/encounterBudget.ts`
- **game_concept**: PTU significance tiers for XP calculation
- **description**: Maps significance tier labels (insignificant, everyday, significant) to multiplier values. Used for pre-encounter XP estimation.
- **inputs**: SignificanceTier
- **outputs**: Multiplier
- **accessible_from**: gm

### combat-C083: Vision Rules
- **type**: utility
- **location**: `app/utils/visionRules.ts`
- **game_concept**: PTU vision capabilities (Darkvision, Tremorsense, etc.)
- **description**: Defines vision capabilities and their interaction with environment presets for accuracy penalties. getEffectiveEnvironmentPenalty calculates accuracy modifier based on combatant vision capabilities.
- **inputs**: Combatant vision state, environment preset
- **outputs**: Accuracy penalty (number)
- **accessible_from**: gm, group, player

### combat-C084: useCombat Composable
- **type**: composable-function
- **location**: `app/composables/useCombat.ts`
- **game_concept**: PTU combat calculation utilities for UI
- **description**: Client-side combat calculations: stage multipliers, HP formulas (Pokemon/Trainer), evasion calculation (physical/special/speed), health status, injury checking, XP gain, accuracy threshold, AP calculation, movement modifiers.
- **inputs**: Various stat/stage values
- **outputs**: Calculated combat values
- **accessible_from**: gm, group, player

### combat-C085: useMoveCalculation Composable
- **type**: composable-function
- **location**: `app/composables/useMoveCalculation.ts`
- **game_concept**: Full move resolution with accuracy, damage, effectiveness
- **description**: Complete move calculation composable: accuracy roll, damage per target, STAB, type effectiveness, weather modifiers (Weather Ball, Sand Force), equipment bonuses, flanking penalty integration, terrain type bonus, environment penalty, Living Weapon equipment overlay. Used by MoveTargetModal.
- **inputs**: move, actor, targets, allCombatants, flankingPenalty getter
- **outputs**: Per-target accuracy results and damage calculations
- **accessible_from**: gm, player

### combat-C086: Encounter Store
- **type**: store-action
- **location**: `app/stores/encounter.ts` -> `useEncounterStore`
- **game_concept**: Central encounter state management
- **description**: Core encounter store with full state management: CRUD (create, load, update, end), serve/unserve for Group View, WebSocket sync, weather management, wild Pokemon spawning, environment preset, significance multiplier, vision capabilities. Delegates combat actions to 5 composables via _buildContext().
- **inputs**: Various per-action
- **outputs**: Encounter state updates
- **accessible_from**: gm (primary), group (via serve), player (via serve)

### combat-C087: Encounter Store Getters
- **type**: store-getter
- **location**: `app/stores/encounter.ts` -> getters
- **game_concept**: Derived encounter state
- **description**: 30+ getters: isActive, isPaused, isServed, currentRound, battleType, isLeagueBattle, currentPhase, combatantsByInitiative, trainersByTurnOrder, pokemonByTurnOrder, currentCombatant, playerCombatants, allyCombatants, enemyCombatants, injuredCombatants, combatantsWithActions, moveLog, currentDeclarations, currentResolutionDeclaration, mountedRiders, isMountedRider, isBeingRidden, getMountPartner, getMountState, mountedPairs, canDismount, isWieldingWeapon, isBeingWielded, getWieldedWeapon, getWeaponWielder, wieldPairs.
- **inputs**: Encounter state
- **outputs**: Derived computed values
- **accessible_from**: gm, group, player

### combat-C088: Combat Store (API-only)
- **type**: store-action
- **location**: `app/stores/encounterCombat.ts` -> `useEncounterCombatStore`
- **game_concept**: Status, stages, injuries, special actions (Breather, Sprint, Pass)
- **description**: Zero-state API-only store for combat operations: addStatusCondition (with GM override decree-012), removeStatusCondition, updateStatusConditions, modifyStage, setCombatStages, takeABreather (assisted variant: 0 Evasion instead of Tripped+Vulnerable), sprint (+50% movement), pass turn, setPhase (League Battle), nextScene.
- **inputs**: encounterId, combatantId, various per-action
- **outputs**: Updated Encounter
- **accessible_from**: gm

### combat-C089: Grid Store (API-only)
- **type**: store-action
- **location**: `app/stores/encounterGrid.ts` -> `useEncounterGridStore`
- **game_concept**: VTT grid operations
- **description**: API-only store for grid operations: updateCombatantPosition, updateGridConfig (width/height/cellSize/isometric settings), setTokenSize, uploadBackgroundImage, removeBackgroundImage, loadFogState, saveFogState.
- **inputs**: encounterId, position/config/file
- **outputs**: Position, GridConfig, or fog state
- **accessible_from**: gm

### combat-C090: XP Store (API-only)
- **type**: store-action
- **location**: `app/stores/encounterXp.ts` -> `useEncounterXpStore`
- **game_concept**: PTU XP calculation and distribution
- **description**: XP management: calculateXp (preview with breakdown), distributeXp (apply to Pokemon with level-up detection), distributeTrainerXp (batch trainer XP). Significance multiplier and boss encounter support.
- **inputs**: encounterId, significanceMultiplier, playerCount, distribution arrays
- **outputs**: XP results with level changes
- **accessible_from**: gm

### combat-C091: usePlayerCombat Composable
- **type**: composable-function
- **location**: `app/composables/usePlayerCombat.ts`
- **game_concept**: Player combat actions (turn detection, move execution, requests)
- **description**: Player-side combat composable: turn detection (isMyTurn, myActiveCombatant), League Battle phase awareness, direct actions (use move, shift, struggle, pass turn via store), requested actions (use item, switch Pokemon, combat maneuvers via WebSocket to GM).
- **inputs**: Encounter store state, player identity
- **outputs**: Reactive turn state and action functions
- **accessible_from**: player

### combat-C092: Fog of War Store
- **type**: store-action
- **location**: `app/stores/fogOfWar.ts`
- **game_concept**: VTT fog of war (3-state: hidden/revealed/explored)
- **description**: Map-based fog state with per-cell visibility. Supports painting (reveal/hide/explore), bulk operations, and persistence via encounterGrid store.
- **inputs**: Cell coordinates, fog state values
- **outputs**: Fog state Map
- **accessible_from**: gm (editing), group (display)

### combat-C093: Terrain Store
- **type**: store-action
- **location**: `app/stores/terrain.ts`
- **game_concept**: VTT terrain cells with movement cost effects
- **description**: Map-based terrain state with base type (normal, water, hazard, etc.) and flags (slow, rough, blocking). Legacy migration from difficult/rough types. Import/export for persistence.
- **inputs**: Cell coordinates, terrain type and flags
- **outputs**: Terrain state Map
- **accessible_from**: gm (editing), group (display)

### combat-C094: Entity Sync Service
- **type**: service-function
- **location**: `app/server/services/entity-update.service.ts` -> `syncEntityToDatabase()`
- **game_concept**: Syncs combat changes back to Pokemon/HumanCharacter DB rows
- **description**: After combat operations modify combatant entities, syncs critical fields (HP, injuries, status conditions, stage modifiers) back to persistent DB records.
- **inputs**: combatant
- **outputs**: void (DB write)
- **accessible_from**: gm (server-side)

### combat-C095: WebSocket Combat Events
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Real-time GM-Group-Player combat sync
- **description**: WebSocket events for combat: turn_change, damage_applied, heal_applied, status_change, move_executed, combatant_added, combatant_removed, mount_change, living_weapon_engage, living_weapon_disengage, encounter_update, serve_encounter, encounter_unserved, player_action.
- **inputs**: Event type and data payload
- **outputs**: Broadcast to relevant clients
- **accessible_from**: gm, group, player

### combat-C096: Encounter Prisma Model
- **type**: prisma-model
- **location**: `app/prisma/schema.prisma` -> `Encounter`
- **game_concept**: Combat encounter persistence
- **description**: Stores all encounter state: name, battleType (trainer/full_contact), weather (with duration/source), combatants (denormalized JSON), turn tracking (round/index/order), League Battle phases (trainer_declaration/resolution/pokemon), declarations, switchActions, pendingActions, holdQueue, grid config (width/height/cellSize/isometric), fog of war, terrain, environment preset, move log, XP tracking (defeatedEnemies, significance multiplier/tier).
- **inputs**: N/A (schema)
- **outputs**: N/A (schema)
- **accessible_from**: gm (via API)

### combat-C097: Combatant Type
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` -> `Encounter.combatants` (JSON)
- **game_concept**: Individual combatant state in combat
- **description**: Denormalized JSON storing per-combatant: id, type (pokemon/human), entityId, entity (full snapshot), side, initiative, turnState (standardActionUsed/shiftActionUsed/swiftActionUsed/canBeCommanded/isHolding), outOfTurnUsage (aooUsed/priorityUsed/interruptUsed), holdAction, skipNextRound, mountState, wieldingWeaponId/wieldedByTrainerId, position, tokenSize, physicalEvasion/specialEvasion/speedEvasion, stageSources, badlyPoisonedRound, disengaged, visionState, tempConditions.
- **inputs**: N/A (type definition)
- **outputs**: N/A (type definition)
- **accessible_from**: gm (via API)

### combat-C098: MoveData Prisma Model
- **type**: prisma-model
- **location**: `app/prisma/schema.prisma` -> `MoveData`
- **game_concept**: PTU move reference data
- **description**: Reference table for all PTU moves: name, type, damageClass, frequency, ac, damageBase, range, effect, contestType/Effect. Seeded from CSV.
- **inputs**: N/A (schema)
- **outputs**: N/A (schema)
- **accessible_from**: gm, group, player (via API)

---

## API Endpoints (58 encounter endpoints)

### combat-C099: Create Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/index.post.ts`
- **game_concept**: Create new encounter
- **description**: Creates a new encounter with name, battleType, weather, significance.
- **inputs**: name, battleType, weather, significanceMultiplier, significanceTier
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C100: List Encounters
- **type**: api-endpoint
- **location**: `app/server/api/encounters/index.get.ts`
- **game_concept**: List all encounters
- **description**: Lists all encounters ordered by creation date.
- **inputs**: None
- **outputs**: Encounter[]
- **accessible_from**: gm

### combat-C101: Get Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id].get.ts`
- **game_concept**: Retrieve encounter state
- **description**: Gets a single encounter with full parsed state.
- **inputs**: encounter ID
- **outputs**: ParsedEncounter
- **accessible_from**: gm, group, player

### combat-C102: Update Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id].put.ts`
- **game_concept**: Update encounter state (undo/redo, bulk edits)
- **description**: Full PUT for encounter state. Used by undo/redo system.
- **inputs**: Full encounter body
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C103: Create from Scene
- **type**: api-endpoint
- **location**: `app/server/api/encounters/from-scene.post.ts`
- **game_concept**: Convert scene to encounter
- **description**: Creates an encounter from a scene, importing Pokemon and characters as combatants.
- **inputs**: sceneId, battleType, significance
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C104: Start Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/start.post.ts`
- **game_concept**: Begin combat (calculate initiative, set turn order)
- **description**: Starts an encounter: calculates initiative, sorts turn order, handles League Battle phase setup.
- **inputs**: encounter ID
- **outputs**: Encounter with turn order
- **accessible_from**: gm

### combat-C105: End Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/end.post.ts`
- **game_concept**: End combat, sync state back to DB entities
- **description**: Ends encounter: clears encounter-end conditions, resets stages, syncs all entities to DB. Sets isActive=false.
- **inputs**: encounter ID
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C106: Next Turn
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/next-turn.post.ts`
- **game_concept**: Advance to next combatant's turn (core turn lifecycle)
- **description**: Core turn progression: applies Heavily Injured HP penalty if Standard Action used, processes tick damage (Burn/Poison/Badly Poisoned/Cursed), syncs entity, advances turn index. League Battle: handles phase transitions (declaration -> resolution -> pokemon -> new round). New turn start: weather damage (Hail/Sandstorm), weather abilities, weather duration decrement, hold queue check, Flinch removal.
- **inputs**: encounter ID
- **outputs**: Encounter with tick/weather damage results
- **accessible_from**: gm

### combat-C107: Apply Damage
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/damage.post.ts`
- **game_concept**: Apply HP damage to combatant
- **description**: Applies damage with full PTU mechanics: temp HP absorption, massive damage injuries, HP marker injuries, faint handling, auto-dismount on faint, entity sync.
- **inputs**: combatantId, damage, suppressDeath
- **outputs**: Encounter with damage results
- **accessible_from**: gm

### combat-C108: Heal Combatant
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/heal.post.ts`
- **game_concept**: Heal HP/injuries/tempHP on combatant
- **description**: Heals a combatant: HP (capped at effective max), temp HP (keep-higher), injuries. Auto-removes Fainted on HP recovery.
- **inputs**: combatantId, amount, tempHp, healInjuries
- **outputs**: Encounter with heal results
- **accessible_from**: gm

### combat-C109: Calculate Damage (Read-only)
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/calculate-damage.post.ts`
- **game_concept**: Full PTU 9-step damage calculation with server-side context
- **description**: Read-only damage calculation with full server context: Living Weapon equipment overlay, flanking detection, Ride as One modifiers, Weather Ball/Sand Force, No Guard, zero-evasion conditions, environment penalty. Returns detailed breakdown.
- **inputs**: attackerId, targetId, moveName, isCritical, damageReduction
- **outputs**: DamageCalcResult with accuracy and breakdown
- **accessible_from**: gm

### combat-C110: Status Conditions
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/status.post.ts`
- **game_concept**: Add/remove status conditions with type immunity and CS automation
- **description**: Adds/removes status conditions. Checks type immunity (decree-012: GM override available). Auto-applies/reverses CS effects (decree-005). Triggers initiative reorder on Paralysis speed change (decree-006).
- **inputs**: combatantId, add[], remove[], override
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C111: Combat Stages
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/stages.post.ts`
- **game_concept**: Modify combat stages
- **description**: Modifies combat stages (delta or absolute). Triggers initiative reorder on Speed stage change (decree-006).
- **inputs**: combatantId, changes (stat -> value), absolute
- **outputs**: Encounter with stage changes
- **accessible_from**: gm

### combat-C112: Add Combatant
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/combatants.post.ts`
- **game_concept**: Add Pokemon or trainer to encounter
- **description**: Adds a combatant: builds from entity, calculates initiative, places on grid, inserts into turn order.
- **inputs**: entityId, entityType, side, initiativeBonus
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C113: Remove Combatant
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts`
- **game_concept**: Remove combatant from encounter
- **description**: Removes combatant, adjusts turn order, clears mount/wield state on partner, syncs entity to DB.
- **inputs**: encounter ID, combatantId
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C114: Move Combatant Position
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/position.post.ts`
- **game_concept**: Move combatant on VTT grid
- **description**: Updates combatant position on the grid. Handles mounted pair synchronization.
- **inputs**: combatantId, position { x, y }
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C115: Move Action
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/move.post.ts`
- **game_concept**: Execute a move action
- **description**: Executes a move: records in move log, tracks frequency usage.
- **inputs**: actorId, moveId, targetIds, damage, notes
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C116: Generic Action
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/action.post.ts`
- **game_concept**: Consume a standard/shift/swift action
- **description**: Marks an action type as used on a combatant's turn state.
- **inputs**: combatantId, actionType
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C117: Switch Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/switch.post.ts`
- **game_concept**: Full Pokemon switch (recall + release)
- **description**: Complete switch: validates, recalls Pokemon (clears side effects), releases new Pokemon (builds combatant, places on grid, inserts into turn order). Handles fainted/forced switch variants. Tracks switch action for League restriction. Syncs entities to DB.
- **inputs**: trainerId, recallCombatantId, releaseEntityId, faintedSwitch, forced, releasePosition
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C118: Recall Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/recall.post.ts`
- **game_concept**: Recall Pokemon without releasing replacement
- **description**: Recalls a Pokemon: validates range and ownership, applies recall side effects, removes from encounter, adjusts turn order. Clears mount/wield state. Fainted recall exemption: fainted Pokemon can be recalled as Shift Action (no Trapped restriction per PTU p.229).
- **inputs**: trainerId, pokemonCombatantIds[]
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C119: Release Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/release.post.ts`
- **game_concept**: Release Pokemon without recalling existing one
- **description**: Releases Pokemon onto the field: builds combatant, places on grid (near trainer or at specified position), inserts into turn order. Checks League restriction for commandability.
- **inputs**: trainerId, pokemonEntityIds[], positions[]
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C120: Take a Breather
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/breather.post.ts`
- **game_concept**: Take a Breather (PTU p.245)
- **description**: Full Action: resets all stages to 0, removes temp HP, cures volatile conditions, applies Tripped+Vulnerable (or 0 Evasion for assisted variant). Re-applies persistent condition CS effects after stage reset.
- **inputs**: combatantId, assisted
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C121: Sprint Action
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/sprint.post.ts`
- **game_concept**: Sprint (PTU p.228)
- **description**: Standard Action: adds Sprint temp condition for +50% movement speed until next turn. Consumes Standard Action.
- **inputs**: combatantId
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C122: Pass Turn
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/pass.post.ts`
- **game_concept**: Pass/forfeit remaining actions
- **description**: Marks all actions as used, ending the combatant's turn.
- **inputs**: combatantId
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C123: Disengage
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/disengage.post.ts`
- **game_concept**: Disengage (PTU p.241)
- **description**: Shift Action: marks combatant as disengaged, preventing shift_away AoO for this turn.
- **inputs**: combatantId
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C124: AoO Detection
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/aoo-detect.post.ts`
- **game_concept**: Detect AoO opportunities
- **description**: Detects AoO triggers from a specific action. Adds to pendingActions queue.
- **inputs**: actorId, triggerType, context
- **outputs**: Encounter with new pending actions
- **accessible_from**: gm

### combat-C125: AoO Resolution
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/aoo-resolve.post.ts`
- **game_concept**: Accept/decline pending AoO
- **description**: Resolves a pending AoO: accept (marks aooUsed) or decline.
- **inputs**: actionId, accepted, damageRoll
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C126: Hold Action
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/hold-action.post.ts`
- **game_concept**: Hold Action (PTU p.227)
- **description**: Holds the current combatant's action until specified initiative value.
- **inputs**: combatantId, holdUntilInitiative
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C127: Release Hold
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/release-hold.post.ts`
- **game_concept**: Release a held action
- **description**: Releases a held combatant, restoring full action economy.
- **inputs**: combatantId
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C128: Priority Action
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/priority.post.ts`
- **game_concept**: Priority Action (PTU p.228)
- **description**: Declares a Priority action (standard, limited, or advanced variant).
- **inputs**: combatantId, variant, actionDescription
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C129: Interrupt Action
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/interrupt.post.ts`
- **game_concept**: Interrupt Action (PTU p.228-229)
- **description**: Declares an Interrupt action with trigger context.
- **inputs**: combatantId, triggerId, triggerType, options
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C130: Intercept Melee
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/intercept-melee.post.ts`
- **game_concept**: Intercept Melee resolution (PTU p.242)
- **description**: Resolves a melee intercept action with skill check.
- **inputs**: interceptorId, targetId, attackerId, actionId, skillCheck
- **outputs**: Encounter with intercept results
- **accessible_from**: gm

### combat-C131: Intercept Ranged
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/intercept-ranged.post.ts`
- **game_concept**: Intercept Ranged resolution (PTU p.242)
- **description**: Resolves a ranged intercept action with skill check and target square.
- **inputs**: interceptorId, targetSquare, attackerId, actionId, skillCheck
- **outputs**: Encounter with intercept results
- **accessible_from**: gm

### combat-C132: Declare (League Battle)
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/declare.post.ts`
- **game_concept**: Trainer declaration phase (League Battle, decree-021)
- **description**: Submits a trainer declaration during the declaration phase of a League Battle.
- **inputs**: combatantId, actionType, description, targetIds
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C133: Weather Management
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/weather.post.ts`
- **game_concept**: Set/clear encounter weather
- **description**: Sets or clears weather with optional source (move/ability/manual) and duration (0=indefinite, 5=standard).
- **inputs**: weather, source, duration
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C134: Use Item in Combat
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/use-item.post.ts`
- **game_concept**: Use healing item during combat
- **description**: Applies a healing item in combat: validates, checks range, applies effects (HP/status cure/revive), handles action economy.
- **inputs**: itemName, userId, targetId, options
- **outputs**: Encounter with item results
- **accessible_from**: gm

### combat-C135: Wild Spawn
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/wild-spawn.post.ts`
- **game_concept**: Spawn wild Pokemon into encounter
- **description**: Generates and adds wild Pokemon to an active encounter. Uses pokemon-generator service.
- **inputs**: pokemon array (species/level), side
- **outputs**: Encounter with added combatants
- **accessible_from**: gm

### combat-C136: Mount
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/mount.post.ts`
- **game_concept**: Mount Pokemon (PTU p.218)
- **description**: Executes mount action via mounting service.
- **inputs**: riderId, mountId, skipCheck
- **outputs**: Encounter with mount state
- **accessible_from**: gm

### combat-C137: Dismount
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/dismount.post.ts`
- **game_concept**: Dismount from Pokemon
- **description**: Executes dismount action via mounting service.
- **inputs**: riderId, forced, skipCheck
- **outputs**: Encounter with dismount state
- **accessible_from**: gm

### combat-C138: Living Weapon Engage
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/living-weapon/engage.post.ts`
- **game_concept**: Engage Living Weapon (PTU pp.305-306)
- **description**: Engages a Living Weapon via service, refreshes equipment bonuses and initiative.
- **inputs**: wielderId, weaponId
- **outputs**: Encounter with wield state
- **accessible_from**: gm

### combat-C139: Living Weapon Disengage
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/living-weapon/disengage.post.ts`
- **game_concept**: Disengage Living Weapon
- **description**: Disengages a Living Weapon via service, refreshes equipment bonuses and initiative.
- **inputs**: combatantId
- **outputs**: Encounter with cleared wield state
- **accessible_from**: gm

### combat-C140: Serve Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/serve.post.ts`
- **game_concept**: Serve encounter to Group View
- **description**: Marks encounter as served and broadcasts to Group View clients.
- **inputs**: encounter ID
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C141: Unserve Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/unserve.post.ts`
- **game_concept**: Remove encounter from Group View
- **description**: Marks encounter as unserved.
- **inputs**: encounter ID
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C142: Get Served Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/served.get.ts`
- **game_concept**: Group/Player view encounter loading
- **description**: Returns the currently served encounter, if any.
- **inputs**: None
- **outputs**: Encounter | null
- **accessible_from**: gm, group, player

### combat-C143: Grid Config
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/grid-config.put.ts`
- **game_concept**: VTT grid configuration
- **description**: Updates grid config (width, height, cellSize, isometric settings).
- **inputs**: Partial GridConfig
- **outputs**: Updated config
- **accessible_from**: gm

### combat-C144: Background Image Upload/Delete
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/background.post.ts`, `background.delete.ts`
- **game_concept**: VTT grid background
- **description**: Upload or remove grid background image.
- **inputs**: File (multipart) or none
- **outputs**: Background URL or void
- **accessible_from**: gm

### combat-C145: Fog of War Get/Put
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/fog.get.ts`, `fog.put.ts`
- **game_concept**: VTT fog of war persistence
- **description**: Load or save fog of war state (enabled, cells, defaultState).
- **inputs**: Fog state object
- **outputs**: Fog state
- **accessible_from**: gm

### combat-C146: Terrain Get/Put
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/terrain.get.ts`, `terrain.put.ts`
- **game_concept**: VTT terrain persistence
- **description**: Load or save terrain state.
- **inputs**: Terrain state object
- **outputs**: Terrain state
- **accessible_from**: gm

### combat-C147: XP Calculation
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-calculate.post.ts`
- **game_concept**: PTU XP preview calculation (p.460)
- **description**: Calculates XP from defeated enemies without distributing.
- **inputs**: significanceMultiplier, playerCount, trainerEnemyIds, isBossEncounter
- **outputs**: XP totals and breakdown
- **accessible_from**: gm

### combat-C148: XP Distribution (Pokemon)
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-distribute.post.ts`
- **game_concept**: PTU Pokemon XP distribution (p.460-461)
- **description**: Applies XP to Pokemon, handles level-up and evolution triggers.
- **inputs**: distribution array, significance, playerCount
- **outputs**: XP results with level changes
- **accessible_from**: gm

### combat-C149: Trainer XP Distribution
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/trainer-xp-distribute.post.ts`
- **game_concept**: PTU Trainer XP distribution (p.461)
- **description**: Batch distributes trainer XP with level-up detection.
- **inputs**: distribution array
- **outputs**: Trainer XP results
- **accessible_from**: gm

### combat-C150: Significance
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/significance.put.ts`
- **game_concept**: Encounter significance for XP (decree-030: capped at x5)
- **description**: Sets significance multiplier and tier on an encounter.
- **inputs**: significanceMultiplier, significanceTier
- **outputs**: Updated encounter
- **accessible_from**: gm

### combat-C151: Environment Preset
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/environment-preset.put.ts`
- **game_concept**: Environment presets for accuracy penalties (PTU ptu-rule-058)
- **description**: Sets or clears the active environment preset on an encounter.
- **inputs**: environmentPreset (object or null)
- **outputs**: Updated encounter
- **accessible_from**: gm

### combat-C152: Vision Capability Toggle
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts`
- **game_concept**: Vision capabilities (Darkvision, etc.) per decree-048
- **description**: Toggles a vision capability on a combatant (manual or source-based).
- **inputs**: capability, enabled, source
- **outputs**: Encounter
- **accessible_from**: gm

### combat-C153: Next Scene
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/next-scene.post.ts`
- **game_concept**: PTU scene boundary (move frequency reset)
- **description**: Advances to next scene within an encounter, resetting scene-frequency moves.
- **inputs**: encounter ID
- **outputs**: Encounter
- **accessible_from**: gm

---

## UI Components (41 encounter components)

### combat-C154: CombatantCard
- **type**: component
- **location**: `app/components/encounter/CombatantCard.vue`
- **game_concept**: Individual combatant display with stats and actions
- **description**: Full combatant card showing HP, status conditions, stages, initiative, turn state, actions. Used in GM encounter view.
- **accessible_from**: gm

### combat-C155: GroupCombatantCard
- **type**: component
- **location**: `app/components/encounter/GroupCombatantCard.vue`
- **game_concept**: Combatant display for Group View (shared TV/projector)
- **description**: Simplified combatant card for Group View display. Read-only.
- **accessible_from**: group

### combat-C156: PlayerCombatantCard
- **type**: component
- **location**: `app/components/encounter/PlayerCombatantCard.vue`
- **game_concept**: Player's own combatant in Player View
- **description**: Player-facing combatant card with available actions during their turn.
- **accessible_from**: player

### combat-C157: DamageSection
- **type**: component
- **location**: `app/components/encounter/DamageSection.vue`
- **game_concept**: Damage application interface
- **description**: UI for applying damage to combatants with numeric input.
- **accessible_from**: gm

### combat-C158: StatusConditionsModal
- **type**: component
- **location**: `app/components/encounter/StatusConditionsModal.vue`
- **game_concept**: Status condition management UI
- **description**: Modal for adding/removing status conditions with category grouping and override option.
- **accessible_from**: gm

### combat-C159: CombatStagesModal
- **type**: component
- **location**: `app/components/encounter/CombatStagesModal.vue`
- **game_concept**: Combat stage adjustment UI
- **description**: Modal for adjusting combat stages (+/- buttons per stat).
- **accessible_from**: gm

### combat-C160: SwitchPokemonModal
- **type**: component
- **location**: `app/components/encounter/SwitchPokemonModal.vue`
- **game_concept**: Pokemon switching interface
- **description**: Modal for switching Pokemon: select recalled and released Pokemon, handles fainted/forced variants.
- **accessible_from**: gm

### combat-C161: MoveButton
- **type**: component
- **location**: `app/components/encounter/MoveButton.vue`
- **game_concept**: Move action trigger
- **description**: Button for each move showing type, frequency, DB. Opens MoveTargetModal.
- **accessible_from**: gm, player

### combat-C162: MoveTargetModal
- **type**: component
- **location**: `app/components/encounter/MoveTargetModal.vue`
- **game_concept**: Move target selection with damage preview
- **description**: Modal for selecting move targets and previewing damage calculation with full breakdown (STAB, effectiveness, weather, flanking, accuracy).
- **accessible_from**: gm, player

### combat-C163: MoveInfoCard
- **type**: component
- **location**: `app/components/encounter/MoveInfoCard.vue`
- **game_concept**: Move detail display
- **description**: Shows full move info: type, class, frequency, AC, DB, range, effect.
- **accessible_from**: gm, player

### combat-C164: TargetSelector
- **type**: component
- **location**: `app/components/encounter/TargetSelector.vue`
- **game_concept**: Target selection for moves/maneuvers
- **description**: Component for selecting valid targets.
- **accessible_from**: gm

### combat-C165: TargetDamageList
- **type**: component
- **location**: `app/components/encounter/TargetDamageList.vue`
- **game_concept**: Per-target damage results display
- **description**: Lists damage calculation results per target with effectiveness labels.
- **accessible_from**: gm

### combat-C166: AddCombatantModal
- **type**: component
- **location**: `app/components/encounter/AddCombatantModal.vue`
- **game_concept**: Add entities to encounter
- **description**: Modal for selecting Pokemon/trainers to add as combatants with side selection.
- **accessible_from**: gm

### combat-C167: GMActionModal
- **type**: component
- **location**: `app/components/encounter/GMActionModal.vue`
- **game_concept**: GM combat action menu (maneuvers, items, special actions)
- **description**: GM action interface showing available combat maneuvers (Push, Trip, Grapple, etc.), special actions (Breather, Sprint, Pass), item use, and Pokemon switching.
- **accessible_from**: gm

### combat-C168: ManeuverGrid
- **type**: component
- **location**: `app/components/encounter/ManeuverGrid.vue`
- **game_concept**: Combat maneuver selection grid
- **description**: Grid display of available combat maneuvers with icons and descriptions.
- **accessible_from**: gm

### combat-C169: AoOPrompt
- **type**: component
- **location**: `app/components/encounter/AoOPrompt.vue`
- **game_concept**: Attack of Opportunity prompt
- **description**: UI prompt for accepting/declining AoO opportunities.
- **accessible_from**: gm

### combat-C170: InterceptPrompt
- **type**: component
- **location**: `app/components/encounter/InterceptPrompt.vue`
- **game_concept**: Intercept opportunity prompt
- **description**: UI prompt for intercept melee/ranged opportunities.
- **accessible_from**: gm

### combat-C171: HoldActionButton
- **type**: component
- **location**: `app/components/encounter/HoldActionButton.vue`
- **game_concept**: Hold Action UI
- **description**: Button for holding the current combatant's action.
- **accessible_from**: gm

### combat-C172: PriorityActionPanel
- **type**: component
- **location**: `app/components/encounter/PriorityActionPanel.vue`
- **game_concept**: Priority Action UI
- **description**: Panel for declaring Priority actions (standard/limited/advanced).
- **accessible_from**: gm

### combat-C173: DeclarationPanel
- **type**: component
- **location**: `app/components/encounter/DeclarationPanel.vue`
- **game_concept**: League Battle declaration phase
- **description**: UI for trainer declarations during League Battle declaration phase.
- **accessible_from**: gm

### combat-C174: DeclarationSummary
- **type**: component
- **location**: `app/components/encounter/DeclarationSummary.vue`
- **game_concept**: League Battle declaration summary
- **description**: Shows submitted declarations for current round.
- **accessible_from**: gm

### combat-C175: WeatherEffectIndicator
- **type**: component
- **location**: `app/components/encounter/WeatherEffectIndicator.vue`
- **game_concept**: Weather condition display
- **description**: Visual indicator for active weather and its effects.
- **accessible_from**: gm, group

### combat-C176: EnvironmentSelector
- **type**: component
- **location**: `app/components/encounter/EnvironmentSelector.vue`
- **game_concept**: Environment preset selection
- **description**: Selector for environment presets that affect accuracy.
- **accessible_from**: gm

### combat-C177: MountControls
- **type**: component
- **location**: `app/components/encounter/MountControls.vue`
- **game_concept**: Mount/dismount UI
- **description**: Controls for mounting/dismounting Pokemon.
- **accessible_from**: gm

### combat-C178: UseItemModal
- **type**: component
- **location**: `app/components/encounter/UseItemModal.vue`
- **game_concept**: In-combat item usage
- **description**: Modal for selecting and applying items in combat.
- **accessible_from**: gm

### combat-C179: CaptureRateDisplay
- **type**: component
- **location**: `app/components/encounter/CaptureRateDisplay.vue`
- **game_concept**: Capture rate calculation display
- **description**: Shows capture rate for a target Pokemon with ball selection.
- **accessible_from**: gm

### combat-C180: TempHpModal
- **type**: component
- **location**: `app/components/encounter/TempHpModal.vue`
- **game_concept**: Temporary HP granting
- **description**: Modal for granting temporary HP to a combatant.
- **accessible_from**: gm

### combat-C181: SignificancePanel
- **type**: component
- **location**: `app/components/encounter/SignificancePanel.vue`
- **game_concept**: Encounter significance for XP
- **description**: Panel for setting encounter significance tier and multiplier.
- **accessible_from**: gm

### combat-C182: XpDistributionModal
- **type**: component
- **location**: `app/components/encounter/XpDistributionModal.vue`
- **game_concept**: XP distribution after encounter
- **description**: Modal for calculating and distributing Pokemon XP.
- **accessible_from**: gm

### combat-C183: XpDistributionResults
- **type**: component
- **location**: `app/components/encounter/XpDistributionResults.vue`
- **game_concept**: XP distribution results display
- **description**: Shows XP distribution results with level-ups.
- **accessible_from**: gm

### combat-C184: TrainerXpSection
- **type**: component
- **location**: `app/components/encounter/TrainerXpSection.vue`
- **game_concept**: Trainer XP distribution
- **description**: Section for distributing trainer XP.
- **accessible_from**: gm

### combat-C185: BudgetIndicator
- **type**: component
- **location**: `app/components/encounter/BudgetIndicator.vue`
- **game_concept**: Encounter budget/difficulty estimation
- **description**: Visual indicator of encounter difficulty relative to party level.
- **accessible_from**: gm

### combat-C186: LevelUpNotification
- **type**: component
- **location**: `app/components/encounter/LevelUpNotification.vue`
- **game_concept**: Level-up notification during combat
- **description**: Notification when a Pokemon levels up from XP distribution.
- **accessible_from**: gm

### combat-C187: VisionCapabilityToggle
- **type**: component
- **location**: `app/components/encounter/VisionCapabilityToggle.vue`
- **game_concept**: Vision capability toggle per decree-048
- **description**: Toggle for enabling/disabling vision capabilities on a combatant.
- **accessible_from**: gm

### combat-C188: GmToastContainer
- **type**: component
- **location**: `app/components/encounter/GmToastContainer.vue`
- **game_concept**: Combat notification system
- **description**: Toast notification container for combat events (damage, healing, status changes).
- **accessible_from**: gm

### combat-C189: PlayerRequestPanel
- **type**: component
- **location**: `app/components/encounter/PlayerRequestPanel.vue`
- **game_concept**: Player action requests display
- **description**: Panel showing pending player action requests for GM approval.
- **accessible_from**: gm

### combat-C190: CombatantGmActions
- **type**: component
- **location**: `app/components/encounter/CombatantGmActions.vue`
- **game_concept**: Per-combatant GM action buttons
- **description**: Action button row for GM per-combatant: damage, heal, status, stages, switch, item, etc.
- **accessible_from**: gm

### combat-C191: CombatantConditionsSection
- **type**: component
- **location**: `app/components/encounter/CombatantConditionsSection.vue`
- **game_concept**: Status condition display on combatant card
- **description**: Displays active status conditions with color coding and removal buttons.
- **accessible_from**: gm, group, player

### combat-C192: CombatantCaptureSection
- **type**: component
- **location**: `app/components/encounter/CombatantCaptureSection.vue`
- **game_concept**: Capture interface on wild Pokemon
- **description**: Capture rate display and ball selection for wild Pokemon combatants.
- **accessible_from**: gm

### combat-C193: BreatherShiftBanner
- **type**: component
- **location**: `app/components/encounter/BreatherShiftBanner.vue`
- **game_concept**: Take a Breather shift reminder
- **description**: Banner reminding combatant to shift away from enemies after taking a breather.
- **accessible_from**: gm

---

## VTT Components (16 components)

### combat-C194: VTTContainer
- **type**: component
- **location**: `app/components/vtt/VTTContainer.vue`
- **game_concept**: VTT grid container (2D and isometric)
- **description**: Main VTT container orchestrating grid rendering, interaction, fog, terrain, and measurement tools.
- **accessible_from**: gm, group

### combat-C195: GridCanvas
- **type**: component
- **location**: `app/components/vtt/GridCanvas.vue`
- **game_concept**: 2D grid rendering
- **description**: HTML5 Canvas for 2D grid with tokens, fog, terrain overlays.
- **accessible_from**: gm, group

### combat-C196: IsometricCanvas
- **type**: component
- **location**: `app/components/vtt/IsometricCanvas.vue`
- **game_concept**: Isometric grid rendering
- **description**: Isometric 3D view with elevation support.
- **accessible_from**: gm, group

### combat-C197: GroupGridCanvas
- **type**: component
- **location**: `app/components/vtt/GroupGridCanvas.vue`
- **game_concept**: Group View grid display (read-only)
- **description**: Read-only grid canvas for Group View showing fog-of-war filtered state.
- **accessible_from**: group

### combat-C198: VTTToken
- **type**: component
- **location**: `app/components/vtt/VTTToken.vue`
- **game_concept**: Combatant token on VTT
- **description**: Visual token for a combatant showing sprite, HP bar, status indicators. Multi-tile support.
- **accessible_from**: gm, group

### combat-C199: VTTMountedToken
- **type**: component
- **location**: `app/components/vtt/VTTMountedToken.vue`
- **game_concept**: Mounted pair token display
- **description**: Combined token display for mounted rider+mount pairs.
- **accessible_from**: gm, group

---

## Capability Chains

### Chain 1: Damage Application (GM -> server -> DB)
1. **CombatantGmActions** (gm) -> **DamageSection** (gm)
2. -> `encounter.applyDamage()` (store action)
3. -> `POST /api/encounters/:id/damage` (API)
4. -> `combatant.service.calculateDamage()` -> `applyDamageToEntity()` -> `applyFaintStatus()`
5. -> `mounting.service.clearMountOnFaint()` (if fainted)
6. -> `entity-update.service.syncEntityToDatabase()`
7. -> WebSocket `damage_applied` broadcast
- **accessible_from**: gm -> group (via WS), player (via WS)

### Chain 2: Move Execution
1. **MoveButton** -> **MoveTargetModal** (gm/player)
2. -> `encounter.executeMove()` (store action)
3. -> `POST /api/encounters/:id/move` (API)
4. -> Move log recording, frequency tracking
5. -> WebSocket `move_executed` broadcast
- **accessible_from**: gm, player (via WS request)

### Chain 3: Turn Progression
1. GM clicks "Next Turn"
2. -> `encounter.nextTurn()` (store)
3. -> `POST /api/encounters/:id/next-turn` (API)
4. -> Turn-end: Heavily Injured penalty, tick damage (Burn/Poison/Cursed), entity sync
5. -> Turn-start: Weather damage (Hail/Sandstorm with immunities + Permafrost), weather abilities, hold queue check, Flinch removal
6. -> League Battle phase transitions
7. -> WebSocket `turn_change` broadcast
- **accessible_from**: gm -> group, player

### Chain 4: Pokemon Switching
1. **SwitchPokemonModal** (gm)
2. -> `encounter.switchPokemon()` (store)
3. -> `POST /api/encounters/:id/switch` (API)
4. -> `switching.service.validateSwitch()` -> recall side effects -> build new combatant -> place on grid -> insert into turn order
5. -> League commandability restriction check
6. -> Entity sync for both recalled and released Pokemon
7. -> WebSocket broadcast
- **accessible_from**: gm -> group, player

### Chain 5: Status Condition Management
1. **StatusConditionsModal** (gm)
2. -> `encounterCombat.addStatusCondition()` (store)
3. -> `POST /api/encounters/:id/status` (API)
4. -> Type immunity check (decree-012: GM override) -> `combatant.service.updateStatusConditions()` -> CS auto-application/reversal (decree-005) -> initiative reorder (decree-006)
5. -> Entity sync -> WebSocket broadcast
- **accessible_from**: gm -> group, player

### Chain 6: Combat Stage Modification
1. **CombatStagesModal** (gm)
2. -> `encounterCombat.modifyStage()` (store)
3. -> `POST /api/encounters/:id/stages` (API)
4. -> `combatant.service.updateStageModifiers()` -> initiative reorder on Speed change (decree-006)
5. -> Entity sync -> WebSocket broadcast
- **accessible_from**: gm -> group, player

### Chain 7: Out-of-Turn Action (AoO)
1. Movement/action triggers AoO detection
2. -> `encounter.detectAoO()` (store)
3. -> `POST /api/encounters/:id/aoo-detect` (API)
4. -> `out-of-turn.service.detectAoOTriggers()` -> creates pending actions
5. -> **AoOPrompt** shown to GM
6. -> `encounter.resolveAoO()` -> `POST /api/encounters/:id/aoo-resolve`
7. -> `out-of-turn.service.resolveAoOAction()`
- **accessible_from**: gm

### Chain 8: Intercept Detection + Resolution
1. Melee/ranged attack on ally triggers intercept detection
2. -> `detectInterceptMelee()` or `detectInterceptRanged()` (in damage endpoint)
3. -> **InterceptPrompt** shown to GM
4. -> `encounter.interceptMelee()`/`interceptRanged()` (store)
5. -> `POST /api/encounters/:id/intercept-melee` or `intercept-ranged`
6. -> `intercept.service.resolveInterceptMelee()`/`resolveInterceptRanged()`
7. -> Position updates, action economy consumed
- **accessible_from**: gm

### Chain 9: Mount/Dismount
1. **MountControls** (gm)
2. -> `encounter.mountRider()` or `dismountRider()` (store)
3. -> `POST /api/encounters/:id/mount` or `dismount`
4. -> `mounting.service.executeMount()`/`executeDismount()`
5. -> Ride as One evasion sharing applied/restored
6. -> Position synchronization
7. -> WebSocket `mount_change` broadcast
- **accessible_from**: gm -> group

### Chain 10: Living Weapon Engage/Disengage
1. GM action on combatant card
2. -> `POST /api/encounters/:id/living-weapon/engage` or `disengage`
3. -> `living-weapon.service.engageLivingWeapon()`/`disengageLivingWeapon()`
4. -> Equipment overlay applied/removed -> evasion refresh -> initiative recalc
5. -> WebSocket `living_weapon_engage`/`living_weapon_disengage` broadcast
- **accessible_from**: gm -> group

### Chain 11: XP Distribution
1. **SignificancePanel** -> **XpDistributionModal** (gm)
2. -> `encounterXp.calculateXp()` (store) -> `POST /api/encounters/:id/xp-calculate`
3. -> GM reviews and approves
4. -> `encounterXp.distributeXp()` -> `POST /api/encounters/:id/xp-distribute`
5. -> Pokemon XP applied, level-ups detected
6. -> `encounterXp.distributeTrainerXp()` -> `POST /api/encounters/:id/trainer-xp-distribute`
- **accessible_from**: gm

### Chain 12: Player Combat Action
1. **PlayerCombatantCard** (player) -> action buttons
2. -> `usePlayerCombat()` composable
3. -> Direct: store action (move, pass). Requested: WebSocket `player_action` to GM
4. -> GM receives in **PlayerRequestPanel**, approves/denies
5. -> Response routed back to player via WebSocket
- **accessible_from**: player -> gm (via WS)

### Chain 13: Server-Side Damage Calculation
1. **MoveTargetModal** or client code
2. -> `POST /api/encounters/:id/calculate-damage` (read-only)
3. -> Full server context: Living Weapon overlay, flanking, Ride as One, Weather Ball, Sand Force, No Guard, zero-evasion conditions, environment penalty
4. -> Returns DamageCalcResult with accuracy and breakdown
- **accessible_from**: gm, player

---

## Accessibility Summary

| Access Level | Capability IDs |
|---|---|
| **gm-only** | C011-C022, C025-C065, C074-C075, C080-C081, C088-C090, C094, C099-C100, C102-C153, C154, C157-C160, C164-C172, C173-C174, C176-C193 |
| **gm + group** | C026, C071, C087, C092-C093, C095, C155, C175, C194-C199 |
| **gm + group + player** | C001-C010, C066-C070, C072-C073, C076-C079, C083-C084, C086, C101, C142, C191 |
| **gm + player** | C085, C091, C156, C161-C163 |
| **api-only** | None identified -- all API endpoints have at least one UI consumer |

---

## Orphan Capabilities

No orphaned capabilities detected. All server-side functions are called by at least one API endpoint, and all API endpoints are called by at least one store action or composable. All store actions are invoked by at least one component.

---

## Missing Subsystems

### MS-1: No Player-Facing Combat Action Interface (Direct Execution)
- **subsystem**: Players can see their turn state but cannot directly execute most combat actions from their view. Moves and pass are direct, but maneuvers, items, and switching require WebSocket requests to GM for approval.
- **actor**: player
- **ptu_basis**: PTU p.226-228: Players choose and execute their own Standard, Shift, Swift actions each turn. The manual describes players as autonomous actors, not request-submitters.
- **impact**: GM becomes a bottleneck for every player action. Slows gameplay. Players cannot independently Push, Trip, Grapple, Disengage, Sprint, or use items without GM proxy action or WebSocket request flow.

### MS-2: No Player Pokemon Management During Combat
- **subsystem**: Players cannot independently switch, recall, or release their own Pokemon during combat. All switching goes through GM actions or WebSocket request.
- **actor**: player
- **ptu_basis**: PTU p.229: "A Trainer may recall a Pokemon to its Poke Ball or release a Pokemon from its Poke Ball as a Standard Action on either the Trainer's or the Pokemon's Initiative."
- **impact**: Players must ask GM to switch their Pokemon, adding communication overhead during time-sensitive combat turns.

### MS-3: No Player Status/Stage Visibility
- **subsystem**: Players can see status conditions on the PlayerCombatantCard but have no dedicated interface for viewing detailed stage modifiers, injury counts, or combat stage breakdowns for their own Pokemon.
- **actor**: player
- **ptu_basis**: PTU p.234-235: Players need to know their combat stages to make informed decisions about moves and Take a Breather.
- **impact**: Players must ask GM for stage information or rely on GM communicating it verbally, reducing player agency.

### MS-4: No Automated Condition Duration Tracking
- **subsystem**: No system tracks condition durations (e.g., Confusion lasts 1-4 rounds, Infatuation until cured). Status conditions are added/removed manually by the GM.
- **actor**: gm
- **ptu_basis**: PTU p.247: Many volatile conditions have specific duration rules (Confused: 1-4 rounds, Flinch: one turn, etc.)
- **impact**: GM must mentally track all condition durations across all combatants, increasing cognitive load and risk of forgotten conditions persisting or being removed early.

### MS-5: No Automated Move Frequency Enforcement
- **subsystem**: Move frequencies (At-Will, EOT, Scene, Daily, etc.) are tracked in the move log but not enforced. The system does not prevent a combatant from using a Scene-frequency move twice in the same scene.
- **actor**: gm
- **ptu_basis**: PTU p.217: Move frequencies are hard restrictions on how often a move can be used (EOT = every other turn, Scene = once per scene, etc.)
- **impact**: GM must manually check move frequency compliance, which is error-prone especially with many combatants and Scene/Daily frequency moves.

### MS-6: No Ability Trigger Automation
- **subsystem**: Pokemon abilities are stored as data but have no automated trigger system. Effects like Intimidate on entry, Sand Stream weather on entry, Flame Body on contact, etc. must be manually applied by the GM.
- **actor**: gm
- **ptu_basis**: PTU pp.311-335: Over 100 abilities with specific trigger conditions (on entry, on hit, on contact, at turn start, etc.)
- **impact**: Abilities that should fire automatically are often forgotten. GM must remember which Pokemon have which abilities and when they trigger.
