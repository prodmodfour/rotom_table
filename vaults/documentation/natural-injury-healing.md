An injury can be healed naturally once 24 hours have passed since the entity's `lastInjuryTime`. Implemented in `server/api/characters/[id]/heal-injury.post.ts` and `server/api/pokemon/[id]/heal-injury.post.ts`.

Natural healing is subject to the daily 3-injury cap (shared with [[pokemon-center-healing]]). When all injuries are healed, `lastInjuryTime` is cleared.

The `canHealInjuryNaturally` utility returns `true` only when 24+ hours have elapsed since `lastInjuryTime`. If `lastInjuryTime` is null (no injuries recorded), it returns `false`.

Trainers also have access to [[ap-drain-injury-healing]] as an alternative method. Pokemon can only heal injuries naturally or via [[pokemon-center-healing]].

## See also

- [[rest-healing-system]]
- [[hp-injury-system]]
- [[effective-max-hp-formula]]
