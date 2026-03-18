The Healing tab on the [[gm-pokemon-detail-page]] provides four healing actions, each with a description and a button.

At the top is a status summary showing:
- Current HP (e.g., "38 / 38")
- Injuries (e.g., "0")
- Rest Today (e.g., "8h / 8h" — the daily rest cap)
- HP per Rest (e.g., "2 HP" — the amount healed per 30-min rest)
- Injuries Healed Today (e.g., "2 / 3" — against the daily cap of 3)

The four actions are:

1. **Rest (30 min)** — heals HP per rest amount. The button is disabled when the Pokemon has 5+ injuries or has hit the daily 8-hour rest cap.
2. **Extended Rest (4–8 hours)** — heals HP over a configurable duration with a number spinner. Clears persistent status conditions (Burned, Frozen, Paralyzed, Poisoned) and restores daily-frequency moves.
3. **Pokemon Center** — full HP restore, all statuses cleared, daily moves restored. Heals up to 3 injuries per day. Time cost: 1 hour + 30 min per injury.
4. **New Day** — resets daily healing limits (rest time and injuries healed counter).

This tab is a shared component also used on human character detail pages.

## See also

- [[pokemon-healing-utility]]
- [[pokemon-rest-healing-composable]]
