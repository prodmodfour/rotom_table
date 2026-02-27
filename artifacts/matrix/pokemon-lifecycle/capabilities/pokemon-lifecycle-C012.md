---
cap_id: pokemon-lifecycle-C012
name: abilities Field
type: prisma-field
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C012: abilities Field
- **cap_id**: pokemon-lifecycle-C012
- **name**: Pokemon Abilities
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.abilities`
- **game_concept**: PTU ability slots (Basic at creation, Advanced at 20, any at 40)
- **description**: JSON array of { name, effect } objects. One Basic Ability randomly selected at generation. Additional ability slots unlock at level 20 (second: Basic or Advanced) and level 40 (third: any category). Level-up check reports milestones but does not auto-assign.
- **inputs**: Array of ability objects
- **outputs**: Ability cards on abilities tab
- **accessible_from**: gm, player

---

## Constants
