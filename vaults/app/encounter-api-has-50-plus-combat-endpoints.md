The encounter API under `app/server/api/encounters/[id]/` has over 50 endpoint files covering the full PTU combat system. The endpoints group into:

**Lifecycle**: `start.post`, `end.post`, `next-turn.post`, `next-scene.post`, `serve.post`, `unserve.post`

**Damage/Healing**: `damage.post`, `heal.post`, `calculate-damage.post`, `use-item.post`, `breather.post`

**Actions**: `action.post`, `move.post`, `pass.post`, `sprint.post`, `declare.post`

**Position/Grid**: `position.post`, `grid-config.put`, `fog.get/put`, `terrain.get/put`, `environment-preset.put`, `significance.put`

**Status/Stages**: `status.post`, `stages.post`

**Combatant management**: `combatants.post`, `combatants/[combatantId]` sub-routes, `wild-spawn.post`, `background.post/delete`

**Combat subsystems**: `switch.post`, `recall.post`, `release.post`, `mount.post`, `dismount.post`, `disengage.post`, `aoo-detect.post`, `aoo-resolve.post`, `hold-action.post`, `release-hold.post`, `priority.post`, `interrupt.post`, `intercept-melee.post`, `intercept-ranged.post`

**Living Weapon**: sub-routes under `living-weapon/`

**Weather**: `weather.post`

**XP**: `xp-calculate.post`, `xp-distribute.post`, `trainer-xp-distribute.post`

All follow the same pattern: load encounter via [[encounter-service-is-the-combat-engine-core]], modify combatants, save, build response.

## See also

- [[route-handlers-delegate-to-services-for-complex-logic]]
- [[encounter-combat-flow]]
- [[capture-api-previews-and-executes-attempts]] — capture endpoints are a separate API domain used during encounters
- [[grid-placement-positions-tokens-avoiding-collisions]] — auto-placement used by combatants.post
