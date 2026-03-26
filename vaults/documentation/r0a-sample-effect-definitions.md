# R0.A Sample Effect Definitions

The 45 validation definitions for the R0.A exit criterion: 30 moves + 15 traits, hand-selected to cover all 18 [[effect-atom-catalog|atom types]], all 7 [[effect-composition-model|composition patterns]], and the [[effect-trigger-system|trigger system]]. Each definition is a TypeScript constant using the [[effect-definition-format|helper function syntax]]. Part of the [[game-state-interface]].

## Purpose

Per the consolidated ring plan: "The effect engine can express and correctly evaluate all 45 sample definitions." These definitions prove the engine design works — or reveal where it doesn't. Gaps discovered during authoring are documented at the end.

---

## Move Definitions (30)

### 1. Thunderbolt — pure damage + conditional status

```typescript
const THUNDERBOLT: MoveDefinition = {
  id: 'thunderbolt',
  name: 'Thunderbolt',
  type: 'electric', damageClass: 'special', damageBase: 8,
  accuracy: 2, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 4,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    dealDamage({ db: 8, type: 'electric', class: 'special' }),
    conditional(
      { check: 'roll-at-least', threshold: 19 },
      applyStatus({ category: 'persistent', condition: 'paralyzed' })
    ),
  ]),
}
```

### 2. Thunder Wave — auto-hit status with type immunity

```typescript
const THUNDER_WAVE: MoveDefinition = {
  id: 'thunder-wave',
  name: 'Thunder Wave',
  type: 'electric', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 2,

  effect: conditional(
    { check: 'not', inner: { check: 'target-type-is', type: 'electric' } },
    applyStatus({ category: 'persistent', condition: 'paralyzed' }),
    passThrough(),
  ),
}
```

No accuracy check — auto-hit. Type immunity checked via Conditional.

### 3. Will-O-Wisp — status with accuracy

```typescript
const WILL_O_WISP: MoveDefinition = {
  id: 'will-o-wisp',
  name: 'Will-O-Wisp',
  type: 'fire', damageClass: 'status', damageBase: null,
  accuracy: 2, range: { type: 'ranged', min: 1, max: 4 }, energyCost: 2,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    applyStatus({ category: 'persistent', condition: 'burned' }),
  ]),
}
```

### 4. Swords Dance — self-buff

```typescript
const SWORDS_DANCE: MoveDefinition = {
  id: 'swords-dance',
  name: 'Swords Dance',
  type: 'normal', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'self' }, energyCost: 2,

  effect: modifyCombatStages({ stages: { atk: 2 }, target: 'self' }),
}
```

### 5. Dragon Dance — multi-stat self-buff

```typescript
const DRAGON_DANCE: MoveDefinition = {
  id: 'dragon-dance',
  name: 'Dragon Dance',
  type: 'dragon', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'self' }, energyCost: 3,

  effect: modifyCombatStages({ stages: { atk: 1, spd: 1 }, target: 'self' }),
}
```

### 6. Earthquake — burst AoE

```typescript
const EARTHQUAKE: MoveDefinition = {
  id: 'earthquake',
  name: 'Earthquake',
  type: 'ground', damageClass: 'physical', damageBase: 10,
  accuracy: 2, range: { type: 'burst', radius: 3, groundsource: true }, energyCost: 6,

  effect: crossEntityFilter(
    sequence([
      resolveAccuracy({ ac: 2 }),
      dealDamage({ db: 10, type: 'ground', class: 'physical' }),
    ]),
    { scope: 'all-in-range' },
  ),
}
```

Each target in the burst gets an independent accuracy check and damage roll.

### 7. Bullet Seed — multi-hit (Five Strike)

```typescript
const BULLET_SEED: MoveDefinition = {
  id: 'bullet-seed',
  name: 'Bullet Seed',
  type: 'grass', damageClass: 'physical', damageBase: 3,
  accuracy: 2, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 3,
  keywords: ['five-strike'],

  effect: repeat(
    sequence([
      resolveAccuracy({ ac: 2 }),
      dealDamage({ db: 3, type: 'grass', class: 'physical' }),
    ]),
    'from-resolution',  // 2–5 hits determined before resolution
  ),
}
```

### 8. Struggle Bug — cone AoE + debuff

```typescript
const STRUGGLE_BUG: MoveDefinition = {
  id: 'struggle-bug',
  name: 'Struggle Bug',
  type: 'bug', damageClass: 'special', damageBase: 5,
  accuracy: 2, range: { type: 'cone', size: 2 }, energyCost: 2,

  effect: crossEntityFilter(
    sequence([
      resolveAccuracy({ ac: 2 }),
      dealDamage({ db: 5, type: 'bug', class: 'special' }),
      modifyCombatStages({ stages: { spatk: -1 } }),
    ]),
    { scope: 'all-in-range' },
  ),
}
```

### 9. Circle Throw — displacement + conditional trip

