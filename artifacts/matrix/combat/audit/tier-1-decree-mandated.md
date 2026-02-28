---
tier: 1
title: Decree-Mandated Verifications
audited_at: 2026-02-28T08:00:00Z
items: 6
correct: 5
incorrect: 1
---

# Tier 1: Decree-Mandated Verifications

Items where active decrees dictate specific implementation behavior. Must confirm code follows each decree.

---

### 1. combat-R033 — Type Immunities to Status (decree-012)

- **Rule:** "Electric Types are immune to Paralysis; Fire Types are immune to Burn; Ghost Types cannot be Stuck or Trapped; Ice Types are immune to being Frozen; Poison and Steel Types are immune to Poison" (PTU 07-combat.md p.239)
- **Decree:** decree-012 mandates server-side enforcement with GM override flag
- **Expected behavior:** status.post.ts rejects immune statuses unless `override: true` is sent
- **Actual behavior:**
  - `app/utils/typeStatusImmunity.ts:22-29` — `TYPE_STATUS_IMMUNITIES` maps Electric->Paralyzed, Fire->Burned, Ghost->Stuck/Trapped, Ice->Frozen, Poison->Poisoned/BadlyPoisoned, Steel->Poisoned/BadlyPoisoned. All 6 PTU immunities present.
  - `app/server/api/encounters/[id]/status.post.ts:51-71` — Checks `findImmuneStatuses(entityTypes, addStatuses)` for Pokemon targets. If immune and `!body.override`, throws 409 error with informative message and `hint: 'Send override: true'`.
  - Additional Naturewalk immunity check at lines 76-98 for terrain-based Slowed/Stuck immunity.
- **Classification:** **Correct** per decree-012
- **Note:** Previous audit had this as not-implemented. Now fully implemented.

---

### 2. combat-R088 — Burned Status CS Auto-Apply (decree-005)

- **Rule:** "Burned: -2 Defense Combat Stage" (PTU 07-combat.md p.246)
- **Decree:** decree-005 mandates auto-apply with source tracking
- **Expected behavior:** Adding Burn auto-applies -2 Def CS tagged with source "Burned". Removing Burn reverses exactly that delta.
- **Actual behavior:**
  - `app/constants/statusConditions.ts:48` — `STATUS_CS_EFFECTS` entry: `{ condition: 'Burned', stat: 'defense', value: -2 }`
  - `app/server/services/combatant.service.ts:344-373` — `applyStatusCsEffects` applies the delta, records in `combatant.stageSources` with actual delta (accounts for -6 bound clamping).
  - `app/server/services/combatant.service.ts:381-403` — `reverseStatusCsEffects` finds matching source entries, reverses each recorded delta, removes source entries.
  - `app/server/api/encounters/[id]/status.post.ts:102` — `updateStatusConditions` auto-calls both functions.
  - Stage changes synced to DB at `status.post.ts:106-109`.
- **Classification:** **Correct** per decree-005

---

### 3. combat-R090 — Paralysis CS Auto-Apply (decree-005)

- **Rule:** "Paralyzed: -4 Speed Combat Stage" (PTU 07-combat.md p.247)
- **Decree:** decree-005 mandates auto-apply with source tracking
- **Expected behavior:** Adding Paralysis auto-applies -4 Speed CS with source tracking
- **Actual behavior:**
  - `app/constants/statusConditions.ts:49` — `{ condition: 'Paralyzed', stat: 'speed', value: -4 }`
  - Same `applyStatusCsEffects`/`reverseStatusCsEffects` mechanism as R088.
  - `app/server/api/encounters/[id]/status.post.ts:111-144` — decree-006 integration: after Paralysis changes Speed CS, triggers `reorderInitiativeAfterSpeedChange` on active encounters.
- **Classification:** **Correct** per decree-005 and decree-006

---

### 4. combat-R091 — Poisoned CS Auto-Apply (decree-005)

- **Rule:** "Poisoned: -2 Special Defense Combat Stage" (PTU 07-combat.md p.247)
- **Decree:** decree-005 mandates auto-apply with source tracking
- **Expected behavior:** Adding Poison/Badly Poisoned auto-applies -2 SpDef CS
- **Actual behavior:**
  - `app/constants/statusConditions.ts:50-51` — Both entries: `{ condition: 'Poisoned', stat: 'specialDefense', value: -2 }` and `{ condition: 'Badly Poisoned', stat: 'specialDefense', value: -2 }`
  - Same mechanism as R088/R090.
- **Classification:** **Correct** per decree-005
- **Note:** Badly Poisoned correctly gets its own entry since it can coexist contextually (though PTU typically only has one active).

---

### 5. combat-R035/R037 — League Two-Phase Trainer System (decree-021)

- **Rule:** "In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed." (PTU 07-combat.md p.64-70)
- **Decree:** decree-021 mandates true two-phase implementation
- **Expected behavior:** Phase 1 (`trainer_declaration`): trainers declare low->high. Phase 2 (`trainer_resolution`): resolve high->low. Phase 3 (`pokemon`): act high->low.
- **Actual behavior:**
  - `app/server/api/encounters/[id]/start.post.ts:88-114` — Sets `currentPhase = 'trainer_declaration'` for League battles. Sorts trainers low->high for `trainerTurnOrder`. Sorts pokemon high->low for `pokemonTurnOrder`. Initial turnOrder = trainerTurnOrder (declaration order).
  - **Gap:** The `trainer_resolution` phase is defined in the type system (`app/types/combat.ts`) but the next-turn endpoint does not transition from `trainer_declaration` to `trainer_resolution` with reversed (high->low) order. After declarations, it appears to skip to `pokemon` phase. The `declarations` array is saved but never processed for resolution.
- **Classification:** **Incorrect** — HIGH severity
- **Note:** Infrastructure (type definitions, DB field, declaration storage) is 70% complete. Missing: the transition logic to activate `trainer_resolution` and process declarations in high->low order before moving to pokemon phase. Ticket ptu-rule-107 exists.

---

### 6. combat-R039 — Dynamic Initiative Reorder (decree-006)

- **Rule:** "Ties in Initiative should be settled with a d20 roll off." (PTU 07-combat.md p.75)
- **Decree:** decree-006 mandates dynamically reordering initiative when Speed CS changes, without granting extra turns
- **Expected behavior:** On Speed CS change, recalculate initiative for all combatants, re-sort unacted combatants, preserve acted positions.
- **Actual behavior:**
  - `app/server/services/encounter.service.ts:320-440` — `reorderInitiativeAfterSpeedChange()`: recalculates initiative via `calculateCurrentInitiative()` for all combatants, splits turn order into acted (frozen) + unacted (re-sortable), re-sorts unacted by new initiative with rolloff, reconstructs order.
  - `app/server/services/combatant.service.ts:778-796` — `calculateCurrentInitiative()`: uses current `stageModifiers.speed` with equipment Focus bonus for accurate speed.
  - Called from: `stages.post.ts:50-76` (manual CS changes), `status.post.ts:111-144` (status CS effects), `breather.post.ts:197-247` (stage reset + reapply).
  - `app/server/services/encounter.service.ts:128-182` — `sortByInitiativeWithRollOff()` handles ties with d20 rolloff, re-rolling until all ties broken.
- **Classification:** **Correct** per decree-006
- **Note:** Previous audit had this as Approximation (static initiative). Now fully implemented with proper three-callsite integration.
