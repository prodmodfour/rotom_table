# Implementation Log

## Status: p2-fix-applied

P0 (Core Mount Relationship, API, and Turn Integration) is fully implemented.
P1 (VTT Integration, Dismount Checks, Edge Effects, UI) is fully implemented.
P2 (Rider Trainer Class Features) is fully implemented.

## P0 Implementation

### Section A: Mount Relationship Data Model
- `1a2cc2d0` — Add MountState interface to `app/types/combat.ts`
- `7901c522` — Add mountState field to Combatant in `app/types/encounter.ts`

### Section B: Mountable Capability Parsing
- `a72a91ba` — Create `app/utils/mountingRules.ts` with capability parsing, DC constants, skill checks

### Section C: Mount/Dismount API Endpoints
- `638aa99c` — Create `app/server/services/mounting.service.ts` with mount/dismount business logic
- `5aeaf85d` — Create `app/server/api/encounters/[id]/mount.post.ts`
- `e43df266` — Create `app/server/api/encounters/[id]/dismount.post.ts`

### Section D: Mount State in Combat Turn System
- `8aded059` — Reset mount movement on new round in `next-turn.post.ts`
- `058bd107` — Mounted combatants use shared movementRemaining in `useGridMovement.ts`
- `1f5dcfd0` — Mount/dismount actions and getters in `encounter.ts` store
- `716c1c77` — Clear mount state on combatant removal in `[combatantId].delete.ts`
- `88bc800b` — Auto-dismount on faint from damage in `damage.post.ts`
- `09b0dce6` — Linked movement for mounted pairs in `position.post.ts`
- `59173398` — Auto-dismount on faint from tick damage in `next-turn.post.ts`
- `7fd76ad0` — Sync mountState in WebSocket surgical combatant update

### Files Changed (P0)
| Action | File |
|--------|------|
| EDIT | `app/types/combat.ts` |
| EDIT | `app/types/encounter.ts` |
| NEW | `app/utils/mountingRules.ts` |
| NEW | `app/server/services/mounting.service.ts` |
| NEW | `app/server/api/encounters/[id]/mount.post.ts` |
| NEW | `app/server/api/encounters/[id]/dismount.post.ts` |
| EDIT | `app/composables/useGridMovement.ts` |
| EDIT | `app/server/api/encounters/[id]/next-turn.post.ts` |
| EDIT | `app/server/api/encounters/[id]/damage.post.ts` |
| EDIT | `app/server/api/encounters/[id]/position.post.ts` |
| EDIT | `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts` |
| EDIT | `app/stores/encounter.ts` |

## P1 Implementation

### Section E: VTT Linked Token Movement
- `8658dc2f` — Add dismount check info builder and easy intercept check to `mountingRules.ts`
- `667896ab` — Add mount state CSS classes and rider badge to `VTTToken.vue`
- `8edc891b` — Create `VTTMountedToken.vue` for stacked token rendering (rider at 60% scale)
- `0f201661` — Integrate VTTMountedToken into GridCanvas rendering (skip riders, render pairs)
- `65a7e1c1` — Apply mount's movement modifiers for mounted rider speed calculation

### Section F: Dismount Check on Damage/Push
- `1ef65298` — Trigger dismount check when mounted combatant takes >= 1/4 max HP damage
- `97f5e691` — Notify GM when damage triggers dismount check on mounted combatant

### Section G: Mounted Prowess Edge Effect
- `8658dc2f` — hasMountedProwess() already exists from P0; buildDismountCheckInfo includes +3 bonus

### Section H: Intercept Bonus Between Rider and Mount
- `8658dc2f` — Add isEasyIntercept() function to mountingRules.ts
- `8edc891b` — VTTMountedToken shows Easy Intercept badge with tooltip (PTU p.218)
- `07ef0b41` — MountControls panel shows Easy Intercept reminder note