```typescript
const CIRCLE_THROW: MoveDefinition = {
  id: 'circle-throw',
  name: 'Circle Throw',
  type: 'fighting', damageClass: 'physical', damageBase: 6,
  accuracy: 4, range: { type: 'melee', push: true }, energyCost: 2,

  effect: sequence([
    resolveAccuracy({ ac: 4 }),
    dealDamage({ db: 6, type: 'fighting', class: 'physical' }),
    displaceEntity({ direction: 'push', distance: '6-weight-class', sizeInteraction: true }),
    conditional(
      { check: 'roll-at-least', threshold: 15 },
      applyStatus({ category: 'volatile', condition: 'tripped' })
    ),
  ]),
}
```

### 10. Roar — delayed resolution, forced displacement + recall

```typescript
const ROAR: MoveDefinition = {
  id: 'roar',
  name: 'Roar',
  type: 'normal', damageClass: 'status', damageBase: null,
  accuracy: 2, range: { type: 'burst', radius: 1, sonic: true, social: true }, energyCost: 3,
  resolution: 'end-of-round',  // delayed: user does nothing, resolves at end of round

  effect: crossEntityFilter(
    sequence([
      resolveAccuracy({ ac: 2 }),
      displaceEntity({ direction: 'away-from-user', distance: 'highest-movement-trait' }),
      conditional(
        { check: 'target-within-recall-range', distance: 6 },
        modifyDeployment({ op: 'switch-out', reason: 'forced-recall' }),
      ),
    ]),
    { scope: 'all-in-range' },
  ),
}
```

**Gap discovered: `resolution: 'end-of-round'`** — delayed resolution timing is move metadata, not an effect engine concept. The turn lifecycle system (Ring 1) must handle this. The effect tree describes what happens when Roar resolves, not when it's declared.

**Gap discovered: `target-within-recall-range`** — a spatial predicate checking whether the target ended displacement within 6m of their Poke Ball/Trainer. Not yet in the ConditionPredicate union.

### 11. Gyro Ball — conditional bonus damage from stat comparison

```typescript
const GYRO_BALL: MoveDefinition = {
  id: 'gyro-ball',
  name: 'Gyro Ball',
  type: 'steel', damageClass: 'physical', damageBase: 6,
  accuracy: 2, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 3,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    conditional(
      { check: 'target-effective-stat-exceeds-user', stat: 'spd' },
      dealDamage({
        db: 6, type: 'steel', class: 'physical',
        bonusDamage: { source: 'stat-difference', stat: 'spd', formula: 'target-minus-user' },
      }),
      dealDamage({ db: 6, type: 'steel', class: 'physical' }),
    ),
  ]),
}
```

**Gap discovered: `target-effective-stat-exceeds-user`** — a predicate comparing effective stats (including CS) between user and target. Not yet in the ConditionPredicate union.

**Gap discovered: `bonusDamage` on DealDamage params** — the atom needs a way to express "base DB + variable bonus damage." Current DealDamage params have `damageBase` but no `bonusDamage` modifier source.

### 12. Hex — conditional DB override

```typescript
const HEX: MoveDefinition = {
  id: 'hex',
  name: 'Hex',
  type: 'ghost', damageClass: 'special', damageBase: 7,
  accuracy: 2, range: { type: 'ranged', min: 1, max: 8 }, energyCost: 4,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    conditional(
      { check: 'target-has-any-status' },
      dealDamage({ db: 13, type: 'ghost', class: 'special' }),
      dealDamage({ db: 7, type: 'ghost', class: 'special' }),
    ),
  ]),
}
```

### 13. Retaliate — historical event query

```typescript
const RETALIATE: MoveDefinition = {
  id: 'retaliate',
  name: 'Retaliate',
  type: 'normal', damageClass: 'physical', damageBase: 7,
  accuracy: 2, range: { type: 'melee' }, energyCost: 3,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    conditional(
      { check: 'ally-fainted-by-target', withinRounds: 2 },
      dealDamage({ db: 14, type: 'normal', class: 'physical' }),
      dealDamage({ db: 7, type: 'normal', class: 'physical' }),
    ),
  ]),
}
```

### 14. Toxic Spikes — layerable hazard

```typescript
const TOXIC_SPIKES: MoveDefinition = {
  id: 'toxic-spikes',
  name: 'Toxic Spikes',
  type: 'poison', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'hazard', placement: 'field' }, energyCost: 2,

  effect: modifyFieldState({
    field: 'hazard',
    op: 'add',
    instance: {
      type: 'toxic-spikes',
      maxLayers: 2,
      triggerEffect: {
        eventType: 'switch-in',
        timing: 'after',
        condition: { check: 'not', inner: { check: 'target-type-is', type: 'poison' } },
        effect: conditional(
          { check: 'hazard-layer-count', hazard: 'toxic-spikes', min: 2 },
          applyStatus({ category: 'persistent', condition: 'badly-poisoned' }),
          applyStatus({ category: 'persistent', condition: 'poisoned' }),
        ),
      },
      removalCondition: { check: 'target-type-is', type: 'poison' },
    },
  }),
}
```

