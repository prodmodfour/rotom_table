# Status Tick Automation

Automatic tick damage for status conditions at turn boundaries.

**Service:** `server/services/status-automation.service.ts`.

**Pure functions:** calculateTickDamage, calculateBadlyPoisonedDamage, getTickDamageEntries.

**Conditions handled:** Burning, Poisoned, Badly Poisoned, Cursed.

**Constant:** `TICK_DAMAGE_CONDITIONS` in `constants/statusConditions.ts`.

**Integration:** Fires in `next-turn.post.ts` before turn advance. The `badlyPoisonedRound` field on the Combatant model tracks escalation for Badly Poisoned.

**WebSocket event:** `status_tick` (server to all clients).

Part of [[turn-lifecycle]].

## See also

- [[status-condition-categories]] — persistent/volatile/other classification
- [[hp-injury-system]] — tick damage can trigger marker crossings
- [[weather-tick-automation]]
