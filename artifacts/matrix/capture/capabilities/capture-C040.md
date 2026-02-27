---
cap_id: capture-C040
name: Pokemon.origin Field
type: prisma-field
domain: capture
---

### capture-C040: Pokemon.origin Field
- **cap_id**: capture-C040
- **name**: Pokemon Origin Tracking
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `Pokemon.origin`
- **game_concept**: How a Pokemon was obtained
- **description**: String field tracking Pokemon origin: 'manual', 'wild', 'template', 'import', 'captured'. Set to 'captured' on successful capture attempt.
- **inputs**: Set by various creation/capture flows
- **outputs**: Origin label on Pokemon record
- **accessible_from**: gm, player
