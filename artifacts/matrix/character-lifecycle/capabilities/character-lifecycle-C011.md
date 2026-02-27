---
cap_id: character-lifecycle-C011
name: character-lifecycle-C011
type: —
domain: character-lifecycle
---

### character-lifecycle-C011
- **name:** Create Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/index.post.ts`
- **game_concept:** Character creation
- **description:** Creates a new HumanCharacter with all PTU fields. Computes maxHp via PTU Trainer HP formula (Level * 2 + HP Stat * 3 + 10). Accepts nested stats object or flat stat fields. Stringifies JSON fields (classes, skills, features, edges, equipment, inventory, statusConditions, stageModifiers).
- **inputs:** Body: name, characterType, playedBy, age, gender, height, weight, level, stats/hp/attack/etc., maxHp, currentHp, trainerClasses[], skills{}, features[], edges[], equipment{}, inventory[], money, statusConditions[], stageModifiers{}, avatarUrl, background, personality, goals, location, isInLibrary, notes
- **outputs:** `{ success, data: Character }` — full serialized character with pokemon
- **accessible_from:** gm