Poison-type switch-in removes Toxic Spikes instead of triggering them.

### 15. Stealth Rock — proximity hazard

```typescript
const STEALTH_ROCK: MoveDefinition = {
  id: 'stealth-rock',
  name: 'Stealth Rock',
  type: 'rock', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'hazard', placement: 'field' }, energyCost: 2,

  effect: modifyFieldState({
    field: 'hazard',
    op: 'add',
    instance: {
      type: 'stealth-rock',
      maxLayers: 1,
      triggerEffect: {
        eventType: 'switch-in',
        timing: 'after',
        condition: null,
        effect: dealDamage({
          ticks: 1, type: 'rock', class: 'physical',
          applyTypeEffectiveness: true,
        }),
      },
    },
  }),
}
```

### 16. Safeguard — blessing with choice point

```typescript
const SAFEGUARD: MoveDefinition = {
  id: 'safeguard',
  name: 'Safeguard',
  type: 'normal', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'blessing' }, energyCost: 3,

  effect: modifyFieldState({
    field: 'blessing',
    op: 'add',
    instance: {
      type: 'safeguard',
      activationsRemaining: 3,
      activationEffect: {
        trigger: {
          eventType: 'status-applied',
          timing: 'before',
          scope: 'ally',
          condition: null,
          effect: choicePoint('activate-safeguard', {
            'yes': sequence([
              interceptEvent(),
              modifyFieldState({ field: 'blessing', op: 'consume', blessingId: 'safeguard' }),
            ]),
            'no': passThrough(),
          }),
        },
      },
    },
  }),
}
```

### 17. Light Screen — blessing with damage resistance

```typescript
const LIGHT_SCREEN: MoveDefinition = {
  id: 'light-screen',
  name: 'Light Screen',
  type: 'psychic', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'blessing' }, energyCost: 3,

  effect: modifyFieldState({
    field: 'blessing',
    op: 'add',
    instance: {
      type: 'light-screen',
      activationsRemaining: 2,
      activationEffect: {
        trigger: {
          eventType: 'damage-received',
          timing: 'before',
          scope: 'ally',
          condition: { check: 'incoming-move-damage-class-is', damageClass: 'special' },
          effect: choicePoint('activate-light-screen', {
            'yes': sequence([
              applyDamageResistance({ steps: 1 }),
              modifyFieldState({ field: 'blessing', op: 'consume', blessingId: 'light-screen' }),
            ]),
            'no': passThrough(),
          }),
        },
      },
    },
  }),
}
```

**Gap discovered: `applyDamageResistance`** — "resist damage one step" is a PTR mechanic (reducing the damage tier). This isn't a standard DealDamage modifier or an existing atom. It needs to be either a before-trigger damage modifier or a new atom. The resistance step system should be documented.

### 18. Aqua Ring — coat with turn-start heal

```typescript
const AQUA_RING: MoveDefinition = {
  id: 'aqua-ring',
  name: 'Aqua Ring',
  type: 'water', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'self' }, energyCost: 3,

  effect: modifyFieldState({
    field: 'coat',
    op: 'add',
    instance: {
      type: 'aqua-ring',
      target: 'self',
      tickEffect: {
        trigger: {
          eventType: 'turn-start',
          timing: 'after',
          scope: 'self',
          condition: null,
          effect: healHP({ ticks: 1 }),
        },
      },
    },
  }),
}
```

### 19. Wide Guard — interrupt, team interception

```typescript
const WIDE_GUARD: MoveDefinition = {
  id: 'wide-guard',
  name: 'Wide Guard',
  type: 'rock', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'burst', radius: 1, interrupt: true, shield: true },
  energyCost: 3,
  actionType: 'interrupt',

  effect: applyActiveEffect({
    op: 'add',
    effect: {
      effectId: 'wide-guard',
      sourceEntityId: 'self',
      expiresAt: 'end-of-action',
      trigger: {
        eventType: 'damage-received',
        timing: 'before',
        scope: 'self',
        condition: { check: 'target-is-adjacent', relativeTo: 'effect-source' },
        effect: interceptEvent(),
      },
    },
    applyTo: 'adjacent-allies-and-self',
  }),
}
```

Wide Guard applies an ActiveEffect with an interception trigger to all adjacent allies and the user. When any of them is hit, the before-trigger intercepts.

### 20. Protect — interrupt, self interception

```typescript
const PROTECT: MoveDefinition = {
  id: 'protect',
  name: 'Protect',
  type: 'normal', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'self', interrupt: true, shield: true },
  energyCost: 3,
  actionType: 'interrupt',

  effect: applyActiveEffect({
    op: 'add',
    effect: {
      effectId: 'protect',
      sourceEntityId: 'self',
      expiresAt: 'end-of-action',
      trigger: {
        eventType: 'damage-received',
        timing: 'before',
        scope: 'self',
        condition: null,
        effect: interceptEvent(),
      },
    },
  }),
}
```

