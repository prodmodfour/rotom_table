The player view has no login, registration, password, or account concept. "Identity" is a character selection from the campaign's full character list, [[player-identity-persists-via-local-storage|stored in the browser's localStorage]]. Any device can open `/player` and select any character — there is no ownership, claiming, or exclusivity.

Multiple browsers can select the same character simultaneously. The [[websocket-identity-is-role-based|WebSocket identity]] tracks which character a player connection is associated with, but does not enforce uniqueness.

This is consistent with the [[server-has-no-auth-or-middleware|trust-based LAN model]] where all participants are physically present at the table.


## See also

- [[played-by-field-is-informational-only]] — the closest thing to user identity in the data model
- [[player-view-is-consumption-only-outside-encounters]] — the practical consequence of having no accounts