---
tier: 5
title: Status Condition Tracking
audited_at: 2026-02-28T08:00:00Z
items: 3
correct: 3
---

# Tier 5: Status Condition Tracking

Verifying that status condition lifecycle (apply, persist, clear) follows PTU rules.

---

### 21. combat-R092 — Persistent Status Cured on Faint

- **Rule:** "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." (PTU p.248)
- **Expected behavior:** On faint, clear all persistent (Burn/Freeze/Paralysis/Poison/BadlyPoisoned) and volatile (Sleep/BadSleep/Confusion/Flinch/Infatuation/Cursed/Disabled/Rage/Suppressed) conditions. Add "Fainted".
- **Actual behavior:**
  - `app/server/services/combatant.service.ts:158-173` — `applyDamageToEntity`: on faint (`damageResult.fainted`):
    1. Builds `conditionsToClear` = `[...PERSISTENT_CONDITIONS, ...VOLATILE_CONDITIONS]`
    2. Reverses CS effects for each being cleared (decree-005 compliance: `reverseStatusCsEffects`)
    3. Filters out all persistent+volatile, also removes any existing 'Fainted' to avoid duplicates
    4. Sets `entity.statusConditions = ['Fainted', ...survivingConditions]`
  - "Other" conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) correctly survive faint.
  - `damage.post.ts:53-58` — Syncs reversed stageModifiers to DB when fainted.
- **Classification:** **Correct**
- **Note:** The decree-005 integration (reversing CS from cleared conditions) is a significant improvement over the previous audit's implementation.

---

### 22. combat-R098 — Volatile Cured on Recall/End Encounter

- **Rule:** Volatile conditions are cleared when a Pokemon is switched out or the encounter ends. (PTU p.235: "Combat Stages remain until the Pokemon or Trainer is switched out, or until the end of the encounter.")
- **Expected behavior:** End encounter clears stages. Volatile conditions cleared on recall.
- **Actual behavior:**
  - End encounter: `app/server/api/encounters/[id]/end.post.ts` ends the encounter and marks as inactive. Combatant data is preserved in the record but new encounters start fresh with reset stages (see start.post.ts:41-48 reset turnState, combatant.service.ts:716-727 resets stageModifiers to defaults).
  - Recall: When combatants are removed via `combatants/[combatantId].delete.ts`, the combatant is removed from the encounter. Re-adding the same entity later builds a fresh combatant via `buildCombatantFromEntity` with clean stages.
- **Classification:** **Correct**
- **Note:** The approach of resetting stages on fresh combatant build rather than explicit clearing on recall is functionally equivalent — any entity re-entering combat gets clean combat stages.

---

### 23. combat-R103/R104 — Temporary Hit Points

- **Rule:** "Temporary Hit Points are Hit Points that are lost before your regular Hit Points. Temp HP from multiple sources do not stack; you simply use whichever value is higher." (PTU p.249). Temp HP excluded from percentage calculations.
- **Expected behavior:** Temp HP absorbs damage first. Multiple temp HP sources: keep higher. Percentage checks use real HP only.
- **Actual behavior:**
  - `app/server/services/combatant.service.ts:96-99` — Damage: `tempHpAbsorbed = min(temporaryHp, remainingDamage)`. Absorbed first before real HP.
  - `combatant.service.ts:239-244` — Healing temp HP: `newTempHp = Math.max(previousTempHp, options.tempHp)`. Higher wins, no stacking. Correct.
  - `combatant.service.ts:112` — Massive damage: `hpDamage >= maxHp / 2`. `hpDamage` is after temp HP absorption. Real HP only.
  - `combatant.service.ts:115-119` — Marker injuries: `countMarkersCrossed(currentHp, unclampedHp, maxHp)`. Uses `currentHp` (real HP), not including temp HP. Correct.
  - `app/utils/captureRate.ts:70` — Capture rate: `hpPercentage = (currentHp / maxHp) * 100`. Uses real HP/real max.
- **Classification:** **Correct**
