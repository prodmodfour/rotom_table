The server enforces PTU rules by default but accepts an explicit `override` flag for edge cases. This is the standard pattern for [[raw-fidelity-as-default]]: enforce by default, allow the GM to force through when they know better (ability-based type changes, homebrew, special scenarios).

The client UI should display a warning when the GM attempts an action that would be blocked, with a confirmation prompt that sends the override flag. The override is never silent — it requires deliberate GM intent.

This pattern applies to type-based status immunities (including [[ghost-type-ignores-movement-restrictions]]), capture restrictions ([[fainted-pokemon-cannot-be-captured]], [[owned-pokemon-reject-capture]]), and any future server-side rule check.

## See also

- [[gm-delegates-authority-into-system]] — the server enforces the GM's pre-delegated authority; override is the exceptional intervention
- [[player-autonomy-boundaries]]
- [[information-asymmetry-by-role]]
