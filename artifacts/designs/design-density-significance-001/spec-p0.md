# P0 Specification

## A. Separate Density from Spawn Count (P0)

### Conceptual Change

Density tier (`sparse | moderate | dense | abundant`) becomes a **descriptive label** on encounter tables -- it tells the GM how populated this habitat is. It no longer mechanically determines spawn count.

Spawn count becomes an explicit, independent parameter in the generation flow. The GM either specifies a count directly or gets a suggestion from the level-budget calculator (P2).

### Data Model Changes

#### `app/types/habitat.ts`

Remove `DENSITY_RANGES` and `MAX_SPAWN_COUNT`. Replace with a new constant for the spawn count cap (safety limit).

```typescript
// Population density tiers -- DESCRIPTIVE ONLY, no mechanical effect
export type DensityTier = 'sparse' | 'moderate' | 'dense' | 'abundant';

// Suggested spawn ranges per density tier (GM reference, not enforced)
// These are hints shown in the UI to help the GM pick a spawn count
export const DENSITY_SUGGESTIONS: Record<DensityTier, { suggested: number; description: string }> = {
  sparse: { suggested: 2, description: 'Few Pokemon -- isolated individuals or a mated pair' },
  moderate: { suggested: 4, description: 'Small group -- a pack or family unit' },
  dense: { suggested: 6, description: 'Large group -- multiple packs or a colony' },
  abundant: { suggested: 8, description: 'Swarm territory -- many overlapping groups' },
};

// Hard cap on spawn count for safety (prevents accidental massive generation)
export const MAX_SPAWN_COUNT = 20;
```

Remove the `densityMultiplier` field from `TableModification` interface -- it no longer has a mechanical purpose. The field already exists in Prisma and the DB; we will keep the column for backward compatibility but stop using it in generation logic.

```typescript
export interface TableModification {
  id: string;
  name: string;
  description?: string;
  parentTableId: string;
  levelRange?: LevelRange;
  // densityMultiplier removed from interface -- no longer used in generation
  entries: ModificationEntry[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### `app/prisma/schema.prisma`

No schema migration needed for P0. The `density` column on `EncounterTable` stays (it becomes descriptive). The `densityMultiplier` column on `TableModification` stays in the DB but is ignored by generation logic. This avoids a migration and preserves existing data.

### API Changes

#### `app/server/api/encounter-tables/[id]/generate.post.ts`

The `count` parameter becomes **required** (no longer derived from density). The density-based calculation block is removed entirely.

```typescript
export default defineEventHandler(async (event) => {
  const tableId = getRouterParam(event, 'id')
  const body = await readBody(event)

  // ... table fetch (unchanged) ...

  // Spawn count -- required from client, capped at MAX_SPAWN_COUNT
  const count = Math.min(
    Math.max(1, body.count ?? 4),
    MAX_SPAWN_COUNT
  )

  // NOTE: densityMultiplier is no longer read from modifications.
  // Modifications still affect species pool (add/remove/override weights)
  // but do not scale spawn count.

  // ... rest of generation logic unchanged ...

  return {
    success: true,
    data: {
      generated,
      meta: {
        tableId: table.id,
        tableName: table.name,
        modificationId: modificationId ?? null,
        levelRange: { min: levelMin, max: levelMax },
        density: table.density as DensityTier, // informational only
        spawnCount: count,
        totalPoolSize: entries.length,
        totalWeight
        // densityMultiplier removed from meta
      }
    }
  }
})
```

### Store Changes

#### `app/stores/encounterTables.ts`

Update `generateFromTable` to require `count` parameter. Remove `densityMultiplier` from the response meta type.

```typescript
async generateFromTable(tableId: string, options: {
  count: number  // now required
  modificationId?: string
  levelRange?: LevelRange
}): Promise<{
  generated: Array<{ ... }>
  meta: {
    tableId: string
    tableName: string
    modificationId: string | null
    levelRange: LevelRange
    density: DensityTier  // informational
    spawnCount: number
    totalPoolSize: number
    totalWeight: number
    // densityMultiplier removed
  }
}>
```

### UI Changes

#### `app/components/habitat/GenerateEncounterModal.vue`

Replace the current density-derived spawn info with an explicit spawn count input.

**Before:**
```
Spawn Count
  4-8 Pokemon (based on Moderate density)
  [ ] Override spawn count: [___]
```

**After:**
```
Spawn Count: [4] (spinner, min 1, max 20)
  Suggestion: 4 (Moderate habitat -- small group)
```

The density label still appears in the table info badges as a descriptive tag. The density suggestion is shown as a hint below the spinner, derived from `DENSITY_SUGGESTIONS[table.density]`.

#### `app/components/encounter-table/ModificationCard.vue`

Remove the `densityMultiplier` display/editor from modification cards. Modifications still show their species overrides but no longer show a density multiplier slider.

#### `app/components/habitat/EncounterTableModal.vue`

Keep the density tier dropdown (it is still a useful descriptive label). Remove any language suggesting it controls spawn count. Update the help text to describe it as a habitat population description.

### Migration Path

Existing encounter tables with density tiers keep their data. The density field becomes informational. Existing `densityMultiplier` values on modifications are preserved in the DB but ignored by the generation endpoint. No data loss.

---

