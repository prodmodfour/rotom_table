# Scene-End AP Restoration

When a scene is [[scene-activation-lifecycle|activated or deactivated]], Action Points are restored for all characters in the scene per PTU Core p.221.

## Service

`server/services/scene.service.ts` — `restoreSceneAp()` groups characters by `(level, drainedAp)` for batch database updates. Unbinds bound AP and restores `currentAp` to `maxAp - drainedAp`.

## Utility

`utils/restHealing.ts` — `calculateSceneEndAp()` is the pure math: `AP = maxAp(level) - drainedAp`. Drained AP persists until [[extended-rest]]. Bound AP is released at scene end.

## Trigger Points

- **Activate:** restores AP for characters in any previously active scene before activating the new one
- **Deactivate:** restores AP for all characters in the deactivating scene

## See also

- [[trainer-action-points]] — AP tracking fields and max AP formula
- [[extended-rest]] — only way to clear drained AP
