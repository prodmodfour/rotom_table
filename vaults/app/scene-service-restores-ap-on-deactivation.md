The scene service (`app/server/services/scene.service.ts`) handles side effects when a scene is deactivated.

`restoreSceneAp()` restores Action Points for all characters that were part of the scene, per PTU Core p.221: AP is completely regained at the end of each scene. Drained AP remains unavailable until Extended Rest. Bound AP is released (Stratagems auto-unbind) by setting `boundAp` to 0. Characters are grouped by (level, drainedAp) to batch identical updates into fewer `updateMany` calls within a single `$transaction`.

`resetScenePokemonMoves()` resets scene-frequency move counters for all Pokemon in the scene. Scene-frequency moves and EOT cooldowns reset at scene boundaries. Each Pokemon's moves are parsed, processed through `resetSceneUsage()`, and written back only if changes occurred.

Both functions parse entity references from the scene's JSON fields and look up the actual database records — the scene stores only IDs, not full entity snapshots.

## See also

- [[scene-api-manages-lifecycle-and-activation]] — the API endpoints that trigger these side effects
- [[scene-activation-resets-canvas-state]] — client-side reset on activation
