# Healing Item System

PTU 1.05 healing item catalog and in-combat usage.

## Constants

`constants/healingItems.ts` — 15 items: Potion, Super Potion, Hyper Potion, status cures including Awakening (decree-041), Full Heal, Full Restore, Revive, and repulsive variants. Exports `HealingItemDef` interface, `HealingItemCategory` type, `getRestorativeItems`, `getCureItems`, `resolveConditionsToCure`, `ITEM_CATEGORY_LABELS`.

## Service

`server/services/healing-item.service.ts`:

- `validateItemApplication` — fainted/revive/full-HP checks using effective max HP (decree-017)
- `applyHealingItem` — HP restoration, status cure, revive with internal validation
- `getEntityDisplayName`
- `checkItemRange` — P2 adjacency validation with [[multi-cell-token-footprint|multi-tile token]] support
- `findTrainerForPokemon` — P2 inventory owner resolution for Pokemon users

## Composable

`composables/useHealingItems.ts` — `getApplicableItems` (filters by category + target state + effective max HP), `useItem` (store action wrapper), `getItemsByCategory`.

## Component

`UseItemModal.vue` — target selector with effective max HP display, filtered item list grouped by category, apply/refuse/cancel flow, result display with repulsive badge.

## Store integration

Encounter store action `useItem`. [[websocket-real-time-sync|WebSocket]] event `item_used` (server to all clients).

## API

POST `/api/encounters/:id/use-item`.

## See also

- [[healing-mechanics]] — how HP restoration, temp HP, and revival work
- [[faint-and-revival-effects]] — Revive removes Fainted status
- [[encounter-component-categories]]
