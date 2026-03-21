Conditional combat penalties (flanking, status conditions, terrain effects) that modify evasion apply AFTER the evasion cap of 9, not before. The cap represents the baseline maximum; penalties reduce from that baseline.

Formula: `effectiveEvasion = Math.min(9, rawEvasion) - penalties`

This preserves [[tactical-mechanics-must-matter]] — if flanking had no effect at high evasion, the positioning mechanic would feel broken against the strongest opponents where it matters most.

## See also

- [[evasion-from-defensive-stats]]
- [[flanking-scales-with-target-size]]
