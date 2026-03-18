# Trigger Validation Switch Chains

Several modules use switch statements or if-chains that must be modified to add new variants, violating the [[open-closed-principle]]:

- **`out-of-turn.service.ts`** — `validateTriggerPreconditions` switches on `triggerType` with 5 explicit cases plus a `default: return false`. Adding a new AoO trigger type requires modifying the switch.
- **`evolution.service.ts`** — Uses a sequential if-chain for evolution trigger properties (`minimumLevel`, `requiredItem`, `requiredGender`, `requiredMove`). Adding a new trigger type (e.g., `requiredLocation`) means adding another if-block.
- **`useRangeParser.ts`** — `getAffectedCells` switches on range type for AoE shape calculation (burst, cone, close-blast, line, melee). A new AoE shape requires a new case.

In each case, a strategy or registry pattern — mapping type to handler function — would allow extension without modification. This is the same structural issue described by the [[switch-statements-smell]].

## See also

- [[strategy-pattern]] — the pattern that would replace these switches
- [[replace-conditional-with-polymorphism]] — the refactoring technique
- [[out-of-turn-service-bundled-actions]] — broader SRP context for the out-of-turn service
- [[trigger-validation-strategy-registry]] — a potential registry to replace these switch chains
