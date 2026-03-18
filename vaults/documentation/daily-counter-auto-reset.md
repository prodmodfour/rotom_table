Rest healing endpoints automatically detect when a new calendar day has started. The `shouldResetDailyCounters` utility compares the current date against `lastRestReset` — if they fall on different calendar days, it returns `true`.

When a reset triggers, `restMinutesToday` and `injuriesHealedToday` are zeroed and `lastRestReset` is updated to the current timestamp. This happens transparently within the [[thirty-minute-rest]] and other rest endpoints, so the GM does not need to manually advance the day for rest counters.

This is distinct from [[new-day-reset]], which explicitly resets AP and move usage in addition to rest counters.

## See also

- [[healing-data-fields]]
- [[rest-healing-system]]
