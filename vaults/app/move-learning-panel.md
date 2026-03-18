The `MoveLearningPanel` component (`app/components/pokemon/MoveLearningPanel.vue`) appears during level-up when new learnset moves are available. It receives a Pokemon and a list of available move names as props.

On mount, it filters out moves the Pokemon already knows, then calls the [[batch-move-lookup-api]] to fetch full details for the remaining names. It displays:
- The current moveset in 6 numbered slots (empty slots shown as "(empty)")
- Each available move with type badge, damage class, frequency, DB, AC, range, and effect text
- An "Add to Slot N" button when empty slots exist, or a "Replace a Move" button when all 6 slots are full

The replace flow enters a mode where current moves become clickable targets highlighted in red. Selecting one sends the replace request to the [[learn-move-api]]. A "Skip - Learn No Moves" button allows dismissing the panel entirely.

After each successful learn, the panel optimistically updates its local move list without re-fetching from the server.

## See also

- [[pokemon-level-up-panel]] — parent context where this panel appears
- [[move-maximum-six-slots]] — the constraint that triggers replace mode
