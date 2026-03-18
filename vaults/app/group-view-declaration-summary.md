# Group View Declaration Summary

The `DeclarationSummary` component appears in the [[group-view-initiative-tracker]] sidebar during League Battle encounters. It shows trainer declarations for the current round in a collapsible list.

Each declaration row displays:
- The trainer name
- An action type badge (Command, Switch, Item, Feature, Orders, or Pass) with distinct color coding per type
- A description of the declared action
- A checkmark icon for declarations that have been resolved

The currently resolving declaration gets a violet left border and a subtle background glow. Already-resolved declarations appear at 60% opacity.

The component reads from the encounter store's `currentDeclarations`, `currentRound`, and `currentPhase`. Resolution status is determined by comparing combatant indices in the turn order — combatants whose index is before the current turn index are marked resolved.

The list header shows "Trainer Declarations (Round N)" and is clickable to toggle expand/collapse.

## See also

- [[group-view-encounter-tab]] — the parent tab that mounts this component
- [[group-view-initiative-tracker]] — appears alongside this component in the initiative sidebar