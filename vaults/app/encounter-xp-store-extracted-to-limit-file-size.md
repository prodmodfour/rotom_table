# Encounter XP Store Extracted to Limit File Size

The `encounterXp` store was explicitly extracted from the [[encounter-store-is-largest-hub-store|encounter store]] to keep the encounter store's file size under ~800 lines. It is one of three [[stateless-service-stores-wrap-api-calls|stateless service stores]] that carry no state of their own.

It wraps three XP-related API endpoints: `calculateXp` (preview XP breakdown with significance multiplier, player count, boss flag, trainer enemy IDs), `distributeXp` (apply XP to Pokemon with custom per-Pokemon amounts), and `distributeTrainerXp` (batch-distribute trainer XP). It imports types from `~/utils/experienceCalculation` for its return values.

The extraction is notable because it is motivated by code organization rather than domain separation — the XP actions conceptually belong to the encounter domain but were moved out purely for file manageability.

## See also

- [[encounter-store-delegates-via-build-context]] — the encounter store's other strategy for managing complexity (composable delegation)