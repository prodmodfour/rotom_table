# Player Capture Healing Interface

Player-to-GM request system for captures, breathers, and healing items.

## GM side

### PlayerRequestPanel.vue

Incoming request display — pending capture/breather/healing/generic requests with approve/deny buttons. 60-second TTL auto-expire, immutable Map updates, timer display.

### usePlayerRequestHandlers.ts

Approval handlers:

- Capture: with accuracy roll + undo snapshot
- Breather: with shift banner
- Healing item: with combatant ID resolution
- Deny: with explicit reason

Reactive `handlerError` state.

### useSwitchModalState.ts

Switch modal state management — standard/fainted/forced switch flows, trainer/Pokemon ID resolution, undo snapshots. Extracted from `pages/gm/index.vue`.

## Player side

### usePlayerCombat.ts

Exports `requestCapture`, `requestBreather`, `requestHealingItem` (WebSocket action requests to GM). `captureTargets` computed property filters encounter combatants to enemy Pokemon with HP > 0.

### PlayerCapturePanel.vue

Two-step capture flow:

1. Select target
2. Capture rate preview (via server call or local fallback) + confirm/cancel

### usePlayerCapture.ts

`fetchCaptureRate` (server endpoint wrapper), `estimateCaptureRate` (local fallback). Reactive loading/error state.

### PlayerHealingPanel.vue

Two tabs:

- Take a Breather (with assisted breather option)
- Use Healing Item (with [[healing-item-system]] catalog integration and target selection)

## Types

`PlayerActionType` includes `capture`, `breather`, `use_healing_item` in `types/player-sync.ts`.

## See also

- [[encounter-component-categories]]
- [[healing-item-system]]
- [[poke-ball-system]]
- [[capture-accuracy-gate]]
