The file `app/constants/combatManeuvers.ts` defines `COMBAT_MANEUVERS`, an array of 11 `Maneuver` objects from PTU 1.05. Each maneuver has an `id`, `name`, `actionType`, `ac` (nullable), `icon` path, `shortDesc`, `requiresTarget` flag, and optional `provokesAoO` and `isInterrupt` fields.

Six Standard Action maneuvers: Push (AC 4), Sprint (no AC), Trip (AC 6), Grapple (AC 4), Disarm (AC 6), Dirty Trick (AC 2). One Shift Action: Disengage (no AoO provocation). Two Interrupt maneuvers: Intercept Melee and Intercept Ranged (both Full + Interrupt, no AC). Two Full Action maneuvers: Take a Breather and Take a Breather (Assisted).

Five of the six standard maneuvers (all except Sprint) carry `provokesAoO: 'maneuver_other'`, linking to the [[aoo-trigger-constants]] trigger map. The `AOO_TRIGGERING_MANEUVERS` array in that file references these same maneuver IDs.

The [[encounter-combat-maneuvers]] note describes how these maneuvers appear in the UI act modal.