### Section I: UI Mount Indicators
- `07ef0b41` — Create MountControls.vue panel (mount/dismount controls, movement info)
- `3f0c7561` — Add mountedPairs, getMountState, canDismount getters to encounter store
- `dd5c4eca` — Show mount relationship indicator on CombatantCard in initiative list
- `72e3e216` — Add mount indicator to GroupCombatantCard for group view
- `4985d999` — Add mount indicator to PlayerCombatantCard for player view
- `01fe333d` — Integrate MountControls panel into GM encounter page
- `ffa1655c` — Add mount_change WebSocket broadcast event to ws.ts
- `65ead0cb` — Handle mount_change WebSocket event in client composable
- `b09ee237` — Broadcast mount_change and encounter_update after mount/dismount
- `63d96c94` — Fix: use continue instead of return in mount options combatant loop

### Files Changed (P1)
| Action | File |
|--------|------|
| EDIT | `app/utils/mountingRules.ts` |
| EDIT | `app/components/vtt/VTTToken.vue` |
| NEW | `app/components/vtt/VTTMountedToken.vue` |
| EDIT | `app/components/vtt/GridCanvas.vue` |
| EDIT | `app/composables/useGridMovement.ts` |
| EDIT | `app/server/api/encounters/[id]/damage.post.ts` |
| EDIT | `app/stores/encounter.ts` |
| EDIT | `app/composables/useEncounterActions.ts` |
| NEW | `app/components/encounter/MountControls.vue` |
| EDIT | `app/components/encounter/CombatantCard.vue` |
| EDIT | `app/components/encounter/GroupCombatantCard.vue` |
| EDIT | `app/components/encounter/PlayerCombatantCard.vue` |
| EDIT | `app/pages/gm/index.vue` |
| EDIT | `app/server/routes/ws.ts` |
| EDIT | `app/composables/useWebSocket.ts` |

## P2 Implementation

### Section J: Rider Class Feature — Rider (Agility Training Doubling)
- `aae04e0f` — Add hasRiderClass, hasRiderFeature to mountingRules.ts
- `aae04e0f` — Add RIDER_FEATURE_NAMES and AGILITY_TRAINING constants to trainerClasses.ts
- `3467ecf4` — Add Agility Training toggle in MountControls.vue (sets 'Agile' tempCondition)
- `48d888b9` — Add toggleAgilityTraining action in encounter store

### Section K: Ramming Speed (Run Up Ability)
- `019f7d1a` — Add calculateRunUpBonus() to mountingRules.ts
- `aae04e0f` — Add hasRunUp() and isDashOrPassRange() to mountingRules.ts
- `3467ecf4` — Display Run Up bonus on mount's turn in MountControls.vue

### Section L: Conqueror's March
- `aae04e0f` — Add isConquerorsMarchEligibleRange() to mountingRules.ts
- `48d888b9` — Add activateConquerorsMarch action in encounter store
- `3467ecf4` — Add Conqueror's March activation button in MountControls.vue

### Section M: Ride as One (Shared Speed Evasion + Initiative)
- `bacb7c4c` — Implement applyRideAsOneEvasion and restoreRideAsOneEvasion in mounting.service.ts
- `bacb7c4c` — Integrate evasion sharing into executeMount and executeDismount
- `bacb7c4c` — Restore evasion on clearMountOnFaint
- `9763fd18` — Add originalSpeedEvasion and rideAsOneSwapped to MountState
- `d7a0da4e` — Reset rideAsOneSwapped at round start in turn-helpers.ts
- `48d888b9` — Add setRideAsOneSwapped action in encounter store
- `3467ecf4` — Display Ride as One indicator in MountControls.vue

### Section N: Lean In (Burst/Blast/Cone/Line Resistance)
- `019f7d1a` — Add applyResistStep() and isAoERange() to mountingRules.ts
- `9763fd18` — Add featureUsage to Combatant type
- `48d888b9` — Add useSceneFeature action for scene-limited tracking
- `3467ecf4` — Add Lean In usage counter and activation button in MountControls.vue
- `cbb3b00e` — Reset featureUsage on scene transition in next-scene.post.ts

