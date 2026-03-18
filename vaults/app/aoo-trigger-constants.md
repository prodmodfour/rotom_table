The file `app/constants/aooTriggers.ts` defines Attack of Opportunity trigger conditions from PTU p.241. Five trigger types are mapped in `AOO_TRIGGER_MAP`:

- **shift_away** (movement) — shifting away from an adjacent enemy
- **ranged_attack** (attack) — using a ranged attack while adjacent to an enemy
- **stand_up** (status_change) — standing up from Tripped while adjacent to an enemy
- **maneuver_other** (maneuver) — using Push, Grapple, Disarm, Trip, or Dirty Trick against a non-adjacent target
- **retrieve_item** (item_action) — retrieving an item from a bag while adjacent to an enemy

Each trigger has a `checkOn` field that classifies the context (movement, attack, status_change, maneuver, item_action), enabling the trigger detection service to filter evaluations by action type.

The file also defines Struggle Attack constants: AC 4 / DB 11 for standard, AC 3 / DB 13 for trainers with Expert+ Combat skill.

`AOO_TRIGGERING_MANEUVERS` lists the five maneuvers that provoke AoO when targeting non-adjacent: push, grapple, disarm, trip, dirty-trick. These IDs match entries in the [[combat-maneuver-constants]], and the [[encounter-combat-maneuvers]] shows how they appear in the UI.

The AoO prompt itself is described in [[attack-of-opportunity-in-combat]].
