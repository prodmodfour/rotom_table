# P1 Specification

## C. Significance Multiplier on Encounters (P1)

### Data Model Changes

**Prisma schema** — add significance field to Encounter:
```prisma
model Encounter {
  // ... existing fields ...
  significance     Float   @default(1.0) // Significance multiplier (x1-x5)
  significanceTier String  @default("insignificant") // Preset tier label
}
```

**TypeScript type** — extend `Encounter` interface:
```typescript
export interface Encounter {
  // ... existing fields ...
  significance: number        // 1.0 to 5.0
  significanceTier: SignificanceTier
}
```

### UI: Significance Selection in StartEncounterModal

Add a significance tier selector to `StartEncounterModal.vue` below the battle type selection:

```html
<div class="form-group">
  <label class="form-label">Encounter Significance</label>
  <div class="significance-options">
    <label
      v-for="preset in SIGNIFICANCE_PRESETS"
      :key="preset.tier"
      class="radio-option"
      :class="{ 'radio-option--selected': selectedTier === preset.tier }"
    >
      <input type="radio" v-model="selectedTier" :value="preset.tier" />
      <div class="radio-option__content">
        <strong>{{ preset.label }} (x{{ preset.defaultMultiplier }})</strong>
        <span>{{ preset.description }}</span>
      </div>
    </label>
  </div>
  <div v-if="showCustomMultiplier" class="custom-multiplier">
    <label>Custom Multiplier</label>
    <input
      type="number"
      v-model.number="customMultiplier"
      min="0.5"
      max="10"
      step="0.5"
      class="form-input"
    />
  </div>
</div>
```

The selected significance is emitted with the confirm event and stored on the Encounter record when created.

### UI: Significance in GenerateEncounterModal

When creating encounters from tables (wild encounters), the significance defaults to `insignificant` (x1). The GM can override it in the modal.

### API Changes

**`POST /api/encounters`** — accept optional `significance` and `significanceTier` in request body. Default to `1.0` and `'insignificant'`.

**`POST /api/encounters/from-scene`** — accept optional `significance` and `significanceTier` in request body.

**`PUT /api/encounters/:id`** — allow updating significance mid-encounter (the GM might reassess significance after the encounter plays out).

### Significance-Aware XP Calculation (P1 — depends on ptu-rule-055)

Once ptu-rule-055 (XP system) is implemented, the significance multiplier is consumed by the XP calculation:

```
XP per player = floor(effectiveEnemyLevels * significance / playerCount)
```

The `calculateEncounterXp()` function in `encounterBudget.ts` already implements this formula. The XP UI (from ptu-rule-055) will read `encounter.significance` to compute the final XP.

**Dependency note**: P1 significance storage is independent of ptu-rule-055. The significance field is stored on Encounter and can be set by the GM immediately. The XP calculation that consumes it is blocked on ptu-rule-055 delivering the XP distribution UI.

---

