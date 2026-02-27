---
cap_id: combat-C025
name: Take a Breather
type: api-endpoint
domain: combat
---

### combat-C025: Take a Breather
- **cap_id**: combat-C025
- **name**: Take a Breather Maneuver
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/breather.post.ts`
- **game_concept**: PTU Take a Breather (p.245) — Full Action
- **description**: Resets combat stages (respects Heavy Armor speed CS -1), removes temp HP, cures volatile conditions + Slowed + Stuck (except Cursed), applies Tripped + Vulnerable as temp conditions. Marks standard+shift used. Logs to move log.
- **inputs**: `{ combatantId }`
- **outputs**: Updated encounter + breather result
- **accessible_from**: gm
