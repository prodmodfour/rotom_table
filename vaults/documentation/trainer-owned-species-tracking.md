# Trainer Owned Species Tracking

`HumanCharacter.ownedSpecies` is a JSON array of lowercase species names in the [[prisma-schema-overview|Prisma schema]] (mapped as `capturedSpecies` in the DB column).

## Purpose

Tracks every species a trainer has ever owned. On successful capture, `attempt.post.ts` checks `isNewSpecies` against this array. If the captured species is new, it appends the species name and awards +1 trainer XP via [[trainer-xp-system|applyTrainerXp]] (PTU p.461).

## See also

- [[trainer-xp-system]]
- [[capture-api-endpoints]]
- [[pokemon-origin-enum]]
