# Property-Based Rule Verification

A destructive restructuring to burn the example-based test suite and replace it with property-based verification — where tests do not say "if input is X, output is Y" but "for ALL inputs satisfying P, output satisfies Q" — transforming the test suite from a collection of spot checks into a proof system for game rule correctness.

## The idea

The current test suite uses example-based tests: feed specific inputs, assert specific outputs. `expect(calculateDamage(10, 5)).toBe(15)`. These tests verify that one particular case works. They say nothing about the infinite other cases. A damage calculation that is correct for 10 inputs and wrong for the 11th will pass all 10 tests.

For a game rules implementation where correctness against a rulebook is the primary goal, example-based testing is structurally inadequate. The PTR vault defines rules as universal properties: "damage is always at least 1," "capture rate is always between 0 and 100," "a Pokemon's stat can never be negative," "STAB applies when the move type matches one of the user's types," "type effectiveness multiplies, never adds." These are properties that must hold for ALL possible inputs, not just the ones a developer thought to test.

Replace the test suite with property-based tests that generate thousands of random inputs and verify that properties hold universally. When a property fails, the framework automatically shrinks the input to the minimal failing case.

```typescript
import { fc } from 'fast-check'

// === PROPERTY: damage is always at least 1 ===
// PTR rule: "The minimum amount of damage dealt is always 1."
// An example test checks one case. A property test checks ALL cases.

test('damage is always at least 1', () => {
  fc.assert(
    fc.property(
      arbitraryAttacker(),    // random Pokemon with valid stats
      arbitraryDefender(),    // random Pokemon with valid stats
      arbitraryMove(),        // random move with valid DB/type
      arbitraryWeather(),     // random weather condition
      (attacker, defender, move, weather) => {
        const result = calculateDamage(attacker, defender, move, { weather })
        // PROPERTY: damage is never less than 1
        expect(result.totalDamage).toBeGreaterThanOrEqual(1)
      }
    )
  )
})

// === PROPERTY: type effectiveness is multiplicative ===
// PTR rule: dual-type effectiveness multiplies individual effectiveness

test('dual-type effectiveness multiplies', () => {
  fc.assert(
    fc.property(
      arbitraryPokemonType(),  // random attacking type
      arbitraryPokemonType(),  // random defense type 1
      arbitraryPokemonType(),  // random defense type 2
      (attackType, defType1, defType2) => {
        const effectVsType1 = getTypeEffectiveness(attackType, [defType1])
        const effectVsType2 = getTypeEffectiveness(attackType, [defType2])
        const effectVsDual = getTypeEffectiveness(attackType, [defType1, defType2])
        // PROPERTY: dual effectiveness = product of individual
        expect(effectVsDual).toBeCloseTo(effectVsType1 * effectVsType2)
      }
    )
  )
})

// === PROPERTY: capture rate is bounded ===
// PTR rule: capture rate is a d100 check (0–100 range)

test('capture rate is always between 0 and 100', () => {
  fc.assert(
    fc.property(
      arbitraryTargetPokemon(),
      arbitraryBallType(),
      arbitraryTrainerLevel(),
      arbitraryCaptureModifiers(),
      (target, ball, level, modifiers) => {
        const rate = calculateCaptureRate(target, ball, level, modifiers)
        expect(rate).toBeGreaterThanOrEqual(0)
        expect(rate).toBeLessThanOrEqual(100)
      }
    )
  )
})

// === PROPERTY: healing never exceeds max HP ===

test('healing never exceeds max HP', () => {
  fc.assert(
    fc.property(
      arbitraryCombatant(),
      fc.integer({ min: 1, max: 1000 }),
      (combatant, healAmount) => {
        const result = applyHealing(combatant, healAmount)
        expect(result.hp).toBeLessThanOrEqual(result.maxHp)
      }
    )
  )
})

// === PROPERTY: stat stages are bounded ===
// PTR rule: combat stages are capped at +6 / -6

test('stat stages never exceed bounds', () => {
  fc.assert(
    fc.property(
      arbitraryCombatant(),
      fc.array(arbitraryStageChange(), { minLength: 1, maxLength: 20 }),
      (combatant, stageChanges) => {
        let current = combatant
        for (const change of stageChanges) {
          current = applyStageChange(current, change)
        }
        // PROPERTY: after any sequence of stage changes, stages are in [-6, 6]
        for (const [stat, value] of Object.entries(current.combatStages)) {
          expect(value).toBeGreaterThanOrEqual(-6)
          expect(value).toBeLessThanOrEqual(6)
        }
      }
    )
  )
})

// === ARBITRARY GENERATORS ===
// Domain-aware generators that produce valid game entities.
// These encode the domain constraints: stats are positive, levels are 1-100,
// moves have valid types, etc.

function arbitraryPokemon(): fc.Arbitrary<Pokemon> {
  return fc.record({
    id: fc.uuid(),
    species: fc.constantFrom('Pikachu', 'Charizard', 'Bulbasaur', /* ... */),
    level: fc.integer({ min: 1, max: 100 }),
    nature: fc.constantFrom(...ALL_NATURES),
    stats: arbitraryStatBlock(),
    moves: fc.array(arbitraryMove(), { minLength: 1, maxLength: 6 }),
    abilities: fc.array(arbitraryAbility(), { minLength: 1, maxLength: 3 }),
    types: fc.array(arbitraryPokemonType(), { minLength: 1, maxLength: 2 }),
  })
}

function arbitraryStatBlock(): fc.Arbitrary<StatBlock> {
  return fc.record({
    hp: fc.integer({ min: 1, max: 200 }),
    attack: fc.integer({ min: 1, max: 200 }),
    defense: fc.integer({ min: 1, max: 200 }),
    specialAttack: fc.integer({ min: 1, max: 200 }),
    specialDefense: fc.integer({ min: 1, max: 200 }),
    speed: fc.integer({ min: 1, max: 200 }),
  })
}

// === METAMORPHIC TESTING ===
// Test relationships between inputs and outputs without knowing exact values.

test('higher defense reduces damage (metamorphic)', () => {
  fc.assert(
    fc.property(
      arbitraryAttacker(),
      arbitraryDefender(),
      arbitraryMove({ class: 'Physical' }),
      fc.integer({ min: 1, max: 50 }),
      (attacker, defender, move, defenseBump) => {
        const result1 = calculateDamage(attacker, defender, move)
        const tougherDefender = {
          ...defender,
          stats: { ...defender.stats, defense: defender.stats.defense + defenseBump }
        }
        const result2 = calculateDamage(attacker, tougherDefender, move)
        // PROPERTY: more defense → less or equal damage
        expect(result2.totalDamage).toBeLessThanOrEqual(result1.totalDamage)
      }
    )
  )
})

test('STAB always increases damage (metamorphic)', () => {
  fc.assert(
    fc.property(
      arbitraryAttacker(),
      arbitraryDefender(),
      (attacker, defender) => {
        // Move type matches attacker's type (STAB applies)
        const stabMove = { ...randomMove(), type: attacker.types[0] }
        // Move type doesn't match (no STAB)
        const nonStabType = ALL_TYPES.find(t => !attacker.types.includes(t))!
        const nonStabMove = { ...stabMove, type: nonStabType }

        const stabDamage = calculateDamage(attacker, defender, stabMove)
        const nonStabDamage = calculateDamage(attacker, defender, nonStabMove)
        // PROPERTY: STAB damage ≥ non-STAB damage
        expect(stabDamage.totalDamage).toBeGreaterThanOrEqual(nonStabDamage.totalDamage)
      }
    )
  )
})
```