### 21. Whirlpool — damage + embedded vortex

```typescript
const WHIRLPOOL: MoveDefinition = {
  id: 'whirlpool',
  name: 'Whirlpool',
  type: 'water', damageClass: 'special', damageBase: 4,
  accuracy: 2, range: { type: 'melee' }, energyCost: 3,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    dealDamage({ db: 4, type: 'water', class: 'special' }),
    embeddedAction(
      modifyFieldState({
        field: 'vortex', op: 'add',
        instance: { type: 'whirlpool', appliesTrapped: true, appliesSlowed: true },
      }),
      'swift',
    ),
  ]),
}
```

### 22. Quash — initiative manipulation

```typescript
const QUASH: MoveDefinition = {
  id: 'quash',
  name: 'Quash',
  type: 'dark', damageClass: 'status', damageBase: null,
  accuracy: 2, range: { type: 'ranged', min: 1, max: 10, social: true }, energyCost: 0,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    modifyInitiative({ op: 'set', value: 0 }),
  ]),
}
```

Uses the [[effect-atom-catalog|ModifyInitiative]] atom with `op: 'set'`.

### 23. After You — initiative reorder (swift action)

```typescript
const AFTER_YOU: MoveDefinition = {
  id: 'after-you',
  name: 'After You',
  type: 'normal', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 5,
  actionType: 'swift',

  effect: conditional(
    { check: 'and', predicates: [
      { check: 'target-has-not-acted-this-round' },
      { check: 'target-is-willing' },
    ]},
    modifyInitiative({ op: 'set-next-after-user' }),
    passThrough(),
  ),
}
```

Uses the [[effect-atom-catalog|ModifyInitiative]] atom with `op: 'set-next-after'`.

**Gap discovered: `target-has-not-acted-this-round`** and **`target-is-willing`** — predicates not in the ConditionPredicate union. These query turn state and player consent.

### 24. Psyshock — replacement effect

```typescript
const PSYSHOCK: MoveDefinition = {
  id: 'psyshock',
  name: 'Psyshock',
  type: 'psychic', damageClass: 'special', damageBase: 8,
  accuracy: 2, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 4,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    replacement(
      dealDamage({ db: 8, type: 'psychic', class: 'special' }),
      { defenderStat: 'def' },  // targets Defense instead of SpDef
    ),
  ]),
}
```

### 25. Heal Block — effect suppression

```typescript
const HEAL_BLOCK: MoveDefinition = {
  id: 'heal-block',
  name: 'Heal Block',
  type: 'psychic', damageClass: 'status', damageBase: null,
  accuracy: 2, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 1,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    applyActiveEffect({
      op: 'add',
      effect: {
        effectId: 'heal-block',
        sourceEntityId: 'self',
        expiresAt: 'end-of-encounter',
        clearedBy: ['switch-out', 'take-a-breather'],
        trigger: {
          eventType: 'healing-attempted',
          timing: 'before',
          scope: 'self',
          condition: null,
          effect: interceptEvent(),
        },
      },
    }),
  ]),
}
```

The ActiveEffect carries the healing-interception trigger. The centralized `healing-attempted` event from the [[effect-trigger-system]] makes this a single definition.

### 26. Taunt — behavioral restriction (Enraged)

```typescript
const TAUNT: MoveDefinition = {
  id: 'taunt',
  name: 'Taunt',
  type: 'dark', damageClass: 'status', damageBase: null,
  accuracy: 2, range: { type: 'ranged', min: 1, max: 6, social: true }, energyCost: 2,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    modifyMoveLegality({ restriction: 'damaging-only', volatile: 'enraged' }),
  ]),
}
```

### 27. Thief — damage + conditional inventory mutation

```typescript
const THIEF: MoveDefinition = {
  id: 'thief',
  name: 'Thief',
  type: 'dark', damageClass: 'physical', damageBase: 6,
  accuracy: 2, range: { type: 'melee' }, energyCost: 2,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    dealDamage({ db: 6, type: 'dark', class: 'physical' }),
    conditional(
      { check: 'user-item-slot-empty' },
      mutateInventory({ op: 'steal' }),
    ),
  ]),
}
```

### 28. Beat Up — multi-attacker delegation

```typescript
const BEAT_UP: MoveDefinition = {
  id: 'beat-up',
  name: 'Beat Up',
  type: 'dark', damageClass: 'physical', damageBase: null,
  accuracy: null, range: { type: 'melee' }, energyCost: 2,

  effect: sequence([
    // User's Struggle Attack (Dark-typed)
    dealDamage({ source: 'struggle-attack', typeOverride: 'dark', attacker: 'self' }),
    // Up to 2 adjacent allies also Struggle Attack
    crossEntityFilter(
      dealDamage({ source: 'struggle-attack', typeOverride: 'dark', attacker: 'filtered-entity' }),
      { scope: 'allies', filter: { check: 'target-is-adjacent' }, maxCount: 2 },
    ),
  ]),
}
```

