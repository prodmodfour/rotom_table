# Browser Audit: /gm View

Audited: 2026-03-05
Route: `http://localhost:3000/gm`

---

## Test Data State

- GM view accessible at /gm
- No active encounter
- No active scene
- WebSocket not connected (no "Connect" clicked)

---

## Overview

The `/gm` route is the GM's control interface. It is NOT a player-view surface. The matrix identifies 11 rules as "Implemented-Unreachable" (R017, R018, R021, R143, R156-R160, R164, R191) meaning the code exists on the GM side but the player cannot access it. These are GM-only capabilities that relate to player-visible data management (editing trainer stats, managing resources, etc.).

Player-view capabilities that reference "gm" in their accessible_from:

| Cap ID | Name | Accessible From | GM Relevance |
|--------|------|----------------|--------------|
| player-view-C011 | GET /api/characters/:id/player-view | player, gm | API endpoint, technically callable from GM but no GM UI uses it |
| player-view-C016 | GET /api/scenes/active | player, group, gm | API endpoint, GM uses its own scene management |
| player-view-C058 | player_action_ack (WS event) | gm (sends), player (receives) | GM sends acks to player actions |
| player-view-C059 | player_turn_notify (WS event) | gm (sends), player (receives) | GM sends turn notifications |
| player-view-C061 | player_move_response (WS event) | gm (sends), player (receives) | GM responds to movement requests |
| player-view-C063 | group_view_response (WS event) | gm (sends), player (receives) | GM responds to group view requests |
| player-view-C084 | getConnectionType utility | player, group, gm | Pure utility function |
| player-view-C085 | QR code generator | player, gm | Utility; GM can share player URL via QR |
| player-view-C088 | Player-sync types | player, gm | Type definitions used by both sides |

All of these are untestable items (API/WS/utility/types). No player-view UI components render on the GM view.

---

## GM View Snapshot

- **Route checked:** http://localhost:3000/gm
- **Expected element:** GM control interface (not player-view)
- **Found:** Yes (GM-specific layout)
- **Classification:** N/A (not a player-view test target)
- **Evidence:** GM view renders with banner ("Rotom Table", "GM View"), navigation (Encounter, Encounters, Scenes, Habitats, Sheets, Create, Map), Connect button, Group View tab buttons (Lobby/Scene/Encounter/Map), and "No Active Encounter" start panel.

---

## Summary

| Classification | Count |
|---------------|-------|
| Present | 0 |
| Absent | 0 |
| Error | 0 |
| Unreachable | 0 |

**Total player-view capabilities testable on /gm: 0**

No player-view UI components are expected or found on the GM view. The GM view correctly renders its own component set. Player-view capabilities accessible from "gm" are all server-side (API/WS) with no visual terminus on the GM page.
