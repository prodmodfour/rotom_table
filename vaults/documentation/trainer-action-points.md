Trainers have Action Points (AP) tracked by three [[healing-data-fields]]: `currentAp`, `drainedAp`, and `boundAp`. Available AP equals `maxAp - boundAp - drainedAp` (floor 0).

Max AP scales with level: `5 + floor(level / 5)`. This yields 5 AP at level 1, 6 at level 5, 7 at level 10, and 8 at level 15.

AP is spent by [[ap-drain-injury-healing]] (costs 2 AP). Drained AP is restored by [[extended-rest]] but NOT by [[pokemon-center-healing]]. Bound AP is also cleared by extended rest. [[new-day-reset]] sets `currentAp` back to full max.

AP is restored at scene end via [[scene-end-ap-restoration]] — triggered by [[scene-activation-lifecycle|scene activate/deactivate]] endpoints. The `calculateSceneEndAp` utility computes `maxAp(level) - drainedAp`; bound AP is released.

## See also

- [[rest-healing-system]]
- [[healing-tab-component]]
