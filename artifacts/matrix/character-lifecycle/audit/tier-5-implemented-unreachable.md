## Tier 5: Implemented-Unreachable

### R063 — AP Spend for Roll Bonus

- **Rule:** "Spend 1 AP as free action before Accuracy/Skill Check to add +1."
- **Expected behavior:** AP fields exist, player can spend AP.
- **Actual behavior:** AP fields exist on model (`currentAp`, `drainedAp`, `boundAp`). GM can decrement AP via update API. Player view is read-only — players cannot spend their own AP. This is a UI access limitation, not a rules implementation error.
- **Classification:** Correct (logic-wise)

---
