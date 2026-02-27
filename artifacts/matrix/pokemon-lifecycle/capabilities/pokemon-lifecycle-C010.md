---
cap_id: pokemon-lifecycle-C010
name: nature Field
type: prisma-field
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C010: nature Field
- **cap_id**: pokemon-lifecycle-C010
- **name**: Pokemon Nature
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.nature`
- **game_concept**: PTU Nature system (Core Chapter 5, p.199)
- **description**: JSON string storing { name, raisedStat, loweredStat }. 36 possible natures (30 with stat effects, 6 neutral). Affects base stats: HP +1/-1, other stats +2/-2. Applied at generation time via applyNatureToBaseStats(). Neutral natures (raise === lower) have no effect.
- **inputs**: Generated randomly at Pokemon creation
- **outputs**: Base stat modification, displayed on stats tab
- **accessible_from**: gm, player
