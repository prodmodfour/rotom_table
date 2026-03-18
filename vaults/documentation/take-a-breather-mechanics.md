Take a Breather is a PTU combat action (p.245) implemented as a Full Action via the `POST /api/encounters/:id/breather` endpoint.

## Effects

1. **Reset combat stages** — all seven [[combat-stage-system]] values return to 0, except Speed for Heavy Armor wearers which resets to -1 (the armor's default CS).
2. **Remove temp HP** — all [[temp-hp-mechanics]] are cleared.
3. **Cure conditions** — removes all volatile status conditions plus Slowed and Stuck. Cursed is explicitly excluded and persists through a breather.
4. **Apply temp conditions** — Tripped and Vulnerable are applied as temporary conditions (cleared at turn end).
5. **Consume actions** — marks both standard and shift actions as used for the turn.

The `BreatherShiftBanner` component reminds the player to shift away from enemies after taking a breather, since the action leaves the combatant temporarily vulnerable.

## See also

- [[combat-stage-system]] — stages that get reset
- [[status-condition-categories]] — volatile conditions that get cured
- [[combat-maneuver-catalog]] — Take a Breather is one of the nine PTU combat maneuvers
- [[turn-lifecycle]] — the temp conditions (Tripped, Vulnerable) clear at turn end
