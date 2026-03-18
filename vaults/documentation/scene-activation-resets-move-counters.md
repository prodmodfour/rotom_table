When a new scene begins, all per-scene move usage counters reset to zero. The [[move-frequency-system]]'s `resetSceneUsage` function clears `usedThisScene` and `lastTurnUsed` on every move. This is triggered by the scene activation API and ensures moves are fresh for each encounter.

The reset is scene-scoped, not encounter-scoped — if multiple encounters occur in one scene, the counters do not reset between them. Only [[scene-activation-lifecycle]] triggers the reset.

## See also

- [[move-frequency-system]] — owns the resetSceneUsage function
- [[scene-activation-lifecycle]] — triggers the reset
- [[daily-moves-once-per-scene]] — daily moves also benefit from this reset
