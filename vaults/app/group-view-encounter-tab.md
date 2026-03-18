# Group View Encounter Tab

When the [[group-view-tab-state]] is set to "encounter", the [[group-view-page]] renders this tab. It polls for a served encounter every 2 seconds.

**Waiting state** — when no encounter is served, a centered card shows a spinning icon, the heading "Waiting for Encounter", and the message "The GM will serve an encounter when combat begins."

**Active state** — when an encounter is served, the tab displays three areas:

- **Header** — encounter name, a "Round N" badge, an optional weather badge (with remaining rounds suffix like "3r"), and the current turn indicator showing "Current Turn: [combatant name]".
- **Main area** — a three-column layout:
  - An initiative sidebar (280px wide) with a [[group-view-initiative-tracker]] showing combatants sorted by initiative, flanking data, and a [[group-view-declaration-summary]] for league battles.
  - A central grid panel with a [[group-grid-canvas-provides-read-only-spectating]] showing the battle map.
  - A [[group-view-combatant-details-panel]] showing the current combatant's details and flanking status.

The encounter tab also loads fog-of-war and terrain state, joins the WebSocket encounter room as `'group'`, and mounts a [[group-view-wild-spawn-overlay]].

## See also

- [[encounter-toolbar]] — the "Serve to Group" button that makes encounters appear here
- [[player-view-encounter-tab]] — the player view's equivalent encounter display
