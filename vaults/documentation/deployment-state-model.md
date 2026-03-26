# Deployment State Model

Per-trainer tracking of which Pokemon are active, in reserve, or fainted. Lives on encounter state, not on the lens — reserve and fainted Pokemon don't have lenses (they're not in combat). Part of the [[game-state-interface]].

## The struct

```
DeploymentState {
  trainerId: string
  active: EntityId[]
  reserve: EntityId[]
  fainted: EntityId[]
}
```

Every trainer in the encounter has a `DeploymentState`. The arrays are mutually exclusive — a Pokemon appears in exactly one.

## Why this is needed

Switching, forced recall, and faint replacement all require knowing the trainer's full roster state:

- **Switching** is a Standard Action. The action presentation UI must know: "does this trainer have reserve Pokemon available?" If not, the switch action is unavailable.
- **Roar** forces recall. The target shifts away and, if within range of their Poke Ball, is immediately recalled. The encounter needs to know: "is there a replacement available?" and move the recalled Pokemon from `active` to `reserve`.
- **Faint replacement** happens on the trainer's next available turn. A fainted Pokemon moves from `active` to `fainted`. If all Pokemon are fainted, the trainer may be eliminated from combat.
- **Re-entry** moves a Pokemon from `reserve` to `active` and creates a new lens for it. Per [[recall-clears-then-source-reapplies]], certain conditions clear on recall and re-apply on send-out if their source persists.

## Lifecycle

1. **Encounter start** — all Pokemon in the trainer's party are `reserve`. The trainer deploys initial Pokemon, moving them to `active` and creating lenses.
2. **During combat** — switching moves a Pokemon from `active` to `reserve` (archives its lens) and another from `reserve` to `active` (creates a new lens). Fainting moves from `active` to `fainted`.
3. **Encounter end** — deployment state is discarded along with all lenses.

## See also

- [[game-state-interface]] — the parent design
- [[combatant-as-lens]] — active Pokemon have lenses; reserve and fainted Pokemon don't
- [[switching-system]] — the switching mechanics that depend on deployment state
- [[recall-clears-then-source-reapplies]] — condition behavior on recall/re-entry