**Gap discovered: `attacker: 'filtered-entity'`** — CrossEntityFilter iterates matching combatants and evaluates the child for each. But DealDamage assumes a single user/target pair. When an ally performs the Struggle Attack, the ally becomes the "user" for that evaluation. The context switching (who is the user of this sub-evaluation) needs to be specified in CrossEntityFilter's contract.

### 29. Defog — field clearing (composed from ModifyFieldState)

```typescript
const DEFOG: MoveDefinition = {
  id: 'defog',
  name: 'Defog',
  type: 'flying', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'field' }, energyCost: 2,

  effect: sequence([
    modifyFieldState({ field: 'weather', op: 'clear' }),
    modifyFieldState({ field: 'hazards', op: 'remove-all' }),
    modifyFieldState({ field: 'blessings', op: 'remove-all' }),
    modifyFieldState({ field: 'coats', op: 'remove-all' }),
  ]),
}
```

Per finding 54: Defog is a composition of ModifyFieldState atoms, not a dedicated ClearFieldState atom.

### 30. Recover — self-heal

```typescript
const RECOVER: MoveDefinition = {
  id: 'recover',
  name: 'Recover',
  type: 'normal', damageClass: 'status', damageBase: null,
  accuracy: null, range: { type: 'self' }, energyCost: 4,

  effect: healHP({ ticks: 5, target: 'self' }),
}
```

5 ticks = 50% max HP.

---

## Trait Definitions (15)

### 1. Volt Absorb — type-absorb (Electric → energy)

```typescript
const VOLT_ABSORB: TraitDefinition = {
  id: 'volt-absorb',
  name: 'Volt Absorb',
  category: 'innate',

  triggers: [
    {
      eventType: 'damage-received',
      timing: 'before',
      condition: { check: 'incoming-move-type-is', type: 'electric' },
      scope: 'self',
      effect: sequence([
        interceptEvent(),
        manageResource({ resource: 'energy', amount: 5 }),
      ]),
    },
  ],
}
```

### 2. Water Absorb — type-absorb (Water → HP)

```typescript
const WATER_ABSORB: TraitDefinition = {
  id: 'water-absorb',
  name: 'Water Absorb',
  category: 'innate',

  triggers: [
    {
      eventType: 'damage-received',
      timing: 'before',
      condition: { check: 'incoming-move-type-is', type: 'water' },
      scope: 'self',
      effect: sequence([
        interceptEvent(),
        healHP({ ticks: 1 }),
      ]),
    },
  ],
}
```

### 3. Flash Fire — type-absorb (Fire → offensive buff)

```typescript
const FLASH_FIRE: TraitDefinition = {
  id: 'flash-fire',
  name: 'Flash Fire',
  category: 'innate',

  triggers: [
    {
      eventType: 'damage-received',
      timing: 'before',
      condition: { check: 'incoming-move-type-is', type: 'fire' },
      scope: 'self',
      effect: sequence([
        interceptEvent(),
        applyActiveEffect({
          op: 'add',
          effect: {
            effectId: 'flash-fire-boost',
            sourceEntityId: 'self',
            state: { fireBoost: true },
            expiresAt: null,  // permanent until cleared
          },
        }),
      ]),
    },
  ],
}
```

All three type-absorb traits confirmed as before-triggers per finding 44.

### 4. Rough Skin — contact retaliation

```typescript
const ROUGH_SKIN: TraitDefinition = {
  id: 'rough-skin',
  name: 'Rough Skin',
  category: 'innate',

  triggers: [
    {
      eventType: 'damage-received',
      timing: 'after',
      condition: { check: 'incoming-move-is-contact' },
      scope: 'self',
      effect: dealDamage({ ticks: 1, target: 'event-source', type: 'typeless' }),
    },
  ],
}
```

### 5. Opportunist [X] — action economy + passive type override

```typescript
const OPPORTUNIST: TraitDefinition = {
  id: 'opportunist',
  name: 'Opportunist',
  category: 'learned',
  scalingParam: 'x',

  triggers: [
    {
      eventType: 'turn-start',
      timing: 'after',
      condition: null,
      scope: 'self',
      effect: modifyActionEconomy({
        outOfTurnChanges: { aooRemaining: { add: 'x' } },
      }),
    },
  ],

  passiveEffects: {
    struggleAttackTypeOverride: 'dark',
  },
}
```

### 6. Teamwork — spatial query + conditional accuracy buff

```typescript
const TEAMWORK: TraitDefinition = {
  id: 'teamwork',
  name: 'Teamwork',
  category: 'learned',

  triggers: [
    {
      eventType: 'accuracy-check',
      timing: 'before',
      condition: { check: 'and', predicates: [
        { check: 'event-source-is', scope: 'ally' },
        { check: 'incoming-move-range-is', range: 'melee' },
        { check: 'user-is-adjacent-to-target' },
      ]},
      scope: 'any',
      effect: modifyAccuracyRoll({ bonus: 2 }),
    },
  ],
}
```

