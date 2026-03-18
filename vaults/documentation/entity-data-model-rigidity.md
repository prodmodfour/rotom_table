# Entity Data Model Rigidity

The app models combat participants through a rigid type hierarchy: `Pokemon` and `HumanCharacter` are two unrelated Prisma models that get embedded into a `Combatant` wrapper via a discriminated union (`entity: Pokemon | HumanCharacter`). This hierarchy is baked into the database schema, the type system, the services, the serializers, and every component that renders a combatant.

The rigidity manifests at every layer:

- **Database**: Two completely separate tables (`Pokemon`, `HumanCharacter`) with no shared base table. Their columns overlap partially but diverge significantly. Adding a combat-relevant property means deciding which table to add it to, or adding it to both.
- **Types**: The 35-field `Combatant` interface ([[combatant-interface-breadth]]) mixes identity, position, turn state, combat stats, and entity-specific data into a single flat bag. The `entity` union forces 144 unsafe `as` casts ([[entity-union-unsafe-downcasts]]).
- **Serialization**: Three separate paths convert database records into typed objects — `serializers.ts` for detail views, `encounter.service.ts` for encounter responses, and `entity-builder.service.ts` for combatant construction. Each encodes its own assumptions about entity shape.
- **Services**: `combatant.service.ts` (791 lines) handles everything that can happen to any entity type, branching on `type === 'pokemon'` throughout.
- **Components**: UI components like `CombatantDetailsPanel.vue` (780 lines) branch on entity type to render different layouts, duplicating template structure.

The deeper problem is that the entity model was designed around what things _are_ (a Pokemon, a Human) rather than what things _can do_ (take damage, have status conditions, occupy a grid position, hold items). This violates the [[liskov-substitution-principle]] — the union subtypes cannot be used interchangeably — and the [[interface-segregation-principle]] — consumers are forced to handle the full entity union even when they only care about one capability.

Introducing a new entity type (e.g., a Wild NPC, a Trap, a Terrain Hazard, a Vehicle) would require: a new Prisma model, a new branch in the discriminated union, updates to every `as` cast and `type ===` check across 45+ files, a new serialization path, new branches in combatant.service.ts, and new template branches in every rendering component.

## See also

- [[entity-union-unsafe-downcasts]] — the type-assertion symptom of this deeper problem
- [[combatant-interface-breadth]] — the 35-field mega-interface symptom
- [[liskov-substitution-principle]] — violated by the non-interchangeable union
- [[interface-segregation-principle]] — violated by forcing consumers to handle the full union
- [[shotgun-surgery-smell]] — adding a new entity type requires changes across 45+ files
- [[combat-entity-base-interface]] — a type-level mitigation, not a structural solution
- [[entity-component-system-architecture]] — a destructive proposal to replace this with composition
- [[trait-composed-domain-model]] — a destructive proposal to shatter the Combatant into compile-time trait interfaces
- [[combatant-interface-bloat]] — the related problem of interface width (too many fields on one type)
- [[composition-over-inheritance]] — the entity model was designed around what things are (inheritance) rather than what they can do (composition)
