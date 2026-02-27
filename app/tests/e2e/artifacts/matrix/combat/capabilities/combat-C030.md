---
cap_id: combat-C030
name: Serve Encounter
type: api-endpoint
domain: combat
---

### combat-C030: Serve Encounter
- **cap_id**: combat-C030
- **name**: Serve Encounter to Group View
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/serve.post.ts`
- **game_concept**: Displaying encounter on shared TV/projector
- **description**: Marks encounter as served, updates GroupViewState. Triggers WebSocket broadcast.
- **inputs**: Encounter ID
- **outputs**: Updated encounter with isServed=true
- **accessible_from**: gm
