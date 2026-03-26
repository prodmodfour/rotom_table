# Trainer Owned Species Tracking

`HumanCharacter.ownedSpecies` is a JSON array of lowercase species names in the [[prisma-schema-overview|Prisma schema]] (mapped as `capturedSpecies` in the DB column).

## Purpose

Tracks every species a trainer has ever owned. On successful capture, `attempt.post.ts` checks `isNewSpecies` against this array and appends the species name if new.

## See also

- [[capture-api-endpoints]]
- [[pokemon-origin-enum]]
