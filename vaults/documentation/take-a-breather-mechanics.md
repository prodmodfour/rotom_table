Take a Breather is a Full Action combat maneuver per [[take-a-breather-resets-combat-state]].

## Effects

1. **Reset combat stages** — all [[combat-stage-system]] values return to 0, except Speed for Heavy Armor wearers which resets to -1 (the armor's default CS).
2. **Remove temp HP** — all [[temp-hp-mechanics]] are cleared.
3. **Cure conditions** — removes all volatile status conditions (except Cursed). Does NOT cure Slow or Stuck per [[stuck-slow-separate-from-volatile]].
4. **Recover fatigue** — recovers 1 level of [[fatigue-levels|Fatigue]] per [[take-a-breather-recovers-fatigue]].
5. **Apply temp conditions** — Tripped and Vulnerable are applied as temporary conditions (cleared at turn end).
6. **Consume actions** — marks both standard and movement actions as used for the turn.

The combatant should be reminded to shift away from enemies after taking a breather, since the action leaves them temporarily vulnerable.

## See also

- [[combat-stage-system]] — stages that get reset
- [[status-condition-categories]] — volatile conditions that get cured
- [[combat-maneuver-catalog]] — Take a Breather is a special action in PTR combat
- [[turn-lifecycle]] — the temp conditions (Tripped, Vulnerable) clear at turn end
