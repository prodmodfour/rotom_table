## Tier 2: Core Workflows

### healing-R004: Injury from Massive Damage

- **Rule:** "Massive Damage is any single attack or damage source that does damage equal to 50% or more of their Max Hit Points."
- **Expected behavior:** If hpDamage >= maxHp / 2, gain 1 injury. Uses real maxHp, not injury-reduced.
- **Actual behavior:** `calculateDamage()` at `server/services/combatant.service.ts:112`: `massiveDamageInjury = hpDamage >= maxHp / 2`. Only HP damage counts (temp HP absorbed first, lines 96-99). Function parameter is raw `maxHp`.
- **Classification:** Correct

### healing-R005: Injury from HP Markers

- **Rule:** "The Hit Point Markers are 50% of maximum Hit Points, 0%, -50%, -100%, and every -50% lower thereafter."
- **Expected behavior:** Markers at 50%, 0%, -50%, -100% of real maxHp. Each crossing = 1 injury.
- **Actual behavior:** `countMarkersCrossed()` at `server/services/combatant.service.ts:50-76`: `fiftyPercent = Math.floor(realMaxHp * 0.5)`, iterates down from `fiftyPercent` through 0 and into negatives, checking `previousHp > threshold && newHp <= threshold`. Uses unclamped newHp for marker detection.
- **Classification:** Correct

### healing-R013: Multiple Injuries from Single Attack

- **Rule:** "A Pokemon or Trainer that goes from Max Hit Points to -150% Hit Points after receiving a single attack would gain 6 Injuries (1 for Massive Damage, and 5 for Hit Point Markers)."
- **Expected behavior:** Massive damage + all marker injuries accumulated in single damage call.
- **Actual behavior:** `calculateDamage()` at `server/services/combatant.service.ts:121`: `totalNewInjuries = (massiveDamageInjury ? 1 : 0) + markerInjuries`. Both are computed independently and summed.
- **Classification:** Correct

### healing-R014: Fainted Cured by Revive or Healing to Positive HP

- **Rule:** "The 'Fainted' Condition is removed only by specific items such as Revive, or by being brought up to a positive Hit Point count by healing Features or Moves."
- **Expected behavior:** When healed from 0 HP to > 0 HP, remove Fainted status.
- **Actual behavior:** `applyHealingToEntity()` at `server/services/combatant.service.ts:220-226`: `if (previousHp === 0 && newHp > 0)`, filters out 'Fainted' from statusConditions, sets `faintedRemoved = true`.
- **Classification:** Correct

### healing-R015: Fainted Clears All Status Conditions

- **Rule:** "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."
- **Expected behavior:** On faint, clear persistent + volatile statuses, keep "other" conditions, add Fainted.
- **Actual behavior:** `applyDamageToEntity()` at `server/services/combatant.service.ts:158-164`: when `damageResult.fainted`, builds `conditionsToClear` from `PERSISTENT_CONDITIONS` + `VOLATILE_CONDITIONS`, filters surviving conditions (keeping "other" like Stuck/Slowed/Trapped/Tripped/Vulnerable), then sets `entity.statusConditions = ['Fainted', ...survivingConditions]`.
- **Classification:** Correct
- **Notes:** Correctly preserves "other" conditions (Stuck, Slowed, etc.) per PTU -- only Persistent and Volatile are cleared on faint.

### healing-R023: Natural Injury Healing (24-Hour Timer)

- **Rule:** "They can naturally heal from a single Injury if they go 24 hours without gaining any new injuries."
- **Expected behavior:** 24+ hours since lastInjuryTime -> allow healing 1 injury.
- **Actual behavior:** `canHealInjuryNaturally()` at `utils/restHealing.ts:73-81`: computes `hoursSinceInjury = (now - injuryTime) / (1000 * 60 * 60)`, returns `hoursSinceInjury >= 24`. Used by `heal-injury.post.ts:96`.
- **Classification:** Correct

