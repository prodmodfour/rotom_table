The app implements nine PTU combat maneuvers as the `COMBAT_MANEUVERS` constant in `constants/combat.ts`. Each maneuver has an id, name, action type, AC value, icon, description, and a `requiresTarget` flag.

## Maneuvers

1. **Push** — shove a target away.
2. **Sprint** — trade standard action for +50% movement (see [[sprint-action]]).
3. **Trip** — knock a target prone.
4. **Grapple** — restrain a target.
5. **Disarm** — force a target to drop a held item.
6. **Dirty Trick** — apply a minor debuff.
7. **Intercept (Melee)** — block a melee attack aimed at an ally (see [[intercept-disengage-system]]).
8. **Intercept (Ranged)** — block a ranged attack aimed at an ally (see [[intercept-disengage-system]]).
9. **Take a Breather** — reset stages and conditions at the cost of vulnerability (see [[take-a-breather-mechanics]]).

The `ManeuverGrid` component renders these as a grid of clickable cards with icons and descriptions. In [[player-view-architecture]], players can request maneuvers via WebSocket to the GM.

## See also

- [[turn-lifecycle]] — maneuvers consume actions within the action phase
- [[encounter-core-api]] — maneuver execution goes through combat action endpoints
