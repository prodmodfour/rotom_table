# Character Creation Validation

Validators in `utils/characterCreationValidation.ts` produce soft warnings (not hard blocks) for the [[character-creation-composable]].

## validateStatAllocation

Checks that all stats are set to the [[starting-stat-allocation|starting value of 10]]. Returns `CreationWarning[]` with `'warning'` or `'info'` severity.

## validateSkills

Validates skill modifier values against [[ptr-skill-list|PTR skill system]].

## See also

- [[character-creation-composable]]
- [[character-creation-page]]