### healing-R024: Trainer AP Drain to Remove Injury

- **Rule:** "Trainers can also remove Injuries as an Extended Action by Draining 2 AP."
- **Expected behavior:** Costs 2 AP (drained), heals 1 injury, subject to daily cap.
- **Actual behavior:** `heal-injury.post.ts:64-92`: `newDrainedAp = character.drainedAp + 2`, `newCurrentAp = Math.max(0, character.currentAp - 2)`, decrements injuries by 1, increments `injuriesHealedToday`.
- **Classification:** Correct

### healing-R026: Pokemon Center -- Base Healing

- **Rule:** "Pokemon Centers can heal Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves."
- **Expected behavior:** Full HP (to effective max after injuries healed), clear ALL statuses, restore daily moves.
- **Actual behavior:** `pokemon-center.post.ts:55-92`: injuries healed first (up to daily cap), then `effectiveMax = getEffectiveMaxHp(pokemon.maxHp, newInjuries)` (line 59), `currentHp: effectiveMax` (line 83), `statusConditions: JSON.stringify([])` (line 87), move usage reset (`usedToday = 0`, `usedThisScene = 0`) on lines 70-78.
- **Classification:** Correct
- **Notes:** Correctly heals injuries first, then computes effective max based on remaining injuries. HP restored to injury-reduced effective max, not raw max.

### healing-R032: Extended Rest -- Clears Persistent Status Conditions

- **Rule:** "Extended rests completely remove Persistent Status Conditions."
- **Expected behavior:** Remove Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned.
- **Actual behavior:** `extended-rest.post.ts:70-72`: calls `getStatusesToClear()` and `clearPersistentStatusConditions()`. `PERSISTENT_CONDITIONS` at `constants/statusConditions.ts:7-9` = `['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']`.
- **Classification:** Correct

### healing-R034: Extended Rest -- Daily Move Recovery

- **Rule:** "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day."
- **Expected behavior:** Only moves used before today (on a previous calendar day) should be refreshed during extended rest.
- **Actual behavior:** `isDailyMoveRefreshable()` at `utils/restHealing.ts:207-212` correctly checks `usedDate.toDateString() !== today.toDateString()`. However, the extended rest endpoint (`extended-rest.post.ts`) does NOT call this function or refresh any daily moves. Daily moves are only refreshed by the Pokemon Center endpoint and the `new-day.post.ts` endpoint (which uses `resetDailyUsage()` to unconditionally reset all daily counters).
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Notes:** The utility function exists and is correct, but the extended rest endpoint does not invoke it. An extended rest taken after midnight should refresh daily moves used on the previous day, but the code does not do this. The `new-day.post.ts` endpoint handles the full-day-reset case correctly, so this only matters for mid-campaign extended rests that cross day boundaries without a "New Day" action.

### healing-R018: Take a Breather -- Core Effects

- **Rule:** "When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions."
- **Expected behavior:** Reset stages, remove temp HP, cure volatile + Slowed + Stuck.
- **Actual behavior:** `breather.post.ts`:
  - Stages reset to defaults (lines 59-74), including Heavy Armor speed CS adjustment.
  - Temp HP removed (lines 77-80).
  - Volatile conditions cured (lines 83-92): `BREATHER_CURED_CONDITIONS` = `VOLATILE_CONDITIONS.filter(c => c !== 'Cursed')` + `['Slowed', 'Stuck']`.
- **Classification:** Correct
- **Notes:** Cursed is excluded from auto-clearing with a documented code comment: "Since the app does not track curse sources, Cursed is excluded from auto-clearing and left for the GM to remove manually when the prerequisite is met." This is a reasonable design choice since PTU says Cursed requires the curse source to be KO'd or >12m away, which the app cannot verify. The previous audit incorrectly flagged this as Incorrect; re-reading the PTU text confirms the Cursed exception is a special case requiring GM adjudication: "To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters." Excluding Cursed from automatic removal and leaving it to GM judgment is the correct approach.

---