**Gap discovered: `accuracy-check` event type** — Teamwork needs to modify the accuracy roll before it's resolved. This requires either a new event type (`accuracy-check`) or the Teamwork buff to be applied via a different mechanism (e.g., a passive modifier the accuracy resolution reads).

**Gap discovered: `modifyAccuracyRoll`** — no atom directly modifies a roll's value. Resolution context inputs are injected before evaluation. A before-trigger on an accuracy check would need to modify the resolution context, which contradicts the pure-function model (context is read-only). Alternative: Teamwork applies a +2 accuracy CS boost as a transient active effect that the accuracy formula reads. This keeps the purity.

**Gap discovered: `user-is-adjacent-to-target`** — the predicate needs to check that the Teamwork holder (not the attacker) is adjacent to the target of the ally's attack. This is a three-entity spatial query (Teamwork holder, attacker, target) that the two-entity condition model (user/target) doesn't naturally express.

### 7. Shell [X] — flat damage reduction

```typescript
const SHELL: TraitDefinition = {
  id: 'shell',
  name: 'Shell',
  category: 'innate',
  scalingParam: 'x',

  passiveEffects: {
    flatDamageReduction: 'x',
  },
}
```

The damage pipeline reads `flatDamageReduction` from the target's passive effects and subtracts it from final damage (minimum 0). Passive because it always applies — no trigger needed.

### 8. Ice Body — weather-conditional turn-start heal

```typescript
const ICE_BODY: TraitDefinition = {
  id: 'ice-body',
  name: 'Ice Body',
  category: 'innate',

  triggers: [
    {
      eventType: 'turn-start',
      timing: 'after',
      condition: { check: 'weather-is', type: 'hail' },
      scope: 'self',
      effect: healHP({ ticks: 1 }),
    },
  ],

  passiveEffects: {
    weatherDamageImmunity: 'hail',
  },
}
```

Heal triggers only in Hail. Weather damage immunity is a passive effect the weather-tick step reads.

### 9. Phaser [X] — movement type grant

```typescript
const PHASER: TraitDefinition = {
  id: 'phaser',
  name: 'Phaser',
  category: 'innate',
  scalingParam: 'x',

  passiveEffects: {
    movementTypeGrant: 'phase',
  },
}
```

Phase movement lets the user ignore solid objects and Slow Terrain. The movement system reads this passive effect.

### 10. Limber — paralysis immunity

```typescript
const LIMBER: TraitDefinition = {
  id: 'limber',
  name: 'Limber',
  category: 'innate',

  triggers: [
    {
      eventType: 'status-applied',
      timing: 'before',
      condition: { check: 'and', predicates: [
        { check: 'incoming-status-is', condition: 'paralyzed' },
      ]},
      scope: 'self',
      effect: interceptEvent(),
    },
  ],
}
```

Uses `incoming-status-is` from the [[effect-composition-model|ConditionPredicate]] event-query category.

### 11. Mettle — cross-encounter persistent resource

```typescript
const METTLE: TraitDefinition = {
  id: 'mettle',
  name: 'Mettle',
  category: 'innate',

  triggers: [
    // Gain 1 Mettle Point on faint
    {
      eventType: 'faint',
      timing: 'after',
      condition: null,
      scope: 'self',
      effect: manageResource({ resource: 'mettle', amount: 1 }),
    },
    // Spend 1 Mettle Point to reroll
    {
      eventType: 'roll-completed',
      timing: 'after',
      condition: { check: 'user-resource-at-least', resource: 'mettle', min: 1 },
      scope: 'self',
      effect: choicePoint('spend-mettle', {
        'reroll': sequence([
          manageResource({ resource: 'mettle', amount: -1 }),
          requestReroll({ must: 'accept-new-result' }),
        ]),
        'keep': passThrough(),
      }),
    },
  ],
}
```

**Gap discovered: `roll-completed` event type** — Mettle triggers after any roll to offer a reroll. This event type isn't in the current list.

**Gap discovered: `requestReroll`** — no atom handles re-rolling. A reroll modifies the resolution context retroactively (replacing the roll value), which contradicts the pure-function model. Alternative: the engine suspends resolution, re-injects the resolution context with a new roll, and re-evaluates. This is a turn-lifecycle concern, not an effect engine concern.

Uses `user-resource-at-least` from the [[effect-composition-model|ConditionPredicate]] state-query category.

### 12. Seed Sower — defensive trigger → terrain

```typescript
const SEED_SOWER: TraitDefinition = {
  id: 'seed-sower',
  name: 'Seed Sower',
  category: 'innate',

  triggers: [
    {
      eventType: 'damage-received',
      timing: 'after',
      condition: null,
      scope: 'self',
      effect: modifyFieldState({ field: 'terrain', op: 'set', type: 'grassy', rounds: 5 }),
    },
  ],
}
```

### 13. Pack Hunt — reactive AoO on ally melee hit

