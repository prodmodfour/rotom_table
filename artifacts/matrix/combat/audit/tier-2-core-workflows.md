## Tier 2: Core Workflows

### 16. combat-R036 — Initiative (Speed Based)

- **Rule:** "The Speed Stat is used to determine turn order during combat." (07-combat.md:611-612)
- **Expected behavior:** Initiative = speed + bonuses. Heavy Armor -1 speed CS affects initiative. Focus Speed +5 after CS affects initiative.
- **Actual behavior:** `app/server/services/combatant.service.ts:586-589` — `effectiveSpeed` applies Heavy Armor speed CS via `applyStageModifier`, adds Focus speed bonus. `initiative = effectiveSpeed + initiativeBonus`.
- **Classification:** Correct

### 17. combat-R037 — League Battle Order

- **Rule:** In League Battles, trainers declare in order of slowest to fastest, then Pokemon act from fastest to slowest.
- **Expected behavior:** Trainers sorted ascending speed (declaration), Pokemon sorted descending speed (action).
- **Actual behavior:** `app/server/api/encounters/[id]/start.post.ts:90-114` — trainers via `sortByInitiativeWithRollOff(trainers, false)` (ascending), pokemon via `sortByInitiativeWithRollOff(pokemon, true)` (descending). Starts with `trainer_declaration` phase.
- **Classification:** Correct

### 18. combat-R038 — Full Contact Order

- **Rule:** In Full Contact battles, all combatants act highest speed to lowest.
- **Expected behavior:** All combatants sorted descending speed.
- **Actual behavior:** `app/server/api/encounters/[id]/start.post.ts:116-121` — `sortByInitiativeWithRollOff(readyCombatants, true)` (descending).
- **Classification:** Correct

### 19. combat-R043 — Action Economy Per Turn

- **Rule:** Each turn: Standard, Shift, and Swift actions.
- **Expected behavior:** Track standard, shift, and swift action usage per turn.
- **Actual behavior:** `start.post.ts:41-48` and `combatant.service.ts:613-619` — `turnState` tracks `standardActionUsed`, `shiftActionUsed`, `swiftActionUsed`.
- **Classification:** Correct

### 20. combat-R072 — Massive Damage Injury

- **Rule:** "Massive Damage is any single attack or damage source that does damage equal to 50% or more of their Max Hit Points. Whenever a Pokemon or trainer suffers Massive Damage, they gain 1 Injury." (07-combat.md:1843-1846). "The artificial Max Hit Point number is not considered when potentially acquiring new injuries... All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum." (07-combat.md:1872-1876)
- **Expected behavior:** If hpDamage >= realMaxHp * 0.5, gain 1 injury. Temp HP absorbed first, only real HP damage counts. Use real (un-reduced) maxHp.
- **Actual behavior:** `app/server/services/combatant.service.ts:96-99` — temp HP absorbed first. Line 112: `massiveDamageInjury = hpDamage >= maxHp / 2`. `app/server/api/encounters/[id]/damage.post.ts:35` passes `entity.maxHp` (the real, un-reduced max stored in DB). Injury-reduced max is only computed by `getEffectiveMaxHp()` for healing.
- **Classification:** Correct

### 21. combat-R073 — HP Marker Injuries

- **Rule:** "The Hit Point Markers are 50% of maximum Hit Points, 0%, -50%, -100%, and every -50% lower thereafter." (07-combat.md:1849-1852)
- **Expected behavior:** Generate markers at 50%, 0%, -50%, -100%... of REAL maxHp. Count crossings from previousHp to newHp (unclamped).
- **Actual behavior:** `app/server/services/combatant.service.ts:50-76` — `countMarkersCrossed(previousHp, newHp, realMaxHp)`: generates thresholds starting at `floor(realMaxHp * 0.5)`, descending by that step. Checks `previousHp > threshold && newHp <= threshold`. Uses unclamped HP (`unclampedHp` at line 105).
- **Classification:** Correct

### 22. combat-R077 — Fainted Condition

- **Rule:** "If a Pokemon or Trainer has 0 Hit Points or less, they are unable to carry out any actions." (07-combat.md:618-621)
- **Expected behavior:** Fainted at 0 HP.
- **Actual behavior:** `app/server/services/combatant.service.ts:124` — `fainted = newHp === 0`. HP clamped to min 0 at line 108.
- **Classification:** Correct

### 23. combat-R079 — Fainted Clears All Status

- **Rule:** "All Persistent Status conditions are cured if the target is Fainted." (07-combat.md:1535-1536). "When Pokemon are Fainted, they are automatically cured of all Volatile Status Afflictions." (07-combat.md:1580-1581). "Other" conditions (Stuck, Slowed, etc.) not explicitly cleared.
- **Expected behavior:** On faint: clear persistent + volatile, preserve "other" conditions, add Fainted.
- **Actual behavior:** `app/server/services/combatant.service.ts:158-164` — filters out all PERSISTENT_CONDITIONS and VOLATILE_CONDITIONS, preserves others (Stuck, Slowed, Trapped, Tripped, Vulnerable), adds 'Fainted'.
- **Classification:** Correct

### 24. combat-R085 — Take a Breather

- **Rule:** "Taking a Breather is a Full Action... set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions. To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters." (07-combat.md:1447-1464)
- **Expected behavior:** Full action: reset stages, remove temp HP, cure volatiles + Slow + Stuck (except Cursed unless source KO/far), apply Tripped + Vulnerable.
- **Actual behavior:** `app/server/api/encounters/[id]/breather.post.ts:20-24` — Cures all VOLATILE_CONDITIONS except Cursed, plus Slowed and Stuck. Lines 57-74: resets stages to defaults (respecting Heavy Armor speed CS). Lines 76-79: removes temp HP. Lines 96-107: applies Tripped + Vulnerable as tempConditions. Lines 110-115: marks standard + shift as used (Full Action).
- **Classification:** Correct

### 25. combat-R103 — Temporary Hit Points

- **Rule:** "Temporary Hit Points are always lost first from damage... Temporary Hit Points do not stack with other Temporary Hit Points – only the highest value applies." (07-combat.md:1653-1658)
- **Expected behavior:** Temp HP absorbs damage first. No stacking (keep highest).
- **Actual behavior:** Damage absorption: `combatant.service.ts:96-99`. Healing (no stacking): `combatant.service.ts:230-236` — `Math.max(previousTempHp, options.tempHp)`.
- **Classification:** Correct

---
