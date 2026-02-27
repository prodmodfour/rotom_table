---
cap_id: healing-C022
name: Composable -- pokemonCenter()
type: —
domain: healing
---

## healing-C022: Composable -- pokemonCenter()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:pokemonCenter`
- **Game Concept:** Client-side Pokemon Center healing action
- **Description:** Calls `POST /api/.../pokemon-center` for the given entity type.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null`
- **Accessible From:** `gm`
- **Orphan:** false
