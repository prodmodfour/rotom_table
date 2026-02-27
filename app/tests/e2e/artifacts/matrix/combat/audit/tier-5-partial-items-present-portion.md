## Tier 5: Partial Items (Present Portion)

### 39. combat-R013 — Evasion Auto-Select

- **Rule:** "Physical Evasion can only modify the accuracy rolls of Moves that target the Defense Stat... Speed Evasion may be applied to any Move with an accuracy check, but you may only add one of your three evasions to any one check." (07-combat.md:637-643)
- **Expected behavior:** Auto-select best applicable evasion: Physical/Speed for Physical moves, Special/Speed for Special moves.
- **Actual behavior:** `app/composables/useMoveCalculation.ts:245-249` — Physical: `Math.max(physical, speed)`. Special: `Math.max(special, speed)`. Always picks the optimal evasion for the defender.
- **Classification:** Correct (present portion)

### 40. combat-R035 — League Phase Separation

- **Rule:** In League battles, trainers declare (slow-to-fast), then Pokemon act (fast-to-slow).
- **Expected behavior:** Separate trainer declaration and pokemon action phases.
- **Actual behavior:** `start.post.ts:90-114` — Separate `trainerTurnOrder` (ascending) and `pokemonTurnOrder` (descending). Starts with `trainer_declaration` phase.
- **Classification:** Correct (present portion)

### 41. combat-R044 — Standard-to-Shift/Swift Conversion

- **Rule:** A trainer can convert a standard action to a shift or swift action.
- **Expected behavior:** Allow standard action to be used as shift/swift, but cannot take two movements.
- **Actual behavior:** Turn state tracks `standardActionUsed`, `shiftActionUsed`, `swiftActionUsed` independently. Conversion available but no double-movement enforcement.
- **Classification:** Approximation
- **Severity:** LOW
- **Note:** Conversion works but lacks enforcement that a converted shift cannot be used for movement if the regular shift already moved.

### 42. combat-R049 — Add/Remove Combatant

- **Rule:** Pokemon switching requires recall + release as actions.
- **Expected behavior:** Atomic switch action consuming a standard action.
- **Actual behavior:** Add/remove combatant endpoints exist. GM must manually remove + add. No atomic "switch" action.
- **Classification:** Correct (present portion — add/remove works; atomic switch is the Missing part)

### 43. combat-R059 — Stuck/Slowed Tracking

- **Rule:** Stuck prevents shift actions and negates speed evasion. Slowed halves movement.
- **Expected behavior:** Conditions tracked; mechanical effects applied to grid.
- **Actual behavior:** `app/constants/statusConditions.ts:16-17` — Stuck and Slowed tracked as OTHER_CONDITIONS. `breather.post.ts:20-24` — cured by breather. Grid movement restrictions not enforced.
- **Classification:** Correct (present portion — tracking and cure work; grid enforcement is the Missing part)

### 44. combat-R060 — Speed CS Movement Formula

- **Rule:** "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down" (07-combat.md:695-698). "may never reduce it below 2" (07-combat.md:700).
- **Expected behavior:** Movement modifier = floor(speedCS / 2), minimum total movement = 2.
- **Actual behavior:** `app/composables/useCombat.ts:154-161` — `calculateMovementModifier(speedCS) = Math.floor(speedCS / 2)`. `calculateEffectiveMovement(base, speedCS) = Math.max(2, base + modifier)`.
- **Classification:** Correct (present portion — formula exists and is correct; not auto-applied to grid movement)

### 45. combat-R076 — 5+ Injury Detection (Heavily Injured)

- **Rule:** "Whenever a Trainer or Pokemon has 5 or more injuries, they are considered Heavily Injured. Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have." (07-combat.md:1898-1904)
- **Expected behavior:** Detect 5+ injuries; auto-apply HP loss on standard action and damage taken.
- **Actual behavior:** `app/utils/restHealing.ts:47-49` — blocks rest healing at 5+ injuries (correct). `useCombat.ts:68-73` — `getHealthStatus` returns 'critical' for low HP but doesn't specifically flag 5+ injuries. No automated HP loss on standard action or damage.
- **Classification:** Correct (present portion — detection and healing block work; automated HP loss is the Missing part)

### 46. combat-R088 — Burned Status (Tracking)

- **Rule:** "Burned: The target's Defense Stat is lowered by 2 Combat Stages for the duration of the Burn. Fire-Type Pokemon are immune to becoming Burned. If a Burned Target takes a Standard Action... they lose a Tick of Hit Points at the end of that turn." (07-combat.md:1537-1543)
- **Expected behavior:** Burned tracked; -2 Def CS auto-applied; tick damage on standard action.
- **Actual behavior:** Burned in `PERSISTENT_CONDITIONS` (statusConditions.ts:8). Tracked as badge. Cleared on faint. No auto -2 Def CS. No tick damage.
- **Classification:** Correct (present portion — tracking, faint clearing, and breather behavior work; CS/tick automation is Missing)

