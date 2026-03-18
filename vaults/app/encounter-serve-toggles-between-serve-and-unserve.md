The [[encounter-toolbar]] has a "Serve to Group" button that pushes the current encounter to connected group and player views. After clicking it, the button text changes to "Unserve" and a "Served to Group" badge appears in the encounter header alongside the battle type and round number.

Observed: clicking "Serve to Group" caused the [[group-view-encounter-tab]] to display the encounter (name, round, battle grid). The player view's Encounter tab simultaneously showed the same encounter data — "New Encounter", "Round 1", with a battle grid and zoom controls.

Clicking "Unserve" immediately reversed this — the group view returned to "Waiting for Encounter" and the player view showed "No active encounter — An encounter will appear here when the GM starts one." The GM itself returned to "No Active Encounter" with the encounter creation form, indicating unserving also ends the encounter entirely.

## See also

- [[websocket-handler-routes-messages-by-type]] — the `serve_encounter` and `encounter_unserved` events that carry this state
- [[websocket-peer-map-tracks-connected-clients]] — the broadcast targeting that reaches group and player peers
