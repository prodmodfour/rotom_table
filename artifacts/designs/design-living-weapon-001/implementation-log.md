# Implementation Log

## Status: implemented

P0 implemented (Sections A-D) + fix cycle applied. P1 implemented (Sections E-I) + fix cycle applied. P2 implemented (Sections J-N) + bug-050 fixed.

---

## Timeline

| Date | Action | Details |
|------|--------|---------|
| 2026-02-28 | Design spec created | Full P0/P1/P2 spec for Living Weapon system |
| 2026-03-03 | P0 implemented | 14 commits: data model, constants, capability parsing, service, API endpoints, WebSocket, encounter integration, auto-disengage on removal/recall/switch |
| 2026-03-03 | P0 fix cycle | 8 commits: code-review-297 (C1+H1-H3+M1-M3) + rules-review-270 (HIGH#1-#2+MEDIUM#1) + bug-046 + decree-043 |
| 2026-03-04 | P1 implemented | 12 commits: equipment overlay, weapon moves, evasion refresh, integration across all 4 code paths + faint state sync |
| 2026-03-04 | P1 fix cycle | 6 commits: code-review-316 (1H+2M) + rules-review-289 (1H+2M). Weapon move DB +1 mod, Weapon keyword STAB exclusion, getEffectiveEquipBonuses extraction, GM move UI injection, encounter reload wield state, app-surface update |
| 2026-03-04 | P2 implemented | 12 commits: bug-050 fix, WieldRelationship P2 fields, VTT shared movement, No Guard suppression, Aegislash forced Blade forme, Weaponize intercept, Soulstealer healing (3 code paths) |

---

## P2 Commits

| Commit | Section | Description |
|--------|---------|-------------|
| c3b07416 | bug-050 | Fix moveKeywords passthrough in calculate-damage.post.ts |
| 1d01abf7 | J/L | Add movementUsedThisRound and wasInBladeFormeOnEngage to WieldRelationship |
| c4f405c4 | J-N | Add all P2 service functions (shared movement, No Guard, Aegislash, Weaponize, Soulstealer) |
| cf4aac7c | J | Integrate shared movement pool into useGridMovement composable |
| 822e44f1 | J | Add linked position sync to position.post.ts endpoint |
| 74e61f15 | J | Track shared movement pool in handleTokenMove (useEncounterActions) |
| 42fe84e8 | K | Enforce No Guard suppression in calculate-damage.post.ts |
| 27177c73 | L | Aegislash forced Blade forme + position sync on engage |
| 03f837c0 | L | Aegislash forme revert on disengage + wasInBladeFormeOnEngage on Combatant |
| 61378ad5 | M | Weaponize Free Action intercept support in intercept-melee.post.ts |
| cf5ba7a7 | N | Soulstealer healing in damage.post.ts |
| c1a7c0ea | N | Soulstealer healing in move.post.ts (L2 duplicate path) |
| 6db8c8bb | N | Soulstealer healing in aoo-resolve.post.ts (L2 duplicate path) |

## P2 Files Changed

### Modified Files
- `app/types/combat.ts` — WieldRelationship P2 fields (movementUsedThisRound, wasInBladeFormeOnEngage)
- `app/types/encounter.ts` — Combatant.wasInBladeFormeOnEngage field
- `app/server/services/living-weapon.service.ts` — All P2 functions (syncWeaponPosition, handleLinkedMovement, getWieldedMovementSpeed, resetWieldMovementPools, isNoGuardActive, swapAegislashStance, isAegislashBladeForm, canUseWeaponize, checkSoulstealer, applySoulstealerHealing)
- `app/server/services/living-weapon-state.ts` — movementUsedThisRound default in reconstruction
- `app/server/api/encounters/[id]/calculate-damage.post.ts` — moveKeywords passthrough + No Guard suppression
- `app/server/api/encounters/[id]/position.post.ts` — Living Weapon linked position sync
- `app/server/api/encounters/[id]/damage.post.ts` — Soulstealer healing integration
- `app/server/api/encounters/[id]/move.post.ts` — Soulstealer healing integration
- `app/server/api/encounters/[id]/aoo-resolve.post.ts` — Soulstealer healing integration
- `app/server/api/encounters/[id]/intercept-melee.post.ts` — Weaponize Free Action intercept
- `app/server/api/encounters/[id]/living-weapon/engage.post.ts` — Aegislash Blade forme + position sync
- `app/server/api/encounters/[id]/living-weapon/disengage.post.ts` — Aegislash forme revert
- `app/composables/useGridMovement.ts` — Shared movement pool integration
- `app/composables/useEncounterActions.ts` — Local movement pool tracking

---

## P1 Commits

| Commit | Section | Description |
|--------|---------|-------------|
| 056780bb | E/F/G/H | computeEffectiveEquipment, buildLivingWeaponEquippedItem, buildLivingWeaponShield in equipmentBonuses.ts |
| b62452f5 | E | getEffectiveEquipmentBonuses in living-weapon.service.ts |
| 69ebdfc5 | I | getGrantedWeaponMoves, getEffectiveMoveList for weapon move injection |
| 7d151309 | E | refreshCombatantEquipmentBonuses for post-engage/disengage evasion update |
| cf69f2ea | E | calculateCurrentInitiative updated with wieldRelationships support |
| 76929cb2 | E | calculate-damage.post.ts updated with effective equipment + weapon move lookup |
| d0ceade5 | E/F/G | evasionCalculation.ts + useMoveCalculation.ts updated with Living Weapon overlay |
| caeb7759 | E | engage/disengage endpoints call refreshCombatantEquipmentBonuses |
| c4ef51ff | H | damage.post.ts refreshes wielder evasion on Living Weapon faint |
| 4c795e5b | H | heal.post.ts refreshes wielder evasion on Living Weapon faint recovery |
| a9162f74 | - | Remove unused computeEquipmentBonuses import from damage calc |
| c0b3e100 | H | use-item.post.ts refreshes wielder evasion on Living Weapon revive |

## P1 Files Changed

### Modified Files
- `app/utils/equipmentBonuses.ts` — computeEffectiveEquipment, buildLivingWeaponEquippedItem, buildLivingWeaponShield
- `app/server/services/living-weapon.service.ts` — getEffectiveEquipmentBonuses, refreshCombatantEquipmentBonuses, getGrantedWeaponMoves, getEffectiveMoveList
- `app/server/services/combatant.service.ts` — calculateCurrentInitiative accepts wieldRelationships
- `app/server/services/encounter.service.ts` — reorderInitiativeAfterSpeedChange passes wield relationships
- `app/utils/evasionCalculation.ts` — computeTargetEvasions accepts wieldRelationships
- `app/composables/useMoveCalculation.ts` — Uses effective equipment with Living Weapon overlay
- `app/server/api/encounters/[id]/calculate-damage.post.ts` — Uses effective equipment + weapon move lookup
- `app/server/api/encounters/[id]/living-weapon/engage.post.ts` — Calls refreshCombatantEquipmentBonuses
- `app/server/api/encounters/[id]/living-weapon/disengage.post.ts` — Calls refreshCombatantEquipmentBonuses
- `app/server/api/encounters/[id]/damage.post.ts` — Refreshes wielder evasion on Living Weapon faint
- `app/server/api/encounters/[id]/heal.post.ts` — Refreshes wielder evasion on Living Weapon faint recovery
- `app/server/api/encounters/[id]/use-item.post.ts` — Refreshes wielder evasion on Living Weapon revive

## P1 Implementation Notes

### Equipment Overlay Pattern
The Living Weapon equipment overlay is a runtime computation that replaces the trainer's mainHand (and offHand for Doublade/Aegislash) with dynamic EquippedItem objects. The trainer's persisted equipment JSON is never modified. This is implemented in `computeEffectiveEquipment()` and consumed through `getEffectiveEquipmentBonuses()`.

### Duplicate Code Path Check (L2 Lesson Applied)
All code paths that compute equipment bonuses for trainers in combat were identified and updated:
1. `buildCombatantFromEntity()` — No change needed (called before wield relationships exist)
2. `calculateCurrentInitiative()` — Updated to accept optional wieldRelationships
3. `calculate-damage.post.ts` — Uses getEffectiveEquipmentBonuses
4. `computeTargetEvasions()` / `useMoveCalculation.ts` — Uses effective equipment
5. `breather.post.ts` — Not changed (only checks speedDefaultCS, not affected by Living Weapon)

### Faint State Sync
When a wielded Pokemon faints or is healed from faint, the wielder's evasion values are immediately refreshed to apply or remove the -2 penalty. This is handled in 3 endpoints:
1. `damage.post.ts` — On faint
2. `heal.post.ts` — On faint removal
3. `use-item.post.ts` — On revive via item

---

## P1 Fix Cycle Commits

| Commit | Issue | Description |
|--------|-------|-------------|
| ca91d05e | rules-289 HIGH#1 | Apply Small Melee Weapon +1 DB modifier to weapon move constants |
| 9adc611c | rules-289 MEDIUM#1 | Skip STAB for moves with Weapon keyword (3 code paths) |
| 900cd8cb | code-316 MEDIUM#1 | Extract getEffectiveEquipBonuses to shared utility (800-line compliance) |
| 9eebcede | code-316 HIGH#1 | Inject weapon moves into GMActionModal move selection UI |
| 1a607b6a | rules-289 MEDIUM#2 | Restore wielder evasion on encounter reload via buildEncounterResponse |
| 83797b0e | code-316 MEDIUM#2 | Update app-surface.md with P1 function additions |

### P1 Fix Cycle Files Changed
- `app/constants/livingWeapon.ts` — Weapon move DB values +1
- `app/composables/useMoveCalculation.ts` — STAB exclusion, extracted getEffectiveEquipBonuses
- `app/components/encounter/GMActionModal.vue` — Weapon move injection into move list
- `app/components/encounter/MoveButton.vue` — STAB exclusion for Weapon keyword
- `app/utils/damageCalculation.ts` — moveKeywords field + STAB exclusion in calculateDamage
- `app/utils/equipmentBonuses.ts` — getEffectiveEquipBonuses shared utility function
- `app/server/services/encounter.service.ts` — Refresh wielder evasion on encounter load
- `artifacts/designs/design-living-weapon-001/shared-specs.md` — Corrected weapon move DB table
- `.claude/skills/references/app-surface.md` — P1 function documentation

---

## P0 Commits

| Commit | Section | Description |
|--------|---------|-------------|
| ad2d0f2b | A | WieldRelationship interface and combatant wield state fields |
| 90e2cc80 | B | Living Weapon constants (LIVING_WEAPON_CONFIG, weapon moves) |
| 71b866bd | B | getLivingWeaponConfig capability parser |
| 5f9e1961 | D | living-weapon.service.ts with pure wield state functions |
| 96b38eb5 | D | wieldRelationships reconstruction from combatant flags |
| 19535e88 | C | POST engage endpoint (Standard Action) |
| 71d661ab | C | POST disengage endpoint (Swift Action) |
| 8ae5a880 | D | WebSocket event handlers (living_weapon_engage/disengage) |
| b57167ef | D | Auto-disengage on combatant removal |
| eef602bd | D | Encounter response and store integration |
| 4a568048 | D | Faint behavior documentation in damage endpoint |
| 39a4bc1c | D | Auto-disengage on Pokemon recall |
| 1d2d3f18 | D | Auto-disengage on Pokemon switch |
| 7eee573a | D | WebSocket state sync includes wieldRelationships |

## P0 Files Changed

### New Files
- `app/constants/livingWeapon.ts` — Species config, weapon move definitions
- `app/server/services/living-weapon.service.ts` — Pure wield state functions
- `app/server/services/living-weapon-state.ts` — State reconstruction from combatant flags
- `app/server/api/encounters/[id]/living-weapon/engage.post.ts` — Engage endpoint
- `app/server/api/encounters/[id]/living-weapon/disengage.post.ts` — Disengage endpoint

### Modified Files
- `app/types/combat.ts` — WieldRelationship interface
- `app/types/encounter.ts` — Combatant wield fields, Encounter wieldRelationships
- `app/utils/combatantCapabilities.ts` — getLivingWeaponConfig()
- `app/server/services/encounter.service.ts` — ParsedEncounter + buildEncounterResponse
- `app/server/routes/ws.ts` — Event handlers + state sync
- `app/stores/encounter.ts` — Living Weapon getters + WebSocket sync
- `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts` — Auto-disengage
- `app/server/api/encounters/[id]/recall.post.ts` — Auto-disengage
- `app/server/api/encounters/[id]/switch.post.ts` — Auto-disengage
- `app/server/api/encounters/[id]/damage.post.ts` — Faint behavior comment

## Implementation Notes

### Data Storage Approach
WieldRelationships are **not stored in a dedicated DB column**. Instead, the combatant flags (`wieldingWeaponId`, `wieldedByTrainerId`) are persisted as part of the combatants JSON column. The full `WieldRelationship[]` array is reconstructed at runtime from these flags using `reconstructWieldRelationships()`. This avoids needing a Prisma schema migration for P0.

### Design Deviation: `updateWieldFaintedState`
The spec defines `updateWieldFaintedState` for explicitly updating the fainted flag on wield relationships. Since relationships are reconstructed from combatant flags (which include the entity's HP state), the `isFainted` flag is automatically correct at reconstruction time. The function exists in the service for future use if relationships are stored in a dedicated column, but is not called in the current flow.

## Fix Cycle Commits

| Commit | Issue | Description |
|--------|-------|-------------|
| c924acb4 | decree-043, rules-270 HIGH#1 | Remove Combat Skill Rank gate from engagement |
| ecbc2159 | code-297 M1 | Validate homebrew species (default to Honedge) |
| 48123a55 | code-297 C1/H2/M3, rules-270 HIGH#2/MEDIUM#1 | Overhaul engage endpoint |
| 29e792f4 | code-297 C1/H2/M3, rules-270 MEDIUM#1 | Overhaul disengage endpoint |
| ff8e7f0e | bug-046 | Fix malformed WS broadcast in mount/dismount |
| 80b4f5fa | code-297 H1 | Add WS event types and client handlers |
| a5199014 | code-297 H3 | File unit test coverage ticket (feature-024) |
| d9b6c420 | code-297 M2 | Update app-surface.md |

### Duplicate Code Path Check (L2 Lesson)
Searched all combatant removal paths and added auto-disengage to:
1. `[combatantId].delete.ts` — Direct removal
2. `recall.post.ts` — Pokemon recall
3. `switch.post.ts` — Pokemon switch (recall half)
