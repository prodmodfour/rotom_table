## Tier 3: Frequency Constraints (Combat Integration)

### R025 — Scene Frequency Definition

- **Rule:** "Scene X: Move can be performed X times per Scene."
- **Expected behavior:** Scene-frequency moves tracked per encounter.
- **Actual behavior:** Move frequency tracking is implemented in the combat system. The encounter model stores move usage history. Scene-frequency moves are decremented per use within an encounter. The concept of "Scene" maps to "Encounter" in the app — starting a new encounter resets scene-frequency moves.
- **Classification:** Correct

### R026 — Scene Frequency EOT Restriction

- **Rule:** "Moves that can be used multiple times a Scene can still only be used Every Other Turn."
- **Expected behavior:** Scene X > 1 moves restricted to every other turn.
- **Actual behavior:** The combat system tracks move usage timing. EOT enforcement exists for Scene-frequency moves — the move execution system checks if the move was used on the previous turn before allowing re-use. This is enforced in the combat move execution flow.
- **Classification:** Correct

### R027 — Daily Frequency Scene Limit

- **Rule:** "Moves that can be used multiple times Daily can still only be used once a Scene."
- **Expected behavior:** Daily moves limited to once per scene/encounter.
- **Actual behavior:** Daily frequency tracking in combat limits daily moves to once per encounter. `restHealing.ts:207-212` provides `isDailyMoveRefreshable` for extended rest refresh checks.
- **Classification:** Correct

---
