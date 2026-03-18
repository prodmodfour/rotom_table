# Scene Activation Restores AP

When a scene is activated or deactivated, all characters in any previously active scene have their AP fully restored (minus drained AP). This implements PTU Core p.221's rule that AP resets at scene boundaries. Characters are grouped by level and drained AP for efficient batch updates. Bound AP from Stratagems is also unbound.

The server service `scene.service.ts` handles this via `restoreSceneAp()`, which runs during both the activate and deactivate API routes.