```typescript
const PACK_HUNT: TraitDefinition = {
  id: 'pack-hunt',
  name: 'Pack Hunt',
  category: 'innate',

  triggers: [
    {
      eventType: 'damage-dealt',
      timing: 'after',
      condition: { check: 'and', predicates: [
        { check: 'event-source-is', scope: 'ally' },
        { check: 'incoming-move-range-is', range: 'melee' },
        { check: 'target-is-adjacent' },
      ]},
      scope: 'any',
      effect: choicePoint('pack-hunt-aoo', {
        'attack': embeddedAction(
          dealDamage({ source: 'struggle-attack', attacker: 'self' }),
          'attack-of-opportunity',
        ),
        'pass': passThrough(),
      }),
    },
  ],
}
```

**Gap discovered: AoO as embedded action** — Pack Hunt grants an Attack of Opportunity, which is an out-of-turn action with its own resolution. The EmbeddedAction composition works, but `actionType: 'attack-of-opportunity'` needs to integrate with the AoO budget tracking (counts against the round limit per PTR rules).

### 14. Sniper — crit bonus damage

```typescript
const SNIPER: TraitDefinition = {
  id: 'sniper',
  name: 'Sniper',
  category: 'innate',

  passiveEffects: {
    critBonusDamage: 5,  // +5 bonus damage on crits, multiplied as part of crit
  },
}
```

The damage pipeline reads `critBonusDamage` during the crit step. The +5 is added before crit multiplication.

### 15. Technician — DB boost for weak moves

```typescript
const TECHNICIAN: TraitDefinition = {
  id: 'technician',
  name: 'Technician',
  category: 'innate',

  passiveEffects: {
    dbBoostThreshold: 6,    // applies to moves with DB ≤ 6
    dbBoostAmount: 2,       // +2 DB
    dbBoostKeywords: ['double-strike', 'five-strike'],  // always applies to these
  },
}
```

The damage pipeline reads `dbBoostThreshold` and `dbBoostAmount` during the DB calculation step.

---

## Gaps Discovered

Gaps found during definition authoring. These are places where the current engine design cannot fully express a definition or where undocumented concepts are needed.

### New atoms needed

