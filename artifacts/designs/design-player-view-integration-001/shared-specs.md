# Shared Specifications

## 9. Integration Sequence: Full Combat Turn

```
Player Device           Server (Nitro)           GM Device            Group View (TV)
     |                       |                       |                       |
     |<-- player_turn_notify |                       |                       |
     | (vibrate + flash)     |                       |                       |
     |                       |                       |                       |
     |-- executeMove (REST)->|-- update DB           |                       |
     |<-- encounter_update --|-- encounter_update -->|-- encounter_update -->|
     |                       |                       |                       |
     |-- player_move_request>|-- player_move_request>|                       |
     |                       |                  [GM approves]                |
     |                       |<- updatePosition(REST)|                       |
     |<-- encounter_update --|-- encounter_update -->|-- encounter_update -->|
     |<-- player_move_resp---|                       |                       |
     |                       |                       |                       |
     |-- nextTurn (REST) --->|-- update DB           |                       |
     |<-- turn_change -------|-- turn_change ------->|-- turn_change ------->|
```

---


## 10. Risks

| Risk | Mitigation |
|------|------------|
| `pendingRequests` grows unbounded | TTL of 60s. Auto-expire + notify player of timeout. |
| Mobile grid tap accuracy | Double-tap for destination. Confirmation sheet. Pinch-to-zoom. |
| Scene unavailable mid-connect | `identify` sends active scene. REST fallback. |
| GM overwhelmed by requests | Direct actions auto-execute. Only requested actions need approval. Future: auto-approve toggle. |
| Keepalive insufficient | 45s well under 100s limit. Adjust if needed. |

---


## 11. Open Questions

1. **Auto-approve movement?** Start with GM approval. Add auto-approve toggle in P2.
2. **Player-to-player request visibility?** No. Requests are private player-to-GM. Results visible via broadcast.
3. **Group View request cooldown?** Yes, 30s client-side.
4. **Scene vs encounter tab priority?** Encounter takes priority (time-sensitive).
5. **Mobile grid focus mode?** Defer to P2. Start with full grid + auto-center on player token.

---

