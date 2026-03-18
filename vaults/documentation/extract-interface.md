# Extract Interface

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When multiple clients use the same subset of a class's methods, or when two classes share identical method signatures, define an interface for that subset.

Interfaces define contracts without imposing implementation, enabling loose coupling.

## See also

- [[interface-segregation-principle]] — Extract Interface is a direct application of ISP
- [[extract-superclass]] — when the implementations (not just signatures) are shared
- [[combatant-interface-breadth]] — segregating the Combatant interface into focused sub-interfaces
- [[entity-union-unsafe-downcasts]] — extracting a CombatEntity base from Pokemon/HumanCharacter
- [[combat-entity-base-interface]] — potential CombatEntity base for Pokemon/HumanCharacter
- [[combatant-type-segregation]] — potential Combatant sub-interfaces
