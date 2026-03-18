# Encounter Combat Flow

Combat in the encounter proceeds through a repeating cycle of phases each round:

1. **Declaration Phase** (Low → High speed) — trainers [[encounter-declaration-phase|declare their actions]] from lowest to highest speed. The phase badge tooltip says "Trainers declare actions from lowest to highest speed (decree-021)."
2. [[encounter-priority-actions-panel]] — an interrupt check between declaration and resolution
3. **Resolution Phase** (High → Low) — combatants resolve their declared actions from highest to lowest initiative
4. [[encounter-priority-actions-panel]] — an interrupt check between resolution and pokemon phase
5. **Pokemon Phase** — Pokemon act in initiative order (fastest first). The tooltip says "Pokemon act in initiative order (fastest first)."
6. [[encounter-priority-actions-panel]] — an interrupt check before the next round

After all phases complete, the round counter advances and the cycle restarts at Declaration Phase.

## See also

- [[encounter-header]] — displays the current phase badge and round counter
- [[encounter-toolbar]] — contains the Next Turn button that advances through phases
- [[encounter-api-has-50-plus-combat-endpoints]] — the server endpoints that drive this flow
- [[encounter-service-is-the-combat-engine-core]] — the service layer that manages encounter state
