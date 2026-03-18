An extended rest applies eight consecutive [[thirty-minute-rest]] periods (4 hours of in-game time). Implemented in `server/api/characters/[id]/extended-rest.post.ts` and `server/api/pokemon/[id]/extended-rest.post.ts`.

Beyond HP restoration, extended rest:

- Clears all persistent [[status-condition-categories]] (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned)
- For trainers: restores all drained AP, clears all bound AP, and sets `currentAp` to full [[trainer-action-points]] max
- For Pokemon: refreshes daily-frequency moves using the rolling window rule — per PTU Core p.252, only moves NOT used today are refreshed. The API response distinguishes `restoredMoves` from `skippedMoves`, though the [[healing-tab-component]] does not currently display skipped moves.

## See also

- [[rest-healing-system]]
- [[move-frequency-system]]
