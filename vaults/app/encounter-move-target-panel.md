When a move is selected in the [[encounter-act-modal-move-list]], a target selection panel slides in to the right of the move list. This panel has three sections:

**Move info card** — displays the move name with a type badge at the top, followed by a details grid showing Class (Physical/Special/Status), DB, AC, Range, and the user's relevant attack stat (ATK for Physical, SPA for Special). Below the grid, the move's full effect text is displayed in a separate box.

**Target selection** — a "Select Target(s)" heading followed by a list of all other combatants in the encounter. Each target shows its name and current HP. Targets out of range are displayed as disabled buttons with "Out of range" text. Selecting a target enables the confirmation button.

**Action buttons** — a "Cancel" button and a "Use [MoveName]" button. The use button is disabled until at least one target is selected. Confirming the move triggers the move execution flow via the encounter API.

## See also

- [[encounter-act-modal]] — the parent modal containing the move list
- [[no-standalone-move-browser]] — this panel is one of the few places full move details are visible
