The capture API at `/api/capture/` has two endpoints: `rate.post` for previewing capture difficulty and `attempt.post` for executing capture attempts.

The rate endpoint accepts either a `pokemonId` (to look up data from the database) or raw stats directly. It calculates the PTU capture rate considering level, HP percentage, evolution stage, status conditions, injuries, shiny status, and legendary status. It also computes the ball modifier using the [[ball-condition-service-builds-capture-modifier-context]] and returns a full breakdown with difficulty description.

The attempt endpoint requires a `pokemonId` and `trainerId`. It validates the accuracy roll (with natural 1 auto-miss and natural 20 auto-hit), checks that the target is unowned, calculates capture rate and ball modifier, then rolls against the effective capture rate. On success it links the Pokemon to the trainer with `origin: 'captured'` and loyalty 2 (Wary). Post-capture ball effects are applied: Heal Ball restores full HP, Friend Ball adds +1 loyalty, Luxury Ball notes raised happiness. New-species captures award +1 trainer XP.

The attempt endpoint broadcasts a `capture_attempt` WebSocket event to all connected clients.

## See also

- [[encounter-api-has-50-plus-combat-endpoints]] — capture is used during combat encounters
- [[websocket-handler-routes-messages-by-type]] — receives the capture_attempt broadcast
- [[api-response-envelope-wraps-success-and-data]]
