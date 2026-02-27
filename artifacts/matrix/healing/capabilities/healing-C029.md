---
cap_id: healing-C029
name: Encounter Take a Breather API
type: —
domain: healing
---

## healing-C029: Encounter Take a Breather API

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/breather.post.ts:default`
- **Game Concept:** Take a Breather -- PTU Full Action (p.245)
- **Description:** Resets all combat stages to 0 (respects Heavy Armor speed CS default), removes temp HP, cures all volatile status conditions (except Cursed which requires GM adjudication) plus Slowed and Stuck. Applies Tripped and Vulnerable as temporary conditions until next turn. Marks standard+shift actions as used. Logs to move log with reminder about required shift movement.
- **Inputs:** Encounter ID (URL param), `{ combatantId }` (body)
- **Outputs:** `{ success, data: Encounter, breatherResult: { combatantId, stagesReset, tempHpRemoved, conditionsCured, trippedApplied, vulnerableApplied } }`
- **Accessible From:** `gm`
- **Orphan:** false
