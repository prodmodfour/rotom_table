# Hardcoded Game Rule Proliferation

Game rules in the app are expressed as imperative TypeScript code scattered across 38 utils, 23 services, and 64 composables. Every formula, every status condition effect, every move interaction, every weather modifier, every ability trigger, and every equipment bonus is a hardcoded function or switch branch. The rules are indistinguishable from the infrastructure that applies them.

This goes deeper than the [[game-logic-boundary-absence]] (which concerns _where_ rules live). The problem is _how_ rules are expressed. Examples:

- **Status conditions**: The `StatusCondition` string union defines what conditions exist. But each condition's properties — tick damage, AoO blocking, CS effects, immunities, display styling — are scattered across ~100 consuming sites in 20+ files ([[status-condition-ripple-effect]]). Adding "Drowsy" would require editing the union, `AOO_BLOCKING_CONDITIONS`, status automation tick logic, CS mappings, the condition display component, and capture bonus calculations.
- **Move effects**: Each move is a row in `moves.csv` with static data (name, type, frequency, damage base). But the _execution logic_ — how Struggle works differently, how multi-hit moves iterate, how recoil is applied, how secondary effects proc — is procedural code in `useMoveCalculation.ts` (871 lines) and `move.post.ts` (376 lines).
- **Weather effects**: `weatherRules.ts` encodes which types are boosted/nerfed by which weather, but the actual application of weather during damage calculation, end-of-turn ticks, and ability-weather interactions are spread across `damageCalculation.ts`, `next-turn.post.ts`, and multiple composables.
- **Equipment bonuses**: Equipment properties are defined in `constants/equipment.ts`, but the logic that applies equipment bonuses during combat is in `combatant.service.ts` and `damageCalculation.ts`.

The pattern repeats: _data_ about a game concept lives in one place, but the _behavior_ derived from that data is hardcoded across many places. There is no way to ask the system "what does the Burned status condition do?" and get a complete answer from a single location.

This violates the [[open-closed-principle]] — the codebase is never closed for modification when a new game mechanic is introduced. It also violates the [[single-responsibility-principle]] — `useMoveCalculation.ts` handles every move's unique behavior in a single file that changes for every move-related rule change.

The PTR vault will continue to evolve as the tabletop system is refined. Every rule change in PTR requires a developer to find and modify the corresponding imperative code, often across multiple files. The distance between "here's the rule" and "here's where the rule is implemented" will only grow.

## See also

- [[game-logic-boundary-absence]] — the boundary problem (where rules live), complementary to this (how rules are expressed)
- [[status-condition-ripple-effect]] — the most acute symptom
- [[open-closed-principle]] — violated by every new game mechanic
- [[shotgun-surgery-smell]] — adding a mechanic scatters changes
- [[strategy-pattern]] — rules as strategies rather than switch branches
- [[status-condition-registry]] — an incremental mitigation for one domain
- [[trigger-validation-strategy-registry]] — an incremental mitigation for another domain
- [[data-driven-rule-engine]] — a destructive proposal to replace code-as-rules with data-as-rules
- [[plugin-mechanic-architecture]] — a destructive proposal to encapsulate each mechanic's rules within its own plugin
- [[saga-orchestrated-turn-lifecycle]] — a destructive proposal to isolate rules into independent step handlers
