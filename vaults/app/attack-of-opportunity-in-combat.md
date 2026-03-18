Attack of Opportunity has a dedicated UI component (`AoOPrompt.vue`) that appears inline on the encounter page when a pending AoO is triggered. It does not appear in the [[encounter-combat-maneuvers]] grid.

The prompt shows a warning-styled banner with the header "Attack of Opportunity" (yellow warning icon, uppercase title). If multiple AoOs are pending, a count badge shows (e.g. "2 pending").

Each pending AoO displays:
- A trigger description explaining what provoked the AoO
- The reactor's name and current HP (color-coded: green for healthy, yellow below 50%, red below 25%)
- A Struggle Attack label showing the AC and DB. Standard combatants see "Struggle Attack (AC 4, DB 4)". Trainers with Expert+ Combat skill see "Struggle Attack (AC 3, DB 5 — Expert+ Combat)".
- Two buttons: "Accept AoO" (green, with sword icon) and "Decline" (grey, with X icon)

Accepting an AoO reveals a damage input field where the GM enters the damage dealt, then confirms. The resolution emits the outcome (accept with damage, or decline) back to the encounter page.

The triggers that can provoke an AoO are defined in the [[aoo-trigger-constants]]: shifting away from an adjacent enemy, using a ranged attack while adjacent, standing up from Tripped, using certain maneuvers against non-adjacent targets, or retrieving an item while adjacent.

## See also

- [[aoo-trigger-constants]]
- [[combat-maneuver-constants]]
