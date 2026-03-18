Pokemon Center healing fully restores HP to the [[effective-max-hp-formula]] ceiling and clears ALL [[status-condition-categories]] (persistent, volatile, and other). Implemented in `server/api/characters/[id]/pokemon-center.post.ts` and `server/api/pokemon/[id]/pokemon-center.post.ts`.

Injuries are healed up to a daily cap of 3 (shared with [[natural-injury-healing]]). When all injuries are healed, `lastInjuryTime` is cleared.

Pokemon Center healing does NOT restore drained [[trainer-action-points]] — unlike [[extended-rest]], AP is unaffected.

Move usage for Pokemon is fully restored without the rolling window restriction that applies to [[extended-rest]].

The healing time is calculated by [[pokemon-center-time-formula]].

## See also

- [[rest-healing-system]]
- [[healing-data-fields]]
