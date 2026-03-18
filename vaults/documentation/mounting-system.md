# Mounting System

Trainer-Pokemon mounting for Mountable Pokemon.

## Service

`server/services/mounting.service.ts` — `mount`/`dismount` logic: validation, position placement, movement sharing, faint auto-dismount, `applyRideAsOneEvasion`, `restoreRideAsOneEvasion`.

## Rules

`utils/mountingRules.ts` — `parseMountableCapacity`, `isMountable`, `getMountCapacity`, `countCurrentRiders`, `hasMountedProwess`, `hasExpertMountingSkill`, `getMountActionCost`, `triggersDismountCheck`, `buildDismountCheckInfo`, `isEasyIntercept`.

P2 Rider feature detection: `hasRiderClass`, `hasRiderFeature`, `hasRunUp`, `isDashOrPassRange`, `getFeatureUsesRemaining`, `isConquerorsMarchEligibleRange`.

P2 helpers: `calculateRunUpBonus`, `calculateOverrunModifiers`, `applyResistStep`, `isAoERange`.

Constants: `MOUNT_CHECK_DC`, `DISMOUNT_CHECK_DC`, `MOUNTED_PROWESS_REMAIN_BONUS`, `FREE_MOUNT_MIN_SHIFT`, `TRAINER_DEFAULT_SPEED`.

## Types

`MountState` in `types/combat.ts` — `isMounted`, `partnerId`, `movementRemaining`, `originalSpeedEvasion`, `rideAsOneSwapped`, `agilityTrainingActive`.

## Constants

`constants/trainerClasses.ts` — `RIDER_FEATURE_NAMES`, `LEAN_IN_MAX_PER_SCENE`, `OVERRUN_MAX_PER_SCENE`, `AGILITY_TRAINING_MOVEMENT_BONUS`, `AGILITY_TRAINING_INITIATIVE_BONUS`, `CAVALIERS_REPRISAL_AP_COST`, `CONQUERORS_MARCH_CONDITION`.

## Component

`MountControls.vue` — mount/dismount UI + P2 Rider feature panel.

## API

- `POST .../mount` — Standard Action, DC 10 Acrobatics/Athletics. Expert Mounting: Free Action during Shift. Mounted Prowess: auto-success. `skipCheck` GM override.
- `POST .../dismount` — places rider in nearest unoccupied adjacent cell. `forced` flag for auto-dismount on faint.

## Store

Encounter getters: `mountedRiders`, `isMountedRider`, `isBeingRidden`, `getMountPartner`. Actions: `mountRider`, `dismountRider`, `toggleAgilityTraining`, `activateConquerorsMarch`, `useSceneFeature`, `setRideAsOneSwapped`, `addDistanceMoved`.

## Linked Movement

In `position.post.ts`, both partners move together with `movementRemaining` decremented.

## Round Reset

`movementRemaining` recalculated from mount's Overland speed.

## Auto-Dismount

Triggered on faint in `damage.post.ts` and `next-turn.post.ts`.

## Damage Integration

Ride as One evasion wired into `calculate-damage.post.ts`. Cavalier's Reprisal detection in `damage.post.ts`.

## WebSocket

`mountState` synced via surgical combatant update.

## See also

- [[encounter-core-api]]