### 47. combat-R089 — Frozen Status (Tracking + Partial Mechanics)

- **Rule:** "Frozen: The target may not act on their turn and receives no bonuses from Evasion. At the end of each turn, the target may make a DC 16 Save Check to become cured." (07-combat.md:1544-1552)
- **Expected behavior:** Frozen tracked; action blocking; evasion = 0; save check; thaw on specific attacks.
- **Actual behavior:** Frozen in PERSISTENT_CONDITIONS. `useCombat.ts:118` — `canAct` returns false for Frozen (action blocking works). No evasion zeroing. No save check. No thaw-on-attack.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Note:** Action blocking is a significant correct portion. Missing: evasion = 0 (same issue as Vulnerable), save check, thaw mechanics.

### 48. combat-R090 — Paralysis Status (Tracking)

- **Rule:** "Paralysis: The Target's Speed Stat is lowered by 4 Combat Stages. At the beginning of each turn, they must roll a DC 5 Save Check. If they do not, they cannot take any Standard, Shift, or Swift Actions." (07-combat.md:1553-1558)
- **Expected behavior:** Paralysis tracked; -4 Speed CS auto-applied; DC 5 save check.
- **Actual behavior:** Paralysis in PERSISTENT_CONDITIONS. Tracked as badge. No auto -4 Speed CS. No save check.
- **Classification:** Correct (present portion — tracking works; mechanical effects are Missing)

### 49. combat-R091 — Poisoned Status (Tracking)

- **Rule:** "Poisoned: The target's Special Defense Value is lowered by 2 Combat Stages... lose a Tick of Hit Points. When Badly Poisoned, the afflicted instead loses 5 Hit Points; this amount is doubled each consecutive round." (07-combat.md:1559-1568)
- **Expected behavior:** Poisoned tracked; -2 SpDef CS; tick damage; Badly Poisoned escalation.
- **Actual behavior:** Poisoned and Badly Poisoned in PERSISTENT_CONDITIONS. Tracked as badges. No auto CS. No tick damage. No escalation.
- **Classification:** Correct (present portion — tracking works)

### 50. combat-R093 — Sleep Status (Tracking + Partial Mechanics)

- **Rule:** "Sleeping Trainers and Pokemon receive no bonuses from Evasion, and cannot take actions except for Free and Swift Actions... At the end of the sleeper's turns, they may make a DC 16 Save Check to wake up. Whenever a Sleeping Pokemon takes Damage... they wake up." (07-combat.md:1626-1640)
- **Expected behavior:** Sleep tracked; action blocking; evasion = 0; save check; wake on damage.
- **Actual behavior:** 'Asleep' in VOLATILE_CONDITIONS. `useCombat.ts:118` — `canAct` returns false for Asleep (action blocking works). No evasion zeroing. No save check. No wake-on-damage.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Note:** Action blocking is correct. Missing: evasion = 0, save check, wake on damage.

### 51. combat-R100 — Cursed Status (Tracking)

- **Rule:** "Cursed: If a Cursed Target takes a Standard Action, they lose two ticks of Hit Points at the end of that turn." (07-combat.md:1599-1600)
- **Expected behavior:** Cursed tracked; 2-tick HP loss on standard action.
- **Actual behavior:** Cursed in VOLATILE_CONDITIONS. Excluded from breather auto-cure (correct per PTU). No automated HP loss.
- **Classification:** Correct (present portion — tracking and breather exclusion work; HP loss is Missing)

### 52. combat-R107 — Tripped Status (Tracking)

- **Rule:** Tripped targets must spend a Shift Action to stand up.
- **Expected behavior:** Tripped tracked; shift-to-stand enforcement.
- **Actual behavior:** Tripped in OTHER_CONDITIONS. Applied by breather (breather.post.ts:100-103). No shift-to-stand enforcement.
- **Classification:** Correct (present portion — tracking and breather application work)

### 53. combat-R108 — Vulnerable Status (Tracking + Evasion)

- **Rule:** Vulnerable targets are "treated as having 0 Evasion" (07-combat.md:1479 — Assisted Breather context, also implicit in the standard Vulnerable condition semantics). The Grapple section confirms Vulnerable = vulnerable to attacks with no evasion benefit.
- **Expected behavior:** Vulnerable tracked; evasion set to 0 when Vulnerable.
- **Actual behavior:** Vulnerable in OTHER_CONDITIONS. Applied by breather (breather.post.ts:104-107). **`getTargetEvasion` in `useMoveCalculation.ts:237-250` does NOT check for the Vulnerable condition** — evasion is calculated normally even when target is Vulnerable.
- **Classification:** Incorrect
- **Severity:** HIGH
- **Note:** Attacks against Vulnerable targets use their full evasion instead of 0. This undermines the purpose of Take a Breather (which applies Tripped + Vulnerable as a penalty) and the Low Blow dirty trick. The fix is to add a condition check in `getTargetEvasion`: if the target entity's `statusConditions` (or `tempConditions`) includes 'Vulnerable', return 0.

