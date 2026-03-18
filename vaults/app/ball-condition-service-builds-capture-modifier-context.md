The ball condition service (`app/server/services/ball-condition.service.ts`) builds the contextual data needed to evaluate Poke Ball conditional modifiers during capture attempts.

`buildConditionContext()` assembles a `BallConditionContext` object from multiple data sources: the target Pokemon's species data (types, weight class, movement speed), the trainer's owned species list (for Repeat Ball), the active encounter's round count and combatant data (for Timer Ball, active Pokemon checks), and GM-provided overrides (for conditions the server cannot determine automatically, like darkness or baiting).

Different Poke Balls have conditional modifiers that depend on specific circumstances — Net Ball gets a bonus against Water/Bug types, Dusk Ball against targets in darkness, Quick Ball in early rounds. The condition context provides all the data the ball modifier calculator needs to evaluate these conditions.

## See also

- [[capture-api-previews-and-executes-attempts]] — both endpoints use this service
- [[combat-services-cover-ptu-subsystems]] — the ball condition service is listed among combat services
