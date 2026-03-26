# 2026-03-26 — Vortex Keyword Digested from PTU Books

The Vortex keyword was missing from the PTR vault. Extracted from `deprecated_books/markdown/core/10-indices-and-reference.md` (line 3523) and created `vaults/ptr/rules/vortex-keyword.md`.

## PTU source text

> Vortex: While in a Vortex, the target is Slowed, Trapped, and loses a Tick of Hit Points at the beginning of each turn. At the end of each turn, the user may roll 1d20 to end all of these effects; during the first turn, they must roll a 20 or higher to dispel the vortex. The DC is lowered by 6 each following turn, automatically wearing off on the fifth turn (20, 14, 8, 2, Dispel)

## PTR adaptation

Tick timing changed from beginning-of-turn to end-of-turn, consistent with `persistent-tick-timing-end-of-turn.md` (Burning, Poisoned, Badly Poisoned all moved to end-of-turn in PTR).

## Impact on finding 25 (VortexInstance)

**Finding 25 is partially wrong.** The review assumed Vortex per-turn damage was based on the source move's DB, type, and damage class. It's not — Vortex damage is a flat 1 tick of HP loss (1/10 max HP), same as burn/poison. No type effectiveness, no STAB, no damage class.

This means VortexInstance does NOT need `sourceMoveId` or `damageSpec` for damage purposes. What it DOES need:

```
VortexInstance {
  targetId: string
  casterId: string           // Destroyed if caster switches/faints
  appliesTrapped: boolean    // Blocks recall
  appliesSlowed: boolean     // Reduces movement
  turnsElapsed: number       // Tracks escape DC (20, 14, 8, 2, auto-dispel)
}
```

The escape DC is derived: `max(2, 20 - (turnsElapsed * 6))`, auto-dispelling at turn 5. No need for a stored DC field.

## Files created/modified

- **Created:** `vaults/ptr/rules/vortex-keyword.md`
- **Updated:** `trapped-is-only-recall-blocker.md` — added backlink
- **Updated:** `slowed-halves-movement.md` — added backlink
- **Updated:** `tick-value-one-tenth-max-hp.md` — added Vortex to tick reference list
- **Updated:** `persistent-tick-timing-end-of-turn.md` — added Vortex to end-of-turn timing list
- **Updated:** `whirlpool.md`, `sand-tomb.md`, `fire-spin.md` — linked Vortex keyword

**Status:** Vortex keyword fully digested. Finding 25 revised — VortexInstance tracks escape timing, not damage specs. Both deferred vault checks now complete. Ready for formal GameState interface design.

