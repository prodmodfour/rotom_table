# Pokemon Ability Assignment

Ability assignment at Level 20 and Level 40 milestones.

## Pure logic

`utils/abilityAssignment.ts` — `categorizeAbilities` (into Basic/Advanced/High), `getAbilityPool` (for second/third milestone, excluding already-held abilities).

## Component

`components/pokemon/AbilityAssignmentPanel.vue` — radio button ability picker with category labels and effect text fetched from the batch API. Submit calls the `assign-ability` endpoint.

## API

POST `/api/pokemon/:id/assign-ability` — validates level, ability count, pool membership, fetches effect from AbilityData. See [[pokemon-api-endpoints]].

## See also

- [[pokemon-api-endpoints]]
- [[pokemon-stat-allocation]]
