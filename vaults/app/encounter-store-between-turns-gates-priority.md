The encounter store has a `betweenTurns` boolean flag that gates the Priority/Interrupt declaration window. When the encounter advances between turns, this flag is set to `true`, opening a window where combatants can declare Priority moves or Interrupts before the next turn resolves.

At runtime on the GM encounter page with no active encounter, this flag defaults to `false`. It becomes meaningful only during active combat flow, working with the [[encounter-combat-flow|turn resolution system]] to pause between turns for declarations.

## See also

- [[encounter-store-delegates-via-build-context]] — the delegation pattern that splits the store's combat logic
- [[encounter-store-merges-websocket-updates-surgically]] — this flag is included in the surgical merge
- [[encounter-store-is-largest-hub-store]] — the overall scale of the store this flag belongs to