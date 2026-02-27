---
cap_id: pokemon-lifecycle-C003
name: origin Field
type: prisma-field
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C003: origin Field
- **cap_id**: pokemon-lifecycle-C003
- **name**: Pokemon Origin Tracking
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.origin`
- **game_concept**: How a Pokemon was created
- **description**: String field tracking provenance: 'manual' (GM-created), 'wild' (encounter table spawn), 'template' (loaded from template), 'import' (CSV import), 'captured' (capture system). Default 'manual'.
- **inputs**: Set at creation or on capture
- **outputs**: Used for library filtering
- **accessible_from**: gm, player
