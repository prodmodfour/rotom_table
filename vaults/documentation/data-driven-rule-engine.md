# Data-Driven Rule Engine

A destructive restructuring to replace all hardcoded game logic with a declarative rule engine where game rules are data, not code — addressing the [[hardcoded-game-rule-proliferation|proliferation of hardcoded game rules]] and the [[status-condition-ripple-effect|shotgun surgery caused by scattered rule definitions]].

## The idea

The app's game rules are expressed as imperative TypeScript: switch statements, if-chains, hardcoded formulas, and scattered constants. Adding a new status condition touches 20+ files. Adding a new move effect requires modifying 871-line composables. Adding a new weather interaction means editing utils, services, and components. The rules are welded to the code that evaluates them.

Define all game rules as structured data in a declarative schema. A generic rule evaluator processes rule definitions at runtime. Adding new game mechanics requires adding rule data — not code.

```typescript
// Status conditions as data, not scattered code
const BURNED: StatusConditionDef = {
  id: 'burned',
  display: { label: 'Burned', icon: 'flame', color: '#e74c3c' },
  tickDamage: { formula: 'max(1, floor(maxHp / 10))', timing: 'end-of-turn' },
  statModifiers: [{ stat: 'atk', stages: -2, scope: 'physical-only' }],
  blocksActions: [],
  blocksAoO: false,
  immunities: [{ type: 'fire' }],
  cureConditions: ['frozen'],  // Burned cures Frozen
  captureModifier: 0,
  csAutoEffects: [{ threshold: -6, apply: 'fainted' }],
  stackable: false,
  persistent: true,
}

// Move effects as data, not procedural code
const FLAMETHROWER: MoveEffectDef = {
  id: 'flamethrower',
  baseDamage: { formula: '2d10+10+spatk', damageBase: 8 },
  accuracy: { formula: '2+accuracy-evasion', stat: 'spatk' },
  type: 'fire',
  category: 'special',
  range: { type: 'ranged', min: 1, max: 6 },
  frequency: { uses: null, recharge: null },
  effects: [
    { trigger: 'on-hit', chance: 0.1, apply: { type: 'status', condition: 'burned' } },
  ],
  weatherInteractions: [
    { weather: 'sunny', modifier: { type: 'damage-multiplier', value: 1.5 } },
    { weather: 'rain', modifier: { type: 'damage-multiplier', value: 0.5 } },
  ],
}

// Weather as data, not scattered across files
const SUNNY: WeatherDef = {
  id: 'sunny',
  display: { label: 'Sunny', icon: 'sun', color: '#f1c40f' },
  typeModifiers: [
    { type: 'fire', effect: 'boost', multiplier: 1.5 },
    { type: 'water', effect: 'nerf', multiplier: 0.5 },
  ],
  tickEffects: [],
  abilityInteractions: [
    { ability: 'chlorophyll', effect: { type: 'speed-multiplier', value: 2 } },
    { ability: 'solar-power', effect: { type: 'spatk-multiplier', value: 1.5 } },
  ],
  moveInteractions: [
    { move: 'solar-beam', effect: { type: 'skip-charge' } },
  ],
}

// The generic rule evaluator processes any rule definition
class RuleEngine {
  evaluate(context: CombatContext, rules: RuleDef[]): RuleResult[] {
    return rules
      .filter(rule => rule.condition(context))
      .sort((a, b) => a.priority - b.priority)
      .reduce((results, rule) => [...results, ...rule.apply(context)], [])
  }
}
```

The PTR vault defines the rules. The rule definitions are a 1:1 translation of those rules into structured data. The rule engine evaluates them. The app never hardcodes a specific rule — it only knows how to _process_ rules.

## Why this is destructive

- **All 38 utils are dissolved.** `damageCalculation.ts`, `captureRate.ts`, `weatherRules.ts`, `typeEffectiveness.ts`, `mountingRules.ts`, `flankingGeometry.ts` — all replaced by rule definitions and a generic evaluator.
- **`useMoveCalculation.ts` (871 lines) is deleted.** Move execution becomes: look up the move's rule definition, feed it to the evaluator. No more per-move procedural logic.
- **`combatant.service.ts` (791 lines) is gutted.** Damage calculation, status application, stage modification — all become rule evaluations, not hardcoded functions.
- **`next-turn.post.ts` (846 lines) is simplified radically.** End-of-turn processing becomes: evaluate all `end-of-turn` rules for all combatants. No more hardcoded tick damage, weather processing, status expiration sequences.
- **`statusConditions.ts`, `pokeBalls.ts`, `trainerClasses.ts`, `equipment.ts`** — all constant files are replaced by comprehensive rule definitions that bundle data AND behavior in a single location.
- **The 100+ consuming sites for status conditions ([[status-condition-ripple-effect]]) collapse to zero.** A new condition means one new rule definition. Nothing else changes.

## Principles improved

