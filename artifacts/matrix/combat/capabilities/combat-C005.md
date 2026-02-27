---
cap_id: combat-C005
name: Encounter XP Tracking Fields
type: prisma-field
domain: combat
---

### combat-C005: Encounter XP Tracking Fields
- **cap_id**: combat-C005
- **name**: XP Distribution State
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `Encounter.defeatedEnemies`, `xpDistributed`, `significanceMultiplier`, `significanceTier`
- **game_concept**: PTU XP calculation — defeated enemy levels * significance / player count
- **description**: Tracks defeated enemies (species, level, type) for XP calculation, whether XP has been distributed (safety flag), GM-set significance multiplier (1.0-5.0), and significance tier label.
- **inputs**: defeatedEnemies auto-populated on faint; significance set via API; xpDistributed set on distribute
- **outputs**: XP calculation data
- **accessible_from**: gm

---

## API Endpoint Capabilities
