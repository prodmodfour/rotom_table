---
cap_id: combat-C116
name: encounter store — updateFromWebSocket
type: store-action
domain: combat
---

### combat-C116: encounter store — updateFromWebSocket
- **cap_id**: combat-C116
- **name**: WebSocket State Sync
- **type**: store-action
- **location**: `app/stores/encounter.ts` — `updateFromWebSocket()`
- **game_concept**: Real-time sync
- **description**: Surgical update preserving Vue reactivity.
- **inputs**: WS encounter data
- **outputs**: Updated state
- **accessible_from**: gm, group, player
