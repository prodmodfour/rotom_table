# Browser Audit: /group View

Audited: 2026-03-05
Route: `http://localhost:3000/group`

---

## Test Data State

- Two player characters seeded: Hassan and Marilena
- Group View in Lobby tab (default)
- No active encounter
- No active scene

---

## Overview

The `/group` route is the shared TV/projector display. It is not a player-view surface itself but is the target of player-view C077 (PlayerGroupControl). The group view is GM-controlled; players can only request tab changes via WebSocket.

Most player-view capabilities are NOT accessible from `/group`. The matrix lists only C016 (GET /api/scenes/active) and C057 (player_action WS event) as accessible from group, and both are server-side/WebSocket capabilities with no direct UI terminus on the group page.

---

## Group View Lobby

### Lobby Display
- **Route checked:** http://localhost:3000/group
- **Expected element:** Player character cards with Pokemon
- **Found:** Yes
- **Classification:** Present (group-view capability, not player-view)
- **Evidence:** Two character cards displayed:
  - Hassan: heading "Hassan", "Igbunu", "Lv 1", Pokemon card for Chomps (img "Chomps", "Lv 10", types "Dragon"/"Ground")
  - Marilena: heading "Marilena", "Ilaria", "Lv 1", Pokemon card for Iris (img "Iris", "Lv 10", type "Ghost")

---

## Player-View Capabilities on /group

No player-view UI components render on the `/group` route. The group view has its own component set (GroupLobby, GroupScene, GroupEncounter, GroupMap). Player-view capabilities that reference "group" in their accessible_from are:

| Cap ID | Name | Accessible From | Group Relevance |
|--------|------|----------------|-----------------|
| player-view-C016 | GET /api/scenes/active | player, group, gm | API endpoint, no UI surface on /group |
| player-view-C057 | player_action (WS event) | player, group | WebSocket event, no UI surface on /group |
| player-view-C084 | getConnectionType utility | player, group, gm | Pure utility, no UI surface |

All three are untestable items (API/WS/utility) with no group-view UI terminus.

---

## Summary

| Classification | Count |
|---------------|-------|
| Present | 0 |
| Absent | 0 |
| Error | 0 |
| Unreachable | 0 |

**Total player-view capabilities testable on /group: 0**

No player-view UI components are expected or found on the group view. The group view correctly renders its own component set.
