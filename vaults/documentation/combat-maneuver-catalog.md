The app implements PTR combat maneuvers as the `COMBAT_MANEUVERS` constant in `constants/combat.ts`. Each maneuver has an id, name, action type, AC value, icon, description, and a `requiresTarget` flag.

## Standard Action Maneuvers

Resolve through [[combat-maneuvers-use-opposed-checks|opposed skill checks]] (Combat, Athletics, Acrobatics, or Stealth), not accuracy rolls.

1. **Push** — shove a target away. See [[push-chains-with-movement]].
2. **Trip** — knock a target prone.
3. **Grapple** — restrain a target.
4. **Disarm** — force a target to drop a held item.
5. **Dirty Trick** — apply a minor debuff.

### Manipulate Maneuvers (trainer-exclusive)

Resolve through opposed social skill checks (Deception, Charm, Intimidate).

6. **Bon Mot** — witty insult using Deception.
7. **Flirt** — distraction using Charm.
8. **Terrorize** — intimidation using Intimidate.

### Movement Action Maneuvers

9. **Disengage** — move 1 meter without provoking an [[attack-of-opportunity-trigger-list|Attack of Opportunity]]. Uses the Shift Action instead of a Standard Action. See [[disengage-avoids-opportunity-attacks]].

### Full Action Interrupts

These are not Standard Action maneuvers — they cost a Full Action and trigger as interrupts on ally attacks.

10. **Intercept (Melee)** — push ally 1m away, take the hit. Requires Acrobatics/Athletics check. See [[intercept-as-bodyguard-positioning]].
11. **Intercept (Ranged)** — shift into the attack path, take the hit. Requires Acrobatics/Athletics check. See [[intercept-as-bodyguard-positioning]].

Pokemon need [[intercept-loyalty-gated|Loyalty 4+]] to intercept.

### Special Actions

12. **Take a Breather** — reset combat stages, remove Temp HP, cure Volatile conditions (except Cursed), recover 1 Fatigue level. See [[take-a-breather-resets-combat-state]].

Extra movement is no longer a maneuver — PTR uses the [[energy-for-extra-movement]] system (spend 5 Energy for additional movement).

The `ManeuverGrid` component renders these as a grid of clickable cards with icons and descriptions. In [[player-view-architecture]], players can request maneuvers via WebSocket to the GM.

## See also

- [[turn-lifecycle]] — maneuvers consume actions within the action phase
- [[encounter-core-api]] — maneuver execution goes through combat action endpoints