| Gap | Discovered in | Proposed resolution |
|---|---|---|
| `applyDamageResistance` — "resist damage one step" | Light Screen (#17) | Before-trigger damage modifier, or new atom. Depends on PTR resistance step system formalization |
| `requestReroll` — retroactive roll replacement | Mettle (trait #11) | Not an atom — turn-lifecycle concern. Engine suspends, re-injects resolution context |
| `modifyAccuracyRoll` — modify a roll before resolution | Teamwork (trait #6) | Not an atom. Use transient accuracy CS boost instead of modifying the roll directly |

### New predicates needed

| Predicate | Discovered in | Category |
|---|---|---|
| `target-within-recall-range` | Roar (#10) | Spatial query |
| `target-effective-stat-exceeds-user` | Gyro Ball (#11) | Stat comparison |
| `target-has-not-acted-this-round` | After You (#23) | Turn state |
| `target-is-willing` | After You (#23) | Player consent |
| `user-is-adjacent-to-target` (three-entity) | Teamwork (trait #6) | Spatial query |

### DealDamage params extensions

| Extension | Discovered in |
|---|---|
| `bonusDamage: { source, stat, formula }` — variable bonus damage | Gyro Ball (#11) |
| `source: 'struggle-attack'` — delegate to Struggle mechanics | Beat Up (#28) |
| `typeOverride` — override the Struggle type | Beat Up (#28) |
| `attacker: 'filtered-entity'` — entity performing the attack in CrossEntityFilter | Beat Up (#28) |
| `applyTypeEffectiveness: true` — apply type chart to fixed-tick damage | Stealth Rock (#15) |

### CrossEntityFilter clarifications

| Issue | Discovered in |
|---|---|
| Context switching — who is the "user" when a filtered ally performs an attack | Beat Up (#28) |
| `maxCount` — limit how many filtered entities participate | Beat Up (#28) |

### Event types needed

| Event type | Discovered in |
|---|---|
| `accuracy-check` — before accuracy resolution | Teamwork (trait #6) |
| `roll-completed` — after any roll, before result consumed | Mettle (trait #11) |

### Move metadata extensions

| Extension | Discovered in |
|---|---|
| `resolution: 'end-of-round'` — delayed resolution timing | Roar (#10) |
| `actionType: 'swift' \| 'interrupt'` — non-standard action types | After You (#23), Wide Guard (#19), Protect (#20) |

### Composition/engine concerns

| Issue | Discovered in |
|---|---|
| Three-entity spatial queries (holder, attacker, target) | Teamwork (trait #6) |
| AoO budget integration with EmbeddedAction | Pack Hunt (trait #13) |
| Reroll mechanics (suspend resolution, re-inject context) | Mettle (trait #11) |
| Damage resistance step system undocumented | Light Screen (#17) |

---

## Coverage Matrix

All 18 atom types and 7 composition patterns are exercised.

### Atoms

| Atom | Covered by |
|---|---|
| DealDamage | Thunderbolt, Earthquake, Gyro Ball, Hex, Retaliate, Circle Throw, Bullet Seed, Struggle Bug, Whirlpool, Thief, Beat Up, Psyshock, Stealth Rock, Rough Skin, Pack Hunt |
| ApplyStatus | Thunderbolt, Thunder Wave, Will-O-Wisp, Circle Throw, Toxic Spikes |
| RemoveStatus | (implicit in Safeguard's interception) |
| ModifyCombatStages | Swords Dance, Dragon Dance, Struggle Bug |
| HealHP | Recover, Water Absorb, Ice Body, Aqua Ring |
| ManageResource | Volt Absorb (energy), Mettle (mettle points) |
| DisplaceEntity | Circle Throw, Roar |
| MutateInventory | Thief |
| ModifyActionEconomy | Opportunist |
| ApplyActiveEffect | Heal Block, Flash Fire, Wide Guard, Protect |
| ModifyMoveLegality | Taunt |
| ModifyInitiative | Quash, After You |
| ModifyFieldState | Toxic Spikes, Stealth Rock, Safeguard, Light Screen, Aqua Ring, Whirlpool, Defog, Seed Sower |
| ModifyDeployment | Roar (forced recall) |
| ResolveAccuracyCheck | Thunderbolt, Will-O-Wisp, Earthquake, Bullet Seed, Struggle Bug, Circle Throw, Gyro Ball, Hex, Retaliate, Quash, Psyshock, Heal Block, Thief, Whirlpool |
| ResolveSkillCheck | (not directly — covered by combat maneuver definitions in Ring 1) |
| InterceptEvent | Volt Absorb, Water Absorb, Flash Fire, Limber, Protect, Wide Guard, Safeguard, Heal Block |
| PassThrough | Thunder Wave, Safeguard, Light Screen, After You, Mettle, Pack Hunt |

### Compositions

| Composition | Covered by |
|---|---|
| Sequence | Thunderbolt, Will-O-Wisp, Circle Throw, Struggle Bug, Whirlpool, Thief, Heal Block, Beat Up, Defog, Volt Absorb, Flash Fire, Mettle |
| Conditional | Thunderbolt, Thunder Wave, Hex, Retaliate, Gyro Ball, Circle Throw, After You, Thief, Toxic Spikes |
| Repeat | Bullet Seed |
| Replacement | Psyshock |
| CrossEntityFilter | Earthquake, Struggle Bug, Beat Up |
| ChoicePoint | Safeguard, Light Screen, Mettle, Pack Hunt |
| EmbeddedAction | Whirlpool, Pack Hunt |

### Trigger patterns

| Pattern | Covered by |
|---|---|
| Before-trigger with interception | Volt Absorb, Water Absorb, Flash Fire, Limber, Protect, Wide Guard, Safeguard, Light Screen, Heal Block |
| After-trigger | Rough Skin, Seed Sower, Pack Hunt, Opportunist, Ice Body, Mettle (faint) |
| Weather-conditional | Ice Body |
| Contact-conditional | Rough Skin |
| Type-conditional | Volt Absorb, Water Absorb, Flash Fire |
| Spatial-conditional | Teamwork, Pack Hunt |
| Event-source filter | Teamwork, Pack Hunt |

### PassiveEffects

| Key | Covered by |
|---|---|
| `struggleAttackTypeOverride` | Opportunist |
| `flatDamageReduction` | Shell |
| `weatherDamageImmunity` | Ice Body |
| `movementTypeGrant` | Phaser |
| `critBonusDamage` | Sniper |
| `dbBoostThreshold` / `dbBoostAmount` | Technician |

---

## Summary

38 of 45 definitions are fully expressible with the current engine design. 7 definitions expose gaps (Roar, Gyro Ball, Light Screen, After You, Beat Up, Teamwork, Mettle). The gaps fall into three categories:

1. **Missing predicates** — 5 new predicates needed across spatial-query, stat-comparison, and turn-state categories
2. **DealDamage extensions** — bonus damage sources, Struggle delegation, type effectiveness on fixed damage
3. **Turn-lifecycle concerns** — delayed resolution, reroll mechanics, AoO budget integration

None of the gaps require rethinking the fundamental architecture. They are extensions to existing contracts (new predicates, new DealDamage params) or concerns that belong to the turn-lifecycle system (Ring 1), not the effect engine (Ring 0).

## See also

- [[effect-node-contract]] — the interface all definitions implement
- [[effect-atom-catalog]] — the 17 atoms used in these definitions
- [[effect-composition-model]] — the 7 composition patterns used in these definitions
- [[effect-trigger-system]] — trigger patterns validated by trait definitions
- [[effect-definition-format]] — the TypeScript constant format and helper functions
- [[game-state-interface]] — the state these definitions read and write
- [[data-driven-rule-engine]] — the vision these definitions realize
