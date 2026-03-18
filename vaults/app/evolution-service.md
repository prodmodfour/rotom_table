The evolution service (`app/server/services/evolution.service.ts`) orchestrates the full Pokemon evolution process. Its main function `performEvolution()`:

1. Validates evolution triggers (level, held item, gender, known moves)
2. Captures a pre-evolution snapshot for undo support
3. Fetches the target species' [[species-data-model-fields]]
4. Recalculates stats using `recalculateStats()` — applies the new nature to new base stats, validates stat points total (`level + 10`), and enforces [[pokemon-stat-allocation-enforces-base-relations]]
5. Proportionally adjusts current HP to the new max HP
6. Remaps abilities positionally (PTU p.202 — abilities change to match the same positional slot in the new species' list)
7. Updates moves, capabilities, and skills
8. Consumes evolution stones from the trainer's inventory if applicable (atomic transaction)
9. Appends evolution history to the Pokemon's notes field
10. Awards trainer XP for a new species if the evolved form is new to the trainer
11. Broadcasts the evolution via WebSocket

Undo is supported via `POST /api/pokemon/:id/evolution-undo`, which restores the stored pre-evolution snapshot and re-adds consumed stones.

## See also

- [[gm-pokemon-detail-evolve-button]]
- [[evolution-confirm-modal]]
- [[evolution-check-utility]]
- [[services-are-stateless-function-modules]] — the stateless function pattern this service follows
- [[prisma-uses-sqlite-with-json-columns-pattern]] — uses `$transaction` for atomic stone consumption
