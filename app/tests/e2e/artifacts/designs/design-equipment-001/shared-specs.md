# Shared Specifications

## Entity Builder Updates

### `buildHumanEntityFromRecord()` (combatant.service.ts)

Add equipment parsing:

```typescript
export function buildHumanEntityFromRecord(record: PrismaHumanRecord): HumanCharacter {
  return {
    // ... existing fields ...
    equipment: record.equipment ? JSON.parse(record.equipment) : {},
  }
}
```

### `buildCombatantFromEntity()` (combatant.service.ts)

Incorporate equipment bonuses into initial evasion calculation:

```typescript
export function buildCombatantFromEntity(options: BuildCombatantOptions): Combatant {
  // ... existing code ...

  let equipmentEvasionBonus = 0
  let equipmentSpeedCS = 0
  if (entityType === 'human') {
    const bonuses = computeEquipmentBonuses((entity as HumanCharacter).equipment ?? {})
    equipmentEvasionBonus = bonuses.evasionBonus
    equipmentSpeedCS = bonuses.speedDefaultCS
  }

  // Apply speed default CS to initiative
  const effectiveSpeedForInitiative = equipmentSpeedCS !== 0
    ? applyStageModifier(stats.speed, equipmentSpeedCS)
    : stats.speed
  const initiative = effectiveSpeedForInitiative + initiativeBonus

  return {
    // ... existing fields ...
    initiative,
    physicalEvasion: initialEvasion(stats.defense || 0) + equipmentEvasionBonus,
    specialEvasion: initialEvasion(stats.specialDefense || 0) + equipmentEvasionBonus,
    speedEvasion: initialEvasion(stats.speed || 0) + equipmentEvasionBonus,
    // ...
  }
}
```

---


## WebSocket Sync

Equipment changes emit a `character_update` WebSocket event (existing event type). The Group View already handles `character_update` by refreshing combatant data. No new event types needed.

---


## Migration Plan

1. Add `equipment` column to `HumanCharacter` Prisma model with `@default("{}")`
2. Run `npx prisma migrate dev --name add-equipment-column`
3. No data migration needed -- all existing characters start with empty equipment (no regression)
4. Existing manual DR/evasion workflows continue to work (P1 only auto-populates when equipment is present)

---


## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Equipment JSON bloat on HumanCharacter | Low | Equipment is 6 items max; JSON is tiny |
| Breaking existing DR/evasion manual workflows | Medium | P1 uses equipment DR as default but caller override still works |
| Shield readied state complexity | Low | P0/P1 only track passive bonuses; readied state is a GM-managed toggle, deferred |
| Pokemon held items confusion | Low | Equipment system is trainer-only; Pokemon `heldItem` field is completely separate |
| Two-handed weapon slot conflicts | Low | Validation in PUT endpoint prevents invalid slot combinations |

---


## Decisions & Trade-offs

1. **JSON field vs. separate table**: JSON on `HumanCharacter` matches project patterns (inventory, features, edges). Equipment changes infrequently and never needs relational queries.

2. **Catalog as constants vs. DB table**: Constants file is simpler and matches the project's approach for `combatManeuvers`, `statusConditions`. The GM can still equip custom items via the API by providing a full `EquippedItem` object.

3. **Evasion bonus stacking**: Equipment evasion bonus stacks additively with `stageModifiers.evasion`. Both feed into the existing `evasionBonus` parameter of `calculateEvasion()`. Total evasion from all sources is still capped at +9 per PTU rules (PTU p.657).

4. **Shield readied state deferred**: Readied shields grant enhanced bonuses but also apply Slowed. This is a combat action with duration tracking. P0/P1 only handle passive (non-readied) shield bonuses. Readied state can be a P2+ enhancement.

5. **Pokemon equipment excluded**: PTU Pokemon use "Held Items" which are a separate system (single item, different mechanics). The equipment slot system is trainer-only. Pokemon held items remain the existing `heldItem` string field.

---