## Why this is destructive

- **The existing unit test suite is rewritten.** Every test file under `app/tests/unit/` that tests game logic (damage, capture, healing, XP, stat calculation, type effectiveness, equipment bonuses) is replaced by property-based tests. Example-based tests remain only for non-game-logic concerns (UI behavior, API integration, WebSocket protocol).
- **Test infrastructure changes.** The project gains `fast-check` (or similar) as a dependency. Custom arbitrary generators must be written for every domain type — Pokemon, Move, Ability, Combatant, Equipment, etc. This is a significant up-front investment (~500–1000 lines of generator code).
- **Test execution time increases.** A property test runs 100–1000 iterations by default. A test suite with 50 properties runs 5,000–50,000 iterations. This is slower than 50 example-based tests but finds orders of magnitude more bugs.
- **Test failures become proofs.** When a property test fails, it means the property doesn't hold — a genuine rule violation, not just a wrong expected value. The shrunk minimal example pinpoints exactly which edge case breaks the rule.
- **The relationship between tests and the PTR vault becomes explicit.** Each property maps to a PTR rule. The test file can reference the vault note (`// Property: ptr:always-round-down`). If the vault rule changes, the corresponding property changes. If no test references a rule, the rule has no automated verification.
- **Arbitrary generators encode domain invariants.** The generators themselves are a form of documentation — they define what constitutes a valid Pokemon, a valid Move, a valid combat state. If a generator produces invalid input, the property test fails — revealing invariant violations in the test infrastructure itself.

