# Pokemon Loyalty

Loyalty is tracked as an integer field on the Pokemon entity, implementing PTR loyalty ranks per [[loyalty-rank-names]].

## Ranks

| Value | Rank |
|---|---|
| 0 | Defiant |
| 1 | Distrustful |
| 2 | Wary |
| 3 | Fond |

## Starting values by origin

Determined by [[pokemon-origin-enum|origin]] and disposition at capture per [[disposition-determines-starting-loyalty]]: captured wild Pokemon default to Loyalty 2 (Wary) at Neutral disposition, with friendlier catches starting higher and hostile catches starting lower. Friend Ball captures grant +1 loyalty via the [[poke-ball-system|post-capture effect]].

## Editing

The GM can edit loyalty via the Pokemon detail view.

## Display

Shown with a color-coded rank name.
