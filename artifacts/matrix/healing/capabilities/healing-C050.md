---
cap_id: healing-C050
name: Pokemon Type Healing Fields
type: —
domain: healing
---

## healing-C050: Pokemon Type Healing Fields

- **Type:** prisma-field
- **Location:** `types/character.ts:Pokemon`
- **Game Concept:** Client-side Pokemon healing type definition
- **Description:** TypeScript interface fields: `restMinutesToday`, `lastInjuryTime: string | null`, `injuriesHealedToday`. Used by HealingTab and composables for type safety.
- **Inputs:** Populated from API responses
- **Outputs:** Used by components and composables
- **Accessible From:** `gm`
- **Orphan:** false
