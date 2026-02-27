---
cap_id: combat-C003
name: Encounter Weather Fields
type: prisma-field
domain: combat
---

### combat-C003: Encounter Weather Fields
- **cap_id**: combat-C003
- **name**: Weather State Tracking
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `Encounter.weather`, `weatherDuration`, `weatherSource`
- **game_concept**: PTU weather conditions (sunny, rain, sandstorm, hail, etc.) with duration tracking
- **description**: Three fields track weather: condition name (nullable), rounds remaining (0 = indefinite/manual), and source (move/ability/manual). Duration auto-decrements at round boundaries. Manual weather persists indefinitely.
- **inputs**: Set via POST /api/encounters/:id/weather
- **outputs**: Weather state on encounter object
- **accessible_from**: gm, group, player
