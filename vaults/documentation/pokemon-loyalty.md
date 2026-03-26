# Pokemon Loyalty

`Pokemon.loyalty` is an `Int @default(3)` field in the [[prisma-schema-overview|Prisma schema]], implementing PTR loyalty ranks.

## Ranks

| Value | Rank |
|---|---|
| 0 | Hostile |
| 1 | Resistant |
| 2 | Wary |
| 3 | Neutral |
| 4 | Friendly |
| 5 | Loyal |
| 6 | Devoted |

## Starting values by origin

Determined by [[pokemon-origin-enum|origin]]: `captured` and `wild` start at 2 (Wary). All others default to 3 (Neutral). Friend Ball captures override to 3 (Neutral) via the `loyalty_plus_one` [[poke-ball-system|post-capture effect]].

## Editing

Editable via `PUT /api/pokemon/:id` (body.loyalty). GM can edit in the Pokemon sheet edit mode via a dropdown select.

## Display

Shown in `PokemonStatsTab.vue` with a PhHandshake icon and a color-coded rank name.
