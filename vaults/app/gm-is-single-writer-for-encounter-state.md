The WebSocket sync system has no conflict resolution because the GM is the single authoritative writer for encounter state. All encounter mutations originate from the GM -- either from direct GM actions or from player requests that the GM approves.

Players cannot modify encounter state directly. They submit action requests via [[player-websocket-wraps-actions-as-promises]] which the [[gm-processes-player-requests-via-request-handlers|GM processes and acknowledges]]. The GM then broadcasts the updated state to all connected clients.

This single-writer model means full encounter state can be broadcast after every mutation without merging or conflict detection. Receiving clients simply apply the authoritative state via the [[encounter-store-merges-websocket-updates-surgically|surgical merge]].

## See also

- [[websocket-identity-is-role-based]] -- the three roles that define the permission model
- [[api-routes-broadcast-mutations-via-websocket]] -- the server-side broadcast that distributes GM state
