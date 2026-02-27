## Tier 4: Partial Items -- Present Portion

### healing-R012: Massive Damage Exclusion for Set/Lose HP (Standard Path)

- **Rule:** "Massive Damage Injuries are never gained from Moves that cause you to 'Set' or 'lose' Hit Points, such as Pain Split or Endeavor."
- **Expected behavior:** Standard damage should apply massive damage check. A separate "set/lose HP" path should skip it.
- **Actual behavior:** The standard `calculateDamage()` in `combatant.service.ts:85-140` correctly applies massive damage checks. No separate "set/lose HP" code path exists.
- **Classification:** Approximation
- **Severity:** LOW
- **Notes:** The standard damage path is correct. The absent "set/lose HP" mode is documented as a P2 gap in the matrix. Pain Split/Endeavor are niche moves; GM can manually adjust HP without triggering the damage pipeline.

### healing-R022: Healing Past HP Markers -- Re-Injury Risk

- **Rule:** "If they're then brought down to 50% again, they gain another Injury for passing the 50% Hit Points Marker again."
- **Expected behavior:** Marker re-crossing triggers new injuries after healing.
- **Actual behavior:** `countMarkersCrossed()` checks `previousHp > threshold && newHp <= threshold` using current HP state. Healing raises HP above markers; subsequent damage crossing them again correctly triggers new injuries.
- **Classification:** Correct
- **Notes:** The stateless design makes re-injury work by consequence. No marker history is needed.

### healing-R035: HP Lost vs Damage Distinction (Standard Path)

- **Rule:** "Effects that say 'loses Hit Points' or that set Hit Points to a certain value instead of 'deals damage' do not have Defensive Stats applied."
- **Expected behavior:** Standard damage applies defense. A "lose HP" path would skip defense.
- **Actual behavior:** Standard `calculateDamage()` in `utils/damageCalculation.ts` applies defense (step 7). In-combat `calculateDamage()` applies massive damage. No "lose HP" mode exists.
- **Classification:** Correct (for present standard path)

### healing-R039: Basic Restorative Items (Manual HP Heal)

- **Rule:** "Potion: Heals 20 Hit Points. Super Potion: Heals 35 Hit Points..."
- **Expected behavior:** Heal endpoint accepts HP amount.
- **Actual behavior:** `encounters/[id]/heal.post.ts` accepts `{ combatantId, amount }`, calls `applyHealingToEntity()` which heals `amount` HP capped at effective max. GM enters amount manually.
- **Classification:** Correct (for present manual path)

### healing-R040: Status Cure Items (Manual Status Removal)

- **Rule:** "Antidote: Cures Poison. Paralyze Heal: Cures Paralysis..."
- **Expected behavior:** Status conditions can be manually removed.
- **Actual behavior:** `encounters/[id]/status.post.ts` calls `updateStatusConditions()` which adds/removes any valid status condition. GM manually removes the appropriate condition.
- **Classification:** Correct (for present manual path)

### healing-R042: AP -- Scene Refresh and Drain/Bind (Utilities)

- **Rule:** "Action Points are completely regained at the end of each Scene. Drained AP becomes unavailable for use until after an Extended Rest is taken."
- **Expected behavior:** AP refreshes at scene end (minus drained/bound). Extended rest clears drained AP.
- **Actual behavior:**
  - `calculateMaxAp()` at `utils/restHealing.ts:219-221`: `5 + Math.floor(level / 5)` -- correct.
  - `calculateAvailableAp()` at line 230-232: `Math.max(0, maxAp - boundAp - drainedAp)` -- correct.
  - `calculateSceneEndAp()` at line 240-243: correct scene-end computation.
  - Extended rest: `extended-rest.post.ts:87-89` sets `drainedAp: 0, boundAp: 0, currentAp: maxAp` -- correct.
  - New day: `new-day.post.ts:55-60` resets AP fully -- correct.
  - **Gap:** No automated trigger calls scene-end AP restoration. Utilities exist but are unused at scene/encounter end.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Notes:** Pure calculation functions are correct. Extended rest and new day correctly restore AP. The missing piece is automated scene-end AP restoration.

---

## Ambiguous Items

### healing-R006: Fainted Condition at "0 or lower"

- **Rule:** "A Pokemon or Trainer that is at 0 Hit Points or lower is Fainted."
- **Expected behavior:** Fainted when HP <= 0.
- **Actual behavior:** `calculateDamage()` at `combatant.service.ts:124`: `fainted = newHp === 0`, where newHp is clamped to 0 via `Math.max(0, unclampedHp)` (line 108). Since HP is always clamped to 0 for storage, "=== 0" and "<= 0" produce identical results in practice.
- **Classification:** Ambiguous
- **Notes:** Functionally correct given HP clamping. The check `=== 0` is semantically narrower than the rule's "0 or lower", but since stored HP is always >= 0, the result is identical. Would diverge only if negative HP storage were introduced. No decree exists. No decree-need ticket required unless negative HP storage is planned.

---

## Escalation Notes

### healing-R007: Math.max(1, ...) Minimum Heal

- **Impact:** Low-maxHp entities (maxHp < 16) heal 1 HP per rest instead of 0. Affects level-1 Pokemon with low base HP stats. Generous deviation favoring players.
- **Recommendation:** LOW-severity ticket. Consider whether this is intentional QoL or unintentional.

### healing-R034: Extended Rest Daily Move Refresh Not Wired

- **Impact:** Extended rests do not refresh daily moves used on previous days. The `isDailyMoveRefreshable()` utility exists but is never called by extended rest endpoints. Players must use the "New Day" action or Pokemon Center for daily move refresh.
- **Recommendation:** MEDIUM-severity ticket. Wire `isDailyMoveRefreshable()` into extended rest endpoints.

### healing-R042: Scene-End AP Restoration Not Automated

- **Impact:** AP is not restored at scene/encounter end. The `calculateSceneEndAp()` utility exists but no trigger invokes it. AP only restored via extended rest, new day, or GM manual edit.
- **Recommendation:** MEDIUM-severity ticket. Add AP restoration hook to scene/encounter end flow.

### healing-R006: Fainted "=== 0" vs "<= 0"

- **Interpretation A:** HP clamping to 0 makes "=== 0" equivalent to "<= 0". No practical difference.
- **Interpretation B:** If negative HP were ever stored (for some future mechanic), the check would need to be "<= 0".
- **Recommendation:** No action needed currently. If negative HP storage is ever introduced, update the fainted check.
