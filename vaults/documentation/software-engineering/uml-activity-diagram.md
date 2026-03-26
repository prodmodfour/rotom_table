# UML Activity Diagram

A [[uml]] diagram that illustrates procedures and business process flows, functioning similarly to flowcharts. Excels at representing parallel events, which is crucial since actual business processes rarely follow linear paths.

## Elements

- **Activity** — a business process containing actions and control elements. Elements connect through edges forming the control flow.
- **Action** — an individual, non-decomposable step within an activity. Actions have input and output information.
- **Activity calling** — invokes another activity, enabling nested activities at different detail levels. Indicated by a fork symbol in action notation.
- **Event acceptance** — waits for an external event before executing. Essential for processes initiated by external triggers.
- **Time event** — starts flows at specific moments, often triggering reminders after deadlines.
- **Signal sending** — transmits signals to receiving activities.

## Flow control

- **Edge** — arrow connecting components, representing control flow
- **Decision node** — diamond-shaped branch with one input, multiple outputs (conditions in brackets; include 'else' for unmet conditions)
- **Merge node** — multiple inputs converging to single output without synchronization
- **Fork** — synchronization bar creating parallel flows from one input
- **Join** — synchronization bar consolidating parallel flows; progression only after all incoming flows arrive
- **Initial node** — starting point (may have multiple, or begin via event acceptance)
- **Activity final node** — marks completion; all parallel flows halt
- **Flow final node** — terminates individual flows without affecting others
- **Activity partition** — swim lanes dividing elements by organizational entity, cost center, or location

## Reading

Begin at initial nodes or event acceptance points, follow control flow arrows. Forks indicate parallel processing — flows execute simultaneously between fork and join points.

In [[uml-2-0|UML 2.0]], activity diagrams became independent from [[uml-statechart-diagram|statechart diagrams]]. Individual steps are now called "actions" within "activities," and multiple initial states with input/output parameters are supported.

## See also

- [[uml-constructing-activity-diagrams]] — construction steps and verification checklists
- [[uml-sequence-diagram]] — emphasizes chronological message exchange rather than procedural flow
