# Service Pattern Classification

The 23 services in [[service-inventory]] follow four patterns:

| Pattern | Description | Services |
|---|---|---|
| **Pure functions** | No DB access, no side effects | encounter-generation, status-automation, weather-automation, grid-placement, ball-condition, mounting, living-weapon, living-weapon-abilities, living-weapon-movement, living-weapon-state |
| **DB writers** | Read/write Prisma | pokemon-generator, entity-update, entity-builder, rest-healing, scene, csv-import, evolution |
| **Hybrid** | Pure logic + DB persist | combatant, switching, healing-item, out-of-turn, intercept |
| **Orchestrators** | Coordinate other services | encounter |

Pure services must stay pure (zero DB imports) for testability. This is a [[single-responsibility-principle]] boundary.

## See also

- [[pure-service-testability-boundary]] — how the purity contract enables testability
- [[repository-use-case-architecture]] — a destructive proposal that supersedes this taxonomy by splitting all services into repositories and use cases
- [[service-responsibility-conflation]] — the hybrid services that conflate business logic with data access