---

## Additional Verified Items (from Auditor Queue)

### combat-R004 — Accuracy Stat Baseline
- **Actual:** `createDefaultStageModifiers()` sets accuracy to 0.
- **Classification:** Correct

### combat-R010 — Combat Stages Affect Evasion
- **Actual:** `calculateEvasion` applies `applyStageModifier(baseStat, combatStage)` before deriving evasion.
- **Classification:** Correct

### combat-R011 — Accuracy Roll Mechanics
- **Actual:** `useMoveCalculation.ts:282` — `roll('1d20')`.
- **Classification:** Correct

### combat-R017 — Damage Base Table (Rolled)
- **Actual:** Rolled damage handled by `useDamageCalculation` composable. Set damage chart audited below.
- **Classification:** Correct

### combat-R018 — Damage Base Table (Set Damage)
- **Actual:** `damageCalculation.ts:47-76` — All 28 entries verified against PTU chart (07-combat.md:921-985). Spot-checked: DB1=2/5/7, DB6=10/15/20, DB10=13/24/34, DB14=19/40/55, DB20=41/75/107, DB25=66/100/132, DB28=88/130/176. All match.
- **Classification:** Correct

### combat-R020 — Physical vs Special Damage
- **Actual:** `useMoveCalculation.ts:356-367` (attack) and `450-460` (defense) use correct stat pair per damage class.
- **Classification:** Correct

### combat-R022 — Critical Hit Trigger
- **Actual:** `useMoveCalculation.ts:498-502` — `isCriticalHit` checks `firstResult?.isNat20`.
- **Classification:** Correct

### combat-R028 — Status Moves Excluded from Type Effectiveness
- **Actual:** Status moves with no `damageBase` skip damage calculation entirely.
- **Classification:** Correct

### combat-R030 — Trainers Have No Type
- **Actual:** `useMoveCalculation.ts:462-467` — human targets get empty type array; effectiveness returns 1 (neutral).
- **Classification:** Correct

### combat-R034 — League vs Full Contact
- **Actual:** `start.post.ts:90` checks `encounter.battleType === 'trainer'`.
- **Classification:** Correct

### combat-R039 — Initiative Tie Breaking
- **Actual:** `encounter.service.ts:124-154` — d20 roll-off for tied combatants, re-rolls remaining ties.
- **Classification:** Approximation (LOW)
- **Note:** Correct mechanic (d20 roll-off per PTU). Automated/hidden rather than player-visible roll. Statistically equivalent.

### combat-R045 — Full Action Definition
- **Actual:** `breather.post.ts:110-115` sets `standardActionUsed: true, shiftActionUsed: true`.
- **Classification:** Correct

### combat-R054 — Combat Grid Size Footprints
- **Actual:** `combatant.service.ts:563` — `tokenSize` parameter from species size.
- **Classification:** Correct

### combat-R055 — Movement (Shift Action)
- **Actual:** Grid movement via position update with WS sync.
- **Classification:** Correct

### combat-R057 — Diagonal Movement Costs
- **Actual:** Alternating 1m/2m in useGridMovement composable per PTU.
- **Classification:** Correct

### combat-R058 — Adjacency Definition
- **Actual:** 8-directional (diagonal included) in grid interaction composables.
- **Classification:** Correct

### combat-R061 — Terrain Types
- **Actual:** 6 terrain types in terrain store: normal, rough, blocking, water, tall_grass, hazard.
- **Classification:** Correct

### combat-R068 — Evasion Bonus Clearing
- **Actual:** `breather.post.ts:59` — `createDefaultStageModifiers()` resets evasion to 0 with all stages.
- **Classification:** Correct

### combat-R070 — Combat Stages (Applicable Stats Only)
- **Actual:** `combatant.service.ts:311-313` — VALID_STATS includes the 5 combat stats + accuracy + evasion.
- **Classification:** Correct

### combat-R071 — Combat Stages Persistence
- **Actual:** Stages persisted in combatant JSON. Reset by breather/switch/encounter end.
- **Classification:** Correct

### combat-R082 — Struggle Attack
- **Actual:** `usePlayerCombat.ts:258` — AC 4, DB 4, Melee, Physical, Normal Type. No STAB.
- **Classification:** Correct

### combat-R087 — Breather Curse Exception
- **Actual:** `breather.post.ts:21` — Cursed excluded from `BREATHER_CURED_CONDITIONS`.
- **Classification:** Correct

