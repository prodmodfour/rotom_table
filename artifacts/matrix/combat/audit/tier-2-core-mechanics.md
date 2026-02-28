---
tier: 2
title: Core Mechanic Gap Verifications
audited_at: 2026-02-28T08:00:00Z
items: 7
correct: 7
---

# Tier 2: Core Mechanic Gap Verifications

Verifying the accuracy of implementations flagged as Partial or gap items in the coverage matrix. For each, confirm the present portion is correct and document what is missing.

---

### 7. combat-R019 + combat-R025 — Damage Formula Dual Min-1 (decree-001)

- **Rule:** "An attack will always do a minimum of 1 damage, even if Defense Stats would reduce it to 0." (PTU 07-combat.md p.779). Type effectiveness applied after defense.
- **Decree:** decree-001 confirms dual floor (post-defense AND post-effectiveness)
- **Expected behavior:** After step 7 (subtract defense+DR): min 1. After step 8 (type effectiveness): min 1 (unless immune).
- **Actual behavior:**
  - `app/utils/damageCalculation.ts:283` — `afterDefense = Math.max(1, subtotalBeforeDefense - effectiveDefense - dr)` — First floor
  - `app/utils/damageCalculation.ts:289-297` — After `floor(afterDefense * typeEffectiveness)`: if immune, 0; else if < 1, set to 1. — Second floor
  - `app/composables/useMoveCalculation.ts:586-593` — Client-side damage calc mirrors: `damage = Math.max(1, damage)` after defense, `damage = Math.floor(damage * effectiveness)`, `damage = Math.max(1, damage)`, immune check.
- **Classification:** **Correct** per decree-001

---

### 8. combat-R072 — Massive Damage Injury (decree-004)

- **Rule:** "If an attack deals Massive Damage, or damage equal to or greater than 50% of a target's maximum Hit Points" = injury (PTU 07-combat.md p.822-828)
- **Decree:** decree-004: only real HP lost (after temp HP) counts toward threshold
- **Expected behavior:** `hpDamage >= maxHp / 2` (not total attack damage)
- **Actual behavior:**
  - `app/server/services/combatant.service.ts:92-99` — Temp HP absorbed first: `tempHpAbsorbed = min(temporaryHp, remainingDamage)`. `hpDamage = remainingDamage` (after temp HP).
  - `combatant.service.ts:112` — `massiveDamageInjury = hpDamage >= maxHp / 2` — Uses real HP damage only.
  - Uses `maxHp` (real max), not effective max HP (injury-reduced). Consistent with PTU p.250: marker checks use real max.
- **Classification:** **Correct** per decree-004

---

### 9. combat-R073 — HP Marker Injuries

- **Rule:** "a target is reduced to a certain Hit Point Marker: 50% of their maximum Hit Points, 0%, -50%, -100%, and every -50% thereafter." (PTU 07-combat.md p.826-828)
- **Expected behavior:** Track markers at 50%, 0%, -50%, -100%, etc. Each crossing = 1 injury. Uses real maxHP. HP can go negative for counting.
- **Actual behavior:**
  - `app/server/services/combatant.service.ts:50-76` — `countMarkersCrossed(previousHp, newHp, realMaxHp)`: generates thresholds starting at `floor(realMaxHp * 0.5)`, descending by same step. Checks `previousHp > threshold && newHp <= threshold` for each. Unclamped newHp used for counting.
  - `combatant.service.ts:105-106` — Called with `currentHp` (before damage) and `unclampedHp` (can be negative).
- **Classification:** **Correct**

---

### 10. combat-R049 — Pokemon Switching (Present Portion)

- **Rule:** "A full Pokemon Switch requires a Standard Action" (PTU 07-combat.md p.235-237). "A Trainer cannot Switch or Recall their Pokemon if their active Pokemon is out of range of their Poke Ball's recall beam - 8 meters."
- **Expected behavior (present):** GM can add/remove combatants manually.
- **Actual behavior:** The encounters API supports `combatants.post.ts` (add) and `combatants/[combatantId].delete.ts` (remove). No range check, no action consumption, no formal switch workflow.
- **Classification:** **Correct** (the present portion — manual add/remove — works correctly)
- **Note:** Missing formal switch workflow confirmed. Not an incorrectness in what exists.

---

### 11. combat-R076 — Heavily Injured (5+ Injuries)

- **Rule:** "If a Pokemon or Trainer has 5 or more Injuries, they are Heavily Injured and lose additional HP whenever they take a Standard Action or take damage" (PTU p.250)
- **Expected behavior (present):** Injury count tracked accurately, injury threshold visually displayed.
- **Actual behavior:**
  - `app/server/services/combatant.service.ts:121-123` — `newInjuries = currentInjuries + totalNewInjuries` — Injuries accumulated correctly.
  - Injury count stored on entity and displayed in UI.
- **Classification:** **Correct** (tracking is correct)
- **Note:** Missing: no automated HP loss on standard action for heavily injured entities. GM must handle manually.

---

### 12. combat-R080 — Death Conditions (Present Portion)

- **Rule:** "If a Pokemon reaches 10 Injuries or HP falls below -50% (or -200% for Trainers), they die." (PTU p.250-251)
- **Expected behavior (present):** Injury count and negative HP tracked.
- **Actual behavior:**
  - Injuries tracked on entity, incremented by `calculateDamage`. HP clamped to 0 for storage but unclamped value used for marker counting.
  - No automated death check at 10 injuries or specific negative HP thresholds.
- **Classification:** **Correct** (tracking is correct)
- **Note:** Missing: no death automation. GM must track manually.

---

### 13. combat-R089/R093/R094 — Frozen/Sleep/Confusion (Present Portion)

- **Rule:** Frozen: evasion 0, skip turn, save check. Sleep: evasion 0, skip turn, wake on damage. Confusion: save check, self-hit on fail.
- **Expected behavior (present):** Conditions tracked and displayed. Zero-evasion enforcement for Frozen and Sleep.
- **Actual behavior:**
  - `app/constants/statusConditions.ts:31-33` — `ZERO_EVASION_CONDITIONS = ['Vulnerable', 'Frozen', 'Asleep']`
  - `app/utils/evasionCalculation.ts:43-49` — `computeTargetEvasions` returns `{ physical: 0, special: 0, speed: 0 }` when entity has Frozen/Asleep.
  - `app/composables/useCombat.ts:112-123` — `canAct()` returns false for Frozen/Asleep entities.
- **Classification:** **Correct** (the present portions — condition tracking, zero evasion, canAct check — are all correct)
- **Note:** Missing: automated save checks, turn skipping, wake-on-damage, self-hit on confusion fail. All manual GM responsibility currently.
