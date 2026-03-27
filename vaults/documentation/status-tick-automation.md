# Status Tick Automation

Automatic tick damage for status conditions at turn boundaries. Fires before turn advance.

**Conditions handled:** Burning, Poisoned, Badly Poisoned, Cursed. Each deals [[tick-value-one-tenth-max-hp|tick damage]] at the end of the affected combatant's turn. Badly Poisoned escalates each round (1 tick, 2 ticks, 3 ticks...).

Part of [[turn-lifecycle]].

## See also

- [[status-condition-categories]] — persistent/volatile/other classification
- [[hp-injury-system]] — tick damage can trigger marker crossings
- [[weather-tick-automation]]
