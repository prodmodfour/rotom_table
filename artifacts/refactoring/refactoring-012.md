---
ticket_id: refactoring-012
priority: P2
categories:
  - PTU-INCORRECT
affected_files:
  - app/server/services/combatant.service.ts
  - app/server/services/pokemon-generator.service.ts
  - app/server/api/encounter-templates/[id]/load.post.ts
estimated_scope: small
status: resolved
created_at: 2026-02-16T22:00:00
source: rules-review-009
---

## Summary

Three combatant creation sites compute initial evasion as `Math.floor(stat / 5)` without the PTU-mandated +6 cap. The dynamic `calculateEvasion()` used during accuracy checks (in `damageCalculation.ts` and `useCombat.ts`) correctly applies `Math.min(6, ...)`, so live gameplay calculations are not affected. However, the stored `physicalEvasion`, `specialEvasion`, and `speedEvasion` values on the combatant object can exceed 6 for entities with stats above 30 — which is incorrect per PTU p.310-314.

## Findings

### Finding 1: PTU-INCORRECT — Missing evasion cap at combatant creation

- **Rule:** PTU p.310-314: "You may never have more than +6 in a [given evasion]." Also: "up to a maximum of +6 at 30 Defense."
- **Impact:** The stored evasion values on combatant objects can exceed 6. Any code that reads `combatant.physicalEvasion` directly (rather than recalculating via `calculateEvasion()`) would use an uncapped value. Currently, accuracy checks recalculate dynamically, so live damage/accuracy is unaffected. The risk is cosmetic display (e.g., showing evasion 7 in UI) and future code that might read the stored value without recalculating.
- **Evidence:**

  **Site 1:** `combatant.service.ts:555-557` (`buildCombatantFromEntity`)
  ```typescript
  physicalEvasion: Math.floor((stats.defense || 0) / 5),   // no cap
  specialEvasion: Math.floor((stats.specialDefense || 0) / 5),
  speedEvasion: Math.floor((stats.speed || 0) / 5),
  ```

  **Site 2:** `pokemon-generator.service.ts:301-303` (`buildPokemonCombatant`)
  ```typescript
  physicalEvasion: Math.floor(data.calculatedStats.defense / 5),  // no cap
  specialEvasion: Math.floor(data.calculatedStats.specialDefense / 5),
  speedEvasion: Math.floor(data.calculatedStats.speed / 5),
  ```

  **Site 3:** `encounter-templates/[id]/load.post.ts:116-118`
  ```typescript
  physicalEvasion: Math.floor(baseDefense / 5),  // no cap
  specialEvasion: Math.floor(baseSpDef / 5),
  speedEvasion: Math.floor(baseSpeed / 5)
  ```

  **Correct implementation (already exists in dynamic path):**
  `damageCalculation.ts:115`:
  ```typescript
  const statEvasion = Math.min(6, Math.floor(applyStageModifier(baseStat, combatStage) / 5))
  ```
  `useCombat.ts:54`:
  ```typescript
  const statEvasion = Math.min(6, Math.floor(applyStageModifier(stat, combatStages) / 5))
  ```

## Suggested Fix

Add `Math.min(6, ...)` to all three sites. Example for `combatant.service.ts`:

```typescript
physicalEvasion: Math.min(6, Math.floor((stats.defense || 0) / 5)),
specialEvasion: Math.min(6, Math.floor((stats.specialDefense || 0) / 5)),
speedEvasion: Math.min(6, Math.floor((stats.speed || 0) / 5)),
```

Alternatively, extract a shared `initialEvasion(stat)` helper to avoid the pattern being written differently in 3 places. This overlaps with refactoring-011 (combatant wrapper duplication between `pokemon-generator.service.ts` and `combatant.service.ts`).

Estimated commits: 1

## Related

- **refactoring-011:** Combatant wrapper duplication — sites 1 and 2 would unify if that ticket is resolved first
- **rules-review-009:** Observation that identified this gap
- **code-review-004:** Previously noted these as "spawn-time initial values — never consumed for live gameplay"
- **design-testability-001 P1:** Added the correct `calculateEvasion()` with cap for dynamic recalculation

## Resolution Log

- **Commit:** `ed32385` — `fix: cap initial evasion at +6 per PTU rules (p.310-314)`
- **Files changed:**
  - `app/server/services/combatant.service.ts` — extracted `initialEvasion()` helper (exported, `Math.min(6, Math.floor(stat / 5))`), applied in `buildCombatantFromEntity`
  - `app/server/api/encounter-templates/[id]/load.post.ts` — imported `initialEvasion`, applied to inline human combatant builder
- **Note:** Ticket listed 3 sites, but Site 2 (`buildPokemonCombatant` in `pokemon-generator.service.ts`) already delegates to `buildCombatantFromEntity` — so fixing Site 1 covered both. Only 2 actual code changes needed.
- **Tests:** 507/508 Vitest pass (1 pre-existing failure in `settings.test.ts` — unrelated)
