# Vision Capability System

Darkvision and Blindsense vision capabilities for darkness encounters.

## Rules

`utils/visionRules.ts` — `VisionCapability` type, `VisionCapabilitySource` type, `CombatantVisionState` interface, `DARKNESS_PRESET_IDS`, `isDarknessBasedPreset`, `hasVisionCapability`, `hasSpecificVision`, `getEffectiveEnvironmentPenalty` (Darkvision/Blindsense negate dim-cave/dark-cave accuracy penalties per RAW).

## Component

`VisionCapabilityToggle.vue` — per-combatant Darkvision/Blindsense toggle checkboxes. Shown when darkness preset active. Emits toggle events.

## Integration

`CombatantCard.vue` — vision indicator icon + toggle.

## API

`POST .../combatants/:combatantId/vision` — toggle capability. Body: `capability`, `enabled`, `source`. Validates against `VisionCapabilitySource` type.

## Store

Encounter action: `toggleVisionCapability`.

## WebSocket

`visionState` synced via surgical combatant update in `updateFromWebSocket`.

## See also

- [[encounter-core-api]]
