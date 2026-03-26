# Effect Definition Format

How move and trait effects are expressed as TypeScript constants in `@rotom/engine`. Definitions are data — structured objects that the engine evaluates. They are not procedural code. This is the realization of [[data-driven-rule-engine]]: game rules are data, not code. Part of the [[game-state-interface]].

## Why TypeScript constants

Per the consolidated ring plan: definitions stored as TypeScript constants are type-safe, version-controlled, testable, and reviewable in PR diffs. Alternatives considered and rejected:

- **JSON** — no type checking, no IDE support, runtime validation only. Violates the design's compile-time safety emphasis.
- **Database rows** — adds persistence dependency to the engine, violating [[dependency-inversion-principle]]. The engine should have zero framework dependencies.
- **Custom DSL** — language design problem (parser, interpreter, debugging tools). The consolidated ring plan explicitly chose composable data modeling over DSL.

TypeScript constants give compile-time type safety with zero runtime overhead. The `@rotom/engine` package owns all definitions.

## Move definition

```typescript
const THUNDERBOLT: MoveDefinition = {
  id: 'thunderbolt',
  name: 'Thunderbolt',
  type: 'electric',
  damageClass: 'special',
  damageBase: 8,
  accuracy: 2,
  range: { type: 'ranged', min: 1, max: 6 },
  energyCost: 4,

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

The `effect` field is an [[effect-node-contract|EffectNode]] tree built from helper functions (`sequence`, `conditional`, `dealDamage`, `applyStatus`) that construct the composition/atom objects. The helpers are syntactic sugar — they return plain data objects, not classes.

## Trait definition

```typescript
const ROUGH_SKIN: TraitDefinition = {
  id: 'rough-skin',
  name: 'Rough Skin',
  category: 'innate',

  triggers: [
    {
      eventType: 'damage-received',
      timing: 'after',
      condition: { check: 'and', predicates: [
        { check: 'incoming-move-is-contact' },
        { check: 'not', inner: { check: 'user-has-active-effect', effectId: 'fainted' } },
      ]},
      scope: 'self',
      effect: dealDamage({ ticks: 1, target: 'event-source', type: 'typeless' }),
    },
  ],
}
```

Trait definitions carry [[effect-trigger-system|TriggerDefinition]] arrays instead of a root `effect` tree. The triggers subscribe to events; the engine dispatches.

## Worked examples

### Hex — conditional DB modifier

```typescript
const HEX: MoveDefinition = {
  id: 'hex',
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

The [[effect-composition-model|Conditional]] node checks target status; DB changes based on the branch.

### Sand Tomb — damage + embedded vortex

```typescript
const SAND_TOMB: MoveDefinition = {
  id: 'sand-tomb',
  type: 'ground', damageClass: 'physical', damageBase: 4,
  accuracy: 2, range: { type: 'melee', min: 1, max: 1 }, energyCost: 3,

  effect: sequence([
    resolveAccuracy({ ac: 2 }),
    dealDamage({ db: 4, type: 'ground', class: 'physical' }),
    embeddedAction(
      modifyFieldState({ field: 'vortex', op: 'add', appliesTrapped: true, appliesSlowed: true }),
      'swift'
    ),
  ]),
}
```

The [[effect-composition-model|EmbeddedAction]] wraps the vortex application as a swift action within the Standard Action move.

### Safeguard — blessing with choice point

```typescript
const SAFEGUARD: MoveDefinition = {
  id: 'safeguard',
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
              removeStatus({ incoming: true }),
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

The blessing's activation effect is itself a trigger definition with a [[effect-composition-model|ChoicePoint]] — the player decides whether to spend an activation.

### Volt Absorb — type-absorb trait

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

A before-trigger that intercepts Electric damage, negates it, and restores energy. The `interceptEvent()` atom sets the interception flag per [[effect-trigger-system]].

### Opportunist — action economy modifier

```typescript
const OPPORTUNIST: TraitDefinition = {
  id: 'opportunist',
  name: 'Opportunist',
  category: 'learned',
  scalingParam: 'x', // X = 1 for learned

  triggers: [
    {
      eventType: 'turn-start',
      timing: 'after',
      condition: null,
      scope: 'self',
      effect: modifyActionEconomy({
        outOfTurnChanges: { aooRemaining: { add: 'x' } }, // X additional AoO
      }),
    },
  ],

  passiveEffects: {
    struggleAttackTypeOverride: 'dark', // Struggle Attacks are Dark-type
  },
}
```

Opportunist combines a trigger (grant AoO at turn start) with a passive effect (type override on Struggle). Passive effects are static modifiers — see PassiveEffectSpec below.

## Passive effect specification

Passive effects are a third category alongside triggered effects and atom-produced effects. They are static modifiers always active while the trait is present — they don't fire on events and don't produce deltas through the atom system.

```typescript
PassiveEffectSpec = {
  struggleAttackTypeOverride?: PokemonType   // Opportunist: Struggle is Dark-type
  moveTypeOverride?: { moveId: string, type: PokemonType }  // Hidden Power typing
  statMultiplier?: { stat: StatKey, multiplier: number }     // Huge Power: 2× Atk
  immunityGrant?: { type: PokemonType }      // Levitate: Ground immunity
  weatherImmunity?: boolean                   // Overcoat: immune to weather damage
  contactDamageImmunity?: boolean             // Long Reach: moves don't make contact
}
```

**Evaluation.** The engine reads `passiveEffects` at specific computation points: the damage pipeline reads type overrides and stat multipliers; the type effectiveness step reads immunity grants; the weather tick step reads weather immunity. Each read point is documented in the relevant pipeline step.

**Conflict resolution.** If two traits declare the same passive key (e.g., two `statMultiplier` entries for the same stat), the engine applies them multiplicatively for multipliers and last-writer-wins for overrides. Specific stacking rules are documented per key.

**Typing.** Passive effect keys are typed — not `Record<string, unknown>`. Each key has a defined type and a defined read point. The set of keys grows as new traits introduce novel static modifiers, but each addition is one key, one type, and one read point.

## Helper functions

The helper functions (`sequence`, `conditional`, `dealDamage`, etc.) are factory functions that return typed data objects:

```typescript
function sequence(children: EffectNode[]): SequenceNode {
  return { type: 'sequence', children, haltOnFailure: true }
}

function conditional(pred: ConditionPredicate, then: EffectNode, else_?: EffectNode): ConditionalNode {
  return { type: 'conditional', predicate: pred, then, else: else_ ?? null }
}

function dealDamage(params: DealDamageParams): DealDamageAtom {
  return { type: 'deal-damage', params }
}
```

These are [[factory-method-pattern|factory methods]] — they construct typed objects without exposing construction details. The returned objects are plain data, serializable, inspectable, and testable.

## SE principles applied

- [[data-driven-rule-engine]] — definitions are data evaluated by a generic engine; game rules are not hardcoded
- [[factory-method-pattern]] — helper functions construct typed definition objects
- [[single-responsibility-principle]] — each definition describes one move or trait. New moves/traits are single-responsibility additions.
- [[dependency-inversion-principle]] — the engine depends on the definition schema (abstraction), not on specific moves/traits
- [[composite-pattern]] — definition trees are composed from atoms and compositions using the shared [[effect-node-contract|EffectNode]] interface
- [[separation-of-concerns]] — definition (what the effect does), evaluation (how the engine runs it), and application (how deltas are applied) are three separate concerns

## See also

- [[effect-node-contract]] — the interface that definition trees implement
- [[effect-atom-catalog]] — the atoms used in definitions
- [[effect-composition-model]] — the compositions used in definitions
- [[effect-trigger-system]] — trait definitions declare triggers
- [[active-effect-model]] — some definitions produce ActiveEffects with embedded trigger definitions
- [[data-driven-rule-engine]] — the vision this format realizes
- [[game-engine-extraction]] — definitions live in `@rotom/engine`, the standalone game logic package
- [[r0a-sample-effect-definitions]] — the 45 validation definitions that prove this format works
