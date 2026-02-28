---
tier: 6
title: Equipment Chain
audited_at: 2026-02-28T08:00:00Z
items: 2
correct: 1
approximation: 1
---

# Tier 6: Equipment Chain

Verifying armor DR computation, Focus single-item limits, and Helmet conditional DR.

---

### 24. combat-R134 — Armor Damage Reduction

- **Rule:** PTU p.293 (errata-2.md p.4): "Light Armor grants +5 Damage Reduction against Physical Damage. Special Armor grants +5 Damage Reduction against Special Damage. Heavy Armor now grants +5 Damage Reduction against all Damage."
- **Expected behavior:** DR from equipped armor applied in damage calculation. Light Armor = phys only, Special Armor = spec only, Heavy Armor = all.
- **Actual behavior:**
  - `app/utils/equipmentBonuses.ts:62-66` — `computeEquipmentBonuses` accumulates `damageReduction` from all equipped items. Also collects `conditionalDR` entries (e.g., Helmet).
  - `app/composables/useMoveCalculation.ts:545-558` — For human targets: `equipmentDR = equipBonuses.damageReduction`. Critical hit check adds Helmet conditional DR (`cdr.condition === 'Critical Hits only'`).
  - **Gap:** The current implementation sums ALL `damageReduction` from equipped items regardless of damage class. Light Armor DR should only apply to Physical, Special Armor only to Special. The equipment data model stores a flat `damageReduction` number without a `damageClass` discriminator. Heavy Armor's "all damage" DR works correctly since no class filter is needed.
- **Classification:** **Approximation** — MEDIUM severity
- **Note:** For campaigns using Light/Special Armor (not Heavy), Physical DR would incorrectly apply to Special attacks and vice versa. The fix requires adding a `damageClass` field to the EquippedItem DR definition. Heavy Armor users are unaffected.

---

### 25. combat-R065/C065 — Equipment Bonuses (Focus, Helmet)

- **Rule:** PTU p.295: "a Trainer may only benefit from one Focus at a time." Focus grants +5 to a specific stat, applied AFTER combat stages. PTU p.293: Helmet grants +15 DR on critical hits only.
- **Expected behavior:** Only one Focus applies. Focus stat bonus applied post-stage. Helmet conditional DR triggers on crits only.
- **Actual behavior:**
  - `app/utils/equipmentBonuses.ts:57-73` — `focusApplied` flag ensures only the first Focus (in slot priority order) contributes stat bonus. Second+ Focus items are silently ignored. Correct.
  - `app/utils/equipmentBonuses.ts:77-79` — `conditionalDR` entries collected from all items with `condition` string (e.g., "Critical Hits only").
  - `app/composables/useMoveCalculation.ts:551-558` — Helmet DR applied: `if (isCriticalHit.value) { for (const cdr of equipBonuses.conditionalDR) { if (cdr.condition === 'Critical Hits only') { equipmentDR += cdr.amount } } }`. Correct — only applied on crits.
  - `app/utils/damageCalculation.ts:226-232` — `applyStageModifierWithBonus(baseStat, stage, postStageBonus)` — Focus bonus applied after combat stage multiplier. Correct per PTU p.295.
- **Classification:** **Correct**
