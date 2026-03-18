# Pokemon Tutor Points

`Pokemon.tutorPoints` tracks tutor point currency (PTU Core p.202). Gained at level 5 and every 5 levels thereafter (5, 10, 15, ..., 100). Used for purchasing TM moves and tutored moves.

Tutor points are incremented by the [[pokemon-experience-chart|level-up detection]] system whenever a Pokemon crosses a qualifying level threshold. Both manual XP grants and post-combat [[xp-distribution-flow|XP distribution]] update tutor points.

Displayed on the skills tab of the [[pokemon-sheet-page]].

## See also

- [[pokemon-experience-chart]] — `checkLevelUp` reports tutor point gains
- [[pokemon-move-learning]] — tutor points spent on move acquisition
