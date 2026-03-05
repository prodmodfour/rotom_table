# P1: UI Display, Extended Source-Based Clearing, and Edge Cases

## Scope

P1 extends source tracking to:
- UI display of condition sources in GM view
- Source-based clearing for recall, encounter end, and breather
- Edge cases around source interaction and clearing rules

**Prerequisite:** P0 must be implemented and reviewed first.

---

## Section E: UI Display of Condition Sources

### E.1: Show source labels in encounter status display

When the GM views a combatant's status conditions in the encounter panel, Other category conditions should show their source label. This helps the GM understand why a condition persists through faint or other clearing events.

**Display rules:**
- Persistent/Volatile conditions: show condition name only (source doesn't affect behavior)
- Other conditions with source: show condition name + source in parentheses
  - Example: "Stuck (Thunder Wave)" or "Slowed (Grassy Terrain)"
- Other conditions with 'unknown' source: show condition name + "(source unknown)"
- Other conditions with 'manual' source: show condition name only (GM applied it, they know why)

**Implementation approach:**

The encounter store's combatant data already includes the full combatant JSON (with conditionInstances). A composable or utility function formats the display:

```typescript
/**
 * Format a condition for display, including source label for Other conditions.
 */
export function formatConditionDisplay(
  condition: StatusCondition,
  instances?: ConditionInstance[]
): string {
  const def = getConditionDef(condition)
  if (def.category !== 'other') return condition

  const instance = instances?.find(i => i.condition === condition)
  if (!instance || instance.sourceType === 'manual') return condition
  if (instance.sourceType === 'unknown') return `${condition} (source unknown)`
  return `${condition} (${instance.sourceLabel})`
}
```

**Affected components:** Any component that renders `entity.statusConditions` for a combatant in GM view. The exact component files depend on the current UI structure (likely in `app/components/encounter/`). The Developer should grep for `statusConditions` renders in encounter components.

### E.2: Tooltip on condition badges (optional enhancement)

If condition badges already exist as distinct UI elements, add a tooltip showing:
- Source type
- Source label
- Applied round (if tracked)

This is a low-effort enhancement if the badge component supports tooltips.

---

## Section F: Source-Based Recall Clearing

### F.1: Update applyRecallSideEffects()

**File:** `app/server/services/switching.service.ts`

Currently, `applyRecallSideEffects()` operates on the DB record directly:

```typescript
// Current: filters by RECALL_CLEARED_CONDITIONS (static)
const recallClearedSet = new Set(RECALL_CLEARED_CONDITIONS as string[])
const persistentOnly = currentStatuses.filter(s => !recallClearedSet.has(s))
```

**P1 change:** For Other conditions, consult source-based rules. This requires passing the combatant's `conditionInstances` to the function.

```typescript
import { shouldClearOnRecall } from '~/constants/conditionSourceRules'

export async function applyRecallSideEffects(
  entityId: string,
  conditionInstances?: ConditionInstance[]
): Promise<void> {
  const dbRecord = await prisma.pokemon.findUnique({
    where: { id: entityId }
  })
  if (!dbRecord) return

  const currentStatuses: StatusCondition[] = JSON.parse(dbRecord.statusConditions || '[]')
  const persistentOnly = currentStatuses.filter(status => {
    const def = getConditionDef(status)
    // Non-other conditions: use static clearsOnRecall flag
    if (def.category !== 'other') return !def.clearsOnRecall
    // Other conditions: check source
    const instance = conditionInstances?.find(i => i.condition === status)
    return !shouldClearOnRecall(status, instance)
  })

  await prisma.pokemon.update({
    where: { id: entityId },
    data: {
      statusConditions: JSON.stringify(persistentOnly),
      temporaryHp: 0,
      stageModifiers: JSON.stringify({})
    }
  })
}
```

### F.2: Add shouldClearOnRecall() to conditionSourceRules.ts

**File:** `app/constants/conditionSourceRules.ts`

Extend `ConditionClearingOverrides`:

```typescript
export interface ConditionClearingOverrides {
  clearsOnFaint: boolean
  clearsOnRecall: boolean    // NEW in P1
  clearsOnEncounterEnd: boolean  // NEW in P1
}
```

Extend `SOURCE_CLEARING_RULES`:

```typescript
export const SOURCE_CLEARING_RULES: Record<ConditionSourceType, Partial<ConditionClearingOverrides>> = {
  'move':        { clearsOnFaint: true, clearsOnRecall: true, clearsOnEncounterEnd: true },
  'ability':     { clearsOnFaint: true, clearsOnRecall: true, clearsOnEncounterEnd: true },
  'terrain':     { clearsOnFaint: false, clearsOnRecall: false, clearsOnEncounterEnd: true },
  'weather':     { clearsOnFaint: false, clearsOnRecall: false, clearsOnEncounterEnd: true },
  'item':        { clearsOnFaint: true, clearsOnRecall: true, clearsOnEncounterEnd: true },
  'environment': { clearsOnFaint: false, clearsOnRecall: false, clearsOnEncounterEnd: false },
  'manual':      { clearsOnFaint: false, clearsOnRecall: false, clearsOnEncounterEnd: false },
  'system':      { clearsOnFaint: false },
  'unknown':     {}
}
```

Add the new decision functions following the same pattern as `shouldClearOnFaint()`:

```typescript
export function shouldClearOnRecall(
  condition: StatusCondition,
  instance?: ConditionInstance
): boolean {
  const def = getConditionDef(condition)
  if (def.category !== 'other') return def.clearsOnRecall
  if (instance?.sourceType) {
    const rule = SOURCE_CLEARING_RULES[instance.sourceType]
    if (rule?.clearsOnRecall !== undefined) return rule.clearsOnRecall
  }
  return def.clearsOnRecall
}

export function shouldClearOnEncounterEnd(
  condition: StatusCondition,
  instance?: ConditionInstance
): boolean {
  const def = getConditionDef(condition)
  if (def.category !== 'other') return def.clearsOnEncounterEnd
  if (instance?.sourceType) {
    const rule = SOURCE_CLEARING_RULES[instance.sourceType]
    if (rule?.clearsOnEncounterEnd !== undefined) return rule.clearsOnEncounterEnd
  }
  return def.clearsOnEncounterEnd
}
```

### F.3: Update recall.post.ts callers

**File:** `app/server/api/encounters/[id]/recall.post.ts`

Pass `conditionInstances` when calling `applyRecallSideEffects()`:

```typescript
// Current:
await applyRecallSideEffects(pokemon.entityId)

// Updated:
await applyRecallSideEffects(pokemon.entityId, pokemon.conditionInstances)
```

Also update `switch.post.ts` if it calls `applyRecallSideEffects()`.

---

## Section G: Source-Based Encounter End Clearing

### G.1: Update clearEncounterEndConditions()

**File:** `app/server/api/encounters/[id]/end.post.ts`

Currently uses a static set:

```typescript
function clearEncounterEndConditions(conditions: StatusCondition[]): StatusCondition[] {
  const toClear = new Set<string>(ENCOUNTER_END_CLEARED_CONDITIONS)
  return conditions.filter((s: StatusCondition) => !toClear.has(s))
}
```

**P1 change:** Accept conditionInstances and use source-aware clearing:

```typescript
import { shouldClearOnEncounterEnd } from '~/constants/conditionSourceRules'
import type { ConditionInstance, StatusCondition } from '~/types'

function clearEncounterEndConditions(
  conditions: StatusCondition[],
  instances?: ConditionInstance[]
): StatusCondition[] {
  return conditions.filter(condition => {
    const instance = instances?.find(i => i.condition === condition)
    return !shouldClearOnEncounterEnd(condition, instance)
  })
}
```

Update the call site in the handler to pass `combatant.conditionInstances`.

---

## Section H: Source-Based Breather Clearing

### H.1: Review breather behavior

**File:** `app/server/api/encounters/[id]/breather.post.ts`

Currently, `BREATHER_CURED_CONDITIONS` includes all volatile conditions (except Cursed) plus Slowed and Stuck. This is PTU-accurate — Take a Breather explicitly cures these regardless of source.

**P1 decision: No change for breather.**

The breather mechanic in PTU is a deliberate game action that explicitly cures specific conditions by category. The source of those conditions is irrelevant — the breather cure is absolute. A terrain-caused Stuck is still cleared by Take a Breather because the combatant is actively breaking free.

This is different from faint (passive event) where terrain-based conditions would logically persist (the terrain didn't go away just because the Pokemon fainted).

If future game logic requires source-aware breather clearing, the infrastructure from F.2 (`shouldClearOnBreather()`) can be added at that time.

---

## Section I: Source Propagation in Existing Condition Paths

### I.1: Status automation (next-turn.post.ts)

When `next-turn.post.ts` applies conditions as part of automation (e.g., future auto-cure from save checks), it should pass `source: { type: 'system', label: 'Save check cure' }` to `updateStatusConditions()`.

Currently, no conditions are added by next-turn.post.ts (only tick damage is applied). If P2 of design-status-automation-001 adds auto-cures (fire thaw, wake on damage), those paths should pass source metadata.

### I.2: Healing item condition cures

**File:** `app/server/services/healing-item.service.ts`

Currently calls `updateStatusConditions(target, [], conditionsToCure)` without source. This is a removal path (curing conditions), not an application path. The `source` parameter is only meaningful when adding conditions, so no change is needed here.

### I.3: Move execution condition application

**File:** `app/server/api/encounters/[id]/move.post.ts`

If a move applies a status condition (currently not automated — conditions are applied manually by the GM), the source should be `{ type: 'move', label: moveName }`. This is a future enhancement when move effects are automated. No change needed now.

### I.4: Breather tempConditions

**File:** `app/server/api/encounters/[id]/breather.post.ts`

Breather applies Tripped/Vulnerable as `tempConditions` on the combatant (not on `entity.statusConditions`). These are temporary conditions cleared at next turn start. They do not go through `updateStatusConditions()` and are not stored in `conditionInstances`.

**No change needed.** `tempConditions` is a separate system for ephemeral combat effects. It does not participate in source tracking or clearing logic.

---

## Section J: Edge Cases

### J.1: Multiple instances of the same condition

PTU does not allow duplicate conditions (you can't be "double-Stuck"). The system already prevents duplicates in `updateStatusConditions()`. Therefore, `conditionInstances` will have at most one entry per condition name.

If a condition is already present and a second source tries to apply it, the `updateStatusConditions()` skips the duplicate. The original source is preserved. If the GM wants to change the source, they must remove and re-add the condition.

### J.2: Condition removed and re-applied with different source

When a condition is removed (e.g., Stuck cured) and later re-applied by a different source:
1. Remove: both `entity.statusConditions` and `conditionInstances` entry are cleared
2. Re-apply: new entry with the new source is created
This is handled naturally by the add/remove logic in `updateStatusConditions()`.

### J.3: Pre-existing conditions on combat entry

When a Pokemon enters combat with pre-existing conditions (from outside combat or a previous encounter):
- `buildCombatantFromEntity()` seeds `conditionInstances` with `sourceType: 'unknown'`
- `shouldClearOnFaint()` with 'unknown' source returns the static def flag
- For Other conditions, static flag is `clearsOnFaint: false` (decree-047)
- This is the safe default: we don't know the source, so we don't clear

### J.4: Revive restoring conditions

When a fainted Pokemon is revived (healed from 0 HP):
- `applyHealingToEntity()` removes 'Fainted' from `entity.statusConditions`
- Should also remove 'Fainted' from `conditionInstances`
- Other surviving conditions (those that persisted through faint) remain

**Implementation:** Update `applyHealingToEntity()` to sync `conditionInstances` when removing Fainted:

```typescript
if (previousHp === 0 && newHp > 0) {
  combatant.entity = {
    ...combatant.entity,
    currentHp: newHp,
    statusConditions: (combatant.entity.statusConditions || []).filter(
      (s: StatusCondition) => s !== 'Fainted'
    )
  }
  // Also remove Fainted from conditionInstances
  if (combatant.conditionInstances) {
    combatant.conditionInstances = combatant.conditionInstances.filter(
      i => i.condition !== 'Fainted'
    )
  }
  result.faintedRemoved = true
}
```

### J.5: Pokemon Center full cure

`pokemon-center.post.ts` sets `statusConditions` to `[]`. This operates on the DB record directly, outside of combat. No `conditionInstances` exist outside combat, so no change needed.

### J.6: Death condition

When 'Dead' is added in `damage.post.ts`, it is added directly to `entity.statusConditions` without going through `updateStatusConditions()`. This should also add a conditionInstance:

```typescript
// In damage.post.ts, when adding Dead:
if (deathCheck.isDead && !body.suppressDeath) {
  const currentConditions: StatusCondition[] = entity.statusConditions || []
  if (!currentConditions.includes('Dead')) {
    combatant.entity = {
      ...entity,
      statusConditions: ['Dead', ...currentConditions.filter(s => s !== 'Dead')]
    }
    // Add to conditionInstances
    if (!combatant.conditionInstances) combatant.conditionInstances = []
    combatant.conditionInstances = [
      { condition: 'Dead', sourceType: 'system', sourceLabel: deathCheck.cause || 'Death' },
      ...combatant.conditionInstances.filter(i => i.condition !== 'Dead')
    ]
    entity = combatant.entity
  }
}
```

---

## Implementation Order

1. **E.1:** UI display formatting function — commit
2. **F.1 + F.2:** shouldClearOnRecall, shouldClearOnEncounterEnd in conditionSourceRules.ts — commit
3. **F.3:** Update recall callers — commit
4. **G.1:** Update encounter end clearing — commit
5. **J.4:** Revive conditionInstances sync — commit
6. **J.6:** Death conditionInstances sync — commit
7. **E.2:** Tooltip enhancement (optional) — commit

---

## Dependency on P0

P1 assumes all P0 sections (A-G) are implemented and reviewed. Specifically:
- `ConditionInstance` type exists on Combatant
- `conditionInstances` is seeded on combat entry
- `updateStatusConditions()` accepts and propagates source
- `shouldClearOnFaint()` exists and works
- `conditionSourceRules.ts` exists with the basic structure

P1 extends the SOURCE_CLEARING_RULES table and adds new `shouldClearOnRecall()` / `shouldClearOnEncounterEnd()` functions to the same module.
