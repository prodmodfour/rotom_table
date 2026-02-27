# Shared Specifications

## Dependencies

| Dependency | Design | Impact on This Design |
|---|---|---|
| ptu-rule-055 | XP calculation system | P1 depends on this -- the XP distribution endpoint and Pokemon XP allocation require the XP system from ptu-rule-055. P0 (density separation) is independent. |
| ptu-rule-060 | Level-budget encounter creation | P2 level-budget helper depends on this. The budget calculator would suggest spawn counts and level distributions based on party data. P0 and P1 are independent. |

### Recommended Sequencing

1. **P0 (this design)** -- can be implemented immediately, no dependencies
2. **ptu-rule-055** -- XP system design and implementation
3. **P1 (this design)** -- significance multiplier and XP calculation (uses ptu-rule-055's XP infrastructure)
4. **ptu-rule-060** -- level-budget system
5. **P2 (this design)** -- environmental modifiers and level-budget helper

---


## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Breaking existing encounter generation workflows | HIGH | P0 makes `count` parameter have a default of 4 if not provided; existing API callers that omit `count` still work |
| densityMultiplier data loss | LOW | Column preserved in DB; only generation logic stops reading it; UI removes editor; data intact for future reference |
| P1 depends on unbuilt ptu-rule-055 | MEDIUM | XP calculation utility is self-contained; it can be built and tested before the full XP distribution system exists |
| P2 environmental modifiers are complex | LOW | Presets are optional; GM can ignore them entirely; existing terrain system untouched |

---


## File Change Summary

### P0 (Density Separation)

| File | Change |
|---|---|
| `app/types/habitat.ts` | Replace `DENSITY_RANGES` with `DENSITY_SUGGESTIONS`; update `MAX_SPAWN_COUNT` to 20; remove `densityMultiplier` from `TableModification` interface |
| `app/server/api/encounter-tables/[id]/generate.post.ts` | Remove density-to-count calculation; require `count` from request body (default 4); remove `densityMultiplier` from meta |
| `app/stores/encounterTables.ts` | Update `generateFromTable` signature and meta types |
| `app/components/habitat/GenerateEncounterModal.vue` | Replace density-derived spawn display with explicit count spinner; show density suggestion as hint |
| `app/components/encounter-table/ModificationCard.vue` | Remove densityMultiplier editor |
| `app/components/habitat/EncounterTableModal.vue` | Update density tier help text to describe it as informational |

### P1 (Significance + XP)

| File | Change |
|---|---|
| `app/utils/xpCalculation.ts` | **New** -- pure XP calculation utility |
| `app/types/encounter.ts` | Add `significanceMultiplier` to `Encounter`; enhance `defeatedEnemies` with `isTrainer` flag |
| `app/prisma/schema.prisma` | Add `significanceMultiplier Float @default(1.0)` to Encounter model |
| `app/server/api/encounters/[id]/significance.put.ts` | **New** -- update significance endpoint |
| `app/server/api/encounters/[id]/xp.get.ts` | **New** -- XP breakdown endpoint |
| `app/server/services/encounter.service.ts` | Add significance to serialization |
| `app/stores/encounter.ts` | Add `setSignificance` and `getXpBreakdown` actions |
| `app/components/encounter/SignificancePanel.vue` | **New** -- significance selector + XP breakdown display |

### P2 (Environmental Modifiers)

| File | Change |
|---|---|
| `app/types/encounter.ts` | Add `EnvironmentPreset` and `EnvironmentEffect` types |
| `app/constants/environmentPresets.ts` | **New** -- built-in PTU environment presets |
| `app/prisma/schema.prisma` | Add `environmentPreset String @default("{}")` to Encounter model |
| `app/components/encounter/EnvironmentSelector.vue` | **New** -- preset picker for encounter creation |
| `app/stores/encounter.ts` | Add environment preset management |
| `app/utils/damageCalculation.ts` | Add optional `environmentModifiers` parameter for accuracy penalties |

---