## Principles improved

- [[single-responsibility-principle]] — each property test verifies one universal rule. Example tests often bundle multiple assertions about a specific scenario, conflating concerns.
- [[open-closed-principle]] — adding a new game rule means adding a new property. Existing properties don't change. Example tests often need modification when related logic changes.
- [[liskov-substitution-principle]] — properties verify that the system behaves correctly for ALL valid inputs, not just specific ones. This is a stronger guarantee of behavioral substitutability.
- Eliminates coverage gaps — example tests leave infinite untested cases. Properties cover the entire input space probabilistically.
- Eliminates [[speculative-generality-smell]] in tests — example tests often speculate about "important" edge cases. Properties don't speculate; they explore the input space systematically.
- Advances the vault convergence goal — properties are the formal bridge between PTR vault rules and app behavior. A property that passes means the app satisfies the vault rule for all tested inputs.

## Patterns and techniques

- [[strategy-pattern]] — arbitrary generators are strategies for producing domain-valid inputs
- [[builder-pattern]] — arbitrary generators compose via builder-like APIs (`fc.record`, `fc.array`, `fc.constantFrom`)
- [[template-method-pattern]] — property tests follow a template: generate inputs → execute function → assert property
- [[composite-pattern]] — complex generators compose from simpler generators (a Pokemon generator composes stat, move, and ability generators)
- Property-based testing (QuickCheck family) — the core technique
- Metamorphic testing — testing relationships between outputs without knowing exact values
- Shrinking — automatic minimal counterexample generation

## Trade-offs

- **Generator maintenance cost.** Arbitrary generators must stay in sync with domain types. When a new field is added to Pokemon, the generator must be updated. If it isn't, tests pass but the generated Pokemon are incomplete.
- **Property discovery difficulty.** Writing good properties requires deep understanding of the game rules. "Damage is at least 1" is obvious. "The probability distribution of capture rates follows X" is not. Some rules may not have obvious property formulations.
- **Flaky test risk.** Random generation can occasionally produce inputs that trigger non-deterministic behavior (e.g., floating-point edge cases). Seeds must be recorded for reproducibility.
- **Loss of documentation value.** Example tests serve as documentation: "here's how to use this function with these inputs." Properties are more abstract: "here's a universal truth about this function." New developers may find properties harder to understand.
- **Debugging difficulty.** When a property fails, the shrunk example may be unfamiliar — a Pokemon with 1 HP, 0 Attack, and a status move that happens to trigger an edge case. Understanding WHY the edge case fails requires more domain knowledge than understanding why a hand-picked example fails.
- **Not all logic is property-testable.** UI rendering, WebSocket protocol, database queries, and API routing don't have obvious universal properties. The test suite will be hybrid: property-based for game logic, example-based for integration concerns.
- **Execution time.** 50 properties × 1000 iterations = 50,000 test executions. This is manageable for pure functions but slow if any test touches the network or database.

## Open questions

- Which testing library? `fast-check` is the most mature TypeScript property testing library. Alternatives include `jsverify` and `testcheck-js`. Should the project standardize on one?
- How many iterations per property? Default 100 is fast but may miss rare edge cases. 1000+ is thorough but slow. Should this be configurable per property based on the function's complexity?
- Should arbitrary generators be co-located with domain types (in the types directory) or with tests (in a test utilities directory)?
- How does this interact with [[game-engine-extraction]]? If the engine is extracted, property tests target engine functions — pure, stateless, and trivially testable. The engine's test suite becomes a proof system for rule correctness.
- How does this interact with [[vault-sourced-data-repository]]? If game data comes from the vault, arbitrary generators could use vault data to generate realistic inputs (real move data, real species stats) instead of synthetic values.
- Should the test suite include a "coverage map" that tracks which PTR vault rules have corresponding property tests? This would reveal untested rules — properties that should exist but don't.
- Can properties be derived semi-automatically from structured vault notes? If a vault note says "range: 0–100," can a tool generate the corresponding property test?

## See also

- [[single-responsibility-principle]] — each property verifies one rule
- [[open-closed-principle]] — new rules mean new properties, not modified tests
- [[game-engine-extraction]] — compatible: property tests target engine functions
- [[vault-sourced-data-repository]] — compatible: generators can use vault data
- [[data-driven-rule-engine]] — compatible: properties verify rule engine outputs
- [[universal-event-journal]] — compatible: event reducers can be property-tested (for any sequence of valid events, the resulting state satisfies invariants)
