# Scene Positions Use Percentages

All entity positions in scenes (pokemon, characters, groups) are stored as percentage-based coordinates from 0 to 100 on both x and y axes. This makes the [[scene-canvas]] resolution-independent — positions render correctly regardless of viewport size.

The position data structure is `{ x: number, y: number }` where both values are percentages. New entities added to a scene default to position `{ x: 50, y: 50 }` (center). Group positions are offset based on the current group count to avoid stacking.
