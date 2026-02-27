---
ticket_id: ptu-rule-048
priority: P3
status: resolved
domain: combat
matrix_source:
  rule_id: combat-R010
  audit_file: matrix/combat-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Evasion combat stage is treated as an independent additive modifier rather than being derived from the stat-based evasion value as PTU defines. The combat stage applies a flat modification rather than the PTU multiplier table.

## Expected Behavior (PTU Rules)

Evasion is stat-derived and combat stages apply multipliers per the CS table (e.g., CS +1 = x1.2, CS +2 = x1.4).

## Actual Behavior

Evasion CS is applied as an additive modifier to the accuracy threshold check.

## Resolution Log

**Date:** 2026-02-20
**Finding:** The formulas were already PTU-correct. The ticket was based on audit classification "Approximation" (combat-R010) which misidentified the evasion bonus as a simplification when it actually matches PTU's two-part evasion system.

**PTU Rules Analysis (07-combat.md:594-657):**
1. **Stat-derived evasion** (Part 1): `floor(stageModified(Stat) / 5)` capped at +6. Combat stages on Def/SpDef/Speed apply the multiplier table to the stat BEFORE evasion is derived. This was already correctly implemented in `calculateEvasion()` in both `useCombat.ts` and `damageCalculation.ts`.
2. **Evasion bonus from moves/effects** (Part 2, PTU p.234 lines 648-653): "Besides these base values for evasion, Moves and effects can raise or lower Evasion. These extra Changes in Evasion apply to all types of Evasion, and stack on top." This IS an additive modifier by PTU design, with its own -6/+6 range. The `stageModifiers.evasion` field correctly represents this bonus.
3. **Total evasion cap**: `min(9, total)` applied at accuracy threshold time. Already implemented.

**What was actually fixed:**
- **UI clarity**: The CombatStagesModal now separates "Combat Stages (stat multipliers)" from "Accuracy & Evasion (additive modifiers)" into labeled sections, preventing confusion between the two PTU mechanics
- **Label update**: Evasion label renamed from "Eva" to "Eva Bonus" / "Eva+" across all display components (CombatStagesModal, CombatantCard, CombatantDetailsPanel, PokemonStatsTab)
- **Code documentation**: Added comprehensive JSDoc on `StageModifiers` type and annotated all evasion calculation callsites with PTU rule references explaining the two-part system

**Files changed:**
- `app/types/combat.ts` — JSDoc on StageModifiers fields
- `app/components/encounter/CombatStagesModal.vue` — split into two sections, renamed "Eva" to "Eva Bonus"
- `app/components/encounter/CombatantCard.vue` — "Eva" to "Eva+"
- `app/components/group/CombatantDetailsPanel.vue` — "EVA" to "EVA+"
- `app/components/pokemon/PokemonStatsTab.vue` — "EVA" to "EVA+"
- `app/composables/useCombat.ts` — expanded evasion calculation comment block
- `app/composables/useMoveCalculation.ts` — annotated evasionBonus usage
- `app/utils/damageCalculation.ts` — comprehensive calculateEvasion JSDoc
- `app/server/api/encounters/[id]/calculate-damage.post.ts` — annotated evasion computation
- `app/server/services/combatant.service.ts` — documented three modifier categories
