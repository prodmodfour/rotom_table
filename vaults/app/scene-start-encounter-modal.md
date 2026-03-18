# Scene Start Encounter Modal

Opened from the "Start Encounter" button in the [[scene-editor-page]]. The heading reads "Start Encounter" and a subtitle shows "Create encounter from **[scene name]**."

A summary line shows the count of wild pokemon that will become enemies (e.g., "8 wild Pokemon (enemies)").

**Battle Type** — two radio options:
- **Full Contact** — "All combatants act in speed order" (default)
- **Trainer (League)** — "Trainers declare, then Pokemon act"

**Encounter Significance** — scales XP rewards (cites PTU Core p.460). Three radio options:
- **Insignificant (x1)** — "Random wild encounters, trivial roadside battles" (default)
- **Everyday (x2)** — "Standard trainer battles, strong wild Pokemon"
- **Significant (x5)** — "Gym leaders, rival encounters, legendary battles, arc finales (PTU: x4-x5)"

Footer has "Cancel" and "Start Encounter" buttons. Starting an encounter converts the scene's wild pokemon into full database-backed combatants via the [[pokemon-generator-service]], as described in [[scene-to-encounter-generates-db-pokemon]].
