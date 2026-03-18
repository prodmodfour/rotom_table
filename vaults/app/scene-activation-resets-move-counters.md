# Scene Activation Resets Move Counters

When a scene is activated or deactivated, all pokemon in any previously active scene have their scene-frequency move counters and EOT cooldowns reset. This implements the PTU rule that scene-frequency moves become available again at scene boundaries.

The server service `scene.service.ts` handles this via `resetScenePokemonMoves()`, which runs during both the activate and deactivate API routes.

## See also

- [[scene-activation-restores-ap]] — the other game-mechanical effect of scene transitions
- [[move-frequency-utility]] — provides the `resetSceneUsage` function called during this process
- [[move-interface-tracks-usage-counters]] — the usage fields that get zeroed
