---
cap_id: pokemon-lifecycle-C033
name: distributeStatPoints (internal)
type: service-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C033: distributeStatPoints (internal)
- **cap_id**: pokemon-lifecycle-C033
- **name**: Stat Point Distribution with Base Relations
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -- `distributeStatPoints()`
- **game_concept**: PTU stat point allocation (Core Chapter 5, Base Relations Rule)
- **description**: Internal function. Distributes (level + 10) stat points weighted by base stats using random rolls, then enforces Base Relations Rule: stats with higher base values must have >= added points than stats with lower base values. Equal base stats form tiers with randomized internal order.
- **inputs**: baseStats object, level number
- **outputs**: Calculated stats object (base + distributed)
- **accessible_from**: api-only (internal to service)

---

## API Endpoints