- [[open-closed-principle]] — the system is fully open for extension (new rules) and fully closed for modification (the evaluator never changes). This is the purest possible OCP adherence.
- [[single-responsibility-principle]] — each rule definition has one responsibility: describe one game mechanic. The evaluator has one responsibility: process rule definitions.
- [[dependency-inversion-principle]] — the app depends on the rule engine abstraction, not on concrete game mechanics. The rule definitions depend on the rule schema abstraction, not on the app.
- Eliminates [[shotgun-surgery-smell]] — a rule change is one file, one definition, one location.
- Eliminates [[divergent-change-smell]] — no file changes for multiple unrelated game mechanics.
- Eliminates [[hardcoded-game-rule-proliferation]] — rules are data, not code.
- Aligns PTR and Documentation vaults — rule definitions map 1:1 to PTR vault rules, making convergence verification mechanical.

## Patterns and techniques

- [[strategy-pattern]] — each rule definition is a strategy for handling its mechanic
- [[chain-of-responsibility-pattern]] — the damage pipeline, capture pipeline, and turn-end pipeline become chains of rule evaluations
- [[visitor-pattern]] — the rule engine visits entities and applies matching rules
- [[template-method-pattern]] — rule evaluation follows a fixed template (filter → sort → apply → collect results)
- [[command-pattern]] — rule application results are command objects that describe state changes
- Interpreter pattern — the rule engine interprets a domain-specific language (the rule schema)
- Data-oriented design — rules are data structures processed by generic algorithms

## Trade-offs

- **Schema design is the hard part.** The rule schema must be expressive enough to describe every PTR rule — including edge cases, exceptions, conditional interactions, and multi-step sequences. If the schema can't express a rule, the escape hatch is procedural code, which defeats the purpose.
- **Debugging complexity.** When damage is wrong, instead of stepping through a TypeScript function, you must trace which rules were evaluated, in what order, with what context, producing what results. The indirection from "rule fires" to "state changes" is harder to follow than procedural code.
- **Performance overhead.** Every game action evaluates rules by iterating definitions, checking conditions, and applying effects. This is slower than hardcoded functions that execute directly. For a real-time game this would be disqualifying; for a turn-based tabletop app, it's likely acceptable.
- **Type safety erosion.** Rule definitions are data, and data is harder to type than code. The formula strings (`'max(1, floor(maxHp / 10))'`) are opaque to TypeScript — errors in formulas become runtime errors, not compile-time errors.
- **DSL maintenance burden.** The rule schema is effectively a domain-specific language. It needs documentation, validation, and possibly tooling (a rule editor, a rule validator, a rule tester). This is a second codebase.
- **Overgeneralization risk.** Not every game mechanic fits neatly into a declarative schema. Move sequences, multi-turn effects, conditional branching based on user choice — these push against declarative expression and may require an embedded scripting layer.

## Open questions

- What is the rule schema format? TypeScript objects (statically typed but compiled)? JSON (dynamic but editable)? A custom DSL (expressive but requires a parser)?
- How are formulas expressed? String formulas with a parser (`'2d10+10+spatk'`)? TypeScript functions (type-safe but not data)? A formula AST?
- How does the rule engine handle rule interactions — two rules that modify the same value? Priority ordering? Multiplicative vs. additive stacking?
- How does this interact with [[game-engine-extraction]]? The engine would be the rule evaluator; the rule definitions would be the engine's input data.
- How does this interact with the PTR vault? Can rule definitions be generated from the PTR vault's structured notes, or are they maintained separately?
- Should the rule engine support "what-if" evaluation for previews (damage preview, capture probability) without side effects?
- How are rule definitions tested? Property-based tests against the PTR rulebook assertions? Snapshot tests of rule evaluation outputs?

## See also

- [[hardcoded-game-rule-proliferation]] — the problem this addresses
- [[status-condition-ripple-effect]] — eliminated entirely
- [[game-logic-boundary-absence]] — the boundary becomes clear: rule definitions are the boundary
- [[game-engine-extraction]] — compatible: the engine evaluates rules; this proposal defines how rules are expressed
- [[status-condition-registry]] — the incremental approach that this supersedes
- [[trigger-validation-strategy-registry]] — the incremental approach that this supersedes
- [[damage-pipeline-as-chain-of-responsibility]] — formalized as a rule evaluation chain
- [[switching-validation-pipeline]] — formalized as a rule evaluation chain
- [[vault-sourced-data-repository]] — compatible: vault-compiled data feeds the rule engine
- [[property-based-rule-verification]] — compatible: property tests verify rule engine outputs for all inputs
- [[game-state-interface]] — the shared abstraction the rule engine evaluates against
- [[state-delta-model]] — rule evaluation produces deltas; the engine applies them
- [[resolution-context-inputs]] — external inputs injected into rule evaluation
- [[effect-handler-contract]] — the handler contract that realizes this note's vision with typed functions
- [[effect-utility-catalog]] — the utility functions that replace hardcoded game logic
- [[effect-trigger-event-bus]] — event-driven triggers replace scattered listener code
- [[effect-handler-format]] — TypeScript handler functions replace scattered rule implementations
