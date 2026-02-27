# Implementation Log

## Implementation Log

### P0 — Data Model, Constants, CRUD, Bonus Utility (2026-02-20)

| Commit | Description | Files |
|--------|-------------|-------|
| `8adf752` | Equipment slot types (EquipmentSlot, EquippedItem, EquipmentSlots) | `app/types/character.ts` |
| `36d09fa` | Prisma schema: equipment JSON field on HumanCharacter | `app/prisma/schema.prisma` |
| `246ce03` | Equipment constants catalog (15 PTU items, 6 slot types) | `app/constants/equipment.ts` (new) |
| `d92c9da` | computeEquipmentBonuses() pure utility | `app/utils/equipmentBonuses.ts` (new) |
| `9626886` | Serializer + PUT endpoint equipment support | `app/server/utils/serializers.ts`, `app/server/api/characters/[id].put.ts` |
| `a120134` | Equipment CRUD API (GET + PUT) | `app/server/api/characters/[id]/equipment.get.ts` (new), `app/server/api/characters/[id]/equipment.put.ts` (new) |

### P0 — Review Fixes (code-review-115) (2026-02-20)

| Commit | Description | Files |
|--------|-------------|-------|
| `4590346` | C1 fix: include equipment in buildHumanEntityFromRecord() | `app/server/services/combatant.service.ts` |
| `1626800` | H1 fix: Zod validation for equipment PUT endpoint | `app/server/api/characters/[id]/equipment.put.ts`, `app/package.json` |
| `aaab058` | M1 fix: add equipment endpoints to app-surface.md | `.claude/skills/references/app-surface.md` |

**P0 Status:** All 4 items implemented + review fixes applied. P1/P2 remain.

### P1 — Combat Integration (2026-02-20)

| Commit | Description | Files |
|--------|-------------|-------|
| `61203a8` | E+F+G: Auto-apply DR, evasion, Focus bonuses in server damage calc | `app/utils/damageCalculation.ts`, `app/server/api/encounters/[id]/calculate-damage.post.ts` |
| `978f529` | F+H: Equipment evasion/initiative/speed CS in combatant builder | `app/server/services/combatant.service.ts` |
| `6027e57` | H: Take a Breather respects Heavy Armor speed default CS | `app/server/api/encounters/[id]/breather.post.ts` |
| `8f79acb` | E+F+G: Equipment bonuses in client-side move calculation | `app/composables/useMoveCalculation.ts` |

**P1 Summary:**

- **E (DR from Armor):** `calculate-damage.post.ts` auto-reads equipment DR for human targets. Helmet conditional DR (+15) applied on critical hits. Caller-provided DR overrides for manual GM adjustments. Client-side `useMoveCalculation.ts` also subtracts equipment DR in `targetDamageCalcs`.
- **F (Evasion from Shields):** Equipment evasion bonus added to evasion calculations in both server (`calculate-damage.post.ts`) and client (`useMoveCalculation.ts` `getTargetEvasion`/`getTargetEvasionLabel`). `buildCombatantFromEntity()` includes equipment evasion in initial evasion values.
- **G (Focus Stat Bonuses):** New `applyStageModifierWithBonus()` helper in `damageCalculation.ts`. `DamageCalcInput` gains `attackBonus`/`defenseBonus` fields. Server endpoint computes Focus bonuses for human attackers/targets. Client composable applies Focus bonuses to `attackStatValue` and `targetDamageCalcs`.
- **H (Heavy Armor Speed Penalty):** `buildCombatantFromEntity()` applies speed default CS to initiative and initial stage modifiers. `breather.post.ts` resets speed CS to equipment default (not 0) for Heavy Armor wearers.

**P1 Status:** All 4 items (E, F, G, H) implemented. P2 (UI) remains.

### P2 — Equipment Tab UI & Item Catalog Browser (2026-02-21)

| Commit | Description | Files |
|--------|-------------|-------|
| `5654e10` | I: HumanEquipmentTab.vue — 6 slots, catalog dropdown, custom item entry, combat bonuses summary | `app/components/character/tabs/HumanEquipmentTab.vue` (new) |
| `d779419` | I: Register Equipment tab in CharacterModal | `app/components/character/CharacterModal.vue` |
| `c0d9b59` | I: Register Equipment tab on GM character detail page | `app/pages/gm/characters/[id].vue` |
| `56a2c1c` | J: EquipmentCatalogBrowser modal — grouped by slot, filter/search, equip button | `app/components/character/EquipmentCatalogBrowser.vue` (new) |
| `5b76f2b` | I+J: Wire catalog browser into Equipment tab | `app/components/character/tabs/HumanEquipmentTab.vue` |

**P2 Summary:**

- **I (Equipment Tab):** New `HumanEquipmentTab.vue` added to both `CharacterModal.vue` and `gm/characters/[id].vue`. Six equipment slots with Phosphor Icons, each showing equipped item name + remove button. Empty slots show dropdown filtered to slot-compatible catalog items plus a "Custom..." option for manual item entry with bonus values. Combat Bonuses summary at bottom shows aggregate DR, evasion, speed CS, Focus stat bonuses, and conditional DR from `computeEquipmentBonuses()`. Equip/unequip calls `PUT /api/characters/:id/equipment`. WebSocket `character_update` emitted when character is in active encounter.
- **J (Item Catalog Browser):** New `EquipmentCatalogBrowser.vue` modal. Full catalog view of all 15 EQUIPMENT_CATALOG entries grouped by slot. Filter by slot dropdown, search by name/description. Each item shows name, cost, description, and bonus tags (DR, evasion, speed CS, focus, conditional DR, can-ready). Equip button targets selected character via PUT API.

**P2 Status:** All items (I, J) implemented. Design complete.

