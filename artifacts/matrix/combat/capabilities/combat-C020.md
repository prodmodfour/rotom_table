---
cap_id: combat-C020
name: Apply Damage
type: api-endpoint
domain: combat
---

### combat-C020: Apply Damage
- **cap_id**: combat-C020
- **name**: Apply Damage to Combatant
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/damage.post.ts`
- **game_concept**: PTU damage application with temp HP, injuries, fainting
- **description**: Applies damage using full PTU mechanics: temp HP absorbs first, massive damage rule (50%+ maxHP = injury), HP marker crossings (50%, 0%, -50%, -100% = injury each), faint at 0 HP clears persistent+volatile conditions. Tracks defeated enemies for XP. Syncs to database.
- **inputs**: `{ combatantId, damage }`
- **outputs**: Updated encounter + damageResult breakdown
- **accessible_from**: gm
