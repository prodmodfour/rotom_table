# Type-Status Immunity Utility

Type-based status immunities in `utils/typeStatusImmunity.ts`, shared between server and client. Per decree-012, PTR p.239.

**Exports:**

- `TYPE_STATUS_IMMUNITIES` — map from Pokemon type to the set of status conditions that type is immune to.
- `isImmuneToStatus(types, status)` — checks whether a combatant's types grant immunity to a given status.
- `getImmuneType(types, status)` — returns which type provides the immunity, if any.
- `findImmuneStatuses(types)` — returns all statuses a combatant is immune to based on its types.

## See also

- [[weather-rules-utility]]
