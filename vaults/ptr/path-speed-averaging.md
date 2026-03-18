When a movement path crosses terrain boundaries, the app detects which terrain types are traversed, identifies applicable movement [[trait-definition|traits]], and averages them to determine maximum movement distance.

A Pokemon with Overland 7 and Swim 5 crossing from land to water gets a maximum of 6 meters of movement. This is [[automate-routine-bookkeeping]] applied to a core PTU mechanic (p.231) rather than using simplified approximations.

PTU movement cannot be split around actions (p.227-228) — each turn has one continuous movement path, so averaging is calculated once per movement action.

## See also

- [[multi-tag-terrain-system]]
- [[water-is-basic-terrain]]
