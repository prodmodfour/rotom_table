# Triple-View System

The app serves three distinct audiences through three route-based views:

- **GM View** (`/gm`) — Full control. Spawn characters, edit stats, manage NPC turns. All information visible. See [[gm-view-routes]] for the full route table.
- **Group View** (`/group`) — TV/projector display for the table. Four tabs (lobby, scene, encounter, map) managed via the [[singleton-models|GroupViewState singleton]]. Cross-tab sync via BroadcastChannel. Store: `groupViewTabs`. See [[group-view-tabs]] for tab components.
- **Player View** (`/player`) — Individual player interface with restricted information (e.g., enemy HP hidden). See [[player-view-architecture]] for components, composables, and types. Orchestrated by [[player-page-orchestration]]; identity managed by [[player-identity-system]].

Each view connects to the server via [[websocket-real-time-sync]] for live state updates. The GM view is the authoritative source of truth; Group and Player views receive broadcasts.

## See also

- [[encounter-serving-mechanics]] — controls which encounter is displayed on group/player views
- [[combatant-card-visibility-rules]] — how information differs per view
- [[view-component-duplication]] — the component duplication this architecture creates
- [[view-capability-projection]] — a destructive proposal to unify all views with capability-based rendering
- [[group-view-scene-interaction]]
- [[pinia-store-classification]]
