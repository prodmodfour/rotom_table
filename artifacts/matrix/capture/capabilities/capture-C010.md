---
cap_id: capture-C010
name: Calculate Capture Rate
type: api-endpoint
domain: capture
---

### capture-C010: Calculate Capture Rate
- **cap_id**: capture-C010
- **name**: Capture Rate Calculation Endpoint
- **type**: api-endpoint
- **location**: `app/server/api/capture/rate.post.ts`
- **game_concept**: Server-side capture rate calculation
- **description**: Accepts pokemonId (looks up DB for level, HP, status, injuries, shiny, evolution data from SpeciesData) OR raw data (level, currentHp, maxHp, species, statusConditions, injuries, isShiny). Returns capture rate with full breakdown and difficulty label.
- **inputs**: `{ pokemonId }` or `{ level, currentHp, maxHp, species?, statusConditions?, injuries?, isShiny? }`
- **outputs**: `{ species, level, currentHp, maxHp, captureRate, difficulty, canBeCaptured, hpPercentage, breakdown }`
- **accessible_from**: gm
