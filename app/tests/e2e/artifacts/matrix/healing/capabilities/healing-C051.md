---
cap_id: healing-C051
name: HumanCharacter Type Healing Fields
type: —
domain: healing
---

## healing-C051: HumanCharacter Type Healing Fields

- **Type:** prisma-field
- **Location:** `types/character.ts:HumanCharacter`
- **Game Concept:** Client-side character healing type definition
- **Description:** TypeScript interface fields: `restMinutesToday`, `lastInjuryTime: string | null`, `injuriesHealedToday`, `drainedAp`, `boundAp`, `currentAp`. Used by HealingTab and composables.
- **Inputs:** Populated from API responses
- **Outputs:** Used by components and composables
- **Accessible From:** `gm`
- **Orphan:** false

---

## New Utility Functions (Added Post-Initial Mapping)