### Section O: Cavalier's Reprisal (Counter-Attack)
- `91449c1f` — Detect reprisal opportunity in damage.post.ts (when mount hit by adjacent foe)
- `3467ecf4` — Display Cavalier's Reprisal info and AP cost in MountControls.vue

### Section P: Overrun (Speed Stat to Damage)
- `019f7d1a` — Add calculateOverrunModifiers() to mountingRules.ts
- `3467ecf4` — Add Overrun activation button with usage tracking in MountControls.vue

### Cross-Cutting: Distance Tracking
- `9763fd18` — Add distanceMovedThisTurn to TurnState type
- `d7a0da4e` — Reset distanceMovedThisTurn in turn state resets
- `bad8df60` — Track distance on token movement in useEncounterActions.ts
- `48d888b9` — Add addDistanceMoved action in encounter store

### Files Changed (P2)
| Action | File |
|--------|------|
| EDIT | `app/utils/mountingRules.ts` |
| EDIT | `app/types/combat.ts` |
| EDIT | `app/types/encounter.ts` |
| EDIT | `app/constants/trainerClasses.ts` |
| EDIT | `app/server/services/mounting.service.ts` |
| EDIT | `app/server/utils/turn-helpers.ts` |
| EDIT | `app/server/api/encounters/[id]/damage.post.ts` |
| EDIT | `app/server/api/encounters/[id]/next-scene.post.ts` |
| EDIT | `app/stores/encounter.ts` |
| EDIT | `app/composables/useEncounterActions.ts` |
| EDIT | `app/components/encounter/MountControls.vue` |

## P2 Fix Cycle (code-review-314 + rules-review-287)

### Issues Addressed

| Issue | Severity | Fix |
|-------|----------|-----|
| CRIT-1: Ride as One evasion ineffective | CRITICAL | Override recalculated speed evasion in calculate-damage.post.ts |
| HIGH-1: Agility Training tempCondition cleared | HIGH | Move to mountState.agilityTrainingActive persistent field |
| HIGH-2: 5 dead utility functions | HIGH | Wire into MountControls and calculate-damage.post.ts |
| MED-1/rules MED-1: ConquerorsMarsh typo | MEDIUM | Rename to ConquerorsMarch, extract to CONQUERORS_MARCH_CONDITION |
| MED-2: app-surface.md not updated | MEDIUM | Add P2 functions, actions, constants |
| MED-3: Direct turnState mutation | MEDIUM | Move Standard Action cost into activateConquerorsMarch store action |
| rules HIGH-1: applyResistStep skips step | HIGH | Full ladder: 3.0->2.0->1.5->1.0->0.5->0.25->0.125 |

### Fix Commits
- `1990f627` — fix: correct applyResistStep to use full PTU effectiveness ladder
- `df43c212` — fix: rename ConquerorsMarsh to ConquerorsMarch and extract constant
- `9a87409f` — fix: move Agility Training flag from tempConditions to mountState
- `c05f2e5a` — fix: wire Ride as One speed evasion into accuracy calculation
- `ca87404b` — fix: wire dead Rider utility functions into integration points
- `595ce0e4` — docs: update app-surface.md with P2 Rider feature additions

### Files Changed (P2 Fix)
| Action | File |
|--------|------|
| EDIT | `app/utils/mountingRules.ts` |
| EDIT | `app/constants/trainerClasses.ts` |
| EDIT | `app/stores/encounter.ts` |
| EDIT | `app/components/encounter/MountControls.vue` |
| EDIT | `app/types/combat.ts` |
| EDIT | `app/server/api/encounters/[id]/calculate-damage.post.ts` |
| EDIT | `.claude/skills/references/app-surface.md` |
