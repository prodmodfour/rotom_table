Some trainer features have ranks (e.g., `[+Attack] [+Attack]` for a +2 bonus). The [[auto-parse-stat-feature-tags]] system counts occurrences of `[+Stat]` tags to determine the rank.

This makes the bonus magnitude parseable without a separate rank field — the tag repetition is the rank. A feature with three `[+Speed]` tags yields a +3 Speed bonus.

## See also

- [[auto-parse-stat-feature-tags]] — the parser that counts tag occurrences
- [[six-trainer-combat-stats]] — the stats that tags can reference
- [[trainer-derived-stats]] — where parsed bonuses feed into
