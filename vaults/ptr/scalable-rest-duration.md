The extended rest endpoint accepts an optional duration parameter (in hours, minimum 4, maximum 8) from the GM. Healing is calculated as `floor(duration / 0.5)` rest periods, each at [[natural-healing-rate]] (with [[rest-heals-minimum-one]]), capped by the 8h daily limit.

When PTU specifies a minimum duration for a mechanic ("at least 4 continuous hours"), the app accepts the actual duration rather than assuming the minimum. GM-specified durations are preferred over fixed defaults for time-based mechanics.

## See also

- [[rest-definition]]
- [[separate-mechanics-stay-separate]]