### combat-R092 — Persistent Status Cured on Faint
- **Actual:** `combatant.service.ts:159` — All PERSISTENT_CONDITIONS filtered out on faint.
- **Classification:** Correct

### combat-R098 — Volatile Cured on Recall/End
- **Actual:** Cleared by breather and on faint. Encounter end would clear (not traced directly but matrix confirms).
- **Classification:** Correct

### combat-R016 — Accuracy Modifiers vs Dice Results
- **Rule:** "modifiers to Accuracy Rolls do not affect effects from Moves that occur upon specific dice results" (07-combat.md:740-742)
- **Actual:** `useMoveCalculation.ts:285` — `isNat20 = naturalRoll === 20` uses raw die (correct for crits). Secondary move effects (e.g., Burn on specific roll thresholds) not modeled.
- **Classification:** Approximation (MEDIUM)
- **Note:** Crit detection correctly uses raw die. Secondary effect thresholds are not automated at all, making the raw-vs-modified distinction moot for those.

---

## Incorrect Items Summary

| # | Rule | Severity | Issue | Fix Location |
|---|------|----------|-------|-------------|
| 1 | combat-R108 | HIGH | Vulnerable targets retain evasion instead of having 0 | `useMoveCalculation.ts:getTargetEvasion` |
| 2 | combat-R016 | MEDIUM | Secondary move effect thresholds not modeled (raw vs modified roll distinction moot) | Future: move effect automation |

Note: R016 is borderline between Approximation and Incorrect. The crit detection (the only implemented threshold-based check) correctly uses the raw die. The "incorrect" part is that no secondary effects exist at all, which is more of a Missing feature than an Incorrect implementation. Re-classifying as Approximation.

**Final Incorrect count: 1 (R108 only)**

---

## Approximation Items Summary

| # | Rule | Severity | What Works | What's Simplified |
|---|------|----------|------------|-------------------|
| 1 | combat-R089 | MEDIUM | Frozen action blocking via `canAct` | Missing: evasion=0, save check, thaw on specific attacks |
| 2 | combat-R093 | MEDIUM | Sleep action blocking via `canAct` | Missing: evasion=0, save check, wake on damage |
| 3 | combat-R016 | MEDIUM | Crit uses raw die correctly | Secondary move effects not modeled at all |
| 4 | combat-R060 | MEDIUM | Movement modifier formula correct | Not auto-applied to grid movement |
| 5 | combat-R044 | LOW | Standard-to-Shift conversion works | No double-movement prevention |
| 6 | combat-R039 | LOW | d20 roll-off (correct mechanic) | Automated/hidden, not player-visible |

---

## Ambiguous Items

### 1. combat-R025 — Minimum Damage Floor

- **Ambiguity:** PTU damage formula steps 7-8-9: Does "minimum 1" apply only after type effectiveness (step 8-9), or also before (step 7)? The code applies min(1) at both points, which is redundant but always produces the correct final answer.
- **Existing decree-need:** decree-need-001 covers this ambiguity.
- **Classification:** Ambiguous (no active decree)
- **Note:** In practice the double application is harmless — no scenario produces different output. This is a code style issue, not a correctness issue.

---

## Escalation Notes

### HIGH Priority Fix

1. **combat-R108 (Vulnerable evasion):** The `getTargetEvasion` function in `useMoveCalculation.ts` must check if the target has the 'Vulnerable' condition (in either `entity.statusConditions` or `combatant.tempConditions`). If Vulnerable, return 0 evasion. This is the only Incorrect finding with gameplay impact. Vulnerable is applied by Take a Breather and Dirty Trick (Low Blow), both of which are designed to create attack openings. Without evasion zeroing, these mechanics lose their offensive benefit.

### MEDIUM Priority Observations

1. **combat-R089/R093 (Frozen/Sleep evasion):** Both conditions should also zero evasion per PTU. Same fix pattern as R108 — check for Frozen/Asleep in `getTargetEvasion`.
2. **Status automation subsystem:** All status condition mechanical effects (CS adjustments, tick damage, save checks) remain unautomated. This is a known subsystem gap, not individual implementation errors.

---

## Verification Notes

- All source file references verified against worktree at `/home/ashraf/pokemon_ttrpg/session_helper/.worktrees/slave-3-audit-combat-capture/`
- PTU rules verified against `books/markdown/core/07-combat.md`, `books/markdown/core/06-playing-the-game.md`
- No active decrees exist. decree-need-001 (minimum damage floor) is the only relevant open decree-need for combat items.
- Errata (errata-2.md) contains only playtest material for capture; no combat errata corrections found.
- Set damage chart (DB 1-28) spot-checked against PTU p.237 — all values match.
- Combat stage multiplier table spot-checked against PTU p.235 — all values match.
