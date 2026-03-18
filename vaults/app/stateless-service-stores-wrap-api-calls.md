Three stores — `encounterGrid`, `encounterCombat`, and `encounterXp` — carry no state of their own. Their Pinia state objects are empty (`{}` at runtime). They exist solely to provide a consistent store-action interface over groups of related API endpoints.

- **encounterGrid**: position updates, grid config, background upload/remove, fog state save/load
- **encounterCombat**: status conditions, combat stages, injuries, breather, sprint, pass, phase changes
- **encounterXp**: XP calculation preview, Pokemon XP distribution, trainer XP distribution

All three take `encounterId` as a parameter to their actions rather than reading it from internal state. This makes them reusable without coupling to a specific encounter instance.

This pattern differs from the [[services-are-stateless-function-modules|server-side stateless services]], which are plain function modules. These client-side counterparts are Pinia stores despite having no state, giving them access to store infrastructure like devtools inspection.

## See also

- [[encounter-store-merges-websocket-updates-surgically]] — the stateful encounter store these service stores complement
- [[all-stores-use-pinia-options-api]]
- [[encounter-store-is-largest-hub-store]] — the stateful hub store these satellites complement
- [[encounter-xp-store-extracted-to-limit-file-size]] — why encounterXp was split from the main encounter store