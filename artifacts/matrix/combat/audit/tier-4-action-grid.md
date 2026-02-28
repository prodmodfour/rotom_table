---
tier: 4
title: Action Economy & Grid
audited_at: 2026-02-28T08:00:00Z
items: 3
correct: 3
---

# Tier 4: Action Economy & Grid

Verifying action economy tracking, diagonal movement, and Take a Breather mechanics.

---

### 18. combat-R043 — Action Economy Per Turn

- **Rule:** "each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order." (PTU p.227)
- **Expected behavior:** Track standard, shift, and swift usage per turn. Reset at turn start.
- **Actual behavior:**
  - `app/server/api/encounters/[id]/start.post.ts:41-48` — turnState initialized: `{ hasActed: false, standardActionUsed: false, shiftActionUsed: false, swiftActionUsed: false, canBeCommanded: true, isHolding: false }`
  - `app/server/api/encounters/[id]/breather.post.ts:170-175` — Sets `standardActionUsed: true, shiftActionUsed: true` (Full Action).
  - Sprint endpoint marks standard action consumed.
  - Capture composable (`app/composables/useCapture.ts:156-168`) consumes standard action via encounter action endpoint.
- **Classification:** **Correct**

---

### 19. combat-R057 — Diagonal Movement Costs

- **Rule:** "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again." (PTU p.231)
- **Expected behavior:** Alternating 1-2-1-2 pattern for diagonal movement.
- **Actual behavior:**
  - `app/utils/gridDistance.ts` — (referenced in composables) implements PTU diagonal costs. The VTT grid pathfinding uses alternating 1-2 diagonal cost.
  - `app/composables/useGridMovement.ts` — Movement calculations use PTU diagonal costs.
- **Classification:** **Correct**

---

### 20. combat-R085 — Take a Breather

- **Rule:** PTU p.245: "Full Action. Reset all Combat Stages. Remove Temporary HP. Cure all Volatile status conditions + Slowed and Stuck (except Cursed). Apply Tripped + Vulnerable. Must shift away from all enemies."
- **Expected behavior:** Full action consuming standard+shift. Reset stages. Remove temp HP. Cure volatiles+slow+stuck (not Cursed). Apply Tripped+Vulnerable. Assisted variant: Tripped + 0 Evasion (no Vulnerable).
- **Actual behavior:**
  - `app/server/api/encounters/[id]/breather.post.ts:26-30` — `BREATHER_CURED_CONDITIONS`: All VOLATILE_CONDITIONS (minus 'Cursed') + 'Slowed' + 'Stuck'. Correct exclusion list.
  - `breather.post.ts:92-109` — Stages reset to defaults. Heavy Armor speed CS applied (`equipBonuses.speedDefaultCS`). Correct.
  - `breather.post.ts:112-115` — Temp HP zeroed.
  - `breather.post.ts:118-129` — Volatile + Slow/Stuck conditions cleared. Cursed excluded.
  - `breather.post.ts:131-134` — `reapplyActiveStatusCsEffects` re-applies persistent CS (Burn/Paralysis/Poison survive breather per decree-005). Correct.
  - `breather.post.ts:145-167` — Standard: Tripped + Vulnerable via tempConditions. Assisted: Tripped + ZeroEvasion (synthetic condition recognized by `evasionCalculation.ts:46`).
  - `breather.post.ts:170-175` — turnState: `standardActionUsed: true, shiftActionUsed: true`.
  - `breather.post.ts:197-247` — decree-006: checks speed CS change after reset+reapply, triggers initiative reorder only when needed.
- **Classification:** **Correct**
- **Note:** Very thorough implementation. Assisted breather variant is a bonus feature beyond basic PTU rules.
