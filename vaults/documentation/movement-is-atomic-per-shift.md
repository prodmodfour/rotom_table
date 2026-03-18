Each shift action is validated as a single continuous path from origin to destination.

The server validates the complete path rather than individual steps, ensuring movement respects terrain, elevation, and opportunity attack zones in one pass. This supports [[player-autonomy-boundaries]] — players move freely because the system validates the full path atomically.

The [[pathfinding-algorithm]] computes the path, and the server checks it against [[combatant-movement-capabilities]] and the [[attack-of-opportunity-system]] before committing the move.

## See also
- [[player-autonomy-boundaries]]
- [[pathfinding-algorithm]]
- [[combatant-movement-capabilities]]
- [[attack-of-opportunity-system]]
